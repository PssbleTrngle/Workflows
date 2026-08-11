import type { components } from "@octokit/openapi-types";
import type { WebhookEventDefinition } from "@octokit/webhooks/types";
import {
  ButtonStyle,
  type Button,
  type ReleaseNotifaction,
} from "@pssbletrngle/workflows-notifications";
import { notNull } from "@pssbletrngle/workflows-shared/util";
import type { RepoSearch } from "@pssbletrngle/workflows-types";
import { parse as parsePath } from "node:path";
import { type App, type Octokit } from "octokit";
import z from "zod";
import { Respositories } from "./metadata/database";
import notifications from "./notifications";

function conclusionColor(
  conclusion: WebhookEventDefinition<"check-run-completed">["check_run"]["conclusion"],
): number {
  switch (conclusion) {
    case "cancelled":
      return 0xdecc2a;
    case "timed_out":
    case "failure":
      return 0xd43350;
    case "success":
      return 0x238636;
    default:
      return 0x0980fd;
  }
}

const moduleMetadataSchema = z.object({
  tag: z.string().nonempty(),
  preRelease: z.boolean().default(false).optional(),
  mavenUrl: z.string().nonempty().optional(),
  modrinthUrl: z.string().nonempty().optional(),
  curseforgeUrl: z.string().nonempty().optional(),
});

const releaseMetadataSchema = z.record(
  z.string().nonempty(),
  moduleMetadataSchema,
);

async function fetchRelease(
  octokit: Octokit,
  subject: RepoSearch,
  tag: string | undefined,
) {
  if (!tag) return null;

  const { data } = await octokit.rest.repos.getReleaseByTag({
    ...subject,
    tag,
  });
  return data;
}

async function tryFetchRelease(
  octokit: Octokit,
  subject: RepoSearch,
  tags: string[],
) {
  try {
    return await Promise.any(
      tags.map((tag) => fetchRelease(octokit, subject, tag)),
    );
  } catch {
    return null;
  }
}

type ModuleReleaseAttributes = {
  key?: string;
} & z.infer<typeof moduleMetadataSchema>;

type Artifacts = components["schemas"]["artifact"][];

async function fetchReleaseArtifacts(
  octokit: Octokit,
  subject: RepoSearch,
  runId: number,
): Promise<Artifacts> {
  const { data } = await octokit.rest.actions.listWorkflowRunArtifacts({
    ...subject,
    run_id: runId,
  });

  return data.artifacts
    .filter((it) => !it.expired)
    .filter((it) => it.name === "release.json");
}

async function fetchReleaseAttributes(
  octokit: Octokit,
  artifacts: Artifacts,
): Promise<ModuleReleaseAttributes[]> {
  const attributes = await Promise.all(
    artifacts.map(async (it) => {
      const { data } = await octokit.request(it.archive_download_url);
      return releaseMetadataSchema.parse(data);
    }),
  );

  if (attributes.length === 0) return [];
  const merged = attributes.reduce((a, b) => ({ ...a, ...b }));

  return Object.entries(merged).map(([key, value]) => ({ key, ...value }));
}

async function getIcon(subject: RepoSearch) {
  const repo = await Respositories.find(subject);
  if (!repo?.icon) return null;
  // maybe not hardcode this
  return new URL(
    repo?.icon,
    "https://workflows.somethingcatchy.net",
  ).toString();
}

export function registerActionsHooks(hooks: App["webhooks"]) {
  hooks.on("workflow_run.completed", async ({ payload, octokit }) => {
    const { workflow_run, repository } = payload;

    const subject: RepoSearch = {
      owner: repository.owner.login,
      repo: repository.name,
    };

    const artifacts = await fetchReleaseArtifacts(
      octokit,
      subject,
      workflow_run.id,
    );

    function isReleaseWorkflows() {
      if (artifacts.length > 0) return true;
      const name = workflow_run.name ?? parsePath(workflow_run.path).name;
      return name.toLowerCase() === "release";
    }

    if (workflow_run.conclusion === "skipped") return;
    if (workflow_run.conclusion === "cancelled") return;
    if (!isReleaseWorkflows()) return;

    const [attributes, icon] = await Promise.all([
      fetchReleaseAttributes(octokit, artifacts),
      getIcon(subject),
    ]);

    if (attributes.length === 0) {
      if (workflow_run.head_branch) {
        attributes.push({
          tag: workflow_run.head_branch,
        });
      }
    }

    const grouped = Object.groupBy(attributes, (it) => it.tag);

    const icon_url = icon ?? repository.owner.avatar_url;

    const author = {
      name: repository.name,
      icon_url,
    };

    for (const [tag, modules = []] of Object.entries(grouped)) {
      const releases = modules.filter((it) => !it.preRelease);
      const preReleases = modules.filter((it) => it.preRelease);

      if (releases.length > 0) await sendReleaseNotifaction(tag, releases);
      if (preReleases.length > 0)
        await sendPreReleaseNotifaction(tag, preReleases);
    }

    async function sendReleaseNotifaction(
      tag: string,
      modules: ModuleReleaseAttributes[],
    ) {
      const color = conclusionColor(workflow_run.conclusion);

      const key: ReleaseNotifaction = {
        type: "release",
        conclusion: workflow_run.conclusion ?? undefined,
        subject,
      };

      if (workflow_run.conclusion === "success") {
        const tagCandidates: string[] = [tag];
        if (workflow_run.head_branch && workflow_run.event === "release")
          tagCandidates.push(workflow_run.head_branch);

        const release = await tryFetchRelease(octokit, subject, tagCandidates);

        const branchUrl = workflow_run.head_branch
          ? `${repository.html_url}/tree/${workflow_run.head_branch}`
          : repository.html_url;
        const url = release?.html_url ?? branchUrl;

        await notifications.sendEmbeds(
          key,
          {
            author,
            title: `Released ${tag}`,
            description: release?.body ?? undefined,
            color,
            url,
          },
          buildDownloadButtons(modules),
        );
      } else {
        await notifications.sendEmbeds(key, {
          author,
          title: "Release failed",
          color,
          url: workflow_run.html_url,
        });
      }
    }

    async function sendPreReleaseNotifaction(
      tag: string,
      modules: ModuleReleaseAttributes[],
    ) {
      if (workflow_run.conclusion !== "success") return;

      const withDownload = modules.filter((it) => it.mavenUrl);
      if (withDownload.length === 0) return;

      const key: ReleaseNotifaction = {
        type: "prerelease",
        conclusion: workflow_run.conclusion ?? undefined,
        subject,
      };

      await notifications.sendEmbeds(
        key,
        {
          author,
          title: `Pre-Release ${tag}`,
          color: 0xc038ff,
        },
        buildDownloadButtons(modules),
      );
    }

    function buildDownloadButtons(modules: ModuleReleaseAttributes[]) {
      return modules.map(
        ({ key, modrinthUrl, curseforgeUrl, mavenUrl, preRelease }) => {
          const buttons: Button[] = [];

          const distinctKey = modules.length > 1 ? key : null;
          const label = ["Download", distinctKey].filter(notNull).join(" ");

          if (modrinthUrl) {
            buttons.push({
              label: `${label} from Modrinth`,
              style: ButtonStyle.Link,
              url: modrinthUrl,
              emoji: { id: "1040805511538421890" },
            });
          }

          if (curseforgeUrl) {
            buttons.push({
              label: `${label} from CurseForge`,
              style: ButtonStyle.Link,
              url: curseforgeUrl,
              emoji: { id: "1249535868365180948" },
            });
          }

          if (preRelease && mavenUrl) {
            buttons.push({
              label: `${label} from Maven`,
              style: ButtonStyle.Link,
              url: mavenUrl,
            });
          }

          return buttons;
        },
      );
    }
  });
}

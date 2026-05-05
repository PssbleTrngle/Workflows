import type { WebhookEventDefinition } from "@octokit/webhooks/types";
import {
  ButtonStyle,
  sendEmbeds,
  type Button,
} from "@pssbletrngle/workflows-notifications";
import type { RepoSearch } from "@pssbletrngle/workflows-types";
import { parse as parsePath } from "node:path";
import { RequestError, type App, type Octokit } from "octokit";
import z from "zod";
import { getIcon } from "./metadata/checks/icon";

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

const releaseMetadataSchema = z.object({
  tag: z.string().nonempty(),
  modrinthUrl: z.string().nonempty().optional(),
  curseforgeUrl: z.string().nonempty().optional(),
});

async function tryFetchRelease(
  octokit: Octokit,
  subject: RepoSearch,
  tag: string | undefined,
) {
  if (!tag) return null;

  try {
    const { data } = await octokit.rest.repos.getReleaseByTag({
      ...subject,
      tag,
    });
    return data;
  } catch (e) {
    if (e instanceof RequestError && e.status === 404) return null;
    throw e;
  }
}

async function fetchAttributes(
  octokit: Octokit,
  subject: RepoSearch,
  runId: number,
) {
  const { data } = await octokit.rest.actions.listWorkflowRunArtifacts({
    ...subject,
    run_id: runId,
  });

  const files = data.artifacts
    .filter((it) => !it.expired)
    .filter((it) => it.name === "release.json");

  const attributes = await Promise.all(
    files.map(async (it) => {
      const { data } = await octokit.request(it.archive_download_url);
      return releaseMetadataSchema.parse(data);
    }),
  );

  return attributes;
}

export function registerActionsHooks(hooks: App["webhooks"]) {
  hooks.on("workflow_run.completed", async ({ payload, octokit }) => {
    const { workflow_run, repository } = payload;

    function isReleaseWorkflows() {
      const name = workflow_run.name ?? parsePath(workflow_run.path).name;
      return name.toLowerCase() === "release";
    }

    if (workflow_run.conclusion === "skipped") return;
    if (!isReleaseWorkflows()) return;

    const subject: RepoSearch = {
      owner: repository.owner.login,
      repo: repository.name,
    };

    const [attributes, icon] = await Promise.all([
      fetchAttributes(octokit, subject, workflow_run.id),
      getIcon(octokit, subject),
    ]);

    if (attributes.length === 0) {
      if (workflow_run.head_branch) {
        attributes.push({
          tag: workflow_run.head_branch,
        });
      }
    }

    for (const { tag, curseforgeUrl, modrinthUrl } of attributes) {
      const color = conclusionColor(workflow_run.conclusion);

      const icon_url = icon?.endsWith(".png")
        ? icon
        : repository.owner.avatar_url;

      const author = {
        name: repository.name,
        icon_url,
      };

      const key = [
        "workflow",
        repository.owner.login,
        workflow_run.conclusion!,
      ];

      if (workflow_run.conclusion === "success") {
        const buttons: Button[] = [];

        if (modrinthUrl) {
          buttons.push({
            label: "Modrinth",
            style: ButtonStyle.Link,
            url: modrinthUrl,
            emoji: { id: "1040805511538421890" },
          });
        }

        if (curseforgeUrl) {
          buttons.push({
            label: "CurseForge",
            style: ButtonStyle.Link,
            url: curseforgeUrl,
            emoji: { id: "1249535868365180948" },
          });
        }

        const release = await tryFetchRelease(octokit, subject, tag);

        const branchUrl = workflow_run.head_branch
          ? `${repository.html_url}/tree/${workflow_run.head_branch}`
          : repository.html_url;
        const url = release?.html_url ?? branchUrl;

        await sendEmbeds(
          key,
          {
            author,
            title: `Released ${tag}`,
            description: release?.body ?? undefined,
            color,
            url,
          },
          buttons,
        );
      } else {
        await sendEmbeds(key, {
          author,
          title: "Release failed",
          color,
          url: workflow_run.html_url,
        });
      }
    }
  });
}

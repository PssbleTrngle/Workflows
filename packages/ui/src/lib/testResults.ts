import { createPath } from "@pssbletrngle/workflows-shared/topic";
import { mapValues, notNull } from "@pssbletrngle/workflows-shared/util";
import type { RepoSearch } from "@pssbletrngle/workflows-types";
import type {
  Repository,
  TestResult,
  TestResults,
  TestSetup,
} from "@pssbletrngle/workflows-types/metadata";
import type { Octokit } from "octokit";

export async function fetchReleaseResults(
  octokit: Octokit,
  subject: RepoSearch,
) {
  const { data } = await octokit.rest.actions.listWorkflowRunsForRepo({
    ...subject,
    event: "release",
  });

  const grouped = Object.groupBy(data.workflow_runs, ({ head_branch }) => {
    const [, version, module] = head_branch?.split("-") ?? [];
    if (!version || !module) return "unknown";
    return `main/${module}/${version}`;
  });

  return mapValues(grouped, (runs) => {
    const latest = runs?.[0];
    if (!latest) throw new Error("whatever");
    const { status, conclusion } = latest;
    return {
      status,
      conclusion,
      at: latest.created_at,
      link: latest.html_url,
    } as TestResult;
  });
}

export async function fetchBuildResults(octokit: Octokit, subject: RepoSearch) {
  const { data } = await octokit.rest.actions.listWorkflowRunsForRepo({
    ...subject,
    branch: "infra",
  });

  const run = data.workflow_runs.find((it) => it.name === "Trigger Test");

  if (!run) return {};

  const {
    data: { jobs },
  } = await octokit.rest.actions.listJobsForWorkflowRun({
    ...subject,
    run_id: run.id,
  });

  const entries = jobs
    .map(({ name, created_at, conclusion, status, html_url }) => {
      const match = name.match(/^trigger \((.+), (.+)\)$/);
      if (!match) return null;
      const [, type, version] = match;
      const ref = `main/${type}/${version}`;
      const result = {
        status,
        conclusion,
        at: created_at,
        link: html_url,
      } as TestResult;
      return [ref, result] as const;
    })
    .filter(notNull);

  return Object.fromEntries(entries);
}

export async function fetchTestSetups(
  subject: RepoSearch,
  { api, octokit }: App.Locals,
) {
  const [{ branches }, releaseResults, buildResults] = await Promise.all([
    api.request<Repository>(`repository/${createPath(subject)}`),
    fetchReleaseResults(octokit, subject),
    fetchBuildResults(octokit, subject),
  ]);

  return branches.map((branch) => {
    const [, type, version] = branch.ref.split("/");
    const setup: TestSetup = { type, version, ref: branch.ref };

    const release = releaseResults[branch.ref];
    const build = buildResults[branch.ref];
    const tests: TestResults = { release, build };

    return { setup, tests };
  });
}

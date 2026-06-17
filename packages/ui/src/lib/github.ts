import {
  isOudated,
  parseVersion,
  type SemanticVersion,
} from "@pssbletrngle/workflows-shared/semver";
import type { Octokit } from "octokit";
import cached from "./cache";

function wrap(data: { tag_name: string }) {
  return {
    tag: data.tag_name,
    version: parseVersion(data.tag_name),
  };
}

// TODO don't hard-code?
export async function fetchLatestGradleHelper(octokit: Octokit) {
  return cached("gradle-helper/latest", async () => {
    const { data } = await octokit.rest.repos.getLatestRelease({
      repo: "GradleHelper",
      owner: "PssbleTrngle",
    });

    return wrap(data);
  });
}

const CUTOFF: SemanticVersion = { major: 1, minor: 2 };

export async function listGradleHelper(octokit: Octokit) {
  return cached("gradle-helper/list", async () => {
    const { data } = await octokit.rest.repos.listReleases({
      repo: "GradleHelper",
      owner: "PssbleTrngle",
    });

    return data.map(wrap).filter((it) => !isOudated(it.version, CUTOFF));
  });
}

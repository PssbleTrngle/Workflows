import { parseVersion } from "@pssbletrngle/workflows-shared/semver";
import type { Octokit } from "octokit";
import cached from "./cache";

// TODO don't hard-code?
export async function fetchLatestGradleHelper(octokit: Octokit) {
  return cached("gradle-helper", async () => {
    const { data } = await octokit.rest.repos.getLatestRelease({
      repo: "GradleHelper",
      owner: "PssbleTrngle",
    });

    return parseVersion(data.tag_name);
  });
}

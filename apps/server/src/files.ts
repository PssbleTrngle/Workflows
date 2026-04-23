import type { RepoSearchWithBranch } from "@pssbletrngle/workflows-types";
import { RequestError, type Octokit } from "octokit";

export async function getFileContent(
  { branch, ...subject }: RepoSearchWithBranch,
  path: string,
  octokit: Octokit,
) {
  try {
    const { data } = await octokit.rest.repos.getContent({
      ...subject,
      ref: branch,
      path,
      mediaType: {
        format: "raw",
      },
    });

    if (typeof data !== "string") {
      throw new Error("unable to load settings.gradle.kts");
    }

    return data as string;
  } catch (e) {
    if (e instanceof RequestError && e.status === 404) return null;
    throw e;
  }
}

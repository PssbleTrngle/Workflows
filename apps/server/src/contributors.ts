import { replaceContributorsTable } from "@pssbletrngle/contributors-generator";
import type { RepoSearchWithBranch } from "@pssbletrngle/workflows-types";
import type { Octokit } from "octokit";
import { cloneAndModify, type GitUser } from "./git";
import logger from "./logger";
import { fetchBranches, isMainBranch } from "./metadata/branches";
import { createModrinthClient } from "./modrinth";

export async function updateContributors(
  subject: RepoSearchWithBranch,
  cloneUrl: string,
  octokit: Octokit,
  user: GitUser,
) {
  logger.info("-> refreshing contributors");

  const branches = await fetchBranches(octokit, subject);
  if (!isMainBranch(subject.branch, branches)) {
    logger.info("<- not a main branch");
    return;
  }

  const modrinth = createModrinthClient();

  await cloneAndModify(subject, cloneUrl, user, [
    async (path) => {
      await replaceContributorsTable(path, { octokit, modrinth });
      return { message: "updated contributors" };
    },
  ]);
}

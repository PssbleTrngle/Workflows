import type { RepoSearchWithBranch } from "@pssbletrngle/workflows-types";
import { $ } from "bun";
import { cloneAndModify, type ActionResult, type GitUser } from "../git";
import logger from "../logger";

async function executeGradle(
  repositoryPath: string,
  command: string,
): Promise<ActionResult> {
  await $`./gradlew "${command}"`.cwd(repositoryPath).quiet();

  return { message: "reformatted" };
}

export default async function runSpotless(
  subject: RepoSearchWithBranch,
  cloneUrl: string,
  user: GitUser,
) {
  logger.info("-> running spotless apply");
  const [result] = await cloneAndModify(subject, cloneUrl, user, [
    (path) => executeGradle(path, "spotlessApply"),
  ]);

  return result;
}

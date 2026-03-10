import type { Repository } from "@pssbletrngle/workflows-types";
import { $ } from "bun";
import { cloneAndModify, type ActionResult, type GitUser } from "../git";

async function executeGradle(
  repositoryPath: string,
  command: string,
): Promise<ActionResult> {
  await $`./gradlew "${command}"`.cwd(repositoryPath).quiet();

  return { message: "reformatted" };
}

export default async function runSpotless(
  repository: Repository,
  branch: string,
  user: GitUser,
) {
  console.info("-> running spotless apply");
  const result = await cloneAndModify(
    repository,
    user,
    (path) => executeGradle(path, "spotlessApply"),
    branch,
  );

  return result;
}

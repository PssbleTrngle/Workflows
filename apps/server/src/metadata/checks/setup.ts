import type { RepoSearchWithBranch } from "@pssbletrngle/workflows-types";
import type { Octokit } from "octokit";
import logger from "../../logger";
import { saveSetup } from "../database";

const GRADLE_HELPER_REGEX =
  /id\s*\("com\.possible-triangle\.helper"\)\s*version\s*\("([\d.]+)"\)/;

export default async function checkSetup(
  subject: RepoSearchWithBranch,
  octokit: Octokit,
) {
  const { data } = await octokit.rest.repos.getContent({
    ...subject,
    path: "settings.gradle.kts",
    mediaType: {
      format: "raw",
    },
  });

  if (typeof data !== "string") {
    throw new Error("unable to load settings.gradle.kts");
  }

  const result = (data as string).match(GRADLE_HELPER_REGEX);
  const gradleHelper = result?.[1];

  if (!gradleHelper) return;

  logger.debug(`detected gradle helper setup with version ${gradleHelper}`);

  await saveSetup(subject, { gradleHelper });
}

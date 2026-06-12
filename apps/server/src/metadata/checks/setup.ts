import { detectProperties } from "@pssbletrngle/github-meta-generator";
import type { RepoSearchWithBranch } from "@pssbletrngle/workflows-types";
import type { BranchSetup } from "@pssbletrngle/workflows-types/metadata";
import type { Octokit } from "octokit";
import { getFileContent } from "../../files";
import logger from "../../logger";
import { createMetadataContext } from "../branches";
import { Respositories } from "../database";

const GRADLE_HELPER_REGEX =
  /id\s*\("com\.possible-triangle\.helper"\)\s*version\s*\("([\d.]+)"\)/;

export async function checkGradleSetup(
  subject: RepoSearchWithBranch,
  octokit: Octokit,
) {
  const data = await getFileContent(subject, "settings.gradle.kts", octokit);

  if (!data) return;

  const result = data.match(GRADLE_HELPER_REGEX);
  const gradleHelper = result?.[1];

  if (!gradleHelper) return;

  logger.debug(`detected gradle helper setup with version ${gradleHelper}`);

  await Respositories.saveSetup(subject, { gradleHelper });
}

export async function checkProjectSetup(
  subject: RepoSearchWithBranch,
  octokit: Octokit,
) {
  const context = await createMetadataContext(octokit, subject);

  if (context === null) return;
  const config = await detectProperties(context);

  const setup: BranchSetup = {
    type: config.type,
  };

  if (config.type === "minecraft") {
    setup.loaders = config.loaders;
    setup.versions = config.versions;
  }

  Respositories.saveSetup(subject, setup);
}

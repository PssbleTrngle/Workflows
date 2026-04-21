import {
  detectProperties,
  generateInFolder,
  migrateConfigFile,
  type MetadataContext,
} from "@pssbletrngle/github-meta-generator";
import meta from "@pssbletrngle/github-meta-generator/meta";
import type { RepoSearchWithBranch } from "@pssbletrngle/workflows-types";
import type { RepositoryStatus } from "@pssbletrngle/workflows-types/metadata";
import type { Octokit } from "octokit";
import type { ActionResult } from "../git";
import { cloneAndModify, type GitUser } from "../git";
import logger from "../logger";
import { createMetadataContext } from "./branches";
import { deleteBranch, saveMeta, saveStatus } from "./database";

export async function migrateMetadataConfig(
  repositoryPath: string,
  context: MetadataContext,
): Promise<ActionResult> {
  await migrateConfigFile(repositoryPath, context);
  return { message: "migrated metadata config file" };
}

export async function updateMetadataFiles(
  repositoryPath: string,
  context: MetadataContext,
): Promise<ActionResult> {
  const config = await detectProperties(context);

  await generateInFolder(repositoryPath, config, { logger });

  return {
    message: "regenerated metadata files",
  };
}

export function metadataBranch(branch: string) {
  return `metadata/${branch}`;
}

export default async function generateMetadata(
  subject: RepoSearchWithBranch,
  cloneUrl: string,
  octokit: Octokit,
  user: GitUser,
) {
  try {
    const context = await createMetadataContext(octokit, subject);

    if (!context) {
      deleteBranch(subject);
      return;
    }

    await saveStatus(subject, "running");

    const checkout =
      context.config.strategy === "pull_request"
        ? metadataBranch(subject.branch)
        : undefined;

    const result = await cloneAndModify(
      subject,
      cloneUrl,
      user,
      [
        (path) => migrateMetadataConfig(path, context),
        (path) => updateMetadataFiles(path, context),
      ],
      checkout,
    );

    const doneState: RepositoryStatus = checkout ? "opened-pr" : "up-to-date";

    await saveMeta(subject, { ...meta, generatedAt: Date.now() });

    if (!result) {
      await saveStatus(subject, doneState);
      return;
    }

    if (checkout) {
      const search = {
        ...subject,
        head: checkout,
      };
      const { data: openPRs } = await octokit.rest.pulls.list({
        ...search,
        head: `${subject.owner}:${checkout}`,
        state: "open",
      });
      if (openPRs.length) return;

      await octokit.rest.pulls.create({
        ...search,
        base: search.branch,
        title: "Generate Metadata Files",
      });

      octokit.log.info("-> created pull request");
    }

    await saveStatus(subject, doneState);

    octokit.log.info(`<- finished metafile update`, subject);

    return doneState;
  } catch (e) {
    await saveStatus(subject, "failed");
    throw e;
  }
}

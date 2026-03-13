import {
  generateInFolder,
  type Meta,
} from "@pssbletrngle/github-meta-generator";
import type {
  RepoSearchWithBranch,
  Repository,
} from "@pssbletrngle/workflows-types";
import type { RepositoryStatus } from "@pssbletrngle/workflows-types/metadata";
import type { Octokit } from "octokit";
import type { ActionResult } from "../git";
import { cloneAndModify, type GitUser } from "../git";
import type { MetadataContext } from "./branches";
import { createMetadataContext } from "./branches";
import { deleteStatus, saveMetadata, saveStatus } from "./cache";
import detectProperties from "./detection";

type GenerationResult = ActionResult & {
  meta: Meta;
};

export async function updateMetadataFiles(
  repositoryPath: string,
  context: MetadataContext,
): Promise<GenerationResult> {
  const config = await detectProperties(repositoryPath, context);

  const meta = await generateInFolder(repositoryPath, config);

  return {
    message: "regenerated metadata files",
    meta,
  };
}

export function metadataBranch(branch: string) {
  return `metadata/${branch}`;
}

export default async function generateMetadata(
  repository: Repository,
  branch: string,
  octokit: Octokit,
  user: GitUser,
) {
  const repo: RepoSearchWithBranch = {
    owner: repository.owner.login,
    repo: repository.name,
    branch,
  };

  try {
    const context = await createMetadataContext(octokit, repo);

    if (!context) {
      deleteStatus(repo);
      return;
    }

    await saveStatus(repo, "running");

    const checkout =
      context.config.strategy === "pull_request"
        ? metadataBranch(branch)
        : undefined;

    const result = await cloneAndModify(
      repository,
      user,
      (path) => updateMetadataFiles(path, context),
      branch,
      checkout,
    );

    const doneState: RepositoryStatus = checkout ? "opened-pr" : "up-to-date";

    if (!result) {
      await saveStatus(repo, doneState);
      return;
    }

    if (checkout) {
      const search = {
        ...repo,
        head: checkout,
      };
      const { data: openPRs } = await octokit.rest.pulls.list({
        ...search,
        head: `${repo.owner}:${checkout}`,
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

    await saveStatus(repo, doneState);
    await saveMetadata(repo, result.meta);

    octokit.log.info(`<- finished metafile update for ${repository.full_name}`);

    return doneState;
  } catch (e) {
    await saveStatus(repo, "failed");
    throw e;
  }
}

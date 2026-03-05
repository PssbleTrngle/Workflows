import {
  generateInFolder,
  type Meta,
} from "@pssbletrngle/github-meta-generator";
import type { Repository } from "@pssbletrngle/webhooks-types";
import type { Octokit } from "octokit";
import type { ActionResult } from "../git";
import { cloneAndModify, type GitUser } from "../git";
import type { MetadataContext } from "./branches";
import { createMetadataContext } from "./branches";
import { saveMetadata, saveStatus } from "./cache";
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

export default async function generateMetadata(
  repository: Repository,
  branch: string,
  octokit: Octokit,
  user: GitUser,
) {
  const repo = {
    owner: repository.owner.login,
    repo: repository.name,
    base: branch,
  };

  try {
    await saveStatus(repo, "running");

    const context = await createMetadataContext(octokit, repo, branch);
    if (!context) return;

    const checkout =
      context.config.strategy === "pull_request"
        ? `metadata/${branch}`
        : undefined;

    const result = await cloneAndModify(
      repository,
      user,
      (path) => updateMetadataFiles(path, context),
      branch,
      checkout,
    );

    if (!result) {
      await saveStatus(repo, "up-to-date");
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
        title: "Generate Metadata Files",
      });

      console.info("-> created pull request");

      await saveStatus(repo, "opened-pr");
    } else {
      await saveStatus(repo, "up-to-date");
    }

    await saveMetadata(repo, result.meta);

    console.info(`<- finished metafile update for ${repository.full_name}`);
  } catch (e) {
    await saveStatus(repo, "failed");
    throw e;
  }
}

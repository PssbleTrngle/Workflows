import type { Repository } from "@pssbletrngle/webhooks-types";
import type { Octokit } from "octokit";
import { cloneAndModify, type GitUser } from "../git";
import { createMetadataContext } from "./branches";
import { saveStatus } from "./cache";
import { updateMetadataFiles } from "./generator";

export default async function generateMetadata(
  repository: Repository,
  branch: string,
  octokit: Octokit,
  user: GitUser,
) {
  const repo = {
    owner: repository.owner.login,
    repo: repository.name,
  };

  try {
    await saveStatus(repo, "running");

    const context = await createMetadataContext(octokit, repo, branch);
    if (!context) return;

    const checkout =
      context.config.strategy === "pull_request"
        ? `metadata/${branch}`
        : undefined;

    const changed = await cloneAndModify(
      repository,
      user,
      (path) => updateMetadataFiles(path, context),
      branch,
      checkout,
    );

    if (!changed) {
      await saveStatus(repo, "up-to-date");
      return;
    }

    if (checkout) {
      const search = {
        ...repo,
        base: branch,
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

    console.info(`<- finished metafile update for ${repository.full_name}`);
  } catch (e) {
    await saveStatus(repo, "failed");
    throw e;
  }
}

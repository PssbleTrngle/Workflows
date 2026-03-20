import type { WebhookEventDefinition } from "@octokit/webhooks/types";
import { configPath } from "@pssbletrngle/github-meta-generator";
import type { RepoSearch, Repository } from "@pssbletrngle/workflows-types";
import type { App } from "octokit";
import logger from "../logger";
import { createAppGitUser } from "../user";
import createApiRoutes from "./api";
import { deleteCacheForRepository, saveStatus, updateCache } from "./cache";
import generateMetadata, { metadataBranch } from "./generator";
import createUIMiddlware from "./ui";

function shouldTriggerUpdate({
  added,
  removed,
  modified,
}: WebhookEventDefinition<"push">["commits"][0]) {
  return [added, removed, modified].flat().includes(configPath);
}

export function registerMetadataHooks(hooks: App["webhooks"]) {
  hooks.onError((error) => {
    logger.error(error);
  });

  hooks.on("push", async ({ payload, octokit }) => {
    const { commits, ref, repository, installation } = payload;

    function isValidRepository(
      value: typeof repository,
    ): value is Repository & typeof repository {
      return !!repository.owner?.login;
    }

    if (!isValidRepository(repository))
      throw new Error(`owner missing for repository ${repository.full_name}`);

    if (commits.some(shouldTriggerUpdate)) {
      octokit.log.info(`config changed for ${repository.full_name}`);

      if (!installation) {
        octokit.log.warn(`installation missing for ${repository.full_name}`);
        return;
      }

      const [, branch] = /^refs\/heads\/(.+)$/.exec(ref) ?? [];
      if (!branch)
        throw new Error(`unable to decode branch name from ref '${ref}'`);

      const user = await createAppGitUser(
        { repository, installation },
        octokit,
      );
      await generateMetadata(repository, branch, octokit, user);
    }
  });

  hooks.on("pull_request.closed", async ({ payload, octokit }) => {
    // const user = await createUserInfo(octokit);

    const { pull_request, repository } = payload;

    // TODO might be possible if authentication as bot is always possible
    // if (pull_request.user.login !== user.name) return;
    if (pull_request.head.ref !== metadataBranch(pull_request.base.ref)) return;

    octokit.log.info(
      `metadata pull request merged for ${pull_request.head.label}`,
    );

    const search: RepoSearch = {
      owner: repository.owner.login,
      repo: repository.name,
    };

    await octokit.rest.git.deleteRef({
      ...search,
      ref: `heads/${pull_request.head.ref}`,
    });

    saveStatus({ ...search, branch: pull_request.base.ref }, "up-to-date");
  });

  hooks.on("repository.renamed", async ({ payload }) => {
    const to: RepoSearch = {
      owner: payload.repository.owner.login,
      repo: payload.repository.name,
    };

    const from = {
      owner: payload.repository.owner.login,
      repo: payload.changes.repository.name.from,
    };

    logger.info("repository got renamed", { from, to });

    await updateCache(from, to);
  });

  hooks.on("repository.transferred", async ({ payload }) => {
    const to: RepoSearch = {
      owner: payload.repository.owner.login,
      repo: payload.repository.name,
    };

    const fromOwner =
      payload.changes.owner.from.organization ??
      payload.changes.owner.from.user;

    if (!fromOwner) return;

    const from = {
      owner: fromOwner.login,
      repo: payload.repository.name,
    };

    logger.info("repository got transferred", { from, to });

    await updateCache(from, to);
  });

  hooks.on("repository.deleted", async ({ payload }) => {
    const repo: RepoSearch = {
      owner: payload.repository.owner.login,
      repo: payload.repository.name,
    };

    logger.info("repository got deleted", { repo });

    await deleteCacheForRepository(repo);
  });
}

export async function createMetadataMiddleware(app: App) {
  const uiMiddlware = await createUIMiddlware(app);
  const apiMiddleware = createApiRoutes(app);

  return [apiMiddleware, uiMiddlware];
}

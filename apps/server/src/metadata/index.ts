import { configPath } from "@pssbletrngle/github-meta-generator";
import type {
  GithubRepository,
  RepoSearch,
  RepoSearchWithBranch,
} from "@pssbletrngle/workflows-types";
import type { App } from "octokit";
import logger from "../logger";
import { createGitUser } from "../user";
import { fileChanged } from "./checks/commit";
import checkIcon, { ICON_PATHS } from "./checks/icon";
import { checkGradleSetup } from "./checks/setup";
import checkViewers from "./checks/viewers";
import { Respositories } from "./database";
import generateMetadata, { metadataBranch } from "./generator";

export async function registerMetadataHooks(hooks: App["webhooks"]) {
  hooks.onError((error) => {
    logger.error(error);
  });

  hooks.on("push", async ({ payload, octokit }) => {
    const { commits, ref, repository, installation } = payload;

    function isValidRepository(
      value: typeof repository,
    ): value is GithubRepository & typeof repository {
      return !!value.owner?.login;
    }

    if (!isValidRepository(repository))
      throw new Error(`owner missing for repository ${repository.full_name}`);

    const [, branch] = /^refs\/heads\/(.+)$/.exec(ref) ?? [];
    if (!branch)
      throw new Error(`unable to decode branch name from ref '${ref}'`);

    const subject: RepoSearchWithBranch = {
      owner: repository.owner.login,
      repo: repository.name,
      branch,
    };

    if (fileChanged(commits, configPath)) {
      octokit.log.info(`config changed for ${repository.full_name}`);

      if (!installation) {
        octokit.log.warn(`installation missing for ${repository.full_name}`);
        return;
      }

      const user = await createGitUser({ repository, installation, octokit });
      await generateMetadata(subject, repository.clone_url, octokit, user);
    }

    if (fileChanged(commits, "settings.gradle.kts")) {
      await checkGradleSetup(subject, octokit);
    }

    if (fileChanged(commits, ...ICON_PATHS)) {
      await checkIcon(subject, octokit);
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

    Respositories.saveStatus(
      { ...search, branch: pull_request.base.ref },
      "up-to-date",
    );
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

    await Respositories.migrate(from, to);
  });

  hooks.on("repository.transferred", async ({ payload, octokit }) => {
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

    await Respositories.migrate(from, to);
    await checkViewers(to, octokit);
  });

  hooks.on("repository.deleted", async ({ payload }) => {
    const repo: RepoSearch = {
      owner: payload.repository.owner.login,
      repo: payload.repository.name,
    };

    logger.info("repository got deleted", { repo });

    await Respositories.delete(repo);
  });

  hooks.on("delete", async ({ payload }) => {
    if (payload.ref_type !== "branch") return;

    const subject: RepoSearchWithBranch = {
      owner: payload.repository.owner.login,
      repo: payload.repository.name,
      branch: payload.ref,
    };

    logger.info("branch got deleted", { subject });

    await Respositories.deleteBranch(subject);
  });

  hooks.on("create", async ({ payload, octokit }) => {
    const { repository, installation, ref, ref_type } = payload;
    if (ref_type !== "branch") return;

    if (!installation) {
      octokit.log.warn(`installation missing for ${repository.full_name}`);
      return;
    }

    const subject: RepoSearchWithBranch = {
      owner: repository.owner.login,
      repo: repository.name,
      branch: ref,
    };

    const user = await createGitUser({ repository, installation, octokit });
    await generateMetadata(subject, repository.clone_url, octokit, user);
  });
}

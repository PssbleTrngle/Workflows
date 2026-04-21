import type { RepoSearchWithBranch } from "@pssbletrngle/workflows-types";
import { $ } from "bun";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { rm } from "node:fs/promises";
import { join } from "node:path";
import config from "./config";
import logger from "./logger";

export type GitUser = {
  token: string;
  email: string;
  name: string;
};

const basePath = join(config.git.cloneDir, "clones");

export async function setupGitCloneDir() {
  if (existsSync(basePath)) {
    logger.debug(`clearing tmp dir at ${basePath}`);
    await rm(basePath, { recursive: true });
  } else {
    logger.debug(`creating tmp dir at ${basePath}`);
  }

  mkdirSync(basePath, { recursive: true });
}

// retry mechanism
type DuplicateBehaviour = "abort" | "skip" | "delete";

async function clone(
  { owner, branch, repo }: RepoSearchWithBranch,
  cloneUrl: string,
  token: string,
  behaviour: DuplicateBehaviour,
) {
  const url = new URL(cloneUrl);
  logger.info(`-> cloning into ${url} @ ${branch}`);

  url.username = "x-access-token";
  url.password = token;

  const relativePath = join(owner, repo, branch.replaceAll("/", "-"));
  const repositoryPath = join(basePath, relativePath);
  if (existsSync(repositoryPath)) {
    const message = `there is already a process running for ${owner}/${repo}@${branch}`;
    if (behaviour === "abort") throw new Error(message);
    if (behaviour === "skip") {
      logger.warn(message);
      return repositoryPath;
    } else if (behaviour === "delete") {
      rmSync(repositoryPath, { recursive: true });
    }
  }

  await $`git clone ${url} --branch ${branch} ${relativePath}`
    .cwd(basePath)
    .quiet();

  logger.info(`-> sucessfully cloned into ${owner}/${repo}`);

  return repositoryPath;
}

async function detectChanges(path: string) {
  const output =
    await $`git diff --quiet --cached --ignore-matching-lines="\\s+<.+>"`
      .nothrow()
      .cwd(path);

  return output.exitCode === 1;
}

async function configureGit(repositoryPath: string, user: GitUser) {
  await $`git config --local user.name ${user.name}`.cwd(repositoryPath);
  await $`git config --local user.email ${user.email}`.cwd(repositoryPath);
  await $`git config --local commit.gpgsign false`.cwd(repositoryPath);
  await $`git config --local push.autoSetupRemote true`.cwd(repositoryPath);
}

async function branchExists(repositoryPath: string, branch: string) {
  const output = await $`git ls-remote --exit-code --heads origin ${branch}`
    .cwd(repositoryPath)
    .nothrow()
    .quiet();
  return output.exitCode === 0;
}

async function checkoutBranch(repositoryPath: string, branch: string) {
  if (await branchExists(repositoryPath, branch)) {
    logger.info(`-> using existing branch ${branch}`);
    await $`git checkout ${branch}`.cwd(repositoryPath).quiet();
  } else {
    logger.info(`-> creating branch ${branch}`);
    await $`git checkout -b ${branch}`.cwd(repositoryPath).quiet();
  }
}

type Action<T extends ActionResult = ActionResult> = (
  path: string,
) => Promise<T | false>;

type ActionResults<T extends [...Action[]]> = {
  [Index in keyof T]: Awaited<ReturnType<T[Index]>> | false;
} & Pick<T, "length">;

async function executeAction<T extends ActionResult>(
  repositoryPath: string,
  user: GitUser,
  action: Action<T>,
): Promise<T | false> {
  const result = await action(repositoryPath);
  if (result === false) {
    return false;
  }

  await $`git add .`.cwd(repositoryPath).quiet();

  const changed = await detectChanges(repositoryPath);

  if (!changed) {
    logger.info("<- no changes detected");
    return false;
  }

  logger.info(`-> creating commit as ${user.name}`);
  await $`git commit -m "${result.message}"`.cwd(repositoryPath).quiet();

  return result;
}

async function wrappedCloneAndModify<T extends [...Action[]]>(
  repositoryPath: string,
  user: GitUser,
  actions: T,
  checkout?: string,
): Promise<ActionResults<T>> {
  if (checkout) await checkoutBranch(repositoryPath, checkout);
  await configureGit(repositoryPath, user);

  const results = [] as ActionResults<T>;

  for (const action of actions) {
    const result = await executeAction(repositoryPath, user, action);
    results.push(result);
  }

  await $`git push`.cwd(repositoryPath).quiet();

  logger.info("-> completed actions and pushed changes");

  return results;
}

export type ActionResult = {
  message: string;
};

export async function cloneAndModify<T extends [...Action[]]>(
  subject: RepoSearchWithBranch,
  cloneUrl: string,
  user: GitUser,
  actions: T,
  checkout?: string,
): Promise<ActionResults<T>> {
  const repositoryPath = await clone(subject, cloneUrl, user.token, "abort");

  try {
    const result = await wrappedCloneAndModify(
      repositoryPath,
      user,
      actions,
      checkout,
    );
    rmSync(repositoryPath, { recursive: true });
    return result;
  } catch (ex) {
    if (ex instanceof Error) {
      logger.error(`<- an error occurred executing action: ${ex.message}`);
    }
    rmSync(repositoryPath, { recursive: true });
    throw ex;
  }
}

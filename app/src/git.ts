import { $ } from "bun";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import config from "./config";

export type GitUser = {
  token: string;
  email: string;
  name: string;
};

const basePath = config.git.cloneDir;

if (!existsSync(basePath)) {
  mkdirSync(basePath, { recursive: true });
}

type DuplicateBehaviour = "abort" | "skip" | "delete";
type Repository = { clone_url: string; full_name: string };

async function clone(
  repository: Repository,
  branch: string,
  token: string,
  behaviour: DuplicateBehaviour,
) {
  const url = new URL(repository.clone_url);
  console.info(`-> cloning into ${url} @ ${branch}`);

  url.username = "x-access-token";
  url.password = token;

  const repositoryPath = join(basePath, repository.full_name);
  if (existsSync(repositoryPath)) {
    const message = `there is already a process running for ${repository.full_name}`;
    if (behaviour === "abort") throw new Error(message);
    if (behaviour === "skip") {
      console.warn(message);
      return repositoryPath;
    } else if (behaviour === "delete") {
      rmSync(repositoryPath, { recursive: true });
    }
  }

  await $`git clone ${url} --branch ${branch} ${repository.full_name}`
    .cwd(basePath)
    .quiet();

  console.info(`-> sucessfully cloned into ${repository.full_name}`);

  return repositoryPath;
}

async function detectChanges(path: string) {
  const output = await $`git diff --quiet && git diff --cached --quiet `
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
    console.info(`-> using existing branch ${branch}`);
    await $`git checkout ${branch}`.cwd(repositoryPath).quiet();
  } else {
    console.info(`-> creating branch ${branch}`);
    await $`git checkout -b ${branch}`.cwd(repositoryPath).quiet();
  }
}

async function wrappedCloneAndModify<T extends ActionResult>(
  repositoryPath: string,
  user: GitUser,
  action: (path: string) => Promise<T | false>,
  checkout?: string,
) {
  if (checkout) await checkoutBranch(repositoryPath, checkout);
  await configureGit(repositoryPath, user);

  const result = await action(repositoryPath);
  if (result === false) return;

  await $`git add .`.cwd(repositoryPath).quiet();

  const changed = await detectChanges(repositoryPath);

  if (!changed) {
    console.info("<- no changes detected");
    return;
  }

  console.info(`-> creating commit as ${user.name}`);

  await $`git commit -m "${result.message}"`.cwd(repositoryPath).quiet();

  await $`git push`.cwd(repositoryPath).quiet();

  console.info("-> completed actions and pushed changes");

  return result;
}

export type ActionResult = {
  message: string;
};

export async function cloneAndModify<T extends ActionResult>(
  repository: Repository,
  user: GitUser,
  action: (path: string) => Promise<T | false>,
  branch: string,
  checkout?: string,
): Promise<undefined | T> {
  const repositoryPath = await clone(repository, branch, user.token, "delete");

  try {
    const result = await wrappedCloneAndModify(
      repositoryPath,
      user,
      action,
      checkout,
    );
    rmSync(repositoryPath, { recursive: true });
    return result;
  } catch (ex) {
    if (ex instanceof Error) {
      console.error(`<- an error occurred executing action: ${ex.message}`);
    }
    rmSync(repositoryPath, { recursive: true });
    throw ex;
  }
}

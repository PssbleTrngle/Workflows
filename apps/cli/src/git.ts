import type { RepoSearch } from "@pssbletrngle/workflows-types";
import { $ } from "bun";

export async function listBranches(path: string) {
  const output = await $`git ls-remote --heads`.cwd(path).quiet();
  const branches = output
    .text()
    .split("\n")
    .map((it) => it.trim())
    .map((it) => it.substring(it.indexOf("refs/heads/")))
    .map((it) => it.substring("refs/heads/".length))
    .filter((it) => it.length > 0);

  return branches;
}

export async function getBranch(path: string) {
  const output = await $`git rev-parse --abbrev-ref HEAD`.cwd(path).quiet();
  return output.text();
}

export async function getRepo(path: string): Promise<RepoSearch> {
  const output = await $`git remote get-url origin`.cwd(path).quiet();
  const match = output
    .text()
    .trim()
    .match(/\/(\w+)\/(\w+)\.git$/);

  if (!match) throw new Error("unable to extract repository from remote");

  const [, owner, repo] = match as [string, string, string];
  return { owner, repo };
}

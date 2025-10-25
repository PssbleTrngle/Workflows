import type { WebhookEventDefinition } from "@octokit/webhooks/types";
import { $ } from "bun";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { updateMetadataFiles } from "./generator";

const basePath = "./tmp";

if (!existsSync(basePath)) {
  mkdirSync(basePath, { recursive: true });
}

async function clone(
  repository: WebhookEventDefinition<"push">["repository"],
  token: string
) {
  const url = new URL(repository.clone_url);
  url.username = "x-access-token";
  url.password = token;
  console.log(`cloning into ${url}`);

  await $`git clone ${url} ${repository.full_name}`.cwd(basePath);

  const repositoryPath = join(basePath, repository.full_name);

  console.log(`-> sucessfully cloned into ${repository.full_name}`);

  return repositoryPath;
}

export async function cloneAndUpdate(
  repository: WebhookEventDefinition<"push">["repository"],
  token: string
) {
  const repositoryPath = await clone(repository, token);

  await updateMetadataFiles(repositoryPath);

  rmSync(repositoryPath, { recursive: true });
}

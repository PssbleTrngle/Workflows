import {
  configPath,
  migrateConfig,
  validateConfig,
  type MetadataContext,
} from "@pssbletrngle/github-meta-generator";
import type {
  RepoSearch,
  RepoSearchWithBranch,
} from "@pssbletrngle/workflows-types";
import type { Octokit, RequestError } from "octokit";
import logger from "../logger";

export async function fetchBranches(octokit: Octokit, search: RepoSearch) {
  const { data } = await octokit.rest.repos.listBranches(search);
  return data.map((it) => it.name);
}

async function fetchConfig(
  octokit: Octokit,
  { branch, ...search }: RepoSearchWithBranch,
) {
  try {
    const { data } = await octokit.rest.repos.getContent({
      ...search,
      path: configPath,
      ref: branch,
      mediaType: {
        format: "raw",
      },
    });

    if (typeof data !== "string") {
      throw new Error(`unable to load config file for branch ${branch}`);
    }

    return JSON.parse(data);
  } catch (e) {
    if ((e as RequestError).status === 404) return null;
    throw e;
  }
}

// TODO test
function isMainBranch(branch: string, { branches }: MetadataContext) {
  if (branch === "main" && !branches.includes("develop")) {
    return true;
  }

  if (branch.startsWith("main/")) {
    const suffix = branch.substring("main/".length);
    return !branches.includes(`develop/${suffix}`);
  }

  return false;
}

export async function createMetadataContext(
  octokit: Octokit,
  target: RepoSearchWithBranch,
) {
  const [uncheckedConfig, branches] = await Promise.all([
    fetchConfig(octokit, target),
    fetchBranches(octokit, target),
  ]);

  if (!uncheckedConfig) return null;

  const migrationContext: Omit<MetadataContext, "config"> = {
    branches,
    target,
    logger,
  };

  const migrated = await migrateConfig(uncheckedConfig, migrationContext);
  const config = validateConfig(migrated);

  const context: MetadataContext = { ...migrationContext, config };

  if (isMainBranch(target.branch, context)) return context;
  return null;
}

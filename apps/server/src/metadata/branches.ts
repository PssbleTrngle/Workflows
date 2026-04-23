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
import type { Octokit } from "octokit";
import { getFileContent } from "../files";
import logger from "../logger";

export async function fetchBranches(octokit: Octokit, search: RepoSearch) {
  const { data } = await octokit.rest.repos.listBranches(search);
  return data.map((it) => it.name);
}

async function fetchConfig(octokit: Octokit, search: RepoSearchWithBranch) {
  const data = await getFileContent(search, configPath, octokit);
  if (!data) return null;
  return JSON.parse(data);
}

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

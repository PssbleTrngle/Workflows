import {
  configPath,
  validateConfig,
  type ConfigSchema,
} from "@pssbletrngle/github-meta-generator";
import type {
  RepoSearch,
  RepoSearchWithBranch,
} from "@pssbletrngle/workflows-types";
import type { Octokit, RequestError } from "octokit";

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

    return validateConfig(JSON.parse(data));
  } catch (e) {
    if ((e as RequestError).status === 404) return null;
    throw e;
  }
}

const MC_VERSION_PATTERN =
  /^((forge|fabric|neoforge|quilt)\/)?\d+\.\d+(\.(\d+|x))?$/;

export type MetadataContext = {
  branches: string[];
  config: ConfigSchema;
};

function isMainBranch(branch: string, { branches, config }: MetadataContext) {
  if (branch === "main" && !branches.includes("develop")) {
    return true;
  }

  if (config.type === "minecraft" && MC_VERSION_PATTERN.test(branch)) {
    return true;
  }

  return false;
}

export async function createMetadataContext(
  octokit: Octokit,
  search: RepoSearchWithBranch,
) {
  const [config, branches] = await Promise.all([
    fetchConfig(octokit, search),
    fetchBranches(octokit, search),
  ]);

  if (!config) return null;

  const context: MetadataContext = { branches, config };

  if (isMainBranch(search.branch, context)) return context;
  return null;
}

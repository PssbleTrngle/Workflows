import {
  validateConfig,
  type ConfigSchema,
} from "@pssbletrngle/github-meta-generator";
import type { Octokit } from "octokit";
import { configPath } from "./generator";

type RepoSearch = {
  owner: string;
  repo: string;
};

async function fetchBranches(octokit: Octokit, search: RepoSearch) {
  const { data } = await octokit.rest.repos.listBranches(search);
  return data.map((it) => it.name);
}

async function fetchConfig(
  octokit: Octokit,
  branch: string,
  search: RepoSearch
) {
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
}

const MC_VERSION_PATTERN =
  /^((forge|fabric|neoforge|quilt)\/)?\d+\.\d+(\.(\d+|x))?$/;

export type MetadataContext = {
  branches: string[];
  config: ConfigSchema;
};

export async function createMetadataContext(
  octokit: Octokit,
  search: RepoSearch,
  branch: string
) {
  const [config, branches] = await Promise.all([
    fetchConfig(octokit, branch, search),
    fetchBranches(octokit, search),
  ]);

  const context: MetadataContext = { branches, config };

  if (branch === "main" && !branches.includes("develop")) {
    return context;
  }

  if (config.type === "minecraft" && MC_VERSION_PATTERN.test(branch)) {
    return context;
  }

  return null;
}

import {
  configPath,
  validateConfig,
  type ConfigSchema,
} from "@pssbletrngle/github-meta-generator";
import type { RepoSearch } from "@pssbletrngle/webhooks-types";
import type { Octokit, RequestError } from "octokit";
import { deleteStatus } from "./cache";

export async function fetchBranches(octokit: Octokit, search: RepoSearch) {
  const { data } = await octokit.rest.repos.listBranches(search);
  return data.map((it) => it.name);
}

async function fetchConfig(
  octokit: Octokit,
  branch: string,
  search: RepoSearch,
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
  search: RepoSearch,
  base: string,
) {
  const [config, branches] = await Promise.all([
    fetchConfig(octokit, base, search),
    fetchBranches(octokit, search),
  ]);

  if (!config) return null;

  const context: MetadataContext = { branches, config };

  if (isMainBranch(base, context)) return context;
  return null;
}

// TODO share?
function notNull<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

// TODO remove
export async function createMetadataContexts(
  octokit: Octokit,
  search: RepoSearch,
) {
  const branches = await fetchBranches(octokit, search);

  const withConfigs = await Promise.all(
    branches.map(async (branch) => {
      const config = await fetchConfig(octokit, branch, search);
      if (!config) await deleteStatus({ ...search, base: branch });
      else return { branch, config };
    }),
  );

  return withConfigs
    .filter(notNull)
    .map(({ config, ...rest }) => ({ ...rest, context: { config, branches } }))
    .filter(({ branch, context }) => isMainBranch(branch, context));
}

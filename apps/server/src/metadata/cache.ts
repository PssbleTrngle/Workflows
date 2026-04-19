import type { Meta } from "@pssbletrngle/github-meta-generator";
import type {
  RepoSearch,
  RepoSearchWithBranch,
} from "@pssbletrngle/workflows-types";
import type {
  Checks,
  RepositoryStatus,
  StatusResult,
} from "@pssbletrngle/workflows-types/metadata";
import logger from "../logger";
import { eventDispatcher } from "./events";

const statusPrefix = "metadata:status:";
const statusKey = ({ owner, repo, branch }: RepoSearchWithBranch) =>
  statusPrefix + `${owner}:${repo}:${branch}`;

function parseKey(prefix: string, key: string): RepoSearchWithBranch {
  const parts = key.substring(prefix.length);
  const [owner, repo, branch] = parts.split(":");
  if (!owner || !repo || !branch) throw new Error("received invalid key");
  return { owner, repo, branch };
}

export async function saveStatus(
  repository: RepoSearchWithBranch,
  status: RepositoryStatus,
) {
  eventDispatcher.sendStatusUpdate(repository, status);
}

export async function deleteCache(repository: RepoSearchWithBranch) {
  logger.debug("deleting cache for branch", repository);
}

export async function deleteCacheForRepository(repository: RepoSearch) {
  logger.debug("deleting cache for repository", repository);
  const statuses = await getStatusesByRepository(repository);

  await Promise.all(
    statuses.map(async ({ search }) => {
      await deleteCache(search);
    }),
  );
}

export function getStatus(_: RepoSearchWithBranch) {
  return null as RepositoryStatus | null;
}

async function getStatuses(_: RepoSearchWithBranch): Promise<StatusResult[]> {
  return [];
}

export function getStatusesByRepository({ owner, repo }: RepoSearch) {
  return getStatuses({ owner, repo, branch: "*" });
}

export async function getStatusesByOwner(owner: string) {
  return getStatuses({ owner, repo: "*", branch: "*" });
}

const metaPrefix = "metadata:meta:";
const metaKey = ({ owner, repo, branch }: RepoSearchWithBranch) =>
  metaPrefix + `${owner}:${repo}:${branch}`;

export async function saveMetadata(_: RepoSearchWithBranch, _2: Meta) {}

export async function getMeta(repository: RepoSearchWithBranch) {
  const json = await redis.get(metaKey(repository));
  if (!json) return null;
  return JSON.parse(json) as Meta;
}

export async function getMetas() {
  const keys = await redis.keys(
    metaKey({ owner: "*", repo: "*", branch: "*" }),
  );
  return Promise.all(
    keys.map(async (it) => ({
      search: parseKey(metaPrefix, it),
      meta: JSON.parse((await redis.get(it)) as string) as Meta,
    })),
  );
}

export async function updateCache(from: RepoSearch, to: RepoSearch) {
  const statuses = await getStatusesByRepository(from);

  await Promise.all(
    statuses.map(async ({ search, status }) => {
      const meta = await getMeta(search);
      await saveStatus({ ...to, branch: search.branch }, status);
      if (meta) await saveMetadata({ ...to, branch: search.branch }, meta);
      await deleteCache(search);
    }),
  );
}

const checksPrefix = "metadata:checks:";
const checksKey = ({ owner, repo, branch }: RepoSearchWithBranch) =>
  checksPrefix + `${owner}:${repo}:${branch}`;

export async function saveChecks(repo: RepoSearchWithBranch, checks: Checks) {
  eventDispatcher.sendChecksUpdate(repo, checks);
}

export async function getChecks(repo: RepoSearchWithBranch): Promise<Checks> {
  return {};
}

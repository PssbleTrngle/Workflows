import type { Meta } from "@pssbletrngle/github-meta-generator";
import type {
  RepoSearch,
  RepoSearchWithBranch,
} from "@pssbletrngle/webhooks-types";
import type {
  RepositoryStatus,
  StatusResult,
} from "@pssbletrngle/webhooks-types/metadata";
import { redis } from "@pssbletrngle/workflows-persistance";
import { eventDispatcher } from "./events";

const statusPrefix = "metadata:status:";
const statusKey = ({ owner, repo, base }: RepoSearchWithBranch) =>
  statusPrefix + `${owner}:${repo}:${base}`;

function parseKey(key: string): RepoSearchWithBranch {
  const parts = key.substring(statusPrefix.length);
  const [owner, repo, base] = parts.split(":");
  if (!owner || !repo || !base) throw new Error("received invalid key");
  return { owner, repo, base };
}

export async function saveStatus(
  repository: RepoSearchWithBranch,
  status: RepositoryStatus,
) {
  await redis.set(statusKey(repository), status);
  eventDispatcher.sendStatusUpdate(repository, status);
}

export function getStatus(repository: RepoSearchWithBranch) {
  return redis.get(statusKey(repository)) as Promise<RepositoryStatus | null>;
}

async function getStatuses(
  search: RepoSearchWithBranch,
): Promise<StatusResult[]> {
  const keys = await redis.keys(statusKey(search));
  return Promise.all(
    keys.map(async (it) => ({
      search: parseKey(it),
      status: (await redis.get(it)) as RepositoryStatus,
    })),
  );
}

export function getStatusesByRepository({ owner, repo }: RepoSearch) {
  return getStatuses({ owner, repo, base: "*" });
}

export async function getStatusesByOwner(owner: string) {
  return getStatuses({ owner, repo: "*", base: "*" });
}

const metaPrefix = "metadata:meta:";
const metaKey = ({ owner, repo, base }: RepoSearchWithBranch) =>
  metaPrefix + `${owner}:${repo}:${base}`;

export async function saveMetadata(
  repository: RepoSearchWithBranch,
  meta: Meta,
) {
  await redis.set(metaKey(repository), JSON.stringify(meta));
}

export async function getMeta(repository: RepoSearchWithBranch) {
  const json = await redis.get(metaKey(repository));
  if (!json) return null;
  return JSON.parse(json) as Meta;
}

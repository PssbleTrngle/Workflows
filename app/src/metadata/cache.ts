import type { RepoSearch } from "@pssbletrngle/webhooks-types";
import type { RepositoryStatus } from "@pssbletrngle/webhooks-types/metadata";
import redis from "../redis";

const statusPrefix = "metadata:status:";
const statusKey = ({ owner, repo }: RepoSearch) =>
  statusPrefix + `${owner}:${repo}`;

export async function saveStatus(
  repository: RepoSearch,
  status: RepositoryStatus,
) {
  await redis.set(statusKey(repository), status);
}

export function getStatus(repository: RepoSearch) {
  return redis.get(statusKey(repository)) as Promise<RepositoryStatus | null>;
}

export async function getStatuses(owner: string) {
  const keys = await redis.keys(statusKey({ owner, repo: "*" }));
  const entries = await Promise.all(
    keys.map(async (it) => [
      it.substring(statusPrefix.length).replace(":", "/"),
      await redis.get(it),
    ]),
  );
  return Object.fromEntries(entries) as Record<string, RepositoryStatus>;
}

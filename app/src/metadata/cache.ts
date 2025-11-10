import redis from "../redis";

export type RepositoryStatus =
  | "opened-pr"
  | "up-to-date"
  | "running"
  | "not-set-up";

const statusPrefix = "metadata:status:";
const statusKey = ({ owner, repo }: Repository) =>
  statusPrefix + `${owner}:${repo}`;

type Repository = {
  owner: string;
  repo: string;
};

export async function saveStatus(
  repository: Repository,
  status: RepositoryStatus,
) {
  await redis.set(statusKey(repository), status);
}

export function getStatus(repository: Repository) {
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

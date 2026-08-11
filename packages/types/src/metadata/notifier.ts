import type { RepoSearchWithBranch, WithTimestamps } from "..";

export type RepositoryNotifactionType = "release" | "prerelease";

export type RepositoryRule = {
  [K in keyof RepoSearchWithBranch]: RepoSearchWithBranch[K] | null;
} & {
  type: RepositoryNotifactionType;
};

export type Owned = {
  createdBy: string;
};

export type Notifier = WithTimestamps &
  Owned & {
    name: string;
    rules: RepositoryRule[];
    exclude: RepositoryRule[];
    discordWebhooks: string[];
  };

export const REPOSITORY_NOTIFACTION_TYPES: RepositoryNotifactionType[] = [
  "release",
  "prerelease",
];

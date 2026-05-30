import type { RepoSearchWithBranch, WithTimestamps } from "..";

export type RepositoryRule = {
  [K in keyof RepoSearchWithBranch]: RepoSearchWithBranch[K] | null;
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

import type { RepoSearchWithBranch } from "..";

export type RepositoryStatus =
  | "opened-pr"
  | "up-to-date"
  | "running"
  | "failed";

export type StatusResult = {
  search: RepoSearchWithBranch;
  status: RepositoryStatus;
};

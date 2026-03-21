import type { RepoSearchWithBranch } from "..";
import type { Checks } from "./checks";

export type RepositoryStatus =
  | "opened-pr"
  | "up-to-date"
  | "running"
  | "failed";

export type StatusResult = {
  search: RepoSearchWithBranch;
  status: RepositoryStatus;
  checks: Checks;
};

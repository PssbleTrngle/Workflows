import type { RepoSearch, RepoSearchWithBranch } from ".";

export type RepositoryEventConsumer = {
  sendBranchUpdate(repository: RepoSearchWithBranch): void;

  sendRepositoryUpdate(repository: RepoSearch): void;
};

export type NotifierEventConsumer = {
  sendNotifierUpdate(name: string, user: string): void;
};

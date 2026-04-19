export * from "./page";

export type GithubRepository = {
  id: number;
  html_url: string;
  clone_url: string;
  full_name: string;
  name: string;
  owner: {
    login: string;
  };
};

export type WithTimestamps = {
  createdAt: string;
  updatedAt: string;
};

export type RepoSearch = {
  owner: string;
  repo: string;
};

export type RepoSearchWithBranch = {
  owner: string;
  repo: string;
  branch: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Dictionary = Record<string, any>;

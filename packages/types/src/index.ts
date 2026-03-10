export * from "./topic";

export type Repository = {
  id: number;
  html_url: string;
  clone_url: string;
  full_name: string;
  name: string;
  owner: {
    login: string;
  };
};

export type RepoSearch = {
  owner: string;
  repo: string;
};

export type RepoSearchWithBranch = {
  owner: string;
  repo: string;
  base: string;
};

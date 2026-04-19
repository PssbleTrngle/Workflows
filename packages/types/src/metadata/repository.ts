import type { WithTimestamps } from "..";
import type { RepositoryStatus } from "./status";

export type Branch = {
  ref: string;
  generatorMeta?: {
    version: string;
    generatedAt: string;
  };
  status?: RepositoryStatus;
  checks?: {
    canModify: boolean;
    isProtected: boolean;
  };
  setup?: {
    type: string;
    loaders: string[];
    versions: string[];
    gradleHelper: string;
  };
};

export type Repository = WithTimestamps & {
  owner: string;
  repo: string;
  icon?: string;
  branches: Branch[];
};

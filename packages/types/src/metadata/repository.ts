import type { DateTime, WithTimestamps } from "..";
import type { Checks } from "./checks";
import type { RepositoryStatus } from "./status";

export type BranchSetup = {
  type?: string;
  loaders?: string[];
  versions?: string[];
  gradleHelper?: string;
};

export type Setup = {
  type: string[];
  loaders: string[];
  versions: string[];
  gradleHelper: string[];
};

export type Branch = {
  ref: string;
  generatorMeta?: {
    version: string;
    source: string;
    generatedAt: DateTime;
  };
  status?: RepositoryStatus;
  checks?: Checks;
  setup?: BranchSetup;
};

export type Repository = WithTimestamps & {
  owner: string;
  repo: string;
  icon?: string | null;
  thumbnail?: Buffer | null;
  visibleTo: string[];
  branches: Branch[];
};

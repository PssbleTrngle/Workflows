import type { DateTime, WithTimestamps } from "..";
import type { Checks } from "./checks";
import type { RepositoryStatus } from "./status";

export type Branch = {
  ref: string;
  generatorMeta?: {
    version: string;
    source: string;
    generatedAt: DateTime;
  };
  status?: RepositoryStatus;
  checks?: Checks;
  setup?: {
    type?: string;
    loaders?: string[];
    versions?: string[];
    gradleHelper?: string;
  };
};

export type Repository = WithTimestamps & {
  owner: string;
  repo: string;
  icon?: string | null;
  visibleTo: string[];
  branches: Branch[];
};

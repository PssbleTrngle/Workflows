import type { RepoSearchWithBranch } from "@pssbletrngle/workflows-types";
import type { ConfigSchema } from "./config";
import type { Options } from "./options";

export type MetadataContext = Options & {
  branches: string[];
  config: ConfigSchema;
  target: RepoSearchWithBranch;
};

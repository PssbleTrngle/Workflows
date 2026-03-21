import type { Migration } from ".";

const CURRENT_VERSION = "1.0";

const addVersion: Migration = (config) => {
  return {
    $version: CURRENT_VERSION,
    ...config,
  };
};

const updateSchema: Migration = (config) => {
  return {
    ...config,
    // TODO don't hardcode
    $schema: "https://workflows.somethingcatchy.net/schema/config.json",
  };
};

const referenceOwner: Migration = (config) => {
  // TODO needs more context
  if (!config.assignee) return config;
  return { ...config, assignee: "@owner" };
};

export default [addVersion, updateSchema];

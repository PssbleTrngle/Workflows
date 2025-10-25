import createYamlGenerator from "../yaml";

const defaultData = {
  loaders: [],
  versions: [],
};

export const generateIssueTemplate = createYamlGenerator("issueTemplates", {
  defaultData,
});

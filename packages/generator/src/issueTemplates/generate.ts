import createGenerator from "../factory";

const defaultData = {
  loaders: [],
  versions: [],
};

export const generateIssueTemplate = createGenerator("issueTemplates", {
  defaultData,
});

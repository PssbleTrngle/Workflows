import createGenerator from "../factory";

const defaultData = {
  loaders: [] as string[],
  versions: [] as string[],
};

export const generateIssueTemplate = createGenerator("issueTemplates", {
  defaultData,
});

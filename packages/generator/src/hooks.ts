import createGenerator from "./factory";

export const generateGitHooks = createGenerator("hooks", {
  commentStyle: "yaml",
});

import createYamlGenerator from "../yaml";
import helpers from "./helpers";
import partials from "./partials";

const defaultData = {
  javaVersion: 21,
};

export const generateWorkflow = createYamlGenerator("workflows", {
  defaultData,
  partials,
  helpers,
});

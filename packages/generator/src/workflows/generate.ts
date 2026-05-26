import createGenerator from "../factory";
import helpers from "./helpers";
import partials from "./partials";

const defaultData = {
  javaVersion: 26,
};

export const generateWorkflow = createGenerator("workflows", {
  defaultData,
  partials,
  helpers,
});

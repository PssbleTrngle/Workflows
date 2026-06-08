import type { MinecraftConfigSchema } from "../config";
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
  transform: ({ upload, ...data }: MinecraftConfigSchema) => {
    if (!upload) return data;
    const snapshots = upload.snapshots && upload.strategy !== "push";
    return { ...data, upload: { ...upload, snapshots } };
  },
});

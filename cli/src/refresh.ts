import {
  configPath,
  generateInFolder,
  validateConfig,
} from "@pssbletrngle/github-meta-generator";
import { join } from "node:path";

export default async function refresh() {
  const path = ".";
  const configFile = Bun.file(join(path, configPath));

  if (!(await configFile.exists()))
    throw new Error(`unable to find ${configPath} in ${path}`);

  const config = validateConfig(await configFile.json());

  await generateInFolder(path, config);
}

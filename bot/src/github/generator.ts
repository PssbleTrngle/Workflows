import { validateConfig } from "@pssbletrngle/github-meta-generator";
import { join } from "node:path";

export async function updateMetadataFiles(path: string) {
  const configFile = Bun.file(join(path, ".github", "metadata-config.json"));
  if (!(await configFile.exists())) return;

  const config = validateConfig(await configFile.json());

  console.log(config);
}

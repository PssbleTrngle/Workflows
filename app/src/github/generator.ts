import {
  generateWithConfig,
  validateConfig,
} from "@pssbletrngle/github-meta-generator";
import { join } from "node:path";

export async function updateMetadataFiles(repositoryPath: string) {
  const configFile = Bun.file(
    join(repositoryPath, ".github", "metadata-config.json")
  );
  if (!(await configFile.exists())) return false;

  const config = validateConfig(await configFile.json());
  console.info(`-> found config for type ${config.type}`);

  console.info(`-> generating files...`);
  await generateWithConfig(config, async (path, content) => {
    console.info(`     created ${path}`);
    const file = Bun.file(join(repositoryPath, path));
    await file.write(content);
  });

  return "regenerated metadata files";
}

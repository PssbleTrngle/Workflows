import {
  generateWithConfig,
  isGenerated,
  type ConfigSchema,
} from "@pssbletrngle/github-meta-generator";
import type { BunFile } from "bun";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

export const configPath = ".github/metadata-config.json";

async function cleanupMetafiles(path: string): Promise<void> {
  const children = readdirSync(path);

  await Promise.all(
    children.map(async (name) => {
      const child = join(path, name);
      const info = statSync(child);
      if (info.isDirectory()) await cleanupMetafiles(child);
      else if (info.isFile()) {
        const file = Bun.file(child);
        if (await isGenerated(file)) {
          await file.delete();
          console.info(`     deleted previously generated file ${name}`);
        }
      }
    })
  );
}

async function shouldModify(file: BunFile, config: ConfigSchema) {
  if (config.overwrite === "always") return true;

  if (await file.exists()) {
    return isGenerated(file);
  }

  return true;
}

export async function generateInFolder(
  repositoryPath: string,
  config: ConfigSchema
) {
  console.info(`-> found config for type ${config.type}`);

  await cleanupMetafiles(join(repositoryPath, ".github"));

  console.info(`-> generating files...`);
  await generateWithConfig(config, async (path, content) => {
    console.info(`     created ${path}`);
    const file = Bun.file(join(repositoryPath, path));

    if (await shouldModify(file, config)) {
      await file.write(content);
    }
  });
}

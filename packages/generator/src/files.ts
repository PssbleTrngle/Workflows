import type { BunFile } from "bun";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import type { ConfigSchema } from "./config";
import { generateWithConfig } from "./generator";
import { isGenerated } from "./meta";
import { defaultOptions, type Options } from "./options";

export const configPath = ".github/metadata-config.json";

async function cleanupMetafiles(path: string, options: Options): Promise<void> {
  const children = readdirSync(path);

  await Promise.all(
    children.map(async (name) => {
      const child = join(path, name);
      const info = statSync(child);
      if (info.isDirectory()) await cleanupMetafiles(child, options);
      else if (info.isFile()) {
        const file = Bun.file(child);
        if (await isGenerated(file)) {
          await file.delete();
          options.logger.info(`     deleted previously generated file ${name}`);
        }
      }
    }),
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
  config: ConfigSchema,
  customOptions: Partial<Options> = {},
) {
  const options = { ...defaultOptions, ...customOptions };
  options.logger.info(`-> found config for type ${config.type}`);

  await cleanupMetafiles(join(repositoryPath, ".github"), options);

  options.logger.info(`-> generating files...`);
  await generateWithConfig(config, async (path, content) => {
    const file = Bun.file(join(repositoryPath, path));

    if (await shouldModify(file, config)) {
      options.logger.info(`     created ${path}`);
      await file.write(content);
    }
  });
}

import { isOudated, parseVersion } from "@pssbletrngle/workflows-shared/semver";
import { join } from "node:path";
import { format } from "prettier";
import type { ConfigSchema } from "../config";
import type { MetadataContext } from "../context";
import { configPath } from "../files";
import migrations_1_0 from "./1_0";

export type Migration = (
  config: Partial<ConfigSchema>,
  context: Omit<MetadataContext, "config">,
) => Partial<ConfigSchema> | Promise<Partial<ConfigSchema>>;

const migrations: Record<`${number}.${number}`, Migration[]> = {
  "1.0": migrations_1_0,
};

export const migrateConfig: Migration = async (config, context) => {
  const schemaVersion = parseVersion(config.$version ?? "0.0");

  const neededMigrations = Object.entries(migrations)
    .filter(([version]) => isOudated(schemaVersion, parseVersion(version)))
    .flatMap(([_, migrations]) => migrations);

  context.logger.info(
    `running ${neededMigrations.length} migrations for config`,
    { repo: context.target },
  );

  const migrated = await neededMigrations.reduce(
    (previous, migrate) => previous.then((it) => migrate(it, context)),
    Promise.resolve(config),
  );

  return migrated;
};

export async function migrateConfigFile(
  path: string,
  context: Omit<MetadataContext, "config">,
) {
  const file = Bun.file(join(path, configPath));
  const config: Partial<ConfigSchema> = await file.json();
  const migrated = await migrateConfig(config, context);
  const formatted = await format(JSON.stringify(migrated), { parser: "json" });
  await file.write(formatted);
}

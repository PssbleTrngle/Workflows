import type { ConfigSchema } from "../config";
import type { MetadataContext } from "../context";
import migerations_1_0 from "./1_0";

type SchemaVersion = { major: number; minor: number };

function parseVersion(value: string): SchemaVersion {
  const [major, minor] = value.split(".").map((it) => Number.parseInt(it)) as [
    number,
    number,
  ];
  if (isNaN(major) || isNaN(minor))
    throw new Error("invalid schema version format");
  return { major, minor };
}

function isOudated({ major, minor }: SchemaVersion, reference: SchemaVersion) {
  if (major < reference.major) return true;
  if (major > reference.major) return false;
  return minor < reference.minor;
}

export type Migration = (
  config: Partial<ConfigSchema>,
  context: Omit<MetadataContext, "config">,
) => Partial<ConfigSchema> | Promise<Partial<ConfigSchema>>;

const migrations: Record<`${number}.${number}`, Migration[]> = {
  "1.0": migerations_1_0,
};

export const migrateConfig: Migration = async (config, context) => {
  const schemaVersion = parseVersion(config.$version ?? "0.0");

  const neededMigrations = Object.entries(migrations)
    .filter(([version]) => isOudated(schemaVersion, parseVersion(version)))
    .flatMap(([_, migrations]) => migrations);

  context.logger.info(
    `running ${neededMigrations.length} migerations for config`,
    context,
  );

  const migrated = await neededMigrations.reduce(
    (previous, migrate) => previous.then((it) => migrate(it, context)),
    Promise.resolve(config),
  );

  return migrated;
};

import type { ConfigSchema } from "../config";
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
) => Partial<ConfigSchema> | Promise<Partial<ConfigSchema>>;

const migrations: Record<`${number}.${number}`, Migration[]> = {
  "1.0": migerations_1_0,
};

const migrateConfig: Migration = async (config: Partial<ConfigSchema>) => {
  const schemaVersion = parseVersion(config.$version ?? "0.0");

  const neededMigrations = Object.entries(migrations)
    .filter(([version]) => isOudated(schemaVersion, parseVersion(version)))
    .flatMap(([_, migrations]) => migrations);

  const migrated = await neededMigrations.reduce(
    (previous, migrate) => previous.then(migrate),
    Promise.resolve(config),
  );

  return migrated;
};

export default migrateConfig;

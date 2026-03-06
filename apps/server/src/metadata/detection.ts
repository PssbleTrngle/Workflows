import {
  packageManagerSchema,
  validateConfig,
} from "@pssbletrngle/github-meta-generator";
import type { MetadataContext } from "./branches";

function uniq<T>(values: T[]): T[] {
  return values.filter((v, i, a) => a.indexOf(v) === i);
}

function detect(branches: string[], pattern: RegExp): string[] {
  return uniq(
    branches
      .map((branch) => pattern.exec(branch))
      .map((it) => it?.[1] as string)
      .filter((it) => !!it)
      .filter((it) => !it.startsWith("metadata/")),
  );
}

function detectLoadersFrom(branches: string[]) {
  return detect(branches, /^(forge|fabric|quilt|neoforge)(?:\/.+)?$/);
}

function detectVersionsFrom(branches: string[]) {
  return detect(branches, /^(?:.+\/)?(\d+\.\d+(?:\.(?:\d+))?)(?:\.x)?$/)
    .toSorted()
    .toReversed();
}

export default async function detectProperties(
  repositoryPath: string,
  { config, branches }: MetadataContext,
) {
  if (config.type === "web") {
    if (config.manager === "detect") {
      const { packageManager } = await Bun.file("package.json").json();
      const [, match] = /^(\w+)@/.exec(packageManager) ?? [];
      config.manager = packageManagerSchema.parse(match);
      console.info(`  -> detected package manager ${config.manager}`);
    }
  }

  if (config.type === "minecraft") {
    if (config.versions === "detect") {
      const detected = detectVersionsFrom(branches);
      if (detected.length) {
        config.versions = detected;
        console.info(
          `  -> detected minecraft versions: ${detected.join(", ")}`,
        );
      }
    }

    if (config.loaders === "detect") {
      const detected = detectLoadersFrom(branches);
      if (detected.length) {
        config.loaders = detected;
        console.info(`  -> detected minecraft loaders: ${detected.join(", ")}`);
      }
    }
  }

  return validateConfig(config, false);
}

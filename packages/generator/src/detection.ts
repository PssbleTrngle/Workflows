import {
  DETECT_KEY,
  packageManagerSchema,
  validateConfig,
} from "@pssbletrngle/github-meta-generator";
import { uniq } from "@pssbletrngle/workflows-shared/util";
import type { MetadataContext } from "./context";

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
  return detect(branches, /^main\/(forge|fabric|quilt|neoforge)(?:\/.+)?$/);
}

function detectVersionsFrom(branches: string[]) {
  return detect(branches, /^main\/(?:.+\/)?(\d+\.\d+(?:\.(?:\d+))?)(?:\.x)?$/)
    .toSorted()
    .toReversed();
}

export default async function detectProperties({
  config,
  branches,
  target,
  logger,
}: MetadataContext) {
  if (config.type === "web") {
    if (config.manager === DETECT_KEY) {
      const { packageManager } = await Bun.file("package.json").json();
      const [, match] = /^(\w+)@/.exec(packageManager) ?? [];
      config.manager = packageManagerSchema.parse(match);
      logger.info(`  -> detected package manager ${config.manager}`);
    }
  }

  if (config.type === "minecraft") {
    if (config.versions === DETECT_KEY) {
      const detected = detectVersionsFrom(branches);
      if (detected.length) {
        config.versions = detected;
        logger.info(`  -> detected minecraft versions: ${detected.join(", ")}`);
      }
    }

    if (config.loaders === DETECT_KEY) {
      const detected = detectLoadersFrom(branches);
      if (detected.length) {
        config.loaders = detected;
        logger.info(`  -> detected minecraft loaders: ${detected.join(", ")}`);
      }
    }
  }

  if (config.owner === DETECT_KEY) {
    config.owner = target.owner;
  }

  if (config.assignee === "@owner") {
    config.assignee = config.owner;
  }

  return validateConfig(config, false);
}

import type { Meta } from "@pssbletrngle/github-meta-generator";
import currentMeta from "@pssbletrngle/github-meta-generator/meta";
import { type App } from "octokit";
import config from "../../config";
import { setupGitCloneDir } from "../../git";
import { installationContext } from "../../installation";
import logger from "../../logger";
import { getMetas } from "../cache";
import checkProtection from "./protection";
import refresh from "./refresh";

function isOutdated(saved: Meta, current: Meta) {
  if (config.dev) return true;
  return saved.version !== current.version;
}

export default async function onStartup(app: App) {
  await setupGitCloneDir();

  const metas = await getMetas();
  const outdated = metas.filter((it) => isOutdated(it.meta, currentMeta));

  logger.info(`found ${outdated.length} outdated branches`);

  for (const { search } of outdated) {
    const context = await installationContext(app, search);

    const results = await Promise.allSettled([
      refresh(search, context),
      checkProtection(search, context.octokit),
    ]);

    for (const result of results) {
      if (result.status === "rejected") {
        logger.error((result.reason as Error).message);
      }
    }
  }
}

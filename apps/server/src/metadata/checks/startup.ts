import type { Meta } from "@pssbletrngle/github-meta-generator";
import currentMeta from "@pssbletrngle/github-meta-generator/meta";
import { type App } from "octokit";
import check from ".";
import config from "../../config";
import { setupGitCloneDir } from "../../git";
import { installationContext } from "../../installation";
import logger from "../../logger";
import { getMetas } from "../cache";

function isOutdated(saved: Meta, current: Meta) {
  if (config.dev) return true;
  return saved.version !== current.version;
}

export default async function onStartup(app: App) {
  await setupGitCloneDir();

  if (!config.startupCheck) return;

  const metas = await getMetas();
  const outdated = metas.filter((it) => isOutdated(it.meta, currentMeta));

  logger.info(`found ${outdated.length} outdated branches`);

  for (const { search } of outdated) {
    const context = await installationContext(app, search);
    await check(search, context);
  }
}

import type { Meta } from "@pssbletrngle/github-meta-generator";
import currentMeta from "@pssbletrngle/github-meta-generator/meta";
import { type App } from "octokit";
import logger from "../logger";
import { getMetas } from "./cache";
import refresh from "./refresh";

function isOutdated(saved: Meta, current: Meta) {
  return saved.version !== current.version;
}

export default async function onStartup(app: App) {
  const metas = await getMetas();
  const outdated = metas.filter((it) => isOutdated(it.meta, currentMeta));

  logger.info(`found ${outdated.length} outdated branches`);

  for (const { search } of outdated) {
    try {
      await refresh(search, app);
    } catch (e) {
      logger.error((e as Error).message);
      return;
    }
  }
}

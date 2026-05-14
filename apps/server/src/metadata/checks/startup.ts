import type { Meta } from "@pssbletrngle/github-meta-generator";
import currentMeta from "@pssbletrngle/github-meta-generator/meta";
import { Repositories } from "@pssbletrngle/workflows-persistance";
import type { Branch } from "@pssbletrngle/workflows-types/metadata";
import { type App } from "octokit";
import check from ".";
import config from "../../config";
import { setupGitCloneDir } from "../../git";
import { installationContext } from "../../installation";
import logger from "../../logger";
import checkViewers from "./viewers";

function isOutdated(saved: Branch["generatorMeta"], current: Meta) {
  if (config.dev) return true;
  if (!saved) return true;
  return saved.version !== current.version;
}

export default async function onStartup(app: App) {
  await setupGitCloneDir();

  if (!config.startupCheck) return;

  const repositories = await Repositories.find();

  const withContexts = await Promise.all(
    repositories.map(async (it) => {
      const context = await installationContext(app, it);
      return { ...it, context };
    }),
  );

  await Promise.all(
    withContexts.map(async ({ context, ...subject }) => {
      await checkViewers(subject, context.octokit);
    }),
  );

  const metas = withContexts.flatMap(({ owner, repo, branches, context }) =>
    branches.map((it) => {
      const search = { owner, repo, branch: it.ref };
      const meta = it.generatorMeta;
      return { search, meta, context };
    }),
  );

  const outdated = metas.filter((it) => isOutdated(it.meta, currentMeta));

  logger.info(`found ${outdated.length} outdated branches`);

  for (const { search, context } of outdated) {
    await check(search, context);
  }
}

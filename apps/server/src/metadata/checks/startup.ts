import type { Meta } from "@pssbletrngle/github-meta-generator";
import currentMeta from "@pssbletrngle/github-meta-generator/meta";
import { Repositories } from "@pssbletrngle/workflows-persistance";
import { notNull } from "@pssbletrngle/workflows-shared/util";
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
      try {
        const context = await installationContext(app, it);
        return { ...it, context };
      } catch (e) {
        logger.error(
          "unable to create installation context, was the app uninstalled?",
          { repo: it.repo, owner: it.owner, error: (e as Error).message },
        );
        return null;
      }
    }),
  ).then((it) => it.filter(notNull));

  await Promise.all(
    withContexts.map(async ({ context, ...subject }) => {
      await checkViewers(subject, context.octokit);
    }),
  );

  const metas = withContexts.flatMap(({ owner, repo, branches, context }) =>
    branches.map((it) => {
      const subject = { owner, repo, branch: it.ref };
      const meta = it.generatorMeta;
      return { subject, meta, context };
    }),
  );

  const outdated = metas.filter((it) => isOutdated(it.meta, currentMeta));

  logger.info(`found ${outdated.length} outdated branches`);

  for (const { subject, context } of outdated) {
    try {
      await check(subject, context);
    } catch (e) {
      logger.error("unable to run startup checks for branch", {
        ...subject,
        error: (e as Error).message,
      });
    }
  }
}

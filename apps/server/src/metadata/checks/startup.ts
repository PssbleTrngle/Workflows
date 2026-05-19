import type { Meta } from "@pssbletrngle/github-meta-generator";
import currentMeta from "@pssbletrngle/github-meta-generator/meta";
import { Repositories } from "@pssbletrngle/workflows-persistance";
import { notNull } from "@pssbletrngle/workflows-shared/util";
import type { RepoSearch } from "@pssbletrngle/workflows-types";
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
    repositories.map(async ({ owner, repo, ...rest }) => {
      const subject: RepoSearch = { owner, repo };
      try {
        const context = await installationContext(app, subject);
        return { ...rest, subject, context };
      } catch (e) {
        logger.error(
          "unable to create installation context, was the app uninstalled?",
          { ...subject, error: (e as Error).message },
        );
        return null;
      }
    }),
  ).then((it) => it.filter(notNull));

  await Promise.all(
    withContexts.map(async ({ context, subject }) => {
      await checkViewers(subject, context.octokit);
    }),
  );

  const metas = withContexts.flatMap(({ subject, branches = [], context }) =>
    branches.map((it) => {
      const meta = it.generatorMeta;
      return { subject: { ...subject, branch: it.ref }, meta, context };
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

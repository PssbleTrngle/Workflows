import type { WebhookEventDefinition } from "@octokit/webhooks/types";
import { App, createNodeMiddleware } from "octokit";
import config from "../config";
import { cloneAndModify } from "../git";
import createGitUser from "../user";
import createApiRoutes from "./api";
import { createMetadataContext } from "./branches";
import { configPath, updateMetadataFiles } from "./generator";
import createUIMiddlware from "./ui";

const app = new App({
  appId: config.app.id,
  privateKey: config.app.privateKey,
  oauth: config.app.oauth,
  webhooks: { secret: config.webhooks.secret },
  log: console,
});

function shouldTriggerUpdate({
  added,
  removed,
  modified,
}: WebhookEventDefinition<"push">["commits"][0]) {
  return [added, removed, modified].flat().includes(configPath);
}

app.webhooks.onError((error) => {
  console.error(error);
});

app.webhooks.on("push", async ({ payload, octokit }) => {
  const { commits, ref, repository, installation } = payload;

  if (commits.some(shouldTriggerUpdate)) {
    app.log.info(`config changed for ${repository.full_name}`);

    if (!installation) {
      octokit.log.warn(`installation missing for ${repository.full_name}`);
      return;
    }

    const user = await createGitUser({ repository, installation }, octokit);

    const [, branch] = /^refs\/heads\/(.+)$/.exec(ref) ?? [];
    if (!branch)
      throw new Error(`unable to decode branch name from ref '${ref}'`);

    const context = await createMetadataContext(octokit, repository, branch);
    if (!context) return;

    const checkout =
      context.config.strategy === "pull_request"
        ? `metadata/${branch}`
        : undefined;

    await cloneAndModify(
      repository,
      user,
      (path) => updateMetadataFiles(path, context),
      branch,
      checkout
    );

    if (checkout) {
      const search = {
        owner: repository.owner?.name!,
        repo: repository.name,
        base: branch,
        head: checkout,
      };
      const { data: openPRs } = await octokit.rest.pulls.list({
        ...search,
        state: "open",
      });
      if (openPRs.length) return;

      await octokit.rest.pulls.create({
        ...search,
        title: "Generate Metadata Files",
      });

      console.info("-> created pull request");
    }

    console.info(`<- finished metafile update for ${repository.full_name}`);
  }
});

const appMiddleware = createNodeMiddleware(app);
const uiMiddlware = await createUIMiddlware(app);
const apiMiddleware = createApiRoutes(app);

export default [appMiddleware, apiMiddleware, uiMiddlware];

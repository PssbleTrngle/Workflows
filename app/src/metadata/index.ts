import type { WebhookEventDefinition } from "@octokit/webhooks/types";
import { configPath } from "@pssbletrngle/github-meta-generator";
import type { Repository } from "@pssbletrngle/webhooks-types";
import { App, createNodeMiddleware } from "octokit";
import config from "../config";
import { createAppGitUser } from "../user";
import createApiRoutes from "./api";
import generateMetadata from "./generator";
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

  function isValidRepository(
    value: typeof repository,
  ): value is Repository & typeof repository {
    return !!repository.owner?.login;
  }

  if (!isValidRepository(repository))
    throw new Error(`owner missing for repository ${repository.full_name}`);

  if (commits.some(shouldTriggerUpdate)) {
    app.log.info(`config changed for ${repository.full_name}`);

    if (!installation) {
      octokit.log.warn(`installation missing for ${repository.full_name}`);
      return;
    }

    const [, branch] = /^refs\/heads\/(.+)$/.exec(ref) ?? [];
    if (!branch)
      throw new Error(`unable to decode branch name from ref '${ref}'`);

    const user = await createAppGitUser({ repository, installation }, octokit);
    await generateMetadata(repository, branch, octokit, user);
  }
});

const appMiddleware = createNodeMiddleware(app);
const uiMiddlware = await createUIMiddlware(app);
const apiMiddleware = createApiRoutes(app);

export default [appMiddleware, apiMiddleware, uiMiddlware];

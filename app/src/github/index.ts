import type { WebhookEventDefinition } from "@octokit/webhooks/types";
import { App, createNodeMiddleware } from "octokit";
import config from "../config";
import detectBranches from "./branches";
import { updateMetadataFiles } from "./generator";
import { cloneAndModify } from "./git";
import createGitUser from "./user";

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
  return [added, removed, modified].flat().some((file) => {
    return true;
  });
}

app.webhooks.on("push", async ({ payload, octokit }) => {
  if (payload.commits.some(shouldTriggerUpdate)) {
    app.log.info(`config changed for ${payload.repository.full_name}`);

    if (!payload.installation) {
      octokit.log.warn(
        `installation missing for ${payload.repository.full_name}`
      );
      return;
    }

    const branches = await detectBranches(octokit, payload.repository);
    const user = await createGitUser(payload, octokit);

    for (const branch of branches) {
      const checkout = branches.length > 1 ? `metadata/${branch}` : "metadata";

      await cloneAndModify(
        payload.repository,
        user,
        updateMetadataFiles,
        branch,
        checkout
      );
    }
  }
});

app.oauth.on("token.created", async ({ token }) => {
  app.log.debug(token);
});

app.webhooks.on("installation.created", async ({ id, payload }) => {
  app.log.info(`Installation with ID ${id} created`);
});

app.webhooks.on("installation.deleted", async ({ id, payload }) => {
  app.log.info(`Installation with ID ${id} deleted`);
});

const githubMiddleware = createNodeMiddleware(app);

export default githubMiddleware;

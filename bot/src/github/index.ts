import { App, createNodeMiddleware } from "octokit";
import config from "../config";

const app = new App({
  appId: config.app.id,
  privateKey: config.app.privateKey,
  oauth: config.app.oauth,
  webhooks: { secret: config.webhooks.secret },
  log: console,
});

app.webhooks.on("push", ({ payload }) => {
  app.log.debug("payload", payload);
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

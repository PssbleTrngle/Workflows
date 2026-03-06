import { App } from "octokit";
import config from "./config";
import { registerIssuesHooks } from "./issues";
import { registerMetadataHooks } from "./metadata";
import { registerReleasesHooks } from "./releases";

const app = new App({
  appId: config.app.id,
  privateKey: config.app.privateKey,
  oauth: config.app.oauth,
  webhooks: { secret: config.webhooks.secret },
  log: console,
});

registerMetadataHooks(app);
registerReleasesHooks(app);
registerIssuesHooks(app);

export default app;

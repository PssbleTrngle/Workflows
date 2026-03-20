import { App } from "octokit";
import { registerActionsHooks } from "./actions";
import config from "./config";
import { registerIssuesHooks } from "./issues";
import logger from "./logger";
import { registerMetadataHooks } from "./metadata";
import onStartup from "./metadata/startup";
import { registerReleasesHooks } from "./releases";
import { registerSpotlessHooks } from "./spotless";

const app = new App({
  appId: config.app.id,
  privateKey: config.app.privateKey,
  oauth: config.app.oauth,
  webhooks: { secret: config.webhooks.secret },
  log: logger,
});

registerMetadataHooks(app.webhooks);
registerReleasesHooks(app.webhooks);
registerIssuesHooks(app.webhooks);
registerActionsHooks(app.webhooks);
registerSpotlessHooks(app.webhooks);

await onStartup(app);

export default app;

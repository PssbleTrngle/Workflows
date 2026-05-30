import { Worker, isMainThread } from "node:worker_threads";
import { App } from "octokit";
import { registerActionsHooks } from "./actions";
import config from "./config";
import { registerIssuesHooks } from "./issues";
import logger from "./logger";
import { registerMetadataHooks } from "./metadata";
import onStartup from "./metadata/checks/startup";
import { registerReleasesHooks } from "./releases";
import { registerSpotlessHooks } from "./spotless";

const app = new App({
  appId: config.app.id,
  privateKey: config.app.privateKey,
  oauth: config.app.oauth,
  webhooks: { secret: config.webhooks.secret },
  log: logger,
});

if (isMainThread) {
  registerMetadataHooks(app.webhooks);
  registerReleasesHooks(app.webhooks);
  registerIssuesHooks(app.webhooks);
  registerActionsHooks(app.webhooks);
  registerSpotlessHooks(app.webhooks);

  new Worker(new URL(import.meta.url));
} else {
  logger.debug("running startup actions in background...");
  await onStartup(app);
}

export default app;

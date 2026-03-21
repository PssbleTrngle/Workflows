import { sendEmbeds } from "@pssbletrngle/workflows-notifications";
import type { App } from "octokit";
import logger from "./logger";

const enum ItemStatus {
  BACKLOG = "19a9db19",
}

const enum Stakeholder {
  SELF = "18e87427",
  USER = "89fc83bb",
}

const enum Priority {
  URGENT = "a9ebe346",
  HIGH = "615560f2",
  MEDIUM = "2b8f4a7e",
  LOW = "3ad80994",
}

const enum Field {
  STATUS = 10475209,
  STAKEHOLDER = 10476752,
  PRIORITY = 10475252,
}

const PROJECT = {
  project_number: 11,
  username: "PssbleTrngle",
};

export function registerIssuesHooks(hooks: App["webhooks"]) {
  hooks.on("issues.assigned", async ({ payload, octokit }) => {
    const { issue } = payload;

    logger.info("-> adding issue to backlog:", issue.title);

    const isBug = issue.labels?.some((it) => it.name.toLowerCase() === "bug");
    const color = isBug ? 0xd43350 : 0xdecc2a;

    const status = ItemStatus.BACKLOG;
    const priority = isBug ? Priority.HIGH : Priority.LOW;
    const stakeholder =
      PROJECT.username === issue.user?.login
        ? Stakeholder.SELF
        : Stakeholder.USER;

    const { data: item } = await octokit.rest.projects.addItemForUser({
      ...PROJECT,
      type: "Issue",
      id: issue.id,
    });

    await octokit.rest.projects.updateItemForUser({
      ...PROJECT,
      item_id: item.id,
      fields: [
        { id: Field.STATUS, value: status },
        { id: Field.STAKEHOLDER, value: stakeholder },
        { id: Field.PRIORITY, value: priority },
      ],
    });

    await sendEmbeds("issues", {
      author: {
        name: "Issue Assigned",
      },
      title: issue.title,
      description: issue.body ?? undefined,
      color,
      url: issue.html_url,
    });
  });

  hooks.on("issues.unassigned", async ({ payload, octokit }) => {
    const { issue } = payload;
    logger.info(
      "-> trying to remove issue from backlog if present:",
      issue.title,
    );

    await octokit.rest.projects.deleteItemForUser({
      ...PROJECT,
      type: "Issue",
      item_id: issue.id,
    });
  });
}

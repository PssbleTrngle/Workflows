import type { WebhookEventDefinition } from "@octokit/webhooks/types";
import { sendEmbeds } from "@pssbletrngle/workflows-notifications";
import type { App } from "octokit";

function conclusionColor(
  conclusion: WebhookEventDefinition<"check-run-completed">["check_run"]["conclusion"],
): number {
  switch (conclusion) {
    case "cancelled":
      return 0xdecc2a;
    case "timed_out":
    case "failure":
      return 0xd43350;
    case "success":
      return 0x238636;
    default:
      return 0x0980fd;
  }
}

export function registerActionsHooks(hooks: App["webhooks"]) {
  hooks.on("check_run.completed", async ({ payload }) => {
    const { check_run, repository } = payload;

    if (check_run.conclusion === "skipped") return;
    if (!["build", "release"].includes(check_run.name)) return;

    const tag = check_run.check_suite.head_branch;
    const releaseUrl = `${repository.html_url}/releases/tag/${tag}`;
    const title =
      check_run.conclusion === "success" ? "Release created" : "Release failed";

    await sendEmbeds(
      ["workflow", repository.owner.login, check_run.conclusion!],
      {
        author: {
          name: repository.name,
          icon_url: repository.owner.avatar_url,
        },
        title,
        description: `Created version [${tag}](${releaseUrl})`,
        color: conclusionColor(check_run.conclusion),
        url: check_run.html_url,
      },
    );
  });
}

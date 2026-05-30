import { ActionRowBuilder, ButtonBuilder } from "@discordjs/builders";
import { connectDatabase } from "@pssbletrngle/workflows-persistance";
import type { Logger } from "@pssbletrngle/workflows-types/logger";
import type {
  APIActionRowComponent,
  APIButtonComponent,
  APIEmbed,
} from "discord-api-types/v10";
import { readFromDatabase } from "./database";
import readFromEnv from "./env";
import type { NotifactionKey } from "./keys";

export { ButtonStyle } from "discord-api-types/v10";

export type Embed = APIEmbed;
export type Button = Partial<APIButtonComponent>;
export type ActionRow = APIActionRowComponent<APIButtonComponent>;

type NotifactionOptions = {
  database?: boolean;
  environment?: boolean;
  logger?: Logger;
};

export async function createNotifications({
  database = true,
  environment = true,
  logger = console,
}: NotifactionOptions = {}) {
  if (database) await connectDatabase(logger);

  async function getWebhooks(key: NotifactionKey) {
    const found = new Set<string>();

    if (database) {
      const hooks = await readFromDatabase(key);
      hooks.forEach((it) => found.add(it));
    }

    if (environment) {
      const hook = await readFromEnv(key);
      if (hook) found.add(hook);
    }

    return [...found.values()];
  }

  async function sendEmbeds(
    type: NotifactionKey,
    embed: Embed | Embed[],
    buttonBars: Button[][] = [],
  ) {
    const webhooks = await getWebhooks(type);
    if (webhooks.length === 0) return;
    const embeds = Array.isArray(embed) ? embed : [embed];

    const actionBars = buttonBars
      .filter((it) => it.length > 0)
      .map((buttons) => {
        const actionBars = new ActionRowBuilder<ButtonBuilder>();
        buttons.forEach((it) =>
          actionBars.addComponents(new ButtonBuilder(it)),
        );

        return actionBars.toJSON();
      });

    const components = actionBars.length > 0 ? actionBars : undefined;

    const results = await Promise.allSettled(
      webhooks.map(async (webhook) => {
        const response = await fetch(webhook + "?with_components=true", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            embeds,
            components,
          }),
        });

        if (!response.ok)
          throw new Error(
            `error trying to send discord message: ${await response.text()}`,
          );
      }),
    );

    results.forEach((result) => {
      if (result.status === "rejected") {
        logger.error(result.reason.message);
      }
    });
  }

  return { sendEmbeds };
}

import { ActionRowBuilder, ButtonBuilder } from "@discordjs/builders";
import { connectDatabase } from "@pssbletrngle/workflows-persistance";
import type { Logger } from "@pssbletrngle/workflows-types/logger";
import type { APIButtonComponent, APIEmbed } from "discord-api-types/v10";
import { readFromDatabase } from "./database";
import readFromEnv from "./env";

export { ButtonStyle } from "discord-api-types/v10";

export type Embed = APIEmbed;
export type Button = Partial<APIButtonComponent>;

type NotifactionOptions = {
  database?: boolean;
  environment?: boolean;
  logger?: Logger;
};

export default async function createNotifications({
  database = true,
  environment = true,
  logger = console,
}: NotifactionOptions = {}) {
  if (database) await connectDatabase(logger);

  async function getWebhooks(type: string | string[]) {
    const types = Array.isArray(type) ? type : [type];
    const found = new Set<string>();

    if (database) {
      const hooks = await readFromDatabase(types);
      hooks.forEach((it) => found.add(it));
    }

    if (environment) {
      const hook = await readFromEnv(types);
      if (hook) found.add(hook);
    }

    return [...found.values()];
  }

  async function sendEmbeds(
    type: string | string[],
    embed: Embed | Embed[],
    buttons: Button[] = [],
  ) {
    const webhooks = await getWebhooks(type);
    if (webhooks.length === 0) return;
    const embeds = Array.isArray(embed) ? embed : [embed];

    const actionBar = new ActionRowBuilder<ButtonBuilder>();

    buttons.forEach((it) => {
      actionBar.addComponents(new ButtonBuilder(it));
    });

    const components = buttons.length > 0 ? [actionBar.toJSON()] : undefined;

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
        logger.error(result.reason);
      }
    });
  }

  return { sendEmbeds };
}

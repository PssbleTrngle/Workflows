import { ActionRowBuilder, ButtonBuilder } from "@discordjs/builders";
import type { APIButtonComponent, APIEmbed } from "discord-api-types/v10";

export { ButtonStyle } from "discord-api-types/v10";

const sharedDiscordWebhook = process.env.DISCORD_WEBHOOK;

export function discordWebhook(type: string | string[]): string | undefined {
  const types = Array.isArray(type) ? type : [type];

  if (types.length === 0) return sharedDiscordWebhook;

  const key = `DISCORD_WEBHOOK_${types.join("_").toUpperCase()}`;
  return process.env[key] || discordWebhook(types.slice(0, types.length - 1));
}

export type Embed = APIEmbed;
export type Button = Partial<APIButtonComponent>;

export async function sendEmbeds(
  type: string | string[],
  embed: Embed | Embed[],
  buttons: Button[] = [],
) {
  const webhook = discordWebhook(type);
  if (!webhook) return;
  const embeds = Array.isArray(embed) ? embed : [embed];

  const actionBar = new ActionRowBuilder<ButtonBuilder>();

  buttons.forEach((it) => {
    actionBar.addComponents(new ButtonBuilder(it));
  });

  const components = buttons.length > 0 ? [actionBar.toJSON()] : undefined;

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
}

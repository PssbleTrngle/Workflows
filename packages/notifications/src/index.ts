const sharedDiscordWebhook = process.env.DISCORD_WEBHOOK;

export function discordWebhook(type: string | string[]): string | undefined {
  const types = Array.isArray(type) ? type : [type];

  if (types.length === 0) return sharedDiscordWebhook;

  const key = `DISCORD_WEBHOOK_${types.join("_").toUpperCase()}`;
  return process.env[key] || discordWebhook(types.slice(0, types.length - 1));
}

type Embed = {
  color?: number;
  title?: string;
  description?: string;
  url?: string;
  author?: {
    name: string;
    icon_url?: string;
  };
  footer?: {
    text?: string;
    icon_url?: string;
  };
};

export async function sendEmbeds(
  type: string | string[],
  embed: Embed | Embed[],
) {
  const webhook = discordWebhook(type);
  if (!webhook) return;
  const embeds = Array.isArray(embed) ? embed : [embed];

  await fetch(webhook, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ embeds }),
  });
}

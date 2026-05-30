import { extractParts, type NotifactionKey } from "./keys";

const sharedDiscordWebhook = process.env.DISCORD_WEBHOOK;

export default function readFromEnv(key: NotifactionKey): string | undefined {
  const parts = extractParts(key);
  if (parts.length === 0) return sharedDiscordWebhook;

  const name = `DISCORD_WEBHOOK_${parts.join("_").toUpperCase()}`;
  return process.env[name] || readFromEnv(parts.slice(0, parts.length - 1));
}

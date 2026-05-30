const sharedDiscordWebhook = process.env.DISCORD_WEBHOOK;

export default function readFromEnv(types: string[]): string | undefined {
  if (types.length === 0) return sharedDiscordWebhook;

  const key = `DISCORD_WEBHOOK_${types.join("_").toUpperCase()}`;
  return process.env[key] || readFromEnv(types.slice(0, types.length - 1));
}

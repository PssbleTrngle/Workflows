import { NotifierRepository } from "@pssbletrngle/workflows-persistance";
import type { NotifactionKey } from "./keys";

// TODO use logger
const repository = new NotifierRepository(console);

export async function readFromDatabase(key: NotifactionKey): Promise<string[]> {
  if (typeof key === "string" || Array.isArray(key)) return [];

  const notifiers = await repository.findMatching(key.subject, key.type);
  return notifiers.flatMap((it) => it.discordWebhooks);
}

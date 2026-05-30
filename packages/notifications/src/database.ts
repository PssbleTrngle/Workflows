import { NotifierRepository } from "@pssbletrngle/workflows-persistance";
import type { NotifactionKey } from "./keys";

// TODO use logger
const repository = new NotifierRepository(console);

export async function readFromDatabase(key: NotifactionKey): Promise<string[]> {
  if (typeof key === "string" || Array.isArray(key)) return [];
  if (key.type !== "release") return [];

  // TODO use conclusion
  const notifiers = await repository.findMatching(key.subject);

  return notifiers.flatMap((it) => it.discordWebhooks);
}

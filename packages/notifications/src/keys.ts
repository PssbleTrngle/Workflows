import { notNull } from "@pssbletrngle/workflows-shared/util";
import type { RepoSearch } from "@pssbletrngle/workflows-types";

export type ReleaseNotifaction = {
  type: "release";
  conclusion?: string;
  subject: RepoSearch;
};

type TypedNotifactionKey = ReleaseNotifaction;

export type NotifactionKey = string | string[] | TypedNotifactionKey;

function extractTypedParts(key: TypedNotifactionKey) {
  if (key.type === "release") {
    const { owner, repo } = key.subject;
    return [owner, repo, key.conclusion].filter(notNull);
  }

  throw new Error("unknown notifaction key");
}

export function extractParts(key: NotifactionKey): string[] {
  if (typeof key === "string") return [key];
  if (Array.isArray(key)) return key;

  return [key.type, ...extractTypedParts(key)];
}

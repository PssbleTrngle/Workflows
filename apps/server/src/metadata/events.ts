import {
  createTopic,
  type RepoSearchWithBranch,
} from "@pssbletrngle/webhooks-types";
import type { RepositoryStatus } from "@pssbletrngle/webhooks-types/metadata";
import createEventDispatcher, { type EventDispatcher } from "../sse";

type MetadataEventDispatcher = EventDispatcher & {
  sendStatusUpdate(
    repository: RepoSearchWithBranch,
    status: RepositoryStatus,
  ): void;
};

export const eventDispatcher =
  createEventDispatcher() as MetadataEventDispatcher;

eventDispatcher.sendStatusUpdate = (subject, status) => {
  eventDispatcher.send(createTopic(subject, "status"), { status });
};

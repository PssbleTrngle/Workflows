import { createTopic } from "@pssbletrngle/workflows-shared/topic";
import { type RepoSearchWithBranch } from "@pssbletrngle/workflows-types";
import type { RepositoryStatus } from "@pssbletrngle/workflows-types/metadata";
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

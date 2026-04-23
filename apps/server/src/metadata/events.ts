import { createTopic } from "@pssbletrngle/workflows-shared/topic";
import {
  type RepoSearch,
  type RepoSearchWithBranch,
} from "@pssbletrngle/workflows-types";
import createEventDispatcher, { type EventDispatcher } from "../sse";

type MetadataEventDispatcher = EventDispatcher & {
  sendBranchUpdate(repository: RepoSearchWithBranch): void;

  sendRepositoryUpdate(repository: RepoSearch): void;
};

export const eventDispatcher =
  createEventDispatcher() as MetadataEventDispatcher;

eventDispatcher.sendBranchUpdate = (subject) => {
  eventDispatcher.send(createTopic("branch_updated", subject));
};

eventDispatcher.sendRepositoryUpdate = (subject) => {
  eventDispatcher.send(createTopic("repository_updated", subject));
};

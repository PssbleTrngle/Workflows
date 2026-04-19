import { createTopic } from "@pssbletrngle/workflows-shared/topic";
import { type RepoSearchWithBranch } from "@pssbletrngle/workflows-types";
import type {
  Checks,
  RepositoryStatus,
  RepositoryStatusResult,
} from "@pssbletrngle/workflows-types/metadata";
import createEventDispatcher, { type EventDispatcher } from "../sse";

type MetadataEventDispatcher = EventDispatcher & {
  sendStatusUpdate(
    repository: RepoSearchWithBranch,
    status: RepositoryStatus,
  ): void;

  sendChecksUpdate(repository: RepoSearchWithBranch, checks: Checks): void;

  sendRepositoryUpdate(repository: RepositoryStatusResult): void;
};

export const eventDispatcher =
  createEventDispatcher() as MetadataEventDispatcher;

eventDispatcher.sendStatusUpdate = (subject, status) => {
  eventDispatcher.send(createTopic("status_updated", subject), { status });
};

// TODO move to owner topic
eventDispatcher.sendChecksUpdate = (subject) => {
  eventDispatcher.send(createTopic("status_updated", subject));
};

eventDispatcher.sendRepositoryUpdate = ({ subject, statuses }) => {
  eventDispatcher.send(createTopic("repository_updated", subject), {
    statuses,
  });
};

/*
setInterval(() => {
  eventDispatcher.sendRepositoryAdded({
    subject: { owner: "PssbleTrngle", repo: "TestMod" },
    status: {},
  });
}, 1000);
*/

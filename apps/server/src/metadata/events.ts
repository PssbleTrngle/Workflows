import { createTopic } from "@pssbletrngle/workflows-shared/topic";
import type {
  NotifierEventConsumer,
  RepositoryEventConsumer,
} from "@pssbletrngle/workflows-types/events";
import createEventDispatcher, { type EventDispatcher } from "../sse";

type MetadataEventDispatcher = EventDispatcher &
  RepositoryEventConsumer &
  NotifierEventConsumer;

export const eventDispatcher =
  createEventDispatcher() as MetadataEventDispatcher;

eventDispatcher.sendBranchUpdate = (subject) => {
  eventDispatcher.send(createTopic("branch_updated", subject));
};

eventDispatcher.sendRepositoryUpdate = (subject) => {
  eventDispatcher.send(createTopic("repository_updated", subject));
};

eventDispatcher.sendNotifierUpdate = (name) => {
  eventDispatcher.send(`${name}/notifier_updated`);
};

export type UpdateContainersCommand = {
  name: string;
  tag: string;
  keys: string[];
};

type Events = {
  update_containers: UpdateContainersCommand;
};

export type EventType = keyof Events;

export type Event<T extends EventType> = Events[T];

export type EventMetadata = {
  retry?: number;
};

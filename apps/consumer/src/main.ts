import {
  updateContainers,
  type ContainerDisplay,
} from "@pssbletrngle/workflows-docker";
import {
  createEventBus,
  type UpdateContainersCommand,
} from "@pssbletrngle/workflows-events";
import { sendEmbeds } from "@pssbletrngle/workflows-notifications";
import { requireEnv } from "@pssbletrngle/workflows-shared/config";
import { createLock } from "@pssbletrngle/workflows-shared/lock";

function notifyUpdate(
  { name, tag, keys }: UpdateContainersCommand,
  containers: ContainerDisplay[],
) {
  return sendEmbeds(["docker", ...keys], {
    title: `Updated ${name}`,
    description: [
      `Found ${containers.length} matching container(s)`,
      ...containers.map((it) => ` - ${it.link}`),
    ]
      .filter((it) => !!it)
      .join("\n"),
    color: 0x0980fd,
    footer: {
      text: `updated to version ${tag}`,
    },
  });
}

// TODO env variable/hostname?
const name = requireEnv("CONSUMER_NAME");

const events = await createEventBus(`consumer_${name}`);
const lock = createLock();

await events.subscribe("update_containers", (event) =>
  lock.withAquired(async () => {
    const containers = await updateContainers(event.name, event.tag);

    console.info(`-> received update event for ${event.name}:${event.tag}`);

    if (!containers) {
      console.info(`<- no containers found`);
      return;
    }

    console.info(
      `<-  updated ${containers.length} container(s): ${containers.map((it) => it.name).join(",")}`,
    );

    await notifyUpdate(event, containers);
  }),
);

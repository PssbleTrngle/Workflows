import {
  updateContainers,
  type ContainerDisplay,
} from "@pssbletrngle/workflows-docker";
import {
  subscribeEvent,
  type UpdateContainersCommand,
} from "@pssbletrngle/workflows-events";
import { sendEmbeds } from "@pssbletrngle/workflows-notifications";

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

await subscribeEvent("update_containers", async (event) => {
  const containers = await updateContainers(event.name, event.tag);

  console.info(`received update event for ${event.name}:${event.tag}`);

  if (!containers) {
    console.info(`<- no containers found`);
    return;
  }

  console.info(`<- updated ${containers.length} containers`);

  await notifyUpdate(event, containers);
});

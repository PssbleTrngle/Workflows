import { createEventBus } from "@pssbletrngle/workflows-events";

const events = await createEventBus("consumer-fake-events");

let i = 0;

setInterval(async () => {
  console.log("sending fake event");

  await events.publish("update_containers", {
    keys: [],
    name: "test-container",
    tag: `v${i++}`,
  });
}, 1000);

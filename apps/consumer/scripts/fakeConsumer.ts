import { createEventBus } from "@pssbletrngle/workflows-events";
import { createLock } from "@pssbletrngle/workflows-shared/lock";

const events = await createEventBus("consumer");

const lock = createLock();

let concurrend = 0;

await events.subscribe("update_containers", async (event, { retry }) => {
  const retryInfo = retry ? [`(retry: ${retry})`] : [];

  await lock.withAquired(async () => {
    concurrend++;
    console.log(
      "-> consuming",
      event.tag,
      ...retryInfo,
      `(concurrent: ${concurrend})`,
    );
    if (Math.random() < 0.2) {
      console.error("<- rejecting", event.tag);
      concurrend--;
      throw new Error("reject");
    }

    await new Promise((res) => setTimeout(res, Math.random() * 3000));
    console.log("<- done", event.tag);
    concurrend--;
  });
});

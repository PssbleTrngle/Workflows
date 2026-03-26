import { createEventBus } from "@pssbletrngle/workflows-events";
import { beforeAll, describe, it, mock } from "bun:test";

beforeAll(() => {
  mock.module("@pssbletrngle/workflows-docker", () => ({
    updateContainers: (name: string, tag: string) => {
      console.info("updated", name, tag);
      return [];
    },
  }));
});

async function startConsumer() {
  await import("../src/main");
}

describe("triggers docker container update", () => {
  it("for other services", async () => {
    const events = await createEventBus("consumer-test");
    await startConsumer();

    await events.publish("update_containers", {
      keys: [],
      name: "test-image",
      tag: "latest",
    });
  });
});

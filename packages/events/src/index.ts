import type { Logger } from "@pssbletrngle/workflows-types/logger";
import createConnection from "./connection";
import type { Event, EventMetadata, EventType } from "./messages";

export * from "./messages";

const maxRetries = 5;

export async function createEventBus(name: string, logger: Logger = console) {
  const { channel, exchange, getQueue } = await createConnection(name, logger);

  async function subscribe<T extends EventType>(
    topic: T,
    handler: (subject: Event<T>, meta: EventMetadata) => void | Promise<void>,
  ) {
    const queue = await getQueue(topic);

    await channel.consume(
      queue,
      async (message) => {
        if (message) {
          const [death] = message.properties.headers?.["x-death"] ?? [];
          const retry = death?.count;

          try {
            const json = JSON.parse(message.content.toString());
            await handler(json, { retry });
            channel.ack(message);
          } catch (e) {
            if (retry !== undefined && retry >= maxRetries) {
              logger.error("max retries exceeded for message", {
                error: (e as Error).message,
              });
              channel.ack(message);
              return;
            }

            channel.nack(message, undefined, false);
          }
        }
      },
      { exclusive: true },
    );
  }

  async function publish<T extends EventType>(topic: T, data: Event<T>) {
    channel.publish(exchange, topic, Buffer.from(JSON.stringify(data)));
  }

  return { publish, subscribe };
}

import { channel, exchange, queue } from "./connection";
import type { Event, EventType } from "./messages";

export * from "./messages";

export async function subscribeEvent<T extends EventType>(
  topic: T,
  handler: (subject: Event<T>) => void | Promise<void>,
) {
  await channel.bindQueue(queue, exchange, topic);

  await channel.consume(queue, async (message) => {
    if (message) {
      try {
        const json = JSON.parse(message.content.toString());
        await handler(json);
        channel.ack(message);
      } catch (e) {
        console.error(e);
        channel.nack(message);
      }
    }
  });
}

export async function publishEvent<T extends EventType>(
  topic: T,
  data: Event<T>,
) {
  channel.publish(exchange, topic, Buffer.from(JSON.stringify(data)));
}

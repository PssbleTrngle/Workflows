import type { Logger } from "@pssbletrngle/workflows-types/logger";
import amqplib from "amqplib";
import config from "./config";

export default async function createConnection(
  name: string,
  logger: Logger = console,
) {
  if (!config.rabbitmqUrl) {
    throw new Error("RabbitMQ Url missing");
  }

  const exchange = "workflows";
  const retryExchange = `${exchange}_retry`;

  const connection = await amqplib.connect(config.rabbitmqUrl);

  const channel = await connection.createChannel();

  await channel.assertExchange(exchange, "direct", { durable: true });
  await channel.assertExchange(retryExchange, "direct", { durable: true });

  const queues = new Map<string, string>();

  async function getQueue(topic: string) {
    if (queues.has(topic)) return queues.get(topic)!;

    const queue = `${name}_${topic}`;
    const retryQueue = `${queue}_retry`;

    await channel.assertQueue(queue, {
      durable: true,
      arguments: {
        "x-dead-letter-exchange": retryExchange,
        "x-dead-letter-routing-key": queue,
      },
    });

    await channel.assertQueue(retryQueue, {
      durable: true,
      arguments: {
        "x-dead-letter-exchange": exchange,
        "x-dead-letter-routing-key": queue,
        "x-message-ttl": 5000,
      },
    });

    await channel.bindQueue(queue, exchange, topic);
    await channel.bindQueue(queue, exchange, queue);

    await channel.bindQueue(retryQueue, retryExchange, queue);

    queues.set(topic, queue);
    return queue;
  }

  logger.info("Connected to RabbitMQ");

  connection.on("error", (event) => {
    logger.error("RabbitMQ closed due to error", event);
  });

  return { exchange, getQueue, channel };
}

export type RabbitConnection = ReturnType<typeof createConnection>;

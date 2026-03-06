import amqplib from "amqplib";
import config from "./config";

if (!config.rabbitmqUrl) {
  throw new Error("RabbitMQ Url missing");
}

export const exchange = "webhooks";

const connection = await amqplib.connect(config.rabbitmqUrl);

export const channel = await connection.createChannel();

await channel.assertExchange(exchange, "direct", { durable: false });

const q = await channel.assertQueue("");
export const queue = q.queue;

console.info("Connected to RabbitMQ");

connection.on("error", (event) => {
  console.info("RabbitMQ closed due to error", event);
});

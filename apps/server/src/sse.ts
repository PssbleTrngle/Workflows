import logger from "./logger";
import type { AuthenticatedHandler } from "./metadata/auth";

type Connection = {
  send(key: string, payload: unknown): void;
};

export type EventDispatcher = Connection & {
  handler: AuthenticatedHandler;
};

export default function createEventDispatcher(): EventDispatcher {
  const connections = new Set<Connection>();

  const handler: AuthenticatedHandler = (req, res) => {
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const connection: Connection = {
      send: (key, payload) => {
        const encoded = JSON.stringify(payload);
        res.write(`event: ${key}\n`);
        res.write(`data: ${encoded}\n`);
        res.write("\n");
      },
    };

    connections.add(connection);
    logger.debug("sse connection opened");

    req.on("close", () => {
      logger.debug("sse connection closed by client");
      connections.delete(connection);
      res.end();
    });
  };

  const send: Connection["send"] = (key, payload) => {
    logger.debug(`sending '${key}' to ${connections.size} connections`);
    connections.forEach((it) => it.send(key, payload));
  };

  return { handler, send };
}

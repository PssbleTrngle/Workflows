import type { RequestHandler } from "express";
import { createHmac } from "node:crypto";
import config from "./config";

function generateHash(from: string, type: string) {
  const hash = createHmac(type, config.webhooks.secret);
  hash.update(from);
  const hex = hash.digest("hex");
  return `${type}=${hex}`;
}

export const devMiddlware: RequestHandler = async (request, _, next) => {
  if (request.method === "POST" && request.body) {
    request.headers["x-hub-signature-256"] = generateHash(
      request.body,
      "sha256"
    );
    request.headers["x-hub-signature"] = generateHash(request.body, "sha1");
  }

  return next();
};

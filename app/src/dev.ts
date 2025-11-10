import { type RequestHandler } from "express";
import { createHmac } from "node:crypto";
import config from "./config";
import { proxyUI } from "./metadata/ui";

function generateHash(from: string, type: string) {
  const hash = createHmac(type, config.webhooks.secret);
  hash.update(from);
  const hex = hash.digest("hex");
  return `${type}=${hex}`;
}

const forgeSignature: RequestHandler = async (request, _, next) => {
  // this does only work if the express.text({ type: '*/*' }) middlware is used
  // which breaks other things again

  if (request.method === "POST" && request.body) {
    request.headers["x-hub-signature-256"] = generateHash(
      request.body,
      "sha256",
    );
    request.headers["x-hub-signature"] = generateHash(request.body, "sha1");
  }

  return next();
};

const logRequests: RequestHandler = (request, _, next) => {
  console.info(`${request.method} -> ${request.originalUrl}`);
  return next();
};

async function devUIProxy(): Promise<RequestHandler> {
  const patterns = [
    /^\/@vite\//,
    /^\/@fs\//,
    /^\/@id\//,
    /^\/src\/.+\.astro/,
    /^\/node_modules\/.+\.m?js/,
  ];
  const uiProxy = await proxyUI();
  return (req, res, next) => {
    if (patterns.some((it) => it.test(req.path))) {
      return uiProxy(req, res, next);
    }
    return next();
  };
}

export async function createDevMiddleware() {
  return [forgeSignature, logRequests, await devUIProxy()];
}

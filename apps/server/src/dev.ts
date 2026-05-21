import { text, type RequestHandler } from "express";
import { createHmac } from "node:crypto";
import config from "./config";
import { proxyUI } from "./metadata/ui";

function generateHash(from: string, type: string) {
  const hash = createHmac(type, config.webhooks.secret);
  hash.update(from);
  const hex = hash.digest("hex");
  return `${type}=${hex}`;
}

function generateSignatureHeaders(payload: unknown) {
  if (typeof payload !== "string")
    throw new Error("body not parsed using text()");
  return {
    "x-hub-signature-256": generateHash(payload, "sha256"),
    "x-hub-signature": generateHash(payload, "sha1"),
  };
}

const parseText = text({ type: "*/*" });
const generateSignature: RequestHandler = async (req, res, next) => {
  if (req.headers["generate-signatures"] === "true") {
    return parseText(req, res, () => {
      res.json(generateSignatureHeaders(req.body));
    });
  }

  return next();
};

const forgeSignature: RequestHandler = async (req, _, next) => {
  // this does only work if the express.text({ type: '*/*' }) middlware is used
  // which breaks other things again

  if (req.method === "POST" && req.body) {
    Object.assign(req.headers, generateSignatureHeaders(req.body));
  }

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
  return [generateSignature, forgeSignature, await devUIProxy()];
}

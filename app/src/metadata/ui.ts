import { handler } from "@pssbletrngle/webhooks-ui";
import { Router, type RequestHandler } from "express";
import type { App } from "octokit";
import { ApiError } from "../error";
import { authorize, login } from "./auth";

function createCallback(app: App): RequestHandler {
  return async (req, res) => {
    const { code, error } = req.query;

    if (typeof error === "string") {
      throw new ApiError(error, 400);
    }

    if (typeof code !== "string") {
      throw new ApiError(`parameter 'code' is required`, 400);
    }

    const { authentication } = await app.oauth.createToken({ code });

    await login(res, authentication);
    res.redirect("/metadata");
  };
}

async function astroOrProxy(): Promise<RequestHandler> {
  if (process.env.NODE_ENV === "development") {
    console.info("Proxing UI requests to local dev server");
    const { createProxyMiddleware } = await import("http-proxy-middleware");
    return createProxyMiddleware({
      target: "http://localhost:4321",
      changeOrigin: true,
    });
  }

  return handler;
}

export default async function createUIMiddlware(app: App) {
  const router = Router();

  router.get("/callback", createCallback(app));

  router.use(...authorize("redirect"), await astroOrProxy());

  return router;
}

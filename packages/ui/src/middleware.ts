import { defineMiddleware, sequence } from "astro:middleware";
import { Octokit } from "octokit";
import createApiClient from "./lib/api";

const COOKIE = "webhooks-session";

const initializeContext = defineMiddleware(({ locals, request }, next) => {
  console.log("requesting at ", request.url);
  const { protocol } = new URL(request.url);
  console.log(request.headers);
  const host = request.headers.get("host");
  if (!host) throw new Error("host header missing, cannot create api client");
  const origin = `${protocol}//${host}`;
  locals.origin = origin;
  return next();
});

const authorize = defineMiddleware(({ locals, cookies }, next) => {
  if (locals.octokit) return next();

  const token = cookies.get(COOKIE)?.value;
  if (!token) {
    return Response.json({ error: "cookie missing" }, { status: 401 });
  }

  locals.octokit = new Octokit({ auth: token });
  locals.api = createApiClient(locals.origin, token);

  return next();
});

export const onRequest = sequence(initializeContext, authorize);

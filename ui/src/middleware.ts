import { defineMiddleware, sequence } from "astro:middleware";
import { Octokit } from "octokit";
import createApiClient from "./lib/api";

const COOKIE = "webhooks-session";

const initializeContext = defineMiddleware(({ locals, request }, next) => {
  const { origin } = new URL(request.url);
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

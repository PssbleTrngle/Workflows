import { defineMiddleware, sequence } from "astro:middleware";
import { Octokit } from "octokit";
import createApiClient from "./lib/api";

const COOKIE = "webhooks-session";

function getProtocol(request: Request) {
  const forwarded = request.headers.get("x-forwarded-proto");
  if (forwarded) return `${forwarded}:`;
  const url = new URL(request.url);
  return url.protocol;
}

const initializeContext = defineMiddleware(({ locals, request }, next) => {
  const protocol = getProtocol(request);
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

import { defineMiddleware, sequence } from "astro:middleware";
import { Octokit } from "octokit";
import createApiClient from "./lib/api";

const COOKIE = "webhooks-session";

const isDev = process.env.NODE_ENV === "development";

function getProtocol(request: Request) {
  const forwarded = request.headers.get("x-forwarded-proto");
  if (forwarded) return `${forwarded}:`;
  const url = new URL(request.url);
  return url.protocol;
}

function getHost(request: Request) {
  const forwarded = request.headers.get("x-forwarded-host");
  if (forwarded) return forwarded;
  const host = request.headers.get("host");
  if (host) return host;

  throw new Error("host header missing, cannot create api client");
}

function getOrigin(request: Request) {
  if (isDev) return "http://localhost:4321";
  const protocol = getProtocol(request);
  const host = getHost(request);
  return `${protocol}//${host}`;
}

const initializeContext = defineMiddleware(({ locals, request }, next) => {
  locals.origin = getOrigin(request);
  return next();
});

const authorize = defineMiddleware(({ locals, cookies }, next) => {
  if (locals.octokit) return next();

  const token = cookies.get(COOKIE)?.value;
  if (!token) {
    return Response.json({ error: "cookie missing" }, { status: 401 });
  }

  locals.octokit = new Octokit({
    auth: token,
  });
  locals.api = createApiClient(locals.origin, token);

  return next();
});

export const onRequest = sequence(initializeContext, authorize);

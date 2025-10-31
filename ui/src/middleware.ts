import { defineMiddleware, sequence } from "astro:middleware";

const COOKIE = "webhooks-session";

const initializeContext = defineMiddleware(({ locals, request }, next) => {
  const { origin } = new URL(request.url);
  locals.origin = origin;
  return next();
});

const authorize = defineMiddleware(({ locals, cookies, request }, next) => {
  const { origin } = new URL(request.url);
  locals.origin = origin;

  if (locals.session) return next();

  const token = cookies.get(COOKIE)?.value;
  if (!token) {
    return Response.json({ error: "cookie missing" }, { status: 401 });
  }

  locals.session = { token };

  return next();
});

export const onRequest = sequence(initializeContext, authorize);

import type { CreateTokenInterface } from "@octokit/oauth-app";
import cookieParser from "cookie-parser";
import type { Request, RequestHandler, Response } from "express";
import type { ParamsDictionary, Query } from "express-serve-static-core";
import { Octokit } from "octokit";
import { ApiError } from "../error";

const COOKIE_NAME = "webhooks-session";

type Authentication = Awaited<
  ReturnType<CreateTokenInterface<"github-app">>
>["authentication"];

export async function login(
  response: Response,
  authentication: Authentication,
) {
  const expires =
    authentication.expiresAt === undefined
      ? undefined
      : new Date(authentication.expiresAt);

  response.cookie(COOKIE_NAME, authentication.token, {
    httpOnly: true,
    expires,
  });
}

export async function logout(response: Response) {
  response.clearCookie(COOKIE_NAME);
}

type AuthenticationStrategy = "redirect" | "fail";

export type AuthenticatedContext = {
  octokit: Octokit;
};

export type AuthenticatedHandler = RequestHandler<
  ParamsDictionary,
  unknown,
  unknown,
  Query,
  AuthenticatedContext
>;

export type AuthenticatedResponse = Response<unknown, AuthenticatedContext>;

function extractToken(req: Request) {
  const cookie: string = req.cookies[COOKIE_NAME];
  if (cookie) return cookie;

  const [type, credentials] = req.headers.authorization?.split(" ") ?? [];
  if (type === "Token" && credentials) {
    return credentials;
  }

  return null;
}

function createHandler(strategy: AuthenticationStrategy): AuthenticatedHandler {
  return (req, res, next) => {
    const token = extractToken(req);

    if (token) {
      res.locals.octokit = new Octokit({ auth: token });
      return next();
    }

    if (strategy === "redirect") {
      console.info("starting login flow");
      res.redirect("/metadata/api/github/oauth/login");
    } else {
      throw new ApiError("requires login", 401);
    }
  };
}

export function authorize(strategy: AuthenticationStrategy) {
  return [cookieParser(), createHandler(strategy)];
}

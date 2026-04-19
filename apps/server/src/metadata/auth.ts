import type { CreateTokenInterface } from "@octokit/oauth-app";
import type { GithubRepository } from "@pssbletrngle/workflows-types";
import cookieParser from "cookie-parser";
import type { Request, RequestHandler, Response } from "express";
import type { ParamsDictionary, Query } from "express-serve-static-core";
import { Octokit } from "octokit";
import { ApiError } from "../error";
import logger from "../logger";

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

type CommonContext = {
  octokit: Octokit;
};

export type OAuthContext = CommonContext & {
  token: string;
};

export type InstallationContext = CommonContext & {
  installation: { id: number };
  repository: GithubRepository;
};

export type AuthenticatedContext = OAuthContext | InstallationContext;

export type AuthenticatedHandler = RequestHandler<
  ParamsDictionary,
  unknown,
  unknown,
  Query,
  OAuthContext
>;

export type AuthenticatedResponse = Response<unknown, OAuthContext>;

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
  return async (req, res, next) => {
    const token = extractToken(req);

    if (token) {
      res.locals.token = token;
      res.locals.octokit = new Octokit({ auth: token, log: logger });
      return next();
    }

    if (strategy === "redirect") {
      logger.debug("starting login flow");
      res.redirect("/api/github/oauth/login");
    } else {
      throw new ApiError("requires login", 401);
    }
  };
}

export function authorize(strategy: AuthenticationStrategy) {
  return [cookieParser(), createHandler(strategy)];
}

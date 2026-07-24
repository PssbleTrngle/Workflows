import {
  AuthFeature,
  GenericModrinthClient,
  type AuthConfig,
} from "@modrinth/api-client";
import { Octokit } from "octokit";
import { notNull } from "../../shared/src/util";
import { replaceContributorsTable } from "./replacer";

const path = process.argv[2] ?? ".";

const { GITHUB_TOKEN, MODRINTH_TOKEN } = process.env;

const userAgent = "@possible_triangle/contributors-generator";

const octokit = notNull(GITHUB_TOKEN)
  ? new Octokit({ auth: GITHUB_TOKEN, userAgent })
  : undefined;

const modrinth = notNull(MODRINTH_TOKEN)
  ? new GenericModrinthClient({
      features: [new AuthFeature({ token: MODRINTH_TOKEN } as AuthConfig)],
      userAgent,
    })
  : undefined;

await replaceContributorsTable(path, { modrinth, octokit });

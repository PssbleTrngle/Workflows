import { Octokit } from "octokit";
import type { GitUser } from "./git";
import type { AuthenticatedContext } from "./metadata/auth";

export async function createUserInfo(octokit: Octokit) {
  const { data } = await octokit.rest.apps.getAuthenticated();
  if (!data?.slug) throw new Error("failed to fetch app information");
  const name = `${data.slug}[bot]`;

  const user = await octokit.rest.users.getByUsername({ username: name });

  const email = `${user.data.id}+${name}@users.noreply.github.com`;
  return { name, email };
}

async function extractToken({ octokit, ...context }: AuthenticatedContext) {
  if ("token" in context) return context.token;

  const tokenResponse = await octokit.rest.apps.createInstallationAccessToken({
    installation_id: context.installation.id,
    repository_ids: [context.repository.id],
  });

  return tokenResponse.data.token;
}

export async function createGitUser(context: AuthenticatedContext) {
  if ("token" in context)
    return createAuthenticatedGitUser(context.token, context.octokit);
  return createAppGitUser(context);
}

async function createAppGitUser(
  context: AuthenticatedContext,
): Promise<GitUser> {
  const [token, userData] = await Promise.all([
    extractToken(context),
    createUserInfo(context.octokit),
  ]);

  return {
    token,
    ...userData,
  };
}

async function createAuthenticatedGitUser(
  token: string,
  octokit: Octokit,
): Promise<GitUser> {
  const { data } = await octokit.rest.users.getAuthenticated();
  if (!data.email) throw new Error("cannot commit without user email");
  return { token, email: data.email, name: data.login };
}

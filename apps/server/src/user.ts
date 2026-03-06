import type { Octokit } from "octokit";
import type { GitUser } from "./git";

async function createUserInfo(octokit: Octokit) {
  const { data } = await octokit.rest.apps.getAuthenticated();
  if (!data?.slug) throw new Error("failed to fetch app information");
  const name = `${data.slug}[bot]`;

  const user = await octokit.rest.users.getByUsername({ username: name });

  const email = `${user.data.id}+${name}@users.noreply.github.com`;
  return { name, email };
}

export type Installation = { id: number } | { token: string };

type RequiredPayload = {
  repository: { id: number };
  installation: Installation;
};

async function extractToken(
  { repository, installation }: RequiredPayload,
  octokit: Octokit,
) {
  if ("token" in installation) return installation.token;

  const tokenResponse = await octokit.rest.apps.createInstallationAccessToken({
    installation_id: installation.id,
    repository_ids: [repository.id],
  });

  return tokenResponse.data.token;
}

export async function createAppGitUser(
  payload: RequiredPayload,
  octokit: Octokit,
): Promise<GitUser> {
  const [token, userData] = await Promise.all([
    extractToken(payload, octokit),
    createUserInfo(octokit),
  ]);

  return {
    token,
    ...userData,
  };
}

export async function createAuthenticatedGitUser(
  token: string,
  octokit: Octokit,
): Promise<GitUser> {
  const { data } = await octokit.rest.users.getAuthenticated();
  if (!data.email) throw new Error("cannot commit without user email");
  return { token, email: data.email, name: data.login };
}

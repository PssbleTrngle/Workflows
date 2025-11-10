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

type RequiredPayload = {
  installation: { id: number };
  repository: { id: number };
};

export default async function createGitUser(
  payload: RequiredPayload,
  octokit: Octokit,
): Promise<GitUser> {
  const [tokenResponse, userData] = await Promise.all([
    octokit.rest.apps.createInstallationAccessToken({
      installation_id: payload.installation.id,
      repository_ids: [payload.repository.id],
    }),
    createUserInfo(octokit),
  ]);

  return {
    token: tokenResponse.data.token,
    ...userData,
  };
}

import type { GithubRepository } from ".";

export type OAuthUser = {
  token: string;
  userId: string;
};

export type InstallationUser = {
  installation: { id: number };
  repository: GithubRepository;
};

export type AuthenticatedUser = OAuthUser | InstallationUser;

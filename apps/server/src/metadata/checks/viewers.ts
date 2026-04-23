import type { RepoSearch } from "@pssbletrngle/workflows-types";
import type { Octokit } from "octokit";
import { updateRepository } from "../database";

export default async function checkViewers(
  subject: RepoSearch,
  octokit: Octokit,
) {
  const { data: users } = await octokit.rest.repos.listCollaborators(subject);
  const userIds = users.map((it) => it.login);
  await updateRepository(subject, { visibleTo: userIds });
}

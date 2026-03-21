import type { RepoSearchWithBranch } from "@pssbletrngle/workflows-types";

function createPath({ branch, owner, repo }: RepoSearchWithBranch) {
  return `${owner}/${repo}/${branch}`;
}

export function createTopic(
  subject: RepoSearchWithBranch | string,
  type: string,
) {
  const path = typeof subject === "string" ? subject : createPath(subject);
  return `${path}/${type}`;
}

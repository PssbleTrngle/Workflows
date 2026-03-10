import type { RepoSearchWithBranch } from "@pssbletrngle/workflows-types";

function createPath({ base, owner, repo }: RepoSearchWithBranch) {
  return `${owner}/${repo}/${base}`;
}

export function createTopic(
  subject: RepoSearchWithBranch | string,
  type: string,
) {
  const path = typeof subject === "string" ? subject : createPath(subject);
  return `${path}/${type}`;
}

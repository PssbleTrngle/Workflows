import type {
  RepoSearch,
  RepoSearchWithBranch,
} from "@pssbletrngle/workflows-types";

export function createPath(
  subject: RepoSearchWithBranch | RepoSearch,
  suffix?: string,
) {
  const parts = [subject.owner, subject.repo];
  if ("branch" in subject) parts.push(subject.branch);
  if (suffix) parts.push(suffix);
  return parts.join("/");
}

type Topic = "status_updated" | "repository_updated";

export function createTopic(
  type: Topic,
  subject?: RepoSearchWithBranch | RepoSearch | string,
) {
  if (!subject) return type;
  if (typeof subject === "string") return `${subject}/${type}`;
  return createPath(subject, type);
}

export function createId(
  type: string,
  subject: RepoSearchWithBranch | RepoSearch,
) {
  const parts = [type, subject.owner, subject.repo];
  if ("branch" in subject) parts.push(subject.branch);
  return parts.join("-");
}

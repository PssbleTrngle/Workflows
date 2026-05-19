import type {
  RepoSearch,
  RepoSearchWithBranch,
} from "@pssbletrngle/workflows-types";

export function createPath(
  subject: RepoSearchWithBranch | RepoSearch,
  suffix?: string,
) {
  const parts = [subject.owner, subject.repo];
  if ("branch" in subject) parts.push(encodeBranch(subject.branch));
  if (suffix) parts.push(suffix);
  return parts.join("/");
}

type Topic = "branch_updated" | "repository_updated" | "test_case_updated";

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

function encodeBranch(value: string) {
  return btoa(value);
}

function decodeBranch(value: string) {
  return atob(value);
}

export function decodeRepo({ owner, repo }: Partial<RepoSearch>): RepoSearch {
  if (!owner) throw new Error(`property 'owner' is missing`);
  if (!repo) throw new Error(`property 'owner' is missing`);
  return { owner, repo };
}

export function decodeRepoWithBranch({
  branch,
  ...subject
}: Partial<RepoSearchWithBranch>): RepoSearchWithBranch {
  if (!branch) throw new Error(`property 'branch' is missing`);
  return {
    ...decodeRepo(subject),
    branch: decodeBranch(branch),
  };
}

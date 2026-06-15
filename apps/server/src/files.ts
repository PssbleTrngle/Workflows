import type {
  RepoSearch,
  RepoSearchWithBranch,
} from "@pssbletrngle/workflows-types";
import { RequestError, type Octokit } from "octokit";

function resolveSearch(subject: RepoSearchWithBranch | RepoSearch) {
  if ("branch" in subject) {
    const { branch, ...rest } = subject;
    return { ...rest, ref: branch };
  }

  return subject;
}

export async function getFile(
  subject: RepoSearchWithBranch | RepoSearch,
  path: string,
  octokit: Octokit,
) {
  const { data } = await octokit.rest.repos.getContent({
    ...resolveSearch(subject),
    path,
  });

  if (Array.isArray(data)) throw new Error(`found a directory at ${path}`);
  if (data.type !== "file") throw new Error(`found a ${data.type} at ${path}`);
  return data;
}

export async function getFileContent(
  subject: RepoSearchWithBranch | RepoSearch,
  path: string,
  octokit: Octokit,
) {
  try {
    const file = await getFile(subject, path, octokit);
    if (file.encoding === "base64") {
      return atob(file.content);
    }
    return file.content;
  } catch (e) {
    if (e instanceof RequestError && e.status === 404) {
      return null;
    }
    throw e;
  }
}

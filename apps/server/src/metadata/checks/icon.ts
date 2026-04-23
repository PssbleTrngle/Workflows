import type { RepoSearch } from "@pssbletrngle/workflows-types";
import type { Octokit } from "octokit";
import { updateRepository } from "../database";

async function getIcon(octokit: Octokit, search: RepoSearch) {
  const paths = [".idea/icon.svg", ".idea/icon.png"];

  try {
    const { data } = await Promise.any(
      paths.map((path) =>
        octokit.rest.repos.getContent({
          ...search,
          path,
        }),
      ),
    );

    if (Array.isArray(data)) return null;

    return data.download_url;
  } catch {
    return null;
  }
}

export default async function checkIcon(subject: RepoSearch, octokit: Octokit) {
  const icon = await getIcon(octokit, subject);
  await updateRepository(subject, { icon });
}

import type { RepoSearch } from "@pssbletrngle/workflows-types";
import type { Octokit } from "octokit";
import { Respositories } from "../database";

export const ICON_PATHS = [".idea/icon.svg", ".idea/icon.png"];

export async function getIcon(octokit: Octokit, search: RepoSearch) {
  try {
    const { data } = await Promise.any(
      ICON_PATHS.map((path) =>
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
  await Respositories.update(subject, { icon });
}

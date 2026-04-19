import {
  connectDatabase,
  Repositories,
} from "@pssbletrngle/workflows-persistance";
import type { RepoSearch } from "@pssbletrngle/workflows-types";
import type {
  Branch,
  Repository,
} from "@pssbletrngle/workflows-types/metadata";
import type { Octokit } from "octokit";
import logger from "../logger";
import type { InstallationContext } from "./auth";
import { checkRepository } from "./checks";

await connectDatabase(logger);

async function getIcon(octokit: Octokit, search: RepoSearch) {
  const paths = [".idea/icon.svg", ".idea/icon.png"];

  try {
    const result = await Promise.any(
      paths.map((path) =>
        octokit.rest.repos.getContent({
          ...search,
          path,
        }),
      ),
    );

    return result.data.download_url;
  } catch {
    return null;
  }
}

export async function updateRepository(
  context: InstallationContext,
  subject: RepoSearch,
) {
  logger.debug("updating", subject);

  //const { data } = await octokit.rest.repos.get(search);

  const statuses = await checkRepository(subject, context);

  const branches = statuses.map<Branch>((it) => ({
    ref: it.search.branch,
    status: it.status,
  }));

  const icon = await getIcon(context.octokit, subject);

  await Repositories.updateOne(
    subject,
    {
      icon,
      branches,
    },
    {
      upsert: true,
    },
  );
}

export async function getRepository(
  search: RepoSearch,
): Promise<Repository | null> {
  return await Repositories.findOne(search);
}

export async function getRepositories(): Promise<Repository[]> {
  return await Repositories.find({});
}

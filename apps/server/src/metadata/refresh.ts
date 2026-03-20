import type {
  RepoSearch,
  RepoSearchWithBranch,
} from "@pssbletrngle/workflows-types";
import type { App } from "octokit";
import logger from "../logger";
import { createAppGitUser } from "../user";
import { fetchBranches } from "./branches";
import generateMetadata from "./generator";

export default async function refresh(
  search: RepoSearchWithBranch | RepoSearch,
  app: App,
) {
  logger.debug(`creating installation octokit for`, search);

  const { data: installation } =
    await app.octokit.rest.apps.getRepoInstallation(search);
  const octokit = await app.getInstallationOctokit(installation.id);
  const { data: repository } = await octokit.rest.repos.get(search);
  const user = await createAppGitUser({ installation, repository }, octokit);

  if ("branch" in search) {
    return await generateMetadata(repository, search.branch, octokit, user);
  } else {
    const branches = await fetchBranches(octokit, search);

    const statuses = await Promise.all(
      branches.map((branch) => {
        return generateMetadata(repository, branch, octokit, user);
      }),
    );

    return statuses.filter((it) => !!it);
  }
}

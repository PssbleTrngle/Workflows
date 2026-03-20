import type { RepoSearch } from "@pssbletrngle/workflows-types";
import type { App } from "octokit";
import type { InstallationContext } from "./metadata/auth";

export async function installationContext(
  app: App,
  search: RepoSearch,
): Promise<InstallationContext> {
  const { data: installation } =
    await app.octokit.rest.apps.getRepoInstallation(search);
  const octokit = await app.getInstallationOctokit(installation.id);

  const { data: repository } = await octokit.rest.repos.get(search);

  return { installation, octokit, repository };
}

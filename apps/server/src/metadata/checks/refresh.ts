import type { RepoSearchWithBranch } from "@pssbletrngle/workflows-types";
import { createGitUser } from "../../user";
import type { InstallationContext } from "../auth";
import generateMetadata from "../generator";

export default async function refresh(
  search: RepoSearchWithBranch,
  context: InstallationContext,
) {
  const user = await createGitUser(context);

  return await generateMetadata(
    context.repository,
    search.branch,
    context.octokit,
    user,
  );
}

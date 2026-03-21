import type {
  RepoSearch,
  RepoSearchWithBranch,
} from "@pssbletrngle/workflows-types";
import logger from "../../logger";
import { createGitUser } from "../../user";
import type { InstallationContext } from "../auth";
import { fetchBranches } from "../branches";
import generateMetadata from "../generator";

export default async function refresh(
  search: RepoSearchWithBranch | RepoSearch,
  context: InstallationContext,
) {
  logger.debug(`creating installation octokit for`, search);

  const user = await createGitUser(context);

  if ("branch" in search) {
    return await generateMetadata(
      context.repository,
      search.branch,
      context.octokit,
      user,
    );
  } else {
    const branches = await fetchBranches(context.octokit, search);

    const statuses = await Promise.all(
      branches.map((branch) => {
        return generateMetadata(
          context.repository,
          branch,
          context.octokit,
          user,
        );
      }),
    );

    return statuses.filter((it) => !!it);
  }
}

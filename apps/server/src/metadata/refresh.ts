import type {
  RepoSearch,
  RepoSearchWithBranch,
} from "@pssbletrngle/workflows-types";
import { createAuthenticatedGitUser } from "../user";
import type { AuthenticatedContext } from "./auth";
import { fetchBranches } from "./branches";
import generateMetadata from "./generator";

export default async function refresh(
  search: RepoSearchWithBranch | RepoSearch,
  { octokit, token }: AuthenticatedContext,
) {
  const user = await createAuthenticatedGitUser(token, octokit);

  const { data: repository } = await octokit.rest.repos.get(search);

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

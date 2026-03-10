import type {
  RepoSearch,
  RepoSearchWithBranch,
} from "@pssbletrngle/webhooks-types";
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

  if ("base" in search) {
    return await generateMetadata(repository, search.base, octokit, user);
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

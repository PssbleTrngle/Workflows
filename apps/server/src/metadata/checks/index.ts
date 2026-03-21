import type {
  RepoSearch,
  RepoSearchWithBranch,
} from "@pssbletrngle/workflows-types";
import logger from "../../logger";
import type { InstallationContext } from "../auth";
import { fetchBranches } from "../branches";
import checkProtection from "./protection";
import refresh from "./refresh";

async function checkFor(
  search: RepoSearchWithBranch,
  context: InstallationContext,
) {
  const results = await Promise.allSettled([
    refresh(search, context),
    checkProtection(search, context.octokit),
  ]);

  for (const result of results) {
    if (result.status === "rejected") {
      logger.error((result.reason as Error).message);
    }
  }
}

export default async function check(
  search: RepoSearchWithBranch | RepoSearch,
  context: InstallationContext,
) {
  if ("branch" in search) {
    return await checkFor(search, context);
  } else {
    const branches = await fetchBranches(context.octokit, search);

    await Promise.all(
      branches.map((branch) => {
        return checkFor({ ...search, branch }, context);
      }),
    );
  }
}

import type {
  RepoSearch,
  RepoSearchWithBranch,
} from "@pssbletrngle/workflows-types";
import type {
  RepositoryStatus,
  StatusResult,
} from "@pssbletrngle/workflows-types/metadata";
import logger from "../../logger";
import type { InstallationContext } from "../auth";
import { fetchBranches } from "../branches";
import { eventDispatcher } from "../events";
import checkProtection from "./protection";
import refresh from "./refresh";

export async function checkBranch(
  search: RepoSearchWithBranch,
  context: InstallationContext,
): Promise<StatusResult> {
  const results = await Promise.allSettled([
    refresh(search, context),
    checkProtection(search, context.octokit),
  ]);

  for (const result of results) {
    if (result.status === "rejected") {
      logger.error((result.reason as Error).message);
    }
  }

  const status: RepositoryStatus | undefined =
    results[0].status === "fulfilled" ? results[0].value : "failed";

  return {
    status,
    search,
    checks: {},
  };
}

export async function checkRepository(
  subject: RepoSearch,
  context: InstallationContext,
) {
  const branches = await fetchBranches(context.octokit, subject);

  const statuses = await Promise.all(
    branches.map((branch) => {
      return checkBranch({ ...subject, branch }, context);
    }),
  );

  eventDispatcher.sendRepositoryUpdate({ subject, statuses });

  return statuses;
}

export default async function check(
  subject: RepoSearchWithBranch | RepoSearch,
  context: InstallationContext,
) {
  if ("branch" in subject) {
    await checkBranch(subject, context);
  } else {
    await checkRepository(subject, context);
  }
}

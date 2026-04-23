import type {
  RepoSearch,
  RepoSearchWithBranch,
} from "@pssbletrngle/workflows-types";
import logger from "../../logger";
import type { InstallationContext } from "../auth";
import { fetchBranches } from "../branches";
import checkIcon from "./icon";
import checkProtection from "./protection";
import refresh from "./refresh";
import checkSetup from "./setup";
import checkViewers from "./viewers";

async function runChecks(promises: Promise<unknown>[]) {
  const results = await Promise.allSettled(promises);

  for (const result of results) {
    if (result.status === "rejected") {
      logger.error((result.reason as Error).message);
    }
  }
}

async function branchChecks(
  subject: RepoSearchWithBranch,
  context: InstallationContext,
) {
  logger.debug("checking branch", subject);

  await runChecks([
    refresh(subject, context),
    checkProtection(subject, context.octokit),
    checkSetup(subject, context.octokit),
  ]);
}

async function checkRepository(
  subject: RepoSearch,
  context: InstallationContext,
) {
  logger.debug("checking repository", subject);

  const branches = await fetchBranches(context.octokit, subject);

  await runChecks([
    checkIcon(subject, context.octokit),
    checkViewers(subject, context.octokit),
  ]);

  await Promise.all(
    branches.map((branch) => {
      return branchChecks({ ...subject, branch }, context);
    }),
  );
}

export default async function check(
  subject: RepoSearchWithBranch | RepoSearch,
  context: InstallationContext,
) {
  if ("branch" in subject) {
    await branchChecks(subject, context);
  } else {
    await checkRepository(subject, context);
  }
}

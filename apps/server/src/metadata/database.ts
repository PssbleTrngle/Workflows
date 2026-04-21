import {
  connectDatabase,
  Repositories,
} from "@pssbletrngle/workflows-persistance";
import { mapKeys } from "@pssbletrngle/workflows-shared/util";
import type {
  RepoSearch,
  RepoSearchWithBranch,
  WithTimestamps,
} from "@pssbletrngle/workflows-types";
import type {
  Branch,
  Checks,
  Repository,
  RepositoryStatus,
} from "@pssbletrngle/workflows-types/metadata";
import type { QueryFilter } from "mongoose";
import logger from "../logger";
import type { AuthenticatedContext, OAuthContext } from "./auth";
import { eventDispatcher } from "./events";

await connectDatabase(logger);

function authFilter(context: AuthenticatedContext): QueryFilter<Repository> {
  if ("userId" in context) return { visibleTo: context.userId };
  return {
    owner: context.repository.owner.login,
    repo: context.repository.name,
  };
}

export async function updateRepository(
  subject: RepoSearch,
  values: Omit<Partial<Repository>, "branches" | keyof WithTimestamps>,
) {
  await Repositories.updateOne(subject, values, { upsert: true });
  eventDispatcher.sendRepositoryUpdate(subject);
}

export async function addRepositoryViewer(subject: RepoSearch, userId: string) {
  await Repositories.updateOne(subject, {
    $push: {
      visibleTo: userId,
    },
  });
}

export async function removeRepositoryViewer(
  subject: RepoSearch,
  userId: string,
) {
  await Repositories.updateOne(subject, {
    $pull: {
      visibleTo: userId,
    },
  });
}

export async function getRepository(
  search: RepoSearch,
  context: AuthenticatedContext,
): Promise<Repository | null> {
  return await Repositories.findOne({
    ...search,
    $and: [authFilter(context)],
  });
}

export async function getRepositoryBranch(
  search: RepoSearchWithBranch,
  context: AuthenticatedContext,
): Promise<Branch | null> {
  const repository = await getRepository(search, context);
  const branch = repository?.branches.find((it) => it.ref === search.branch);
  return branch ?? null;
}

//export type RepositoryFilter = {
//
//}

export async function getRepositories(
  context: OAuthContext,
): Promise<Repository[]> {
  return await Repositories.find(
    {
      branches: { $ne: [] },
      $and: [authFilter(context)],
    },
    undefined,
  );
}

export async function migrateRepository(from: RepoSearch, to: RepoSearch) {
  await Repositories.updateMany(from, to);
}

export async function deleteRepository(subject: RepoSearch) {
  await Repositories.deleteMany(subject);
}

async function updateBranch(
  subject: RepoSearchWithBranch,
  values: Partial<Branch>,
) {
  const { branch, ...search } = subject;

  const result = await Repositories.updateMany(
    { ...search, "branches.ref": branch },
    mapKeys(values, (it) => `branches.$.${it}`),
  );

  if (result.modifiedCount === 0) {
    await Repositories.updateMany(
      search,
      {
        $push: { branches: { ref: branch, ...values } },
      },
      { upsert: true },
    );
  }

  eventDispatcher.sendBranchUpdate(subject);
}

export async function saveStatus(
  subject: RepoSearchWithBranch,
  status: RepositoryStatus,
) {
  await updateBranch(subject, { status });
}

export async function saveChecks(
  subject: RepoSearchWithBranch,
  checks: Checks,
) {
  await updateBranch(subject, { checks });
}

export async function saveSetup(
  subject: RepoSearchWithBranch,
  setup: Branch["setup"],
) {
  await updateBranch(subject, { setup });
}

export async function saveMeta(
  subject: RepoSearchWithBranch,
  generatorMeta: Branch["generatorMeta"],
) {
  await updateBranch(subject, { generatorMeta });
}

export async function deleteBranch(subject: RepoSearchWithBranch) {
  const { branch, ...search } = subject;
  const result = await Repositories.updateMany(search, {
    $pull: {
      branches: { ref: branch },
    },
  });

  if (result.modifiedCount > 0) {
    logger.debug("deleting cache for branch", subject);
  }
}

import {
  mapKeys,
  mapValues,
  notNull,
  uniq,
} from "@pssbletrngle/workflows-shared/util";
import type {
  RepoSearch,
  RepoSearchWithBranch,
  WithTimestamps,
} from "@pssbletrngle/workflows-types";
import type { AuthenticatedUser } from "@pssbletrngle/workflows-types/auth";
import type { RepositoryEventConsumer } from "@pssbletrngle/workflows-types/events";
import type { Logger } from "@pssbletrngle/workflows-types/logger";
import type {
  Branch,
  BranchSetup,
  Checks,
  Repository,
  RepositoryFilter,
  RepositoryStatus,
  Setup,
} from "@pssbletrngle/workflows-types/metadata";
import type { QueryFilter } from "mongoose";
import { Repositories } from "../documents/repository";
import { MongoRepository } from "./mongo";

export class RepositoryRepository extends MongoRepository<Repository> {
  constructor(
    private readonly logger?: Logger,
    private readonly events?: RepositoryEventConsumer,
  ) {
    super(Repositories);
  }

  protected authFilter(
    user: AuthenticatedUser | undefined,
  ): QueryFilter<Repository> {
    if (!user) return {};
    if ("userId" in user) return { visibleTo: user.userId };
    return {
      owner: user.repository.owner.login,
      repo: user.repository.name,
    };
  }

  async update(
    subject: RepoSearch,
    values: Omit<Partial<Repository>, "branches" | keyof WithTimestamps>,
  ) {
    await Repositories.updateOne(subject, values, { upsert: true });
    this.events?.sendRepositoryUpdate(subject);
  }

  async addViewer(subject: RepoSearch, userId: string) {
    await Repositories.updateOne(subject, {
      $push: {
        visibleTo: userId,
      },
    });
  }

  async removeViewer(subject: RepoSearch, userId: string) {
    await Repositories.updateOne(subject, {
      $pull: {
        visibleTo: userId,
      },
    });
  }

  async find(
    search: RepoSearch,
    user?: AuthenticatedUser,
  ): Promise<Repository | null> {
    return await Repositories.findOne({
      ...search,
      branches: { $ne: [] },
      $and: [this.authFilter(user)],
    });
  }

  async findBranch(
    { owner, repo, branch }: RepoSearchWithBranch,
    user?: AuthenticatedUser,
  ): Promise<Branch | null> {
    const repository = await this.find({ owner, repo }, user);
    const match = repository?.branches?.find((it) => it.ref === branch);
    return match ?? null;
  }

  private filterQueries(filter: RepositoryFilter) {
    const filters: QueryFilter<Repository>[] = [];

    if (filter.version)
      filters.push({ "branches.setup.versions": filter.version });
    if (filter.loader)
      filters.push({ "branches.setup.loaders": filter.loader });
    if (filter.gradleHelper)
      filters.push({ "branches.setup.gradleHelper": filter.gradleHelper });
    if (filter.owner) filters.push({ owner: filter.owner });
    // TODO
    // if (filter.failedChecks) filters.push({ owner: filter.owner });

    return filters;
  }

  async findAll(
    user?: AuthenticatedUser,
    filter: RepositoryFilter = {},
  ): Promise<Repository[]> {
    return await Repositories.find(
      {
        branches: { $ne: [] },
        $and: [this.authFilter(user), ...this.filterQueries(filter)],
      },
      undefined,
      { sort: { updatedAt: -1 } },
    );
  }

  async findSetup(search: RepoSearch, user?: AuthenticatedUser) {
    const repo = await this.find(search, user);
    if (!repo) return null;
    const setups = repo.branches.map((it) => it.setup).filter(notNull);
    const merged: Setup = {
      gradleHelper: [],
      loaders: [],
      type: [],
      versions: [],
    };

    setups.forEach((it) => {
      if (it.type) merged.type.push(it.type);
      if (it.gradleHelper) merged.gradleHelper.push(it.gradleHelper);
      if (it.loaders) merged.loaders.push(...it.loaders);
      if (it.versions) merged.versions.push(...it.versions);
    });

    return mapValues(merged, uniq) as Setup;
  }

  async createFilterValues(user?: AuthenticatedUser) {
    const [owner, gradleHelper, loader, version] = await Promise.all([
      this.groupField<string>("owner", user),
      this.groupField<string>("branches[].setup.gradleHelper", user),
      this.groupField<string>("branches[].setup.loaders[]", user),
      this.groupField<string>("branches[].setup.versions[]", user),
    ]);

    return { owner, gradleHelper, loader, version };
  }

  async migrate(from: RepoSearch, to: RepoSearch) {
    await Repositories.updateMany(from, to);
  }

  async delete(subject: RepoSearch) {
    await Repositories.deleteMany(subject);
  }

  private async updateBranch(
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

    this.events?.sendBranchUpdate(subject);
  }

  async saveStatus(subject: RepoSearchWithBranch, status: RepositoryStatus) {
    await this.updateBranch(subject, { status });
  }

  async saveChecks(subject: RepoSearchWithBranch, checks: Checks) {
    await this.updateBranch(subject, { checks });
  }

  async saveSetup(subject: RepoSearchWithBranch, setup: BranchSetup) {
    await this.updateBranch(
      subject,
      mapKeys(setup, (it) => `setup.${it}`),
    );
  }

  async saveMeta(
    subject: RepoSearchWithBranch,
    generatorMeta: Branch["generatorMeta"],
  ) {
    await this.updateBranch(subject, { generatorMeta });
  }

  async deleteBranch(subject: RepoSearchWithBranch) {
    const { branch, ...search } = subject;
    const result = await Repositories.updateMany(search, {
      $pull: {
        branches: { ref: branch },
      },
    });

    if (result.modifiedCount > 0) {
      this.logger?.debug("deleting cache for branch", subject);
    }
  }
}

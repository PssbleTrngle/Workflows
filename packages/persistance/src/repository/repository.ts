import { mapKeys } from "@pssbletrngle/workflows-shared/util";
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
  Checks,
  Repository,
  RepositoryStatus,
} from "@pssbletrngle/workflows-types/metadata";
import type { QueryFilter } from "mongoose";
import { Repositories } from "../documents/repository";

export class RepositoryRepository {
  constructor(
    private readonly logger?: Logger,
    private readonly events?: RepositoryEventConsumer,
  ) {}

  private authFilter(
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

  //export type RepositoryFilter = {
  //
  //}

  async findAll(user?: AuthenticatedUser): Promise<Repository[]> {
    return await Repositories.find(
      {
        branches: { $ne: [] },
        $and: [this.authFilter(user)],
      },
      undefined,
    );
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

  async saveSetup(subject: RepoSearchWithBranch, setup: Branch["setup"]) {
    await this.updateBranch(subject, { setup });
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

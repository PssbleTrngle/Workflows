import type { RepoSearch } from "@pssbletrngle/workflows-types";
import type { OAuthUser } from "@pssbletrngle/workflows-types/auth";
import type { NotifierEventConsumer } from "@pssbletrngle/workflows-types/events";
import type { Logger } from "@pssbletrngle/workflows-types/logger";
import type { Notifier } from "@pssbletrngle/workflows-types/metadata";
import type { QueryFilter } from "mongoose";
import { Notifiers } from "../documents/notifier";

type MongoError = Error & {
  code: string;
};

export class NotifierRepository {
  constructor(
    private readonly logger?: Logger,
    private readonly events?: NotifierEventConsumer,
  ) {}

  private authFilter(user: OAuthUser | undefined) {
    if (!user) return {};
    return { createdBy: user.userId } satisfies QueryFilter<Notifier>;
  }

  async update(
    name: string,
    user: OAuthUser,
    values: Pick<
      Partial<Notifier>,
      "discordWebhooks" | "rules" | "exclude" | "name"
    >,
  ) {
    const { modifiedCount } = await Notifiers.updateOne(
      { name, $and: [this.authFilter(user)] },
      values,
    );
    if (modifiedCount > 0) {
      this.events?.sendNotifierUpdate(name, user.userId);
      return true;
    }

    return false;
  }

  async create(
    user: OAuthUser,
    values: Pick<Notifier, "discordWebhooks" | "rules" | "exclude" | "name">,
  ): Promise<Notifier | false> {
    try {
      const inserted = await Notifiers.insertOne({
        ...values,
        ...this.authFilter(user),
      });

      this.events?.sendNotifierUpdate(values.name, user.userId);

      return inserted;
    } catch (ex) {
      if ((ex as MongoError).code === "E11000") return false;
      throw ex;
    }
  }

  async find(name: string, user: OAuthUser): Promise<Notifier | null> {
    return await Notifiers.findOne({
      name,
      $and: [this.authFilter(user)],
    });
  }

  async findAll(user?: OAuthUser): Promise<Notifier[]> {
    return await Notifiers.find(this.authFilter(user), undefined);
  }

  async findMatching(subject: RepoSearch): Promise<Notifier[]> {
    const filters: QueryFilter<Notifier>[] = [];
    filters.push({ "rules.owner": { $in: [subject.owner, null] } });
    filters.push({ "rules.repo": { $in: [subject.repo, null] } });
    filters.push({ "exclude.owner": { $not: { $eq: subject.owner } } });
    filters.push({ "exclude.repo": { $not: { $eq: subject.repo } } });
    return await Notifiers.find({ $and: filters }, undefined);
  }

  async delete(name: string, user: OAuthUser) {
    const { deletedCount } = await Notifiers.deleteMany({
      name,
      $and: [this.authFilter(user)],
    });

    return deletedCount > 0;
  }
}

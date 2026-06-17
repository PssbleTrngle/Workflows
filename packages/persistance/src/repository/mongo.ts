import type { AuthenticatedUser } from "@pssbletrngle/workflows-types/auth";
import type { Model, PipelineStage, QueryFilter } from "mongoose";

export abstract class MongoRepository<T> {
  constructor(private readonly model: Model<T>) {}

  protected abstract authFilter(user?: AuthenticatedUser): QueryFilter<T>;

  protected async groupField<T>(field: string, user?: AuthenticatedUser) {
    const unwinds = field.match(/\[\]/g)?.length ?? 0;
    const key = field.replaceAll("[]", "");

    const stages: PipelineStage[] = [
      { $match: this.authFilter(user) },
      { $project: { field: `$${key}` } },
    ];

    for (let i = 0; i < unwinds; i++) {
      stages.push({ $unwind: "$field" });
    }

    stages.push({ $group: { _id: "$field" } });

    const results: Array<{ _id: T }> = await this.model.aggregate(stages);

    return results.map((it) => it._id);
  }
}

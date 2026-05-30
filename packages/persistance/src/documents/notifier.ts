import type {
  Notifier,
  RepositoryRule,
} from "@pssbletrngle/workflows-types/metadata";
import mongoose, { type SchemaDefinition } from "mongoose";

const ruleSchema: SchemaDefinition<RepositoryRule> = {
  branch: { type: String },
  owner: { type: String },
  repo: { type: String },
};

const schema = new mongoose.Schema<Notifier>(
  {
    name: { type: String, required: true },
    createdBy: { type: String, required: true },
    rules: [ruleSchema],
    exclude: [ruleSchema],
    discordWebhooks: [{ type: String }],
  },
  {
    timestamps: true,
  },
);

schema.index({ name: 1, createdBy: 1 }, { unique: true });

export const Notifiers = mongoose.model("Notifier", schema);

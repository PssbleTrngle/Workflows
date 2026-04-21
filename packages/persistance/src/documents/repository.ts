import type {
  Repository,
  RepositoryStatus,
} from "@pssbletrngle/workflows-types/metadata";
import mongoose from "mongoose";

const schema = new mongoose.Schema<Repository>(
  {
    owner: { type: String, required: true },
    repo: { type: String, required: true },
    icon: { type: String },
    visibleTo: [{ type: String }],
    branches: [
      {
        ref: { type: String, required: true },
        generatorMeta: {
          version: { type: String, required: true },
          source: { type: String, required: true },
          generatedAt: { type: Date, required: true },
        },
        status: {
          type: String,
          enum: [
            "failed",
            "opened-pr",
            "running",
            "up-to-date",
          ] satisfies RepositoryStatus[],
        },
        checks: {
          canModify: { type: Boolean },
          isProtected: { type: Boolean },
        },
        setup: {
          type: [{ type: String }],
          loaders: [{ type: String }],
          versions: [{ type: String }],
          gradleHelper: { type: String },
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

schema.index({ owner: 1, repo: 1 }, { unique: true });

export const Repositories = mongoose.model("Repository", schema);

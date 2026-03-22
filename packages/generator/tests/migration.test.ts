import { describe, expect, it } from "bun:test";
import { type MetadataContext, migrateConfig } from "../src";
import testLogger from "./logger";

const context = {
  target: { branch: "main", owner: "OWNER", repo: "REPO" },
  branches: ["main"],
  logger: testLogger,
} satisfies Partial<MetadataContext>;

describe("config migrations", () => {
  it("adds version number", async () => {
    const migrated = await migrateConfig({}, context);

    expect(migrated.$version).not.toBeUndefined();
  });

  it("updates schema", async () => {
    const migrated = await migrateConfig({}, context);

    expect(migrated.$schema).toBe(
      "https://workflows.somethingcatchy.net/schema/config.json",
    );
  });

  it("uses @owner reference", async () => {
    const migrated = await migrateConfig({ assignee: "OWNER" }, context);

    expect(migrated.assignee).toBe("@owner");
  });

  it("does not use @owner reference when assigne undefined", async () => {
    const migrated = await migrateConfig({}, context);

    expect(migrated.assignee).toBeUndefined();
  });

  it("does not use @owner reference when assigne different", async () => {
    const migrated = await migrateConfig({ assignee: "NOT_OWNER" }, context);

    expect(migrated.assignee).toBe("NOT_OWNER");
  });
});

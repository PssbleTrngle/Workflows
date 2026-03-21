import { describe, expect, it } from "bun:test";
import migrateConfig from "../src/migrations";

describe("config migrations", () => {
  it("adds version number", async () => {
    const migrated = await migrateConfig({});

    expect(migrated.$version).not.toBeUndefined();
  });

  it("updates schema", async () => {
    const migrated = await migrateConfig({});

    expect(migrated.$schema).toBe(
      "https://workflows.somethingcatchy.net/schema/config.json",
    );
  });

  it("uses @owner reference", async () => {
    const migrated = await migrateConfig({ assignee: "OWNER" });

    expect(migrated.assignee).toBe("@owner");
  });

  it("does not use @owner reference when assigne undefined", async () => {
    const migrated = await migrateConfig({});

    expect(migrated.assignee).toBeUndefined();
  });

  it("does not use @owner reference when assigne different", async () => {
    const migrated = await migrateConfig({ assignee: "NOT_OWNER" });

    expect(migrated.assignee).toBe("NOT_OWNER");
  });
});

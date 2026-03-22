import { describe, expect, it } from "bun:test";
import { type MetadataContext, type MinecraftConfigSchema } from "../src";
import detectProperties from "../src/detection";
import { loadConfigFixture } from "./fixtures";
import testLogger from "./logger";

const context = {
  target: { branch: "main", owner: "OWNER", repo: "REPO" },
  logger: testLogger,
} satisfies Partial<MetadataContext>;

describe("config detection", () => {
  it("detect minecraft loaders", async () => {
    const config = await loadConfigFixture(
      "minecraft",
      "configWithVersions.json",
    );

    const detected = await detectProperties({
      ...context,
      config,
      branches: ["main/forge/1.20.x", "main/fabric"],
    });

    expect(detected.type).toBe("minecraft");
    expect((detected as MinecraftConfigSchema).loaders).toEqual([
      "forge",
      "fabric",
    ]);
  });

  it("detect minecraft versions", async () => {
    const config = await loadConfigFixture(
      "minecraft",
      "configWithLoaders.json",
    );

    const detected = await detectProperties({
      ...context,
      config,
      branches: ["main/forge/1.20.x", "main/1.21.x"],
    });

    expect(detected.type).toBe("minecraft");
    expect((detected as MinecraftConfigSchema).versions).toEqual([
      "1.21",
      "1.20",
    ]);
  });

  it("detect owner", async () => {
    const config = await loadConfigFixture(
      "minecraft",
      "configWithVersionsAndLoaders.json",
    );

    const detected = await detectProperties({
      ...context,
      config,
      branches: [],
    });

    expect(detected.owner).toEqual("OWNER");
  });

  it("detect owner", async () => {
    const config = await loadConfigFixture(
      "minecraft",
      "configWithVersionsAndLoaders.json",
    );

    const detected = await detectProperties({
      ...context,
      config,
      branches: [],
    });

    expect(detected.assignee).toEqual("OWNER");
  });
});

import { describe, expect, it } from "bun:test";
import { generateWorkflow } from "../src";

describe("minecraft test workflows", () => {
  it("generates test workflow without sonar", async () => {
    const generated = await generateWorkflow("minecraft/test.yml");
    expect(generated).toMatchSnapshot(
      "test workflow with push and pull_request"
    );
  });

  it("generates test workflow with sonar", async () => {
    const generated = await generateWorkflow("minecraft/test.yml", {
      sonar: true,
    });
    expect(generated).toMatchSnapshot("test workflow with only pull_request");
  });

  it("generates sonar workflow", async () => {
    const generated = await generateWorkflow("minecraft/sonar.yml", {
      sonar: true,
    });
    expect(generated).toMatchSnapshot("sonar workflow");
  });
});

describe("minecaft release workflows", () => {
  const uploads = ["curseforge", "modrinth", "github", "nexus"];
  uploads.forEach((upload) => {
    it(`generates release workflow with ${upload}`, async () => {
      const generated = await generateWorkflow("minecraft/release.yml", {
        upload: {
          [upload]: true,
        },
      });
      expect(generated).toMatchSnapshot(`release workflow with ${upload}`);
    });
  });
});

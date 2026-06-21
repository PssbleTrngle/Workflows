import { describe, expect, it } from "bun:test";
import { generateWorkflow } from "../src";
import mockContext from "./providers/context";

describe("minecraft test workflows", () => {
  it("generates test workflow without sonar", async () => {
    const generated = await generateWorkflow.run(
      ["minecraft", "test.yml"],
      mockContext(),
    );
    expect(generated).toMatchSnapshot("test workflow without sonar");
  });

  it("generates test workflow with sonar", async () => {
    const generated = await generateWorkflow.run(
      ["minecraft", "test.yml"],
      mockContext({
        sonar: true,
      }),
    );
    expect(generated).toMatchSnapshot("test workflow with sonar");
  });

  it("generates test workflow with loader branches", async () => {
    const generated = await generateWorkflow.run(
      ["minecraft", "test.yml"],
      mockContext({
        loaders: ["neoforge", "fabric"],
      }),
    );
    expect(generated).toMatchSnapshot("test workflow with loaders");
  });
});

describe("minecaft release workflows", () => {
  const uploads = ["curseforge", "modrinth", "github", "nexus"];
  uploads.forEach((upload) => {
    it(`generates release workflow with ${upload}`, async () => {
      const generated = await generateWorkflow.run(
        ["minecraft", "release.yml"],
        mockContext({
          upload: {
            [upload]: true,
            strategy: "release",
          },
        }),
      );
      expect(generated).toMatchSnapshot(`release workflow with ${upload}`);
    });
  });

  it(`generates release on push workflow`, async () => {
    const generated = await generateWorkflow.run(
      ["minecraft", "release.yml"],
      mockContext({
        upload: {
          nexus: true,
          strategy: "push",
        },
      }),
    );
    expect(generated).toMatchSnapshot("release workflow on push");
  });

  it(`test workflow with snapshot release`, async () => {
    const generated = await generateWorkflow.run(
      ["minecraft", "test.yml"],
      mockContext({
        upload: {
          nexus: true,
          snapshots: true,
        },
      }),
    );
    expect(generated).toMatchSnapshot("snapshot release workflow");
  });
  it(`test workflow will not publish snapshots with push strategy`, async () => {
    const generated = await generateWorkflow.run(
      ["minecraft", "test.yml"],
      mockContext({
        upload: {
          nexus: true,
          snapshots: true,
          strategy: "push",
        },
      }),
    );
    expect(generated).toMatchSnapshot(
      "snapshot release workflow with push strategy",
    );
  });
});

import { describe, expect, it } from "bun:test";
import { generateLicenses } from "../src";
import { globFixtureDirectory } from "./fixtures";
import { createGlobMock } from "./providers/context";

describe("minecraft licenses", () => {
  it(`generates LICENSE.md`, async () => {
    const generated = await generateLicenses(["minecraft", "LICENSE.md"], {
      owner: "Username",
      glob: createGlobMock({
        "**/src/main/resources/assets": ["src/main/resources/assets"],
      }),
    });
    expect(generated).toMatchSnapshot("minecraft license");
  });

  it(`generates LICENSE.md with loader subdirectories`, async () => {
    const generated = await generateLicenses(["minecraft", "LICENSE.md"], {
      owner: "Username",
      loaders: ["neoforge", "fabric"],
      glob: createGlobMock({
        "**/src/main/resources/assets": [
          "common/src/main/resources/assets",
          "neoforge/src/main/resources/assets",
          "fabric/src/main/resources/assets",
        ],
      }),
    });
    expect(generated).toMatchSnapshot("minecraft multiloader license");
  });

  it(`generates LICENSE.md within simple directory`, async () => {
    const generated = await generateLicenses(["minecraft", "LICENSE.md"], {
      owner: "Username",
      loaders: ["neoforge", "fabric"],
      glob: globFixtureDirectory("minecraft", "examples", "simple"),
    });
    expect(generated).toMatchSnapshot(
      "minecraft multiloader license in directory",
    );
  });

  it(`generates LICENSE.md within multiloader directory`, async () => {
    const generated = await generateLicenses(["minecraft", "LICENSE.md"], {
      owner: "Username",
      glob: globFixtureDirectory("minecraft", "examples", "multiloader"),
    });
    expect(generated).toMatchSnapshot(
      "minecraft multiloader license in multiloader directory",
    );
  });
});

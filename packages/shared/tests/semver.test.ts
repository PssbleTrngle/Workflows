import { describe, expect, it } from "bun:test";
import { isOudated, parseVersion, type SemanticVersion } from "../src/semver";

describe("semantic version parsing", () => {
  it("parses", async () => {
    const first = parseVersion("1.2");

    expect(first).toMatchObject({ major: 1, minor: 2 });
  });

  it("parses with prefix", async () => {
    const first = parseVersion("v4.19");

    expect(first).toMatchObject({ major: 4, minor: 19 });
  });

  it("compares versions", async () => {
    for (const [first, second] of versionProvider()) {
      expect(isOudated(first, second)).toBeTrue();
      expect(isOudated(second, first)).toBeFalse();
      expect(isOudated(second, second)).toBeFalse();
      expect(isOudated(first, first)).toBeFalse();
    }
  });
});

function* versionProvider(): Generator<[SemanticVersion, SemanticVersion]> {
  yield [parseVersion("1.2"), parseVersion("1.3")];
  yield [parseVersion("4.2"), parseVersion("4.20")];
  yield [parseVersion("3.29"), parseVersion("4.0")];
  yield [parseVersion("2.14"), parseVersion("4.9")];
}

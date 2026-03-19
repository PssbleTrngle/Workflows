import { describe, expect, it } from "bun:test";
import { generateLicenses } from "../src";

describe("minecraft licenses", () => {
  it(`generates LICENSE.md`, async () => {
    const generated = await generateLicenses(["minecraft", "LICENSE.md"], {
      owner: "Username",
    });
    expect(generated).toMatchSnapshot("minecraft license");
  });
});

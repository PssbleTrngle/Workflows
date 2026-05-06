import { describe, expect, it } from "bun:test";
import { generateEditorConfig } from "../src/editorconfig/generate";
import mockContext from "./providers/context";

describe("minecraft editorconfig", () => {
  it(`generates .editorconfig`, async () => {
    const generated = await generateEditorConfig(
      ["minecraft", ".editorconfig"],
      mockContext(),
    );
    expect(generated).toMatchSnapshot("minecraft editorconfig");
  });
});

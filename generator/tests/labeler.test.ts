import { describe, expect, it } from "bun:test";
import { generateConfig } from "../src/configs/generate";
import optionsProvider from "./providers/minecraftOptions";

describe("minecaft issue labeler", () => {
  for (const [key, options] of optionsProvider()) {
    it(`generates labeler config ${key}`, async () => {
      const generated = await generateConfig(
        ["minecraft", "labeler.yml"],
        options,
      );
      expect(generated).toMatchSnapshot(`labeler config ${key}`);
    });
  }
});

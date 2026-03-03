import { describe, expect, it } from "bun:test";
import { generateIssueTemplate } from "../src";
import optionsProvider from "./providers/minecraftOptions";

describe("minecraft bug templates", () => {
  for (const [key, options] of optionsProvider()) {
    it(`generates bug template ${key}`, async () => {
      const generated = await generateIssueTemplate(
        ["minecraft", "bug_report.yml"],
        options,
      );
      expect(generated).toMatchSnapshot(`bug template ${key}`);
    });
  }
});

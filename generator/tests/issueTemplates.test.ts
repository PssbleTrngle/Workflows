import { describe, expect, it } from "bun:test";
import { generateIssueTemplate, type TemplateData } from "../src";

function* optionsProvider(): Generator<[string, TemplateData]> {
  yield ["without loader and versions", {}];
  yield ["without loader and single version", { versions: ["1.21.1"] }];
  yield [
    "without loader and multiple versions",
    { versions: ["1.20.1", "1.21.1"] },
  ];
  yield ["single loader and no versions", { loaders: ["neoforge"] }];
  yield [
    "multiple loaders and no versions",
    { loaders: ["neoforge", "fabric"] },
  ];
  yield [
    "multiple loaders and single version",
    { loaders: ["neoforge", "fabric"], versions: ["1.21.1"] },
  ];
  yield [
    "multiple loaders and multiple versions",
    { loaders: ["neoforge", "fabric"], versions: ["1.20.1", "1.21.1"] },
  ];
}

describe("minecraft bug templates", () => {
  for (const [key, options] of optionsProvider()) {
    it(`generates bug template ${key}`, async () => {
      const generated = await generateIssueTemplate(
        ["minecraft", "bug_report.yml"],
        options
      );
      expect(generated).toMatchSnapshot(`bug template ${key}`);
    });
  }
});

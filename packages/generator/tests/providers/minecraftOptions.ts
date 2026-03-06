import type { TemplateData } from "../../src";

export default function* optionsProvider(): Generator<[string, TemplateData]> {
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

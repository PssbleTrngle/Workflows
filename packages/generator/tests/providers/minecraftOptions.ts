import type { TemplateData } from "../../src";
import { Context } from "../../src/generator";
import mockContext from "./context";

export default function* optionsProvider(): Generator<
  [string, TemplateData & Context]
> {
  yield ["without loader and versions", mockContext()];
  yield [
    "without loader and single version",
    mockContext({ versions: ["1.21.1"] }),
  ];
  yield [
    "without loader and multiple versions",
    mockContext({ versions: ["1.20.1", "1.21.1"] }),
  ];
  yield [
    "single loader and no versions",
    mockContext({ loaders: ["neoforge"] }),
  ];
  yield [
    "multiple loaders and no versions",
    mockContext({ loaders: ["neoforge", "fabric"] }),
  ];
  yield [
    "multiple loaders and single version",
    mockContext({ loaders: ["neoforge", "fabric"], versions: ["1.21.1"] }),
  ];
  yield [
    "multiple loaders and multiple versions",
    mockContext({
      loaders: ["neoforge", "fabric"],
      versions: ["1.20.1", "1.21.1"],
    }),
  ];
}

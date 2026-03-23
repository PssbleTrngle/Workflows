import type { Context, TemplateData } from "../../src/generator";

export function createGlobMock(
  paths: Record<string, string[]>,
): Context["glob"] {
  return (pattern) => {
    if (pattern in paths) return paths[pattern]!;
    throw new Error(`unexpected pattern: '${pattern}'`);
  };
}

const emptyGlob: Context["glob"] = () => [];

interface MockContext {
  <T extends TemplateData>(data: T): Context & T;
  (): Context;
}

const mockContext: MockContext = (data: TemplateData = {}) => ({
  ...data,
  glob: emptyGlob,
});

export default mockContext;

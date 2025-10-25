import type { RuntimeOptions } from "handlebars";
import { format } from "prettier";
import helpers from "./helpers";
import { compileFile } from "./load";
import { withHeader } from "./meta";

export type TemplateData = Record<string, unknown>;

export default function createYamlGenerator(
  folder: string,
  {
    defaultData = {},
    header = true,
    ...options
  }: { defaultData?: TemplateData; header?: boolean } & RuntimeOptions
) {
  return async (path: string, data: TemplateData = {}) => {
    const template = await compileFile(folder, path);
    let generated = template(
      { ...defaultData, ...data },
      {
        ...options,
        helpers: {
          ...helpers,
          ...options.helpers,
        },
      }
    );
    if (header) generated = await withHeader(generated);
    return format(generated, { parser: "yaml" });
  };
}

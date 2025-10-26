import type { RuntimeOptions } from "handlebars";
import { format } from "prettier";
import type { Generator, TemplateData } from "./generator";
import helpers from "./helpers";
import { compileFile } from "./load";
import { withHeader } from "./meta";

export default function createYamlGenerator(
  folder: string,
  {
    defaultData = {},
    header = true,
    ...options
  }: { defaultData?: TemplateData; header?: boolean } & RuntimeOptions
): Generator {
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

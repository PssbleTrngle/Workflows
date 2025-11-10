import type { RuntimeOptions } from "handlebars";
import { format } from "prettier";
import { loadTemplate } from "../dist/templates";
import type { Generator, TemplateData } from "./generator";
import helpers from "./helpers";
import { withHeader } from "./meta";

export default function createYamlGenerator(
  folder: string,
  {
    defaultData = {},
    header = true,
    ...options
  }: { defaultData?: TemplateData; header?: boolean } & RuntimeOptions,
): Generator {
  return async (key: string[], data: TemplateData = {}) => {
    const template = await loadTemplate(folder, ...key);
    let generated = template(
      { ...defaultData, ...data },
      {
        ...options,
        helpers: {
          ...helpers,
          ...options.helpers,
        },
      },
    );
    if (header) generated = await withHeader(generated);
    return format(generated, { parser: "yaml" });
  };
}

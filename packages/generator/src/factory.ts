import type { RuntimeOptions } from "handlebars";
import { format } from "prettier";
import { loadTemplate } from "../dist/templates";
import type { Generator, TemplateData } from "./generator";
import helpers from "./helpers";
import { withHeader } from "./meta";

export default function createGenerator(
  folder: string,
  {
    defaultData = {},
    header = true,
    ...options
  }: {
    defaultData?: TemplateData;
    header?: boolean;
  } & RuntimeOptions = {},
): Generator {
  return async (key: string[], data: TemplateData = {}) => {
    const { template, parser } = await loadTemplate(folder, ...key);
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
    if (parser) return format(generated, { parser });
    return generated;
  };
}

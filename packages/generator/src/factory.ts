import type { HelperDeclareSpec, RuntimeOptions } from "handlebars";
import { sep as posixSep } from "node:path/posix";
import { sep as winSep } from "node:path/win32";
import { format, type BuiltInParserName } from "prettier";
import { loadTemplate } from "../dist/templates";
import type { Context, Generator, TemplateData } from "./generator";
import helpers from "./helpers";
import { withHeader } from "./meta";

function normalizePath(path: string) {
  if (process.platform === "win32") {
    return path.replaceAll(winSep, posixSep);
  }
  return path;
}

function createHelpers({ glob }: Context): HelperDeclareSpec {
  return {
    glob: (context, options) => {
      if (typeof context !== "string")
        throw new Error("pattern must be string");
      const paths = glob(context).map(normalizePath).toSorted();
      return paths.map((path) => options.fn({ path })).join("");
    },
  };
}

export default function createGenerator(
  folder: string,
  {
    defaultData = {},
    header = true,
    commentStyle,
    ...options
  }: {
    defaultData?: TemplateData;
    header?: boolean;
    commentStyle?: BuiltInParserName;
  } & RuntimeOptions = {},
): Generator {
  return async (key, { glob, ...data }) => {
    const { template, parser } = await loadTemplate(folder, ...key);
    let generated = template(
      { ...defaultData, ...data },
      {
        ...options,
        helpers: {
          ...helpers,
          ...options.helpers,
          ...createHelpers({ glob }),
        },
      },
    );
    if (header) generated = await withHeader(generated, commentStyle ?? parser);
    if (parser) return format(generated, { parser });
    return generated;
  };
}

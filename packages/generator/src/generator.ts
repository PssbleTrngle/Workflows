import { join } from "node:path";
import { type TemplateEntry } from "../dist/templates";
import type { ConfigSchema } from "./config";
import { generateConfig } from "./configs/generate";
import { generateEditorConfig } from "./editorconfig/generate";
import { generateIssueTemplate } from "./issueTemplates/generate";
import { generateLicenses } from "./licenses/generate";
import { generatePrettierConfig } from "./prettier";
import { generateTsConfig } from "./tsconfig";
import { generateWorkflow } from "./workflows/generate";

export type Acceptor = (path: string, content: string) => Promise<void>;

export type TemplateData = Record<string, unknown>;

export type Context = {
  glob: (path: string) => string[];
};

export type Generator = {
  run(key: string[], data: TemplateData & Context): Promise<string>;
  list(key: string): Promise<TemplateEntry[]>;
};

type SchemaType = {
  key: string;
  path: string;
  value?: string;
  generator: Generator;
};

const schemaTypes: SchemaType[] = [
  {
    key: "issueTemplates",
    path: ".github/ISSUE_TEMPLATE",
    generator: generateIssueTemplate,
  },
  { key: "workflows", path: ".github/workflows", generator: generateWorkflow },
  { key: "configs", path: ".github", generator: generateConfig },
  { key: "license", path: ".", generator: generateLicenses },
  { key: "editorconfig", path: ".", generator: generateEditorConfig },
  { key: "tsconfig", path: ".", generator: generateTsConfig },
  {
    key: "formatter",
    value: "prettier",
    path: ".",
    generator: generatePrettierConfig,
  },
];

function isConfigKey(
  config: ConfigSchema,
  key: string,
): key is keyof ConfigSchema {
  return key in config;
}

function isDisabled(config: ConfigSchema, key: string, value?: string) {
  if (!isConfigKey(config, key)) return false;
  if (value) return config[key] !== value;
  return config[key] === false;
}

export async function generateWithConfig(
  config: ConfigSchema & Context,
  acceptor: Acceptor,
) {
  await Promise.all(
    schemaTypes.map(async ({ key, path, generator, value }) => {
      if (isDisabled(config, key, value)) return;

      const schemas = await generator.list(config.type);

      await Promise.all(
        schemas.map(async ({ key, name }) => {
          if (isDisabled(config, name)) return;

          const output = join(path, ...key);

          const generated = await generator.run([config.type, ...key], config);
          await acceptor(output, generated);
        }),
      );
    }),
  );
}

import { basename, join } from "node:path";
import type { ConfigSchema } from "./config";
import { generateIssueTemplate } from "./issueTemplates/generate";
import { listTemplates } from "./load";
import { generateWorkflow } from "./workflows/generate";

export type Acceptor = (path: string, content: string) => Promise<void>;

export type TemplateData = Record<string, unknown>;

export type Generator = (path: string, data?: TemplateData) => Promise<string>;

type SchemaType = {
  key: keyof ConfigSchema;
  path: string;
  generate: Generator;
};

const schemaTypes: SchemaType[] = [
  {
    key: "issueTemplates",
    path: ".github/ISSUE_TEMPLATE",
    generate: generateIssueTemplate,
  },
  { key: "workflows", path: ".github/workflows", generate: generateWorkflow },
];

function check(config: ConfigSchema, key: string) {
  return key in config && config[key as keyof ConfigSchema] === false;
}

export async function generateWithConfig(
  config: ConfigSchema,
  acceptor: Acceptor
) {
  await Promise.all(
    schemaTypes.map(async ({ key, path, generate }) => {
      if (key in config && check(config, key)) return;

      const schemas = await listTemplates(key, config.type);

      await Promise.all(
        schemas.map(async (file) => {
          const fileName = basename(file);
          const name = fileName.substring(0, fileName.indexOf("."));
          if (check(config, name)) return;

          const output = join(path, fileName);

          const generated = await generate(file, config);
          await acceptor(output, generated);
        })
      );
    })
  );
}

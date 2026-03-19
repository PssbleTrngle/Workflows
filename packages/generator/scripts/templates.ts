import type { BunFile } from "bun";
import handlebars from "handlebars";
import { readdirSync, statSync } from "node:fs";
import { extname } from "node:path";
import { join } from "node:path/posix";
import { format, type BuiltInParserName } from "prettier";
import getOutput from "./output";

const lines = [
  `import { template } from "handlebars";`,
  "const registry = new Map();",
  "const createKey = (...parts) => parts.join('/')",
  "const fromKey = (key) => key.split('/')",
  `function nameOf(key) {
      const last = key[key.length - 1];
      return last.substring(0, last.indexOf('.'));
  }`,
  `export async function loadTemplate(...parts) {
      const key = createKey(...parts);
      const template = registry.get(key);
      if (!template) throw new Error("template not found: '" + key + '"')
      return template;
    }`,
  `export async function listTemplates(...prefix) {
      const prefixKey = createKey(...prefix, "");
      return [...registry.keys()]
        .filter((key) => key.startsWith(prefixKey))
        .map(fromKey)
        .map(key => key.slice(prefix.length, key.length))
        .map(key => ({ key, name: nameOf(key) }));
    }`,
];

function parserOf(file: string): BuiltInParserName | null {
  const extension = extname(file);
  switch (extension) {
    case ".yml":
    case ".yaml":
      return "yaml";
    default:
      return null;
  }
}

async function compile(path: string, key: string[]) {
  const content = await Bun.file(path).text();
  const specification = handlebars.precompile(content) as string;
  const parts = key.map((it) => `"${it}"`).join(", ");
  const parser = parserOf(path);
  const entry = parser
    ? `{ template: template(${specification}), parser: '${parser}' }`
    : `{ template: template(${specification}) }`;
  lines.push(`registry.set(createKey(${parts}), ${entry});`);
}

async function compileIn(dir: string, key: string[]): Promise<void> {
  const children = readdirSync(dir).map((name) => {
    const path = join(dir, name);
    return { name, path, info: statSync(path), key: [...key, name] };
  });

  await Promise.all(
    children.map(({ path, key, info }) => {
      if (info.isDirectory()) return compileIn(path, key);
      return compile(path, key);
    }),
  );
}

await compileIn("templates", []);

async function write(file: BunFile, lines: string[]) {
  const content = await format(lines.join("\n\n"), { parser: "typescript" });
  await file.write(content);
  console.info(`generated ${file.name}`);
}

const out = getOutput("templates.js");
await write(out, lines);

const types = getOutput("templates.d.ts");
await write(types, [
  `import type { BuiltInParserName } from "prettier";`,
  "export type TemplateKey = string[]",
  "export type RegisteredTemplate = { template: HandlebarsTemplateDelegate, parser?: BuiltInParserName }",
  "export function loadTemplate(...key: TemplateKey): Promise<RegisteredTemplate>",
  "export type TemplateEntry = { name: string, key: TemplateKey }",
  "export function listTemplates(...prefix: TemplateKey): Promise<TemplateEntry[]>",
]);

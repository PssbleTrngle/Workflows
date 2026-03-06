import type { BunFile } from "bun";
import handlebars from "handlebars";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path/posix";
import { format } from "prettier";
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

async function compile(path: string, key: string[]) {
  const content = await Bun.file(path).text();
  const specification = handlebars.precompile(content) as string;
  const parts = key.map((it) => `"${it}"`).join(", ");
  lines.push(`registry.set(createKey(${parts}), template(${specification}));`);
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
    })
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
  "export type TemplateKey = string[]",
  "export function loadTemplate(...key: TemplateKey): Promise<HandlebarsTemplateDelegate>",
  "export type TemplateEntry = { name: string, key: TemplateKey }",
  "export function listTemplates(...prefix: TemplateKey): Promise<TemplateEntry[]>",
]);

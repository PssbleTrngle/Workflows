import { compile } from "handlebars";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

function pathOf(...parts: string[]) {
  return join(__dirname, "templates", ...parts);
}

async function loadFile(...path: string[]) {
  const file = Bun.file(pathOf(...path));
  return file.text();
}

export async function compileFile(...path: string[]) {
  return compile(await loadFile(...path));
}

export async function listTemplates(type: string, ...path: string[]) {
  const files = readdirSync(pathOf(type, ...path));
  return files
    .map((it) => join(...path, it))
    .filter((it) => statSync(pathOf(type, it)).isFile());
}

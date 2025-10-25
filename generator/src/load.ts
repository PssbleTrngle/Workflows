import { compile } from "handlebars";
import { join } from "node:path";

async function loadFile(...path: string[]) {
  const file = Bun.file(join(__dirname, "templates", ...path));
  return file.text();
}

export async function compileFile(...path: string[]) {
  return compile(await loadFile(...path));
}

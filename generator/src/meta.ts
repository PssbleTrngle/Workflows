import type { BunFile } from "bun";
import { join } from "node:path";
import { compileFile } from "./load";

const { version = "0.0.0-dev", name } = await Bun.file(
  join(__dirname, "..", "package.json")
).json();

export async function createHeader() {
  const template = await compileFile("meta.xml");

  const generated = template({
    link: name,
    version,
    generatedAt: new Date().toISOString(),
  });

  return generated
    .split("\n")
    .map((it) => `# ${it}`)
    .join("\n");
}

export async function withHeader(generated: string) {
  const header = await createHeader();
  return header + "\n\n" + generated;
}

export async function isGenerated(file: BunFile) {
  const content = await file.text();
  const needle = `<source>${name}</source>`;
  return content.includes(needle);
}

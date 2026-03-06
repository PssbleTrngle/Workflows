import type { BunFile } from "bun";
import { source, version } from "../dist/meta.json";
import { loadTemplate } from "../dist/templates";

export type Meta = {
  version: string;
  source: string;
};

export async function createHeader() {
  const template = await loadTemplate("meta.xml");

  const generated = template({
    source,
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
  const needle = `<source>${source}</source>`;
  return content.includes(needle);
}

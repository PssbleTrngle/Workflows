import type { BunFile } from "bun";
import type { BuiltInParserName } from "prettier";
import { source, version } from "../dist/meta.json";
import { loadTemplate } from "../dist/templates";

export type Meta = {
  version: string;
  source: string;
};

function commentOut(lines: string[], style?: BuiltInParserName): string[] {
  if (style === "yaml") {
    return lines.map((it) => `# ${it}`);
  }

  if (style === "markdown") {
    return ["<!---", ...lines, "-->"];
  }

  return lines;
}

export async function createHeader(style?: BuiltInParserName) {
  const { template } = await loadTemplate("meta.xml");

  const generated = template({
    source,
    version,
    generatedAt: new Date().toISOString(),
  });

  return commentOut(generated.split("\n"), style).join("\n");
}

export async function withHeader(generated: string, style?: BuiltInParserName) {
  const header = await createHeader(style);
  return header + "\n\n" + generated;
}

export async function isGenerated(file: BunFile) {
  const content = await file.text();
  const needle = `<source>${source}</source>`;
  return content.includes(needle);
}

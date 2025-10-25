import { compileFile } from "./load";

const repository = `https://github.com/PssbleTrngle/Workflows`;
const version = "0.0.0-dev";

export async function createHeader() {
  const template = await compileFile("meta.xml");

  const generated = template({
    link: repository,
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

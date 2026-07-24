import handlebars from "handlebars";
import { exists, mkdir } from "node:fs/promises";
import { format } from "prettier";

if (!(await exists("dist"))) mkdir("dist");

const template = await Bun.file("templates/table.md").text();

const compiled = handlebars.precompile(template) as string;

const output = Bun.file("dist/template.js");

const code = /* javascript */ `
   import handlebars from "handlebars";
   export const template = handlebars.template(${compiled})
`;

await output.write(await format(code, { parser: "typescript" }));

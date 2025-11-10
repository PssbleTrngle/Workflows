import { loadTemplate } from "../../dist/templates";

const partialFiles = ["java.yml"];

async function loadPartial(file: string) {
  const template = await loadTemplate("workflows", file);
  const name = file.substring(0, file.indexOf("."));
  return [name, template];
}

const entries = await Promise.all(partialFiles.map(loadPartial));
const partials: Record<string, HandlebarsTemplateDelegate> =
  Object.fromEntries(entries);

export default partials;

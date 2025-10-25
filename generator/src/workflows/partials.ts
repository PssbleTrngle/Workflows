import { compileFile } from "../load";

const partialFiles = ["java.yml"];

async function loadPartial(file: string) {
  const template = await compileFile("workflows", file);
  const name = file.substring(0, file.lastIndexOf("."));
  return [name, template];
}

const entries = await Promise.all(partialFiles.map(loadPartial));
const partials: Record<string, HandlebarsTemplateDelegate> =
  Object.fromEntries(entries);

export default partials;

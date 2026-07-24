import type { BunFile } from "bun";
import { join } from "node:path";
import { CONTRIBUTORS_CONFIG_PATH, parseContributorsConfig } from "./config";
import { generateContributorsTable, type Apis } from "./generate";

async function replaceInFile(content: string, file: BunFile) {
  if (!(await file.exists()))
    throw new Error(`unable to find file ${file.name}`);

  const current = await file.text();

  const replaced = current.replaceAll(
    /(<!--\s*contributors\.start\s*-->)[\s\S]*?(<!--\s*contributors\.end\s*-->)/gm,
    `$1\n${content}$2`,
  );

  await file.write(replaced);
}

export async function replaceContributorsTable(path: string, apis: Apis) {
  const file = Bun.file(join(path, CONTRIBUTORS_CONFIG_PATH));

  if (!(await file.exists())) {
    throw new Error(`unable to find ${CONTRIBUTORS_CONFIG_PATH} in ${path}`);
  }

  const config = parseContributorsConfig(await file.json());

  const table = await generateContributorsTable(config, apis);

  const output = Bun.file(join(path, "README.md"));

  await replaceInFile(table, output);
}

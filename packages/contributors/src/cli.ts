import { join } from "node:path";
import {
  CONTRIBUTORS_CONFIG_PATH,
  generateContributorsTable,
  parseContributorsConfig,
} from ".";

const path = process.argv[2] ?? ".";
const file = Bun.file(join(path, CONTRIBUTORS_CONFIG_PATH));

if (!(await file.exists())) {
  throw new Error(`unable to find ${CONTRIBUTORS_CONFIG_PATH} in ${path}`);
}

const config = parseContributorsConfig(await file.json());
const { GITHUB_TOKEN } = process.env;

if (!GITHUB_TOKEN) throw new Error("GITHUB_TOKEN environment variable missing");

const table = await generateContributorsTable(config, GITHUB_TOKEN);

const output = Bun.file(join(path, "CONTRIBUTORS.md"));

await output.write(table);

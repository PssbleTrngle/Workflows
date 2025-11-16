import { join } from "node:path";
import { validateConfig } from "./config";
import { configPath, generateInFolder } from "./files";

const path = process.argv[2];

function error(message: string): never {
  console.error(message);
  process.exit(1);
}

if (!path) error("missing path parameter");

const configFile = Bun.file(join(path, configPath));

if (!(await configFile.exists()))
  error(`unable to find ${configPath} in ${path}`);

const config = validateConfig(await configFile.json());

await generateInFolder(path, config);

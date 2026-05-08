import {
  configPath,
  detectProperties,
  generateInFolder,
  validateConfig,
} from "@pssbletrngle/github-meta-generator";
import type { RepoSearchWithBranch } from "@pssbletrngle/workflows-types";
import { join } from "node:path";
import { getBranch, getRepo, listBranches } from "./git";

export default async function refresh() {
  const path = ".";
  const configFile = Bun.file(join(path, configPath));

  if (!(await configFile.exists()))
    throw new Error(`unable to find ${configPath} in ${path}`);

  const target: RepoSearchWithBranch = {
    ...(await getRepo(path)),
    branch: await getBranch(path),
  };

  const raw = validateConfig(await configFile.json());

  const branches = await listBranches(path);

  const withDetected = await detectProperties({
    config: raw,
    branches,
    logger: console,
    target,
  });

  const validated = validateConfig(withDetected, false);

  await generateInFolder(path, validated);
}

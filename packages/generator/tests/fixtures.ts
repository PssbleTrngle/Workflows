import { globSync } from "node:fs";
import { join } from "node:path";
import { validateConfig } from "../src";
import type { Context } from "../src/generator";

export async function loadFixtureFile(...paths: string[]): Promise<unknown> {
  const file = Bun.file(join(__dirname, "__fixtures__", ...paths));
  return await file.json();
}

export async function loadConfigFixture(...paths: string[]) {
  const json = await loadFixtureFile(...paths);
  return validateConfig(json);
}

export function globFixtureDirectory(...paths: string[]): Context["glob"] {
  const cwd = join(join(__dirname, "__fixtures__", ...paths));
  return (pattern: string) => globSync(pattern, { cwd });
}

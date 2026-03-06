import { join } from "node:path";
import { validateConfig } from "../src";

export async function loadFixture(...paths: string[]): Promise<unknown> {
  const file = Bun.file(join(__dirname, "__fixtures__", ...paths));
  return await file.json();
}

export async function loadConfigFixture(...paths: string[]) {
  const json = await loadFixture(...paths);
  return validateConfig(json);
}

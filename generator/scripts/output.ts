import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const outDir = "dist";

if (!existsSync(outDir)) {
  mkdirSync(outDir, { recursive: true });
}

export default function getOutput(name: string) {
  return Bun.file(join(outDir, name));
}

import { join } from "node:path";
import type { Meta } from "../src/meta";
import getOutput from "./output";

const { version = "0.0.0-dev", name } = await Bun.file(
  join(__dirname, "..", "package.json")
).json();

const metadata: Meta = {
  version,
  source: name,
};

const out = getOutput("meta.json");

await out.write(JSON.stringify(metadata));

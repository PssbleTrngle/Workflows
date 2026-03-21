/* eslint-disable no-console */
import { $ } from "bun";
import { watch } from "fs";

const build = () => $`bun run build`;

await build();
watch("templates", { recursive: true }, async () => {
  console.info("detected changes, regenerating templates");
  await build();
});

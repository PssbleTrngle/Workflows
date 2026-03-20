import { readdirSync } from "node:fs";
import { join } from "node:path";

const version = `1.0.${process.env.BUILD_NUMBER}`;

async function updatePackageJson(path: string) {
  const file = Bun.file(join(path, "package.json"));
  if (!(await file.exists())) return;

  const json = await file.json();
  console.log(json.name);
}

await updatePackageJson(".");

const types = ["apps", "packages"];

await Promise.all(
  types.map(async (type) => {
    const children = readdirSync(type);
    await Promise.all(
      children.map((child) => {
        const path = join(type, child);
        return updatePackageJson(path);
      }),
    );
  }),
);

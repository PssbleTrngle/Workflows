import { readdirSync } from "node:fs";
import { join } from "node:path";

const version = process.env.RELEASE_VERSION;

if (!version) throw new Error("release version missing");

async function updatePackageJson(path: string) {
  const file = Bun.file(join(path, "package.json"));
  if (!(await file.exists())) return;

  const json = await file.json();

  console.log("updating version for", json.name);

  json.version = version;

  await file.write(JSON.stringify(json, null, 2));
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

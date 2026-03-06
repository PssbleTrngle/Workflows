import config from "./config";
import docker from "./connection";
import { prettyInfo } from "./pretty";

async function findContainers(image: string) {
  return await docker.listContainers({ filters: { ancestor: [image] } });
}

async function updateContainer(name: string, tag: string) {
  const image = `ghcr.io/${name}:${tag}`;

  console.info(`new release of image '${image}'`);

  const containers = await findContainers(image);
  const names = containers.flatMap((it) => it.Names);

  if (names.length === 0) return false;

  const container = await docker.createContainer({
    Image: "containrrr/watchtower",
    name: "watchtower_updater",
    HostConfig: {
      AutoRemove: true,
      Binds: [
        `${config.socketPath}:/var/run/docker.sock`,
        `/root/.docker/config.json:/config.json`,
      ],
    },
    Cmd: [
      "--include-stopped",
      "--run-once",
      "--enable-lifecycle-hooks",
      ...names,
    ],
  });

  await container.start();
  await container.wait();

  return containers.map(prettyInfo);
}

export async function updateContainers(name: string, tag: string) {
  const containers = await updateContainer(name, tag);
  if (!containers) {
    console.info(`   no containers found`);
    return;
  }

  console.info(
    `   updated ${containers.length} container(s): ${containers.map((it) => it.name).join(",")}`,
  );

  return containers;
}

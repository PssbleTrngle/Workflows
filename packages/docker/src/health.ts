import config from "./config";
import docker from "./connection";

export async function checkHealth(
  lastAlarm?: (id: string) => Promise<Date | undefined>,
) {
  const containers = await docker.listContainers();
  const withHealth = await Promise.all(
    containers.map(async (container) => {
      const info = await docker.getContainer(container.Id).inspect();
      const health = info.State.Health!;
      const alarm = await lastAlarm?.(container.Id);

      return { container, health, alarm };
    }),
  );

  const unhealthy = withHealth.filter(
    ({ health }) => health?.Status === "unhealthy",
  );

  if (unhealthy.length > 0) {
    console.info(`Found ${unhealthy.length} unhealthy containers`);
  }

  const shouldAlarm = unhealthy.filter(({ health, alarm }) => {
    if (health.FailingStreak < config.failingStreak) return false;
    return alarm === undefined;
  });

  return shouldAlarm;
}

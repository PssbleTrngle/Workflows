import { checkHealth, prettyInfo } from "@pssbletrngle/workflows-docker";
import { sendEmbeds } from "@pssbletrngle/workflows-notifactions";
import { schedule } from "node-cron";
import { lastAlarm, saveAlarmDate } from "./persistance";

schedule(process.env.HEALTH_SCHEDULE || "* * * * *", async () => {
  try {
    await runCron();
  } catch (e) {
    console.error(e);
  }
});

async function runCron() {
  const unhealthy = await checkHealth(lastAlarm);

  if (unhealthy.length > 0) {
    console.info(`Sending alarm about ${unhealthy.length} containers`);
  }

  await Promise.all(
    unhealthy.map(async ({ container, health }) => {
      const { link } = prettyInfo(container);

      await sendEmbeds("alarm", {
        title: `Service Unhealthy`,
        description: `${link} is not running correctly`,
        color: 0xd43350,
        footer: {
          text: `${health.FailingStreak} failed checks`,
        },
      });

      await saveAlarmDate(container.Id, new Date());
    }),
  );
}

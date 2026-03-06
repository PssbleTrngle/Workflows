import { redis } from "@pssbletrngle/workflows-persistance";

// TODO intEnv?
const alarmStaleTime = Number.parseInt(process.env.STALE_TIME ?? "86400000");

export async function lastAlarm(id: string) {
  const raw = await redis.get(`alarm:${id}`);
  if (!raw) return undefined;
  const millis = Number.parseInt(raw);
  if (isNaN(millis)) return undefined;
  return new Date(millis);
}

export async function saveAlarmDate(id: string, timestamp: Date) {
  await redis.set(`alarm:${id}`, timestamp.getTime(), "EX", alarmStaleTime);
}

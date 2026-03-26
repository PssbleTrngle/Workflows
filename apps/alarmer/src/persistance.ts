import { redis } from "@pssbletrngle/workflows-persistance";
import { intEnv } from "@pssbletrngle/workflows-shared/config";

const alarmStaleTime = intEnv("STALE_TIME") ?? 86400000;

export async function lastAlarm(id: string) {
  const raw = await redis.get(`alarm:${id}`);
  if (!raw) return undefined;
  const millis = Number.parseInt(raw);
  if (Number.isNaN(millis)) return undefined;
  return new Date(millis);
}

export async function saveAlarmDate(id: string, timestamp: Date) {
  await redis.set(`alarm:${id}`, timestamp.getTime(), "EX", alarmStaleTime);
}

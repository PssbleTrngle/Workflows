export function formatAgo(date: Date) {
  const localizer = new Intl.RelativeTimeFormat("en");

  const millis = Date.now() - date.getTime();
  const seconds = Math.floor(millis / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return localizer.format(-days, "days");
  if (hours > 0) return localizer.format(-hours, "hours");
  if (minutes > 0) return localizer.format(-minutes, "minutes");
  if (seconds > 0) return localizer.format(-seconds, "seconds");
  return "now";
}

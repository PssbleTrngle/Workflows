import createNotifications from "@pssbletrngle/workflows-notifications";
import logger from "./logger";

const notifications = await createNotifications({ logger });

export default notifications;

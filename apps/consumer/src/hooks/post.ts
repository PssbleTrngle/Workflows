import createNotifications from "@pssbletrngle/workflows-notifications";

const version = process.env.APP_VERSION || "0.0.0-dev";

const notifications = await createNotifications({ database: false });

notifications.sendEmbeds(["docker"], {
  title: "Updated self",
  color: 0x0980fd,
  footer: {
    text: `updated to version ${version}`,
  },
});

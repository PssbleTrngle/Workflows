import { sendEmbeds } from "@pssbletrngle/workflows-notifications";

const version = process.env.APP_VERSION || "0.0.0-dev";

sendEmbeds(["docker"], {
  title: "Updated self",
  color: 0x0980fd,
  footer: {
    text: `updated to version ${version}`,
  },
});

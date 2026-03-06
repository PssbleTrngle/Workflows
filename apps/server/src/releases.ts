import { type WebhookEventDefinition } from "@octokit/webhooks/types";
import { publishEvent } from "@pssbletrngle/workflows-events";
import { App } from "octokit";

type PackagePublished = WebhookEventDefinition<"package-published">;

async function handlePackagePublished(event: PackagePublished) {
  const pack = event.package;

  if (pack.package_type !== "CONTAINER") return;
  if (!pack.owner) {
    console.warn(`owner missing for ${pack.name}`);
    return;
  }

  const name = `${pack.owner.login}/${pack.name}`.toLowerCase();
  const tag = pack.package_version?.container_metadata?.tag?.name ?? "latest";

  await publishEvent("update_containers", {
    name,
    tag,
    keys: [pack.owner.login, pack.name],
  });
}

export function registerReleasesHooks(hooks: App["webhooks"]) {
  hooks.on("package.published", ({ payload }) =>
    handlePackagePublished(payload),
  );

  hooks.on("registry_package.published", async ({ payload }) => {
    // check installation type?
    const { registry_package, ...event } = payload;
    await handlePackagePublished({
      ...event,
      package: registry_package as PackagePublished["package"],
    });
  });
}

import type { WebhookEventDefinition } from "@octokit/webhooks/types";

export function fileChanged(
  commits: WebhookEventDefinition<"push">["commits"],
  ...paths: string[]
) {
  return commits.some(({ added, removed, modified }) => {
    const touched = [added, removed, modified].flat();
    return paths.some((it) => touched.includes(it));
  });
}

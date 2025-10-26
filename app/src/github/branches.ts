import type { WebhookEventDefinition } from "@octokit/webhooks/types";
import type { Octokit } from "octokit";

type Repository = WebhookEventDefinition<"push">["repository"];

export default async function detectBranches(
  octokit: Octokit,
  repository: Repository
) {
  const owner = repository.owner?.name;
  if (!owner)
    throw new Error(`owner missing for repository ${repository.full_name}`);

  const { data } = await octokit.rest.repos.listBranches({
    repo: repository.name,
    owner,
  });

  const names = new Set(data.map((it) => it.name));

  const branches = [];
  if (names.has("develop")) {
    branches.push("develop");
  } else if (names.has("main")) {
    branches.push("main");
  }

  names.forEach((it) => {
    if (/\d+\.\d+\.(\d+|x)/.test(it)) {
      branches.push(it);
    }
  });

  return branches;
}

import { notNull } from "@pssbletrngle/workflows-shared/util";
import type { RepoSearchWithBranch } from "@pssbletrngle/workflows-types";
import type { Octokit } from "octokit";
import logger from "../logger";

const BLOCKING_RULE_TYPES = ["pull_request", "required_status_checks"];

export default async function checkProtection(
  search: RepoSearchWithBranch,
  octokit: Octokit,
) {
  const { data: app } = await octokit.rest.apps.getAuthenticated();
  if (!app) {
    logger.warn("not authenticated as app");
    return;
  }

  const { data: protections } = await octokit.request(
    "GET /repos/{owner}/{repo}/rules/branches/{branch}",
    search,
  );

  const ruleSets = await Promise.all(
    protections
      .map((it) => it.ruleset_id)
      .filter(notNull)
      .map(async (id) => {
        const { data } = await octokit.rest.repos.getRepoRuleset({
          ...search,
          ruleset_id: id,
        });

        return data;
      }),
  );

  const blocking = ruleSets.filter(
    ({ rules, bypass_actors }) =>
      rules?.some((it) => BLOCKING_RULE_TYPES.includes(it.type)) &&
      !bypass_actors?.some(
        (actor) =>
          actor.actor_type === "Integration" && actor.actor_id === app.id,
      ),
  );

  return blocking;
}

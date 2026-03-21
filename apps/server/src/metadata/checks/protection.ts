import { notNull } from "@pssbletrngle/workflows-shared/util";
import type { RepoSearchWithBranch } from "@pssbletrngle/workflows-types";
import { Check } from "@pssbletrngle/workflows-types/metadata";
import type { Octokit } from "octokit";
import logger from "../../logger";
import { saveChecks } from "../cache";

const BLOCKING_RULE_TYPES = ["pull_request", "required_status_checks"];

export default async function checkProtection(
  repo: RepoSearchWithBranch,
  octokit: Octokit,
) {
  logger.debug("checking branch protections", { repo });

  const { data: protections } = await octokit.request(
    "GET /repos/{owner}/{repo}/rules/branches/{branch}",
    repo,
  );

  const ruleSets = await Promise.all(
    protections
      .map((it) => it.ruleset_id)
      .filter(notNull)
      .map(async (id) => {
        const { data } = await octokit.rest.repos.getRepoRuleset({
          ...repo,
          ruleset_id: id,
        });

        return data;
      }),
  );

  const enabled = ruleSets.filter((it) => it.enforcement === "active");

  const blocking = enabled.filter(
    ({ rules, current_user_can_bypass }) =>
      rules?.some((it) => BLOCKING_RULE_TYPES.includes(it.type)) &&
      !current_user_can_bypass,
  );

  await saveChecks(repo, {
    [Check.BRANCH_PROTECTED]: enabled.length > 0,
    [Check.APP_NOT_BLOCKED]: blocking.length === 0,
  });
}

import { notNull } from "@pssbletrngle/workflows-shared/util";
import type {
  RepoSearch,
  RepoSearchWithBranch,
} from "@pssbletrngle/workflows-types";
import logger from "../logger";
import { createAuthenticatedGitUser } from "../user";
import type { AuthenticatedContext } from "./auth";
import { fetchBranches } from "./branches";
import generateMetadata from "./generator";

const BLOCKING_RULE_TYPES = ["pull_request", "required_status_checks"];

async function checkProtection(
  search: RepoSearchWithBranch,
  { octokit }: AuthenticatedContext,
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

export default async function refresh(
  search: RepoSearchWithBranch | RepoSearch,
  { octokit, token }: AuthenticatedContext,
) {
  const user = await createAuthenticatedGitUser(token, octokit);

  const { data: repository } = await octokit.rest.repos.get(search);

  if ("base" in search) {
    return await generateMetadata(repository, search.base, octokit, user);
  } else {
    const branches = await fetchBranches(octokit, search);

    const statuses = await Promise.all(
      branches.map((branch) => {
        return generateMetadata(repository, branch, octokit, user);
      }),
    );

    return statuses.filter((it) => !!it);
  }
}

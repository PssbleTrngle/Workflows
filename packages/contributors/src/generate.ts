import { Octokit } from "octokit";
import { format } from "prettier";
import { template } from "../dist/template";
import type { Contributor, ContributorsConfig } from "./config";

async function populateContributor(
  contributor: Contributor,
  octokit: Octokit,
): Promise<Contributor> {
  const withDefaults = {
    githubUser: contributor.name,
    ...contributor,
  };

  if (!withDefaults.avatar) {
    try {
      const { data } = await octokit.rest.users.getByUsername({
        username: withDefaults.githubUser,
      });

      withDefaults.avatar = data.avatar_url;
    } catch {
      octokit.log.warn(`unable to fetch avatar for ${withDefaults.githubUser}`);
    }
  }

  return withDefaults;
}

export async function generateContributorsTable(
  { perRow, contributors }: ContributorsConfig,
  octokit: Octokit,
) {
  const rows: Contributor[][] = [[]];

  for (let i = 0; i < contributors.length; i++) {
    let lastRow = rows.at(-1)!;
    if (lastRow.length === perRow) {
      lastRow = [];
      rows.push(lastRow);
    }

    const populated = await populateContributor(contributors[i]!, octokit);
    lastRow.push(populated);
  }

  return await format(template({ rows }), { parser: "html" });
}

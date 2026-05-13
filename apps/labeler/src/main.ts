import type { RepoSearch } from "@pssbletrngle/workflows-types";
import dotenv from "dotenv";
import { Octokit } from "octokit";
import { fetchConfig, matchLabels } from "./matcher";

dotenv.config();

const subject: RepoSearch = { owner: "PssbleTrngle", repo: "dye_depot" };

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

const { data: user } = await octokit.rest.users.getAuthenticated();

console.info(`authenticated as ${user.login}`);
console.info(`checking ${subject.owner}/${subject.repo}...`);

const config = await fetchConfig(octokit, subject);
if (!config) throw new Error("could not find labeler.yml config in repository");

for await (const { data: issues } of octokit.paginate.iterator(
  octokit.rest.issues.listForRepo,
  { ...subject },
)) {
  await Promise.all(
    issues.map(async (issue) => {
      if (!issue.body) return;
      if (issue.pull_request) return;

      const labels = matchLabels(issue.body, config);

      const current = issue.labels.map((it) => {
        if (typeof it === "string") return it;
        return it.name;
      });

      const missing = labels.filter((it) => !current.includes(it));
      if (missing.length > 0) {
        console.info("  updating labels for", issue.title);
        await octokit.rest.issues.addLabels({
          ...subject,
          issue_number: issue.number,
          labels: missing,
        });
      }
    }),
  );
}

import { Octokit } from "octokit";
import { replaceContributorsTable } from "./replacer";

const path = process.argv[2] ?? ".";

const { GITHUB_TOKEN } = process.env;
if (!GITHUB_TOKEN) throw new Error("GITHUB_TOKEN environment variable missing");

const octokit = new Octokit({ auth: GITHUB_TOKEN });
await replaceContributorsTable(path, octokit);

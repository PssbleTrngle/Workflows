import type { RepoSearch } from "@pssbletrngle/workflows-types";
import { YAML } from "bun";
import { Octokit, RequestError } from "octokit";

type LabelerConfig = Record<string, string[]>;

export async function fetchConfig(octokit: Octokit, subject: RepoSearch) {
  const path = ".github/labeler.yml";
  try {
    const { data } = await octokit.rest.repos.getContent({
      ...subject,
      path,
      mediaType: {
        format: "raw",
      },
    });

    if (typeof data !== "string")
      throw new Error("failed fetching content for config");

    return YAML.parse(data) as LabelerConfig;
  } catch (e) {
    if (e instanceof RequestError && e.status === 404) return null;
    throw e;
  }
}

function parseRegExp(pattern: string) {
  const isRegEx = pattern.match(/^\/(.+)\/(.*)$/) as [never, string, string];
  if (isRegEx) return new RegExp(isRegEx[1], isRegEx[2]);
  return new RegExp(pattern);
}

function matchLabel(content: string, patterns: string[]) {
  return patterns.some((pattern) => {
    const regEx = parseRegExp(pattern);
    return regEx.test(content);
  });
}

export function matchLabels(content: string, labels: LabelerConfig) {
  return Object.entries(labels)
    .filter(([, patterns]) => matchLabel(content, patterns))
    .map(([label]) => label);
}

import {
  contentsSame,
  notNull,
  uniq,
} from "@pssbletrngle/workflows-shared/util";
import type { RepoSearch } from "@pssbletrngle/workflows-types";
import type { Setup } from "@pssbletrngle/workflows-types/metadata";
import type { Octokit } from "octokit";
import logger from "../../logger";
import { Respositories } from "../database";

const CONTROLLED_TOPICS = [
  "fabric",
  "forge",
  "neoforge",
  "minecraft",
  "mc",
  "fabricmc",
  "minecraft-mod",
  "mod",
  "modding",
];

function detectTopics(setup: Setup): string[] {
  if (setup.type.includes("minecraft")) {
    return ["minecraft", "mod", ...setup.loaders]
      .map((it) => it.toLowerCase())
      .filter(notNull);
  }

  return [];
}

export default async function updateTopics(
  subject: RepoSearch,
  octokit: Octokit,
) {
  const setup = await Respositories.findSetup(subject);
  if (!setup) return;

  const { data: current } = await octokit.rest.repos.getAllTopics(subject);
  const keep = current.names.filter((it) => !CONTROLLED_TOPICS.includes(it));
  const detected = detectTopics(setup);
  const next = uniq([...keep, ...detected]);

  if (contentsSame(next, current.names)) {
    logger.debug("topics stayed the same, not updating", subject);
    return;
  }

  await octokit.rest.repos.replaceAllTopics({ ...subject, names: next });
  logger.info("updated topics", subject);
}

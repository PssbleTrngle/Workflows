import type { RepoSearch } from "@pssbletrngle/workflows-types";
import type { Octokit } from "octokit";
import { getFile } from "../../files";
import logger from "../../logger";
import { Respositories } from "../database";

export const ICON_PATHS = [".idea/icon.svg", ".idea/icon.png"];

export async function getIcon(octokit: Octokit, subject: RepoSearch) {
  try {
    return await Promise.any(
      ICON_PATHS.map((path) => getFile(subject, path, octokit)),
    );
  } catch {
    return null;
  }
}

export async function createThumbnails(url: string) {
  const response = await fetch(url);
  const input = await response.blob();
  return input.image().resize(128, 128).webp().toBuffer();
}

export default async function checkIcon(subject: RepoSearch, octokit: Octokit) {
  const file = await getIcon(octokit, subject);
  const url = file?.download_url;

  if (!url) {
    await Respositories.update(subject, { thumbnail: null, icon: null });
    logger.debug("deleted icon", subject);
    return;
  }

  const thumbnail = await createThumbnails(url);
  const icon = `/files/${subject.owner}/${subject.repo}/thumbnail.webp`;
  logger.debug("updated icon", subject);
  await Respositories.update(subject, { thumbnail, icon });
}

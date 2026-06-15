import type { RepoSearch } from "@pssbletrngle/workflows-types";
import { Readable } from "node:stream";
import type { Octokit } from "octokit";
import sharp from "sharp";
import { getFile } from "../../files";
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
  const { body } = await fetch(url);
  if (!body) throw new Error("unable to downlod icon");
  const input = Readable.fromWeb(body);
  const transformer = sharp().resize(128, 128).webp();
  return input.pipe(transformer).toBuffer();
}

export default async function checkIcon(subject: RepoSearch, octokit: Octokit) {
  const file = await getIcon(octokit, subject);
  const url = file?.download_url;

  if (!url) {
    await Respositories.update(subject, { thumbnail: null, icon: null });
    return;
  }

  const thumbnail = await createThumbnails(url);
  const icon = `/files/${subject.owner}/${subject.repo}/thumbnail.webp`;
  await Respositories.update(subject, { thumbnail, icon });
}

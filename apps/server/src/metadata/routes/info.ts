import generatorInfo from "@pssbletrngle/github-meta-generator/meta";
import type { AppInfo } from "@pssbletrngle/workflows-types";
import { Router } from "express";
import type { App } from "octokit";
import { ApiError } from "../../error";

export default function infoRouter(app: App) {
  const router = Router();

  router.get("/", async (_, res) => {
    const { data } = await app.octokit.rest.apps.getAuthenticated();
    if (!data) throw new ApiError("unable to get app info", 404);

    const url = data.html_url;
    const { pathname } = new URL(data.external_url);
    const [owner, repo] = pathname.substring(1).split("/") as [string, string];
    const repository = {
      url: data.external_url,
      owner,
      repo,
    };

    res.json({ ...generatorInfo, url, repository } satisfies AppInfo);
  });

  return router;
}

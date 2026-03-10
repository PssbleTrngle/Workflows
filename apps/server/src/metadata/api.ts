import type { RepositoryStatus } from "@pssbletrngle/webhooks-types/metadata";
import { json, Router } from "express";
import { type App } from "octokit";
import z from "zod";
import { cutoff } from "../error";
import { createAuthenticatedGitUser } from "../user";
import { authorize, type AuthenticatedResponse } from "./auth";
import {
  getStatus,
  getStatusesByOwner,
  getStatusesByRepository,
} from "./cache";
import { eventDispatcher } from "./events";
import generateMetadata from "./generator";

export default function createApiRoutes(_: App) {
  const router = Router();

  router.use(...authorize("fail"));
  router.use(json());

  router.use("/sse", eventDispatcher.handler);

  router.get("/test", (_, res) => res.json({ message: "yes" }));

  router.get(
    "/:owner/:repo/status",
    async (req, res: AuthenticatedResponse) => {
      // TODO authorization guard
      const status = await getStatusesByRepository(req.params);
      res.json({ status });
    },
  );

  router.get(
    "/:owner/:repo/:base/status",
    async (req, res: AuthenticatedResponse) => {
      // TODO authorization guard
      const status = await getStatus(req.params);
      res.json({ status });
    },
  );

  router.get("/status", async (_, res: AuthenticatedResponse) => {
    const [organizations, user] = await Promise.all([
      res.locals.octokit.rest.orgs.listForAuthenticatedUser(),
      res.locals.octokit.rest.users.getAuthenticated(),
    ]);

    const namespaces = [
      user.data.login,
      ...organizations.data.map((it) => it.login),
    ];

    const statuses = await Promise.all(namespaces.map(getStatusesByOwner));
    res.json(statuses.flat());
  });

  const repoParams = z.object({
    repo: z.string().nonempty(),
    owner: z.string().nonempty(),
    base: z.string().nonempty(),
  });

  const reposParams = z.array(repoParams);

  router.post("/refresh", async (req, res: AuthenticatedResponse) => {
    const data = reposParams.parse(req.body);

    const status: RepositoryStatus = "up-to-date";

    const { octokit, token } = res.locals;
    const user = await createAuthenticatedGitUser(token, octokit);

    // TODO async, maybe in chunks?
    for (const entry of data) {
      const { data: repository } = await octokit.rest.repos.get(entry);

      await generateMetadata(repository, entry.base, octokit, user);
    }

    res.json({ success: true, status });
  });

  router.use(cutoff);

  const apiRouter = Router();
  apiRouter.use("/api", router);
  return apiRouter;
}

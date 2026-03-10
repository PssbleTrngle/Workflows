import { json, Router } from "express";
import { type App } from "octokit";
import z from "zod";
import { cutoff } from "../error";
import validate from "../validation";
import { authorize, type AuthenticatedResponse } from "./auth";
import {
  getStatus,
  getStatusesByOwner,
  getStatusesByRepository,
} from "./cache";
import { eventDispatcher } from "./events";
import refresh from "./refresh";

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
    owner: z.string().nonempty(),
    repo: z.string().nonempty(),
    base: z.string().nonempty().optional(),
  });

  router.post(
    "/refresh",
    validate(repoParams),
    async (req, res: AuthenticatedResponse) => {
      const status = await refresh(req.body, res.locals);

      res.json({ success: true, status });
    },
  );

  router.use(cutoff);

  const apiRouter = Router();
  apiRouter.use("/api", router);
  return apiRouter;
}

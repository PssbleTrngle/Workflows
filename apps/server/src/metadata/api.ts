import { json, Router } from "express";
import { type App } from "octokit";
import z from "zod";
import { cutoff } from "../error";
import validate from "../validation";
import { authorize, type AuthenticatedResponse } from "./auth";
import { getStatus, getStatusesByRepository } from "./cache";
import { eventDispatcher } from "./events";
import refresh from "./refresh";

const paginationQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().default(20),
});

export default function createApiRoutes(_: App) {
  const router = Router();

  router.use(...authorize("fail"));
  router.use(json());

  router.use("/sse", eventDispatcher.handler);

  router.get(
    "/:owner/:repo/status",
    async (req, res: AuthenticatedResponse) => {
      // TODO authorization guard
      const status = await getStatusesByRepository(req.params);
      res.json({ status });
    },
  );

  router.get(
    "/:owner/:repo/:branch/status",
    async (req, res: AuthenticatedResponse) => {
      // TODO authorization guard
      const status = await getStatus(req.params);
      res.json({ status });
    },
  );

  router.get(
    "/status",
    validate({ query: paginationQuery }),
    async (req, res: AuthenticatedResponse) => {
      const { data } =
        await res.locals.octokit.rest.repos.listForAuthenticatedUser({
          per_page: req.query.pageSize,
          sort: "pushed",
          page: req.query.page,
        });

      const statuses = await Promise.all(
        data.map((it) =>
          getStatusesByRepository({ repo: it.name, owner: it.owner.login }),
        ),
      );
      res.json(statuses.flat());
    },
  );

  const repoParams = z.object({
    owner: z.string().nonempty(),
    repo: z.string().nonempty(),
    branch: z.string().nonempty().optional(),
  });

  router.post(
    "/refresh",
    validate({ body: repoParams }),
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

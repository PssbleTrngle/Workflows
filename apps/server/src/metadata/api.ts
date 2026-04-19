import type { RepoSearchWithBranch } from "@pssbletrngle/workflows-types";
import { randomUUIDv7 } from "bun";
import { json, Router } from "express";
import { type App } from "octokit";
import z from "zod";
import { cutoff } from "../error";
import { installationContext } from "../installation";
import validate from "../validation";
import { authorize, type AuthenticatedResponse } from "./auth";
import { getChecks, getStatus, getStatusesByRepository } from "./cache";
import check from "./checks";
import { eventDispatcher } from "./events";

const paginationQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().default(20),
});

export default function createApiRoutes(app: App) {
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
    "/:owner/:repo/status/*branch",
    async (req, res: AuthenticatedResponse) => {
      // TODO authorization guard

      const { branch, ...rest } = req.params;
      const subject: RepoSearchWithBranch = {
        ...rest,
        branch: branch.join("/"),
      };

      const [status, checks] = await Promise.all([
        getStatus(subject),
        getChecks(subject),
      ]);

      res.json({ status, checks });
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
      const context = await installationContext(app, req.body);

      // not used yet, could be used for tracing
      const uuid = randomUUIDv7();
      res.json({ message: "refresh started", uuid });

      check(req.body, context);
    },
  );

  router.use(cutoff);

  const apiRouter = Router();
  apiRouter.use("/api", router);
  return apiRouter;
}

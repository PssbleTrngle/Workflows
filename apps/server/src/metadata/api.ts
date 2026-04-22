import type { RepoSearch } from "@pssbletrngle/workflows-types";
import { randomUUIDv7 } from "bun";
import { json, Router } from "express";
import { type App } from "octokit";
import z from "zod";
import config from "../config";
import { cutoff } from "../error";
import { installationContext } from "../installation";
import validate from "../validation";
import { authorize, type AuthenticatedResponse } from "./auth";
import check from "./checks";
import { eventDispatcher } from "./events";
import repositoryRouter from "./routes/repository";

export default function createApiRoutes(app: App) {
  const router = Router();

  router.use(...authorize("fail"));
  router.use(json());

  router.use("/sse", eventDispatcher.handler);

  router.use("/repository", repositoryRouter());

  if (config.dev) {
    router.get("/setup", async (_, res: AuthenticatedResponse) => {
      const { octokit } = res.locals;

      // not used yet, could be used for tracing
      const uuid = randomUUIDv7();
      res.json({ message: "setup started", uuid });

      for await (const { data: repositories } of octokit.paginate.iterator(
        octokit.rest.repos.listForAuthenticatedUser,
        { sort: "pushed" },
      )) {
        for (const repository of repositories) {
          if (repository.fork) continue;

          const subject: RepoSearch = {
            owner: repository.owner.login,
            repo: repository.name,
          };

          try {
            const context = await installationContext(app, subject);
            await check(subject, context);
          } catch {
            // not installed on repository
          }
        }
      }
    });
  }

  router.post(
    "/refresh",
    validate({
      body: z.object({
        owner: z.string().nonempty(),
        repo: z.string().nonempty(),
        branch: z.string().nonempty().optional(),
      }),
    }),
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

import { decodeRepoWithBranch } from "@pssbletrngle/workflows-shared/topic";
import { Router } from "express";
import z from "zod";
import { ApiError } from "../../error";
import type { AuthenticatedResponse } from "../auth";
import { Respositories } from "../database";

export default function repositoryRouter() {
  const router = Router();

  router.get("/filters", async (_, res: AuthenticatedResponse) => {
    const filters = await Respositories.createFilterValues(res.locals);
    res.json(filters);
  });

  router.get(
    "/:owner/:repo/:branch",
    async (req, res: AuthenticatedResponse) => {
      const subject = decodeRepoWithBranch(req.params);
      const repositoryBranch = await Respositories.findBranch(
        subject,
        res.locals,
      );
      if (!repositoryBranch)
        throw new ApiError("repository branch not found", 404);
      res.json(repositoryBranch);
    },
  );

  router.get("/:owner/:repo", async (req, res: AuthenticatedResponse) => {
    const repository = await Respositories.find(req.params, res.locals);
    if (!repository) throw new ApiError("repository not found", 404);
    res.json(repository);
  });

  router.get("/", async (_, res: AuthenticatedResponse) => {
    const repositories = await Respositories.findAll(res.locals);
    res.json({ entries: repositories });
  });

  const filterSchema = z.object({
    owner: z.string().nonempty().optional(),
    gradleHelper: z.string().nonempty().optional(),
    loader: z.string().nonempty().optional(),
    version: z.string().nonempty().optional(),
    // TODO parse on/off   failedChecks: z.boolean().optional(),
  });

  router.post("/search", async (req, res: AuthenticatedResponse) => {
    const filter = filterSchema.parse(req.body);
    const repositories = await Respositories.findAll(res.locals, filter);
    res.json({ entries: repositories });
  });

  return router;
}

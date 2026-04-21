import type { RepoSearchWithBranch } from "@pssbletrngle/workflows-types";
import { Router } from "express";
import { ApiError } from "../../error";
import type { AuthenticatedResponse } from "../auth";
import {
  getRepositories,
  getRepository,
  getRepositoryBranch,
} from "../database";

export default function repositoryRouter() {
  const router = Router();

  router.get(
    "/:owner/:repo/*branch",
    async (req, res: AuthenticatedResponse) => {
      // TODO authorization guard
      const { branch, ...rest } = req.params;
      const subject: RepoSearchWithBranch = {
        ...rest,
        branch: branch.join("/"),
      };

      const repositoryBranch = await getRepositoryBranch(subject, res.locals);
      if (!repositoryBranch)
        throw new ApiError("repository branch not found", 404);
      res.json(repositoryBranch);
    },
  );

  router.get("/:owner/:repo", async (req, res: AuthenticatedResponse) => {
    // TODO authorization guard
    const repository = await getRepository(req.params, res.locals);
    if (!repository) throw new ApiError("repository not found", 404);
    res.json(repository);
  });

  router.get("/", async (_, res: AuthenticatedResponse) => {
    // TODO authorization guard
    const repositories = await getRepositories(res.locals);
    res.json({ entries: repositories });
  });

  return router;
}

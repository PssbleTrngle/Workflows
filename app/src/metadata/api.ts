import { json, Router } from "express";
import { type App } from "octokit";
import z from "zod";
import { cutoff } from "../error";
import { authorize, type AuthenticatedResponse } from "./auth";
import { getStatus, getStatuses, saveStatus } from "./cache";

export default function createApiRoutes(_: App) {
  const router = Router();

  router.use(...authorize("fail"));

  router.use(json());

  router.get(
    "/status/:owner/:repo",
    async (req, res: AuthenticatedResponse) => {
      // TODO authorization guard
      const status = await getStatus(req.params);
      res.json({ status: status ?? "not-set-up" });
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

    const statuses = await Promise.all(namespaces.map(getStatuses));
    const merged = statuses.reduce((a, b) => ({ ...a, ...b }), {});
    res.json(merged);
  });

  const setupParams = z.array(
    z.object({
      repo: z.string().nonempty(),
      owner: z.string().nonempty(),
    }),
  );

  router.post("/setup", async (req, res) => {
    const data = setupParams.parse(req.body);

    const status = "not-set-up";
    for (const entry of data) {
      await saveStatus(entry, status);
    }

    res.json({ success: true, status });
  });

  router.use(cutoff);

  const apiRouter = Router();
  apiRouter.use("/api", router);
  return apiRouter;
}

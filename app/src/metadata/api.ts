import { Router } from "express";
import { type App } from "octokit";
import { cutoff } from "../error";
import { authorize, type AuthenticatedResponse } from "./auth";
import { getStatus, getStatuses, saveStatus } from "./cache";

export default function createApiRoutes(_: App) {
  const router = Router();

  router.use(...authorize("fail"));

  router.get(
    "/status/:owner/:repo",
    async (req, res: AuthenticatedResponse) => {
      // TODO authorization guard
      const status = await getStatus(req.params);
      res.json({ status: status ?? "not-set-up" });
    }
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

  router.post("/setup/:owner/:repo", async (req, res) => {
    await saveStatus(req.params, "not-set-up");

    res.json({ success: true });
  });

  router.use(cutoff);

  const apiRouter = Router();
  apiRouter.use("/api", router);
  return apiRouter;
}

import { Router } from "express";
import z from "zod";
import { ApiError } from "../../error";
import validate from "../../validation";
import type { AuthenticatedResponse } from "../auth";
import { Notifiers } from "../database";

const ruleSchema = z.object({
  repo: z.string().nonempty().nullable(),
  owner: z.string().nonempty().nullable(),
  branch: z.string().nonempty().nullable(),
});

const rulesSchema = z.array(ruleSchema).default([]);

const inputSchema = z.object({
  name: z.string().nonempty(),
  rules: rulesSchema,
  exclude: rulesSchema,
  discordWebhooks: z.array(z.url()).default([]),
});

export default function notifierRouter() {
  const router = Router();

  router.get("/:name", async (req, res: AuthenticatedResponse) => {
    const notifier = await Notifiers.find(req.params.name, res.locals);
    if (!notifier) throw new ApiError("notifier not found", 404);
    res.json(notifier);
  });

  router.put(
    "/:name",
    validate({ body: inputSchema }),
    async (req, res: AuthenticatedResponse) => {
      const success = await Notifiers.update(
        req.params.name,
        res.locals,
        req.body,
      );

      if (!success) throw new ApiError("notifier not found", 404);

      res.json({ success: true });
    },
  );

  router.delete("/:name", async (req, res: AuthenticatedResponse) => {
    const success = await Notifiers.delete(req.params.name, res.locals);
    if (!success) throw new ApiError("notifier not found", 404);
    res.json({ success: true });
  });

  router.get("/", async (_, res: AuthenticatedResponse) => {
    const repositories = await Notifiers.findAll(res.locals);
    res.json({ entries: repositories });
  });

  router.post(
    "/",
    validate({ body: inputSchema }),
    async (req, res: AuthenticatedResponse) => {
      const inserted = await Notifiers.create(res.locals, req.body);
      if (!inserted)
        throw new ApiError("notifier with that name already exists", 400);

      res.json({ success: true, value: inserted });
    },
  );

  return router;
}

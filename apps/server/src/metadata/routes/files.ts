import { Router } from "express";
import { ApiError } from "../../error";
import { Respositories } from "../database";

export default function filesRouter() {
  const router = Router();

  router.get("/:owner/:repo/thumbnail.webp", async (req, res) => {
    const repository = await Respositories.find(req.params);
    if (!repository?.thumbnail)
      throw new ApiError("repository does not have an icon", 404);
    res.contentType("image/webp").send(repository.thumbnail);
  });

  return router;
}

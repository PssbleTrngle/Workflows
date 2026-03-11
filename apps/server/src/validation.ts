import type { Dictionary } from "@pssbletrngle/workflows-types";
import type { RequestHandler } from "express-serve-static-core";
import type { infer as inferType, ZodType } from "zod";

export default function validate<
  ReqParams,
  BodySchema extends ZodType,
  QuerySchema extends ZodType,
  LocalsObj extends Dictionary,
>(schemas: {
  query?: QuerySchema;
  body?: BodySchema;
}): RequestHandler<
  ReqParams,
  unknown,
  inferType<BodySchema>,
  inferType<QuerySchema>,
  LocalsObj
> {
  return (req, _, next) => {
    if (schemas.body) req.body = schemas.body.parse(req.body);
    if (schemas.query) {
      const value = schemas.query.parse(req.query, {});
      delete (req as Dictionary).query;
      Object.defineProperty(req, "query", { value, writable: false });
    }

    return next();
  };
}

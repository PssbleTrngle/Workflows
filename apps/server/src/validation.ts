import type { Dictionary } from "@pssbletrngle/webhooks-types";
import type { RequestHandler } from "express-serve-static-core";
import type { infer as inferType, ZodType } from "zod";

export default function validate<
  ReqParams,
  Schema extends ZodType,
  ReqQuery,
  LocalsObj extends Dictionary,
>(
  schema: Schema,
): RequestHandler<ReqParams, unknown, inferType<Schema>, ReqQuery, LocalsObj> {
  return (req, _, next) => {
    req.body = schema.parse(req.body);
    return next();
  };
}

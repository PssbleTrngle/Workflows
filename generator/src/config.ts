import z from "zod";

const schema = z.object({
  type: z.enum(["minecraft"]),
});

export type ConfigSchema = z.infer<typeof schema>;

export function validateConfig(input: unknown) {
  return schema.parse(input);
}

export const configSchema = z.toJSONSchema(schema);

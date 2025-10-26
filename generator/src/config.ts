import z, { type ZodType } from "zod";

function orDetect<T>(schema: ZodType<T>) {
  return schema.or(z.literal("detect")).default("detect");
}

const uploadSchema = z.object({
  modrinth: z.boolean().default(false),
  curseforge: z.boolean().default(false),
  github: z.boolean().default(false),
  nexus: z.boolean().default(false),
});

const minecraftSchema = z.object({
  type: z.literal("minecraft"),
  loaders: orDetect(z.array(z.string().nonempty())).describe(
    "supported mod loaders"
  ),
  versions: orDetect(z.array(z.string().nonempty())).describe(
    "supported minecraft versions"
  ),
  upload: uploadSchema.optional(),
  sonar: z.boolean().default(false),
});

const webSchema = z.object({
  type: z.literal("web"),
  manager: orDetect(z.enum(["npm", "yarn", "pnpm", "bun"])),
});

const commonSchema = z.object({
  workflows: z.boolean().default(true),
  issueTemplates: z.boolean().default(true),
});

const schema = webSchema.or(minecraftSchema).and(commonSchema);

export type ConfigSchema = z.infer<typeof schema>;

export type ConfigType = ConfigSchema["type"];

export function validateConfig(input: unknown) {
  return schema.parse(input);
}

export const configSchema = z.toJSONSchema(schema);

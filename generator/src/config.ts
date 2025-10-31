import z, { type ZodType } from "zod";

function orDetect<T>(schema: ZodType<T>) {
  return schema.or(z.literal("detect")).default("detect");
}

function createSchema() {
  const uploadSchema = z.object({
    modrinth: z.boolean().default(false).describe("upload to modrinth"),
    curseforge: z.boolean().default(false).describe("upload to curseforge"),
    github: z
      .boolean()
      .default(false)
      .describe(`publish to github's maven registry`),
    nexus: z
      .boolean()
      .default(false)
      .describe(`publish to @pssbletrngle's maven registry`),
  });

  const minecraftSchema = z.object({
    type: z.literal("minecraft"),
    loaders: orDetect(z.array(z.string().nonempty()).nonempty()).describe(
      "supported mod loaders"
    ),
    versions: orDetect(z.array(z.string().nonempty()).nonempty()).describe(
      "supported minecraft versions"
    ),
    upload: uploadSchema.optional(),
    sonar: z
      .boolean()
      .default(false)
      .describe("does this project include sonarqube"),
  });

  const webSchema = z.object({
    type: z.literal("web"),
    manager: orDetect(z.enum(["npm", "yarn", "pnpm", "bun"])).describe(
      "package manager"
    ),
  });

  const commonSchema = z.object({
    workflows: z.boolean().default(true).describe("generate workflow files"),
    issueTemplates: z
      .boolean()
      .default(true)
      .describe("generate issue templates"),
    overwrite: z
      .enum(["generated", "always"])
      .default("always")
      .describe("whether to only overwrite generated files or any file"),
    strategy: z
      .enum(["pull_request", "push"])
      .default("pull_request")
      .describe("push changes directory or submit them as a pull request"),
  });

  return webSchema.or(minecraftSchema).and(commonSchema);
}

const schema = createSchema();

export type ConfigSchema = z.infer<typeof schema>;

const resolvedSchema = createSchema().superRefine((data, context) => {
  Object.entries(data).forEach(([key, input]) => {
    if (input === "detect")
      context.addIssue({
        code: "invalid_value",
        message: `could not detect values`,
        path: [key],
        values: [],
        input,
      });
  });
});

export type ConfigType = ConfigSchema["type"];

export function validateConfig(
  input: unknown,
  allowDetected: boolean = true
): ConfigSchema {
  if (allowDetected) return schema.parse(input);
  return resolvedSchema.parse(input);
}

export const configSchema = z.toJSONSchema(schema);

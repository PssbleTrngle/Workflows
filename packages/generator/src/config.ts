import z, { type ZodType } from "zod";

export const DETECT_KEY = "detect";

function orDetect<T>(schema: ZodType<T>) {
  return schema.or(z.literal(DETECT_KEY)).default(DETECT_KEY);
}

const commonSchema = z.object({
  $schema: z.url().optional(),
  $version: z.string().regex(/\d+\.\d+/),

  workflows: z.boolean().default(true).describe("generate workflow files"),
  owner: orDetect(z.string().nonempty()).describe("the owner of this code"),
  issueTemplates: z
    .boolean()
    .default(true)
    .describe("generate issue templates"),
  configs: z.boolean().default(true).describe("generate config files"),
  license: z.boolean().default(true).describe("generate a license"),
  assignee: z
    .string()
    .nonempty()
    .optional()
    .describe("assignee to be used in issue templates"),
  overwrite: z
    .enum(["generated", "always"])
    .default("generated")
    .describe("whether to only overwrite generated files or any file"),
  strategy: z
    .enum(["pull_request", "push"])
    .default("push")
    .describe("push changes directory or submit them as a pull request"),
});

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

const minecraftSchema = z
  .object({
    type: z.literal("minecraft"),
    loaders: orDetect(z.array(z.string().nonempty()).nonempty())
      .describe("supported mod loaders")
      .meta({ examples: ["forge", "fabric", "neoforge"] }),
    versions: orDetect(z.array(z.string().nonempty()).nonempty())
      .describe("supported minecraft versions")
      .meta({ examples: ["1.20.1", "1.21", "1.21.10"] }),
    upload: uploadSchema.optional(),
    sonar: z
      .boolean()
      .default(false)
      .describe("does this project include sonarqube"),
  })
  .and(commonSchema);

export const packageManagerSchema = z.enum(["npm", "yarn", "pnpm", "bun"]);

const webSchema = z
  .object({
    type: z.literal("web"),
    manager: orDetect(packageManagerSchema).describe("package manager"),
  })
  .and(commonSchema);

const schema = webSchema.or(minecraftSchema);

export type CommonSchema = z.infer<typeof commonSchema>;
export type MinecraftConfigSchema = z.infer<typeof minecraftSchema>;
export type WebConfigSchema = z.infer<typeof webSchema>;
export type ConfigSchema = z.infer<typeof schema>;

const resolvedSchema = schema.superRefine((data, context) => {
  Object.entries(data).forEach(([key, input]) => {
    if (input === DETECT_KEY)
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
  allowDetected: boolean = true,
): ConfigSchema {
  if (allowDetected) return schema.parse(input);
  return resolvedSchema.parse(input);
}

export const configSchema = z.toJSONSchema(schema, {
  override: ({ jsonSchema, path }) => {
    // all-of merges messed up if sub-schemas prohibit additional properties
    if (jsonSchema.additionalProperties === false) {
      delete jsonSchema.additionalProperties;
    }

    // deny additional properties for type-specific configs
    if (path.length === 2) {
      // TODO not working yet
      // jsonSchema.unevaluatedProperties = false;
    }

    // fields with default values do not need to be marked as required
    jsonSchema.required = jsonSchema.required?.filter((field) => {
      const definition = jsonSchema.properties?.[field];
      if (typeof definition !== "object") return true;
      return definition?.default === undefined;
    });
  },
});

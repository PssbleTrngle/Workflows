import z from "zod";

const platformSchmema = z.string().nonempty().or(z.boolean()).optional();

const contributorSchema = z.object({
  name: z.string().nonempty(),
  github: platformSchmema,
  modrinth: platformSchmema,
  curseforge: platformSchmema,
  description: z.string().nonempty().optional(),
  avatar: z.string().nonempty().optional(),
});

const configSchema = z.object({
  $schema: z.string().optional(),
  contributors: z.array(contributorSchema),
  perRow: z.number().int().positive().default(5),
});

export function parseContributorsConfig(input: unknown) {
  return configSchema.parse(input);
}

export type Contributor = z.infer<typeof contributorSchema>;
export type ContributorsConfig = z.infer<typeof configSchema>;

export const contributorsConfigSchema = configSchema.toJSONSchema({
  override: ({ jsonSchema }) => {
    // fields with default values do not need to be marked as required
    jsonSchema.required = jsonSchema.required?.filter((field) => {
      const definition = jsonSchema.properties?.[field];
      if (typeof definition !== "object") return true;
      return definition?.default === undefined;
    });
  },
});

export const CONTRIBUTORS_CONFIG_PATH = "contributors.json";

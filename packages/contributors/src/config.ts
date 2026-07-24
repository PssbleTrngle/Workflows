import z from "zod";

const ContributorSchema = z.object({
  $schema: z.string().optional(),
  name: z.string().nonempty(),
  githubUser: z.string().nonempty().optional(),
  description: z.string().nonempty().optional(),
  avatar: z.string().nonempty().optional(),
});

const ConfigSchema = z.object({
  contributors: z.array(ContributorSchema),
  perRow: z.number().int().positive().default(5),
});

export function parseContributorsConfig(input: unknown) {
  return ConfigSchema.parse(input);
}

export type Contributor = z.infer<typeof ContributorSchema>;
export type ContributorsConfig = z.infer<typeof ConfigSchema>;

export const contributorsConfigSchema = ConfigSchema.toJSONSchema({
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

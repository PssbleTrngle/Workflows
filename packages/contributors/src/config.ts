import z from "zod";

const ContributorSchema = z.object({
  name: z.string().nonempty(),
  githubUser: z.string().nonempty().optional(),
  description: z.string().nonempty().optional(),
  avatar: z.string().nonempty().optional(),
});

const ConfigSchema = z.object({
  contributors: z.array(ContributorSchema),
  perRow: z.number().positive().default(5),
});

export function parseContributorsConfig(input: unknown) {
  return ConfigSchema.parse(input);
}

export type Contributor = z.infer<typeof ContributorSchema>;
export type ContributorsConfig = z.infer<typeof ConfigSchema>;

export const contributorsConfigSchema = ConfigSchema.toJSONSchema();

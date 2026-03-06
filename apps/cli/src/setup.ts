import {
  configPath,
  validateConfig,
  type ConfigSchema,
  type MinecraftConfigSchema,
  type WebConfigSchema,
} from "@pssbletrngle/github-meta-generator";
import { join } from "node:path";
import prompts, { type PromptObject } from "prompts";
import strip from "./strip";

const minecraftPrompts: PromptObject<keyof MinecraftConfigSchema>[] = [
  {
    type: "multiselect",
    name: "loaders",
    message: "Which mod loaders?",
    min: 1,
    choices: [
      {
        title: "NeoForge",
        value: "neoforge",
      },
      {
        title: "Forge",
        value: "forge",
      },
      {
        title: "Fabric",
        value: "fabric",
      },
      {
        title: "Quilt",
        value: "quilt",
      },
    ],
  },
  {
    type: "toggle",
    name: "sonar",
    message: "Analyzed with SonarQube?",
  },
  {
    type: "multiselect",
    name: "upload",
    message: "Where should this project be published to?",
    choices: [
      { title: "Modrinth", value: "modrinth" },
      { title: "CurseForge", value: "curseforge" },
      { title: "registry.somethingcatchy.net", value: "nexus" },
      { title: "GitHub Packages", value: "github" },
    ],
    format: (choices: string[]) => {
      return Object.fromEntries(choices.map((key) => [key, true]));
    },
  },
];

const webPrompts: PromptObject<keyof WebConfigSchema>[] = [
  {
    type: "select",
    name: "manager",
    message: "Which package manager?",
    choices: [
      { title: "npm" },
      { title: "yarn" },
      { title: "pnpm" },
      { title: "bun" },
    ],
  },
];

const commonPrompts: PromptObject<keyof ConfigSchema>[] = [
  {
    type: "toggle",
    name: "issueTemplates",
    message: "Generate issue templates?",
  },
  {
    type: "toggle",
    name: "workflows",
    message: "Generate workflows?",
  },
  {
    type: "toggle",
    name: "configs",
    message: "Generate configs?",
  },
  {
    type: "select",
    name: "overwrite",
    message: "Which files be overwritten?",
    choices: [
      { title: "Previously generated files", value: "generated" },
      { title: "Any files", value: "always" },
    ],
  },
  {
    type: "select",
    name: "strategy",
    message: "How should changes be made?",
    choices: [
      { title: "Through pull requests", value: "pull_request" },
      { title: "Pushed to the same branch", value: "push" },
    ],
  },
  {
    type: "text",
    name: "assignee",
    message: "default assignee for issues?",
    format: (value) => value.trim() || undefined,
  },
];

export default async function setup() {
  const path = ".";
  const { type } = await prompts<keyof ConfigSchema>([
    {
      type: "select",
      name: "type",
      message: "project type?",
      choices: [
        {
          title: "Minecraft",
          value: "minecraft",
        },
        {
          title: "Web",
          value: "web",
        },
      ],
    },
  ]);

  const defaults = validateConfig({ type });

  const additionalPrompts = [
    ...commonPrompts,
    ...(type === "minecraft" ? minecraftPrompts : webPrompts),
  ].map((prompt) => {
    let initial: boolean | string | number | undefined =
      defaults[prompt.name as keyof ConfigSchema];
    if (prompt.type === "multiselect") initial = undefined;
    if (prompt.type === "select" && Array.isArray(prompt.choices)) {
      initial = prompt.choices.findIndex((it) => it.value === initial);
    }
    return { initial, ...prompt };
  });

  const additional = await prompts(additionalPrompts);
  const input = { ...additional, type };

  const validated = validateConfig(input);

  const stripped = strip(validated, input, defaults);

  const output = Bun.file(join(path, configPath));

  await output.write(
    JSON.stringify(
      {
        $schema: "https://webhooks.new.macarena.ceo/schema/config.json",
        ...stripped,
      },
      null,
      2,
    ),
  );
}

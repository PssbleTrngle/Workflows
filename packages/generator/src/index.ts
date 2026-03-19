export {
  configSchema,
  DETECT_KEY,
  packageManagerSchema,
  validateConfig,
} from "./config";
export type {
  ConfigSchema,
  MinecraftConfigSchema,
  WebConfigSchema,
} from "./config";
export { generateConfig } from "./configs/generate";
export { configPath, generateInFolder } from "./files";
export { generateWithConfig, type TemplateData } from "./generator";
export { generateIssueTemplate } from "./issueTemplates/generate";
export { generateLicenses } from "./licenses/generate";
export { isGenerated, type Meta } from "./meta";
export { generateWorkflow } from "./workflows/generate";

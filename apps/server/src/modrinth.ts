import {
  AuthFeature,
  GenericModrinthClient,
  type AuthConfig,
} from "@modrinth/api-client";
import { source } from "@pssbletrngle/github-meta-generator/meta";
import config from "./config";

export function createModrinthClient() {
  const { token } = config.modrinth;
  if (!token) return undefined;

  return new GenericModrinthClient({
    features: [new AuthFeature({ token } as AuthConfig)],
    userAgent: source,
  });
}

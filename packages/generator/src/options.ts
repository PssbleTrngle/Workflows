import type { Logger } from "@pssbletrngle/workflows-types/logger";

export type Options = {
  logger: Logger;
};

export const defaultOptions: Options = {
  logger: console,
};

import {
  connectDatabase,
  NotifierRepository,
  RepositoryRepository,
} from "@pssbletrngle/workflows-persistance";
import logger from "../logger";
import { eventDispatcher } from "./events";

await connectDatabase(logger);

export const Respositories = new RepositoryRepository(logger, eventDispatcher);
export const Notifiers = new NotifierRepository(logger, eventDispatcher);

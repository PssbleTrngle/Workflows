type Log = (message: string, context?: unknown) => void;

export type Options = {
  logger: {
    info: Log;
    error: Log;
    warn: Log;
    debug: Log;
  };
};

export const defaultOptions: Options = {
  logger: console,
};

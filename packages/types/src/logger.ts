type Log = (message: string, context?: unknown) => void;

export type Logger = {
  info: Log;
  error: Log;
  warn: Log;
  debug: Log;
};

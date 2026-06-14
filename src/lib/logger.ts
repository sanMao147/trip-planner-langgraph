type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function getConfiguredLevel(): LogLevel {
  const env = (process.env.LOG_LEVEL || "").toLowerCase() as LogLevel;
  if (env in LOG_LEVELS) return env;
  // 生产环境默认仅输出 error，开发环境输出 info+
  return process.env.NODE_ENV === "production" ? "error" : "info";
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[getConfiguredLevel()];
}

export interface Logger {
  debug: (message: string, ...args: unknown[]) => void;
  info: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
}

export function createLogger(module: string): Logger {
  const prefix = `[${module}]`;

  return {
    debug(message, ...args) {
      if (shouldLog("debug")) console.debug(`${prefix} ${message}`, ...args);
    },
    info(message, ...args) {
      if (shouldLog("info")) console.info(`${prefix} ${message}`, ...args);
    },
    warn(message, ...args) {
      if (shouldLog("warn")) console.warn(`${prefix} ${message}`, ...args);
    },
    error(message, ...args) {
      if (shouldLog("error")) console.error(`${prefix} ${message}`, ...args);
    },
  };
}

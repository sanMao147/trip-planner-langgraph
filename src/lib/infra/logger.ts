/**
 * 日志级别类型定义
 * debug: 详细调试信息，仅开发环境使用
 * info: 一般信息，记录关键业务流程
 * warn: 警告信息，提示潜在问题
 * error: 错误信息，记录异常和故障
 */
type LogLevel = "debug" | "info" | "warn" | "error";

/**
 * 日志级别优先级映射
 * 数值越小优先级越高（越详细）
 */
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * 获取配置的日志级别
 * 
 * 从环境变量 LOG_LEVEL 读取配置，如果未设置则根据 NODE_ENV 决定：
 * - 生产环境（production）：默认 error 级别
 * - 开发环境：默认 info 级别
 * 
 * @returns 配置的日志级别
 */
function getConfiguredLevel(): LogLevel {
  const env = (process.env.LOG_LEVEL || "").toLowerCase() as LogLevel;
  if (env in LOG_LEVELS) return env;
  
  return process.env.NODE_ENV === "production" ? "error" : "info";
}

/**
 * 判断是否应该输出指定级别的日志
 * 
 * @param level 日志级别
 * @returns 是否应该输出
 */
function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[getConfiguredLevel()];
}

/**
 * 日志记录器接口
 * 定义四种日志级别的方法
 */
export interface Logger {
  debug: (message: string, ...args: unknown[]) => void;
  info: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
}

/**
 * 创建日志记录器实例
 * 
 * 根据模块名称创建带有前缀的日志记录器，方便区分不同模块的日志。
 * 
 * @param module 模块名称
 * @returns Logger 实例
 */
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

import { createLogger } from "@/lib/infra/logger";

const logger = createLogger("LangSmith");

/**
 * 判断是否启用 LangSmith 追踪
 *
 * 当 LANGCHAIN_TRACING_V2 环境变量为 "true" 时启用。
 *
 * @returns 是否启用 LangSmith
 */
export function isLangSmithEnabled(): boolean {
  return process.env.LANGCHAIN_TRACING_V2 === "true";
}

/**
 * 获取 LangSmith 回调列表
 *
 * 返回用于注入 LLM 的回调数组。
 * 未启用时返回空数组，不影响正常执行。
 * LangSmith 通过环境变量自动配置（LANGCHAIN_API_KEY、LANGCHAIN_PROJECT、LANGCHAIN_ENDPOINT），
 * LangChain SDK 内置的 tracing 会在这些环境变量存在时自动上报。
 *
 * @returns 回调数组（未启用时为空数组）
 */
export function getLangSmithCallbacks(): unknown[] {
  if (!isLangSmithEnabled()) {
    return [];
  }

  if (!process.env.LANGCHAIN_API_KEY) {
    logger.warn("LANGCHAIN_TRACING_V2=true 但 LANGCHAIN_API_KEY 未设置，跳过追踪");
    return [];
  }

  // LangChain SDK 在设置了 LANGCHAIN_TRACING_V2=true 和 LANGCHAIN_API_KEY 后
  // 会自动启用内置 tracing，无需手动注入 CallbackHandler。
  // 返回空数组即可，tracing 通过环境变量全局生效。
  logger.info(`LangSmith 追踪已启用，项目: ${process.env.LANGCHAIN_PROJECT || "default"}`);
  return [];
}

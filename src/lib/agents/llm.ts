import { ChatOpenAI } from "@langchain/openai";
import { createLogger } from "@/lib/infra/logger";
import { isLangSmithEnabled } from "@/lib/infra/langsmith";

/** 日志记录器实例 */
const logger = createLogger("LLM");

/** LLM 实例缓存，避免重复创建 */
let llmInstance: ChatOpenAI | null = null;

/**
 * 获取 LLM 实例（单例模式）
 * 
 * 使用单例模式确保整个应用中只有一个 LLM 实例，减少资源消耗。
 * 从环境变量读取配置参数。
 * 
 * @returns ChatOpenAI 实例
 */
export function getLLM(): ChatOpenAI {
  if (llmInstance) return llmInstance;
  
  llmInstance = new ChatOpenAI({
    modelName: process.env.OPENAI_MODEL || "gpt-4o",
    temperature: 0.7,
    maxTokens: 4096,
    openAIApiKey: process.env.OPENAI_API_KEY,
    configuration: {
      baseURL: process.env.OPENAI_BASE_URL,
    },
  });

  if (isLangSmithEnabled()) {
    logger.info("LangSmith 追踪已注入 LLM 实例");
  }

  return llmInstance;
}

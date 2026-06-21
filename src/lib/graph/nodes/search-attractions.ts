import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { getMCPTools, findTool } from "@/lib/infra/mcp-client";
import { ATTRACTION_AGENT_PROMPT } from "@/lib/agents/prompts";
import { getLLM } from "@/lib/agents/llm";
import { createLogger } from "@/lib/infra/logger";
import { safeJSONParse } from "../utils";
import type { TripStateType } from "../state";
import type { Attraction } from "@/types";

/** 日志记录器实例 */
const logger = createLogger("TripGraph");

/**
 * 景点搜索节点
 * 
 * 调用高德 MCP 工具搜索目的地景点，并结合 LLM 生成结构化的景点列表。
 * 搜索逻辑：
 * 1. 获取 MCP 工具并调用关键词搜索
 * 2. 将 MCP 返回的原始数据拼入 LLM context
 * 3. 调用 LLM 生成符合 Attraction[] 格式的景点列表
 * 
 * @param state 当前状态
 * @returns 更新后的部分状态（包含景点列表）
 */
export async function searchAttractions(state: TripStateType): Promise<Partial<TripStateType>> {
  logger.info("search_attractions 开始");
  
  const request = state.tripRequest;
  if (!request) return { error: "缺少请求", stage: "error" };

  // 获取 MCP 工具并调用高德关键词搜索
  const mcpTools = await getMCPTools();
  const keywordTool = findTool(mcpTools, "keywords_search") || findTool(mcpTools, "keyword");

  // 收集 MCP 原始结果用于注入 LLM context
  const mcpContextParts: string[] = [];

  if (keywordTool) {
    const preferences = request.preferences.length > 0 ? request.preferences.join(" ") : "景点";
    const result = await keywordTool.invoke({
      keywords: `${request.city} ${preferences} 热门景点`,
      city: request.city,
    });
    const resultStr = typeof result === "string" ? result : JSON.stringify(result);
    logger.debug("MCP 关键词搜索结果:", resultStr.substring(0, 500));
    mcpContextParts.push(`## 高德地图 POI 搜索原始数据\n\`\`\`json\n${resultStr.substring(0, 3000)}\n\`\`\``);
  }

  const llm = getLLM();
  const prompt = ATTRACTION_AGENT_PROMPT(request);

  // 将 MCP 真实数据拼入 LLM context
  const mcpContext = mcpContextParts.length > 0 ? mcpContextParts.join("\n\n") + "\n\n---\n\n" : "";
  const response = await llm.invoke([
    new SystemMessage("你是一个专业旅行规划助手，只输出 JSON 格式数据。请基于提供的高德地图真实 POI 数据生成景点列表。"),
    new HumanMessage(`${mcpContext}${prompt}`),
  ]);

  const text = typeof response.content === "string" ? response.content : JSON.stringify(response.content);
  const attractions = safeJSONParse<Attraction[]>(text, []);
  
  logger.info(`search_attractions 完成，共 ${attractions.length} 个景点`);

  return {
    attractions,
    messages: [`✅ 景点搜索完成，找到 ${attractions.length} 个景点`],
    stage: "attractions_done",
  };
}

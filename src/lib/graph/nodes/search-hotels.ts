import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { getMCPTools, findTool } from "@/lib/infra/mcp-client";
import { HOTEL_AGENT_PROMPT } from "@/lib/agents/prompts";
import { getLLM } from "@/lib/agents/llm";
import { createLogger } from "@/lib/infra/logger";
import { safeJSONParse } from "../utils";
import type { TripStateType } from "../state";
import type { Hotel } from "@/types";

/** 日志记录器实例 */
const logger = createLogger("TripGraph");

/**
 * 酒店搜索节点
 * 
 * 调用高德 MCP 工具搜索符合用户住宿偏好的酒店，并结合 LLM 生成结构化的酒店列表。
 * 
 * @param state 当前状态
 * @returns 更新后的部分状态（包含酒店列表）
 */
export async function searchHotels(state: TripStateType): Promise<Partial<TripStateType>> {
  logger.info("search_hotels 开始");
  
  const request = state.tripRequest;
  if (!request) return { error: "缺少请求", stage: "error" };

  const mcpTools = await getMCPTools();
  const keywordTool = findTool(mcpTools, "keywords_search") || findTool(mcpTools, "keyword");

  const mcpContextParts: string[] = [];

  if (keywordTool) {
    const result = await keywordTool.invoke({
      keywords: `${request.city} ${request.accommodation} 酒店`,
      city: request.city,
    });
    const resultStr = typeof result === "string" ? result : JSON.stringify(result);
    logger.debug("MCP 酒店搜索结果:", resultStr.substring(0, 500));
    mcpContextParts.push(`## 高德地图酒店搜索原始数据\n\`\`\`json\n${resultStr.substring(0, 3000)}\n\`\`\``);
  }

  const llm = getLLM();
  const prompt = HOTEL_AGENT_PROMPT(request);

  const mcpContext = mcpContextParts.length > 0 ? mcpContextParts.join("\n\n") + "\n\n---\n\n" : "";
  const response = await llm.invoke([
    new SystemMessage("你是一个专业酒店推荐助手，只输出 JSON 格式数据。请基于提供的高德真实酒店数据生成推荐。"),
    new HumanMessage(`${mcpContext}${prompt}`),
  ]);

  const text = typeof response.content === "string" ? response.content : JSON.stringify(response.content);
  const hotels = safeJSONParse<Hotel[]>(text, []);
  
  logger.info(`search_hotels 完成，共 ${hotels.length} 个酒店`);

  return {
    hotels,
    messages: [`✅ 酒店搜索完成，找到 ${hotels.length} 个酒店`],
    stage: "hotels_done",
  };
}

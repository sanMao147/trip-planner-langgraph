import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { getMCPTools, findTool } from "@/lib/infra/mcp-client";
import { WEATHER_AGENT_PROMPT } from "@/lib/agents/prompts";
import { getLLM } from "@/lib/agents/llm";
import { createLogger } from "@/lib/infra/logger";
import { safeJSONParse } from "../utils";
import type { TripStateType } from "../state";
import type { WeatherInfo } from "@/types";

/** 日志记录器实例 */
const logger = createLogger("TripGraph");

/**
 * 天气查询节点
 * 
 * 调用高德 MCP 天气工具获取目的地天气预报，并结合 LLM 生成结构化的天气信息。
 * 
 * @param state 当前状态
 * @returns 更新后的部分状态（包含天气信息）
 */
export async function queryWeather(state: TripStateType): Promise<Partial<TripStateType>> {
  logger.info("query_weather 开始");
  
  const request = state.tripRequest;
  if (!request) return { error: "缺少请求", stage: "error" };

  const mcpTools = await getMCPTools();
  const weatherTool = findTool(mcpTools, "weather");

  const mcpContextParts: string[] = [];

  if (weatherTool) {
    const result = await weatherTool.invoke({ city: request.city });
    const resultStr = typeof result === "string" ? result : JSON.stringify(result);
    logger.debug("MCP 天气查询结果:", resultStr.substring(0, 500));
    mcpContextParts.push(`## 高德天气 API 原始数据\n\`\`\`json\n${resultStr.substring(0, 3000)}\n\`\`\``);
  }

  const llm = getLLM();
  const prompt = WEATHER_AGENT_PROMPT(request);

  const mcpContext = mcpContextParts.length > 0 ? mcpContextParts.join("\n\n") + "\n\n---\n\n" : "";
  const response = await llm.invoke([
    new SystemMessage("你是一个天气预报助手，只输出 JSON 格式数据。请基于提供的高德天气真实数据生成天气预报。"),
    new HumanMessage(`${mcpContext}${prompt}`),
  ]);

  const text = typeof response.content === "string" ? response.content : JSON.stringify(response.content);
  const weather = safeJSONParse<WeatherInfo[]>(text, []);
  
  logger.info(`query_weather 完成，共 ${weather.length} 天天气`);

  return {
    weather,
    messages: [`✅ 天气查询完成，获取 ${weather.length} 天天气数据`],
    stage: "weather_done",
  };
}

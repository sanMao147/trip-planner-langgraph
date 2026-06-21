import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { PLANNER_AGENT_PROMPT, FALLBACK_PLANNER_PROMPT } from "@/lib/agents/prompts";
import { getLLM } from "@/lib/agents/llm";
import { createLogger } from "@/lib/infra/logger";
import { safeJSONParse, generateHardcodedPlan } from "../utils";
import type { TripStateType } from "../state";
import type { TripPlan } from "@/types";

/** 日志记录器实例 */
const logger = createLogger("TripGraph");

/**
 * 行程规划节点
 * 
 * 整合景点、酒店、天气信息，调用 LLM 生成完整的旅行计划。
 * 采用多级降级策略：
 * 1. 主 Planner：使用收集到的真实数据生成计划
 * 2. Fallback Planner：如果主 Planner 失败，使用简化提示词重新生成
 * 3. 硬编码降级：如果 LLM 完全失败，使用硬编码方案生成基础计划
 * 
 * @param state 当前状态
 * @returns 更新后的部分状态（包含完整旅行计划）
 */
export async function planItinerary(state: TripStateType): Promise<Partial<TripStateType>> {
  logger.info("plan_itinerary 开始");
  
  const request = state.tripRequest;
  if (!request) return { error: "缺少请求", stage: "error" };

  const llm = getLLM();
  const prompt = PLANNER_AGENT_PROMPT(
    request,
    state.attractions.length,
    state.hotels.length,
    state.weather.length
  );

  const contextParts: string[] = [];

  if (state.attractions.length > 0) {
    contextParts.push(`## 已识别的景点\n${JSON.stringify(state.attractions, null, 2)}`);
  }
  if (state.hotels.length > 0) {
    contextParts.push(`## 已筛选的酒店\n${JSON.stringify(state.hotels, null, 2)}`);
  }
  if (state.weather.length > 0) {
    contextParts.push(`## 天气信息\n${JSON.stringify(state.weather, null, 2)}`);
  }

  const contextStr = contextParts.join("\n\n");

  const response = await llm.invoke([
    new SystemMessage("你是一个资深旅行规划师，只输出 JSON 格式数据。请基于提供的景点、酒店和天气数据生成完整行程。"),
    new HumanMessage(`${contextStr}\n\n${prompt}`),
  ]);

  const text = typeof response.content === "string" ? response.content : JSON.stringify(response.content);
  // safeJSONParse 返回 fallback 作为失败兜底；用空对象作为 fallback 后再校验 days 字段
  const parsed = safeJSONParse<TripPlan>(text, {} as TripPlan, ["city", "days"]);
  let tripPlan: TripPlan | null = (parsed.days && parsed.days.length > 0) ? parsed : null;

  // 容错：LLM 输出失败则用 Fallback
  if (!tripPlan || !tripPlan.days || tripPlan.days.length === 0) {
    logger.warn("Planner 输出无效，使用 Fallback Planner");
    const fallbackResponse = await llm.invoke([
      new SystemMessage("你是一个旅行规划助手，只输出 JSON 格式数据。"),
      new HumanMessage(FALLBACK_PLANNER_PROMPT(request)),
    ]);
    const fallbackText =
      typeof fallbackResponse.content === "string"
        ? fallbackResponse.content
        : JSON.stringify(fallbackResponse.content);
    const fallbackParsed = safeJSONParse<TripPlan>(fallbackText, {} as TripPlan, ["city", "days"]);
    tripPlan = (fallbackParsed.days && fallbackParsed.days.length > 0) ? fallbackParsed : null;
  }

  // 最终降级：硬编码
  if (!tripPlan || !tripPlan.days || tripPlan.days.length === 0) {
    logger.warn("使用硬编码降级方案");
    tripPlan = generateHardcodedPlan(request, state.weather);
  }

  // generateHardcodedPlan 保证返回有效计划，此处防御性校验以满足类型收窄
  if (!tripPlan) {
    return { error: "行程规划失败", stage: "error" };
  }

  logger.info(`plan_itinerary 完成，共 ${tripPlan.days.length} 天行程`);

  return {
    tripPlan,
    messages: [`✅ 行程规划完成，共 ${tripPlan.days.length} 天行程`],
    stage: "planning_done",
  };
}

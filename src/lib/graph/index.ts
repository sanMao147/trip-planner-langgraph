import type { TripRequest, TripPlan } from "@/types";
import { createLogger } from "@/lib/infra/logger";
import { getGraph, INITIAL_STATE_TEMPLATE } from "./graph";

export type { TripStateType } from "./state";

/** 日志记录器实例 */
const logger = createLogger("TripGraph");

// ==================== 便捷运行函数 ====================

/**
 * 执行旅行规划的便捷函数
 * 
 * 封装完整的工作流执行逻辑，对外提供简洁的 API。
 * 
 * @param request 旅行请求参数
 * @returns 生成的旅行计划
 * @throws 如果执行失败或超时，抛出错误
 */
export async function runTripPlan(request: TripRequest): Promise<TripPlan> {
  logger.info(`开始规划旅行: ${request.city}, ${request.travelDays}天`);

  const graph = getGraph();

  const initialState = {
    ...INITIAL_STATE_TEMPLATE,
    tripRequest: request,
  };

  logger.info(`LangSmith run_name: trip-plan-${request.city}`, { city: request.city, travelDays: request.travelDays });

  const result = await graph.invoke(initialState);

  if (result.error) {
    throw new Error(result.error);
  }

  if (!result.tripPlan) {
    throw new Error("旅行计划生成失败");
  }

  return result.tripPlan;
}

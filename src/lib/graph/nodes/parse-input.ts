import { createLogger } from "@/lib/infra/logger";
import type { TripStateType } from "../state";

/** 日志记录器实例 */
const logger = createLogger("TripGraph");

/**
 * 输入解析节点
 * 
 * 验证旅行请求参数是否存在，作为工作流的入口节点。
 * 如果请求参数为空，设置错误状态并终止执行。
 * 
 * @param state 当前状态
 * @returns 更新后的部分状态
 */
export async function parseInput(state: TripStateType): Promise<Partial<TripStateType>> {
  logger.info("parse_input 开始");
  
  const request = state.tripRequest;
  if (!request) {
    return { error: "缺少旅行请求参数", stage: "error" };
  }
  
  return {
    messages: ["✅ 旅行请求解析完成"],
    stage: "parsed",
  };
}

import { createLogger } from "@/lib/infra/logger";
import type { TripStateType } from "../state";

/** 日志记录器实例 */
const logger = createLogger("TripGraph");

/**
 * 输出格式化节点
 * 
 * 完成旅行计划的最后处理，主要功能：
 * 1. 如果预算字段为空，自动计算预算明细
 * 2. 设置完成状态
 * 
 * @param state 当前状态
 * @returns 更新后的部分状态（包含格式化后的计划）
 */
export async function formatOutput(state: TripStateType): Promise<Partial<TripStateType>> {
  logger.info("format_output 开始");
  
  const tripPlan = state.tripPlan;

  if (!tripPlan) {
    return { error: "行程规划失败", stage: "error" };
  }

  // 确保预算字段存在
  if (!tripPlan.budget) {
    let totalAttractions = 0;
    let totalHotels = 0;
    let totalMeals = 0;

    for (const day of tripPlan.days) {
      totalAttractions += day.attractions.reduce((sum, a) => sum + (a.ticketPrice || 0), 0);
      totalMeals += day.meals.reduce((sum, m) => sum + (m.estimatedCost || 0), 0);
      if (day.hotel?.estimatedCost) {
        totalHotels += day.hotel.estimatedCost;
      }
    }

    const computedBudget = {
      totalAttractions,
      totalHotels,
      totalMeals,
      totalTransportation: tripPlan.days.length * 50,
      total: totalAttractions + totalHotels + totalMeals + tripPlan.days.length * 50,
    };

    // 不可变更新：返回新的 tripPlan 对象，避免直接修改输入状态
    const updatedPlan = { ...tripPlan, budget: computedBudget };

    return {
      tripPlan: updatedPlan,
      messages: ["✅ 输出格式化完成"],
      stage: "completed",
    };
  }

  // 预算已存在，返回原对象无需克隆
  return {
    tripPlan,
    messages: ["✅ 输出格式化完成"],
    stage: "completed",
  };
}

import { NextRequest, NextResponse } from "next/server";
import { runTripPlan } from "@/lib/graph";
import { saveTripPlan } from "@/lib/infra/store";
import { generateSessionId } from "@/lib/utils";
import { tripRequestSchema } from "@/types";
import { createLogger } from "@/lib/infra/logger";
import { closeMCPClient } from "@/lib/infra/mcp-client";
import type { ApiResponse } from "@/types";

/** Next.js Serverless 函数最大执行时长（秒），与客户端超时保持一致 */
export const maxDuration = 120;

/** 日志记录器实例 */
const logger = createLogger("API:plan");

/** 请求超时时间：120秒 */
const PLAN_TIMEOUT_MS = 120_000;

/**
 * POST /api/trip/plan - 创建旅行计划
 * 
 * 接收用户的旅行请求参数，调用 LangGraph 工作流生成完整的旅行计划。
 * 
 * 请求体结构：
 * {
 *   city: string,           // 目的地城市
 *   startDate: string,      // 出发日期 (YYYY-MM-DD)
 *   endDate: string,        // 结束日期 (YYYY-MM-DD)
 *   travelDays: number,     // 旅行天数
 *   transportation: string, // 交通方式
 *   accommodation: string,  // 住宿偏好
 *   preferences: string[],  // 旅行偏好列表
 *   freeTextInput?: string  // 额外要求（可选）
 * }
 * 
 * @param request NextRequest 对象
 * @returns ApiResponse 包含 sessionId 和旅行计划
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  logger.info("POST /api/trip/plan 收到请求");

  // 解析请求体
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "请求体格式无效，需要 JSON" } as ApiResponse<null>,
      { status: 400 }
    );
  }

  // Zod 参数校验
  const parsed = tripRequestSchema.safeParse(body);
  if (!parsed.success) {
    const response: ApiResponse<null> = {
      success: false,
      error: "请求参数验证失败",
      message: parsed.error.issues.map((e) => e.message).join("; "),
    };
    return NextResponse.json(response, { status: 400 });
  }

  const tripRequest = parsed.data;
  const sessionId = generateSessionId();

  // 超时控制：120秒后若未完成则返回 504
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("TIMEOUT")), PLAN_TIMEOUT_MS)
  );

  try {
    // 并行执行：旅行规划和超时检测
    const tripPlan = await Promise.race([runTripPlan(tripRequest), timeoutPromise]);
    
    // 保存到内存存储
    saveTripPlan(sessionId, tripPlan);

    const elapsed = Date.now() - startTime;
    logger.info(`旅行计划生成完成，sessionId=${sessionId}，耗时 ${elapsed}ms`);

    logger.info(`规划完成 token统计`, {
      sessionId,
      city: tripPlan.city,
      days: tripPlan.days.length,
      elapsed: `${elapsed}ms`,
    });

    const response: ApiResponse<{ sessionId: string; plan: typeof tripPlan }> = {
      success: true,
      data: { sessionId, plan: tripPlan },
    };

    return NextResponse.json(response);
  } catch (error) {
    const elapsed = Date.now() - startTime;

    // 处理超时错误
    if (error instanceof Error && error.message === "TIMEOUT") {
      logger.error(`旅行计划生成超时，耗时 ${elapsed}ms`);
      return NextResponse.json(
        { success: false, error: "规划超时，请减少旅行天数后重试" } as ApiResponse<null>,
        { status: 504 }
      );
    }

    // 处理其他错误
    logger.error("旅行计划生成失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: "旅行计划生成失败，请稍后重试",
        message: error instanceof Error ? error.message : "未知错误",
      } as ApiResponse<null>,
      { status: 500 }
    );
  } finally {
    // 清理 MCP 客户端连接，防止 Serverless 环境下连接泄漏
    await closeMCPClient();
  }
}
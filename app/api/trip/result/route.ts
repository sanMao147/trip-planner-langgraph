import { NextRequest, NextResponse } from "next/server";
import { getTripPlan } from "@/lib/store";
import { createLogger } from "@/lib/logger";
import type { ApiResponse, TripPlan } from "@/types";

/** 日志记录器实例 */
const logger = createLogger("API:result");

/**
 * GET /api/trip/result - 获取旅行计划
 * 
 * 根据 sessionId 从内存存储中获取之前生成的旅行计划。
 * 
 * 查询参数：
 * - sessionId: string - 会话 ID
 * 
 * @param request NextRequest 对象
 * @returns ApiResponse 包含旅行计划数据
 */
export async function GET(request: NextRequest) {
  // 从 URL 查询参数中获取 sessionId
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");

  // 验证 sessionId 是否存在
  if (!sessionId) {
    return NextResponse.json(
      { success: false, error: "缺少 sessionId 参数" } as ApiResponse<null>,
      { status: 400 }
    );
  }

  // 从存储中获取旅行计划
  const tripPlan = getTripPlan(sessionId);

  // 如果未找到旅行计划
  if (!tripPlan) {
    logger.warn(`会话 ${sessionId} 未找到`);
    return NextResponse.json(
      { success: false, error: "未找到对应的旅行计划，可能已过期" } as ApiResponse<null>,
      { status: 404 }
    );
  }

  // 返回成功响应
  return NextResponse.json({
    success: true,
    data: tripPlan,
  } as ApiResponse<TripPlan>);
}
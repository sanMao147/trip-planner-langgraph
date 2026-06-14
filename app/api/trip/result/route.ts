import { NextRequest, NextResponse } from "next/server";
import { getTripPlan } from "@/lib/store";
import { createLogger } from "@/lib/logger";
import type { ApiResponse, TripPlan } from "@/types";

const logger = createLogger("API:result");

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json(
      { success: false, error: "缺少 sessionId 参数" } as ApiResponse<null>,
      { status: 400 }
    );
  }

  const tripPlan = getTripPlan(sessionId);

  if (!tripPlan) {
    logger.warn(`会话 ${sessionId} 未找到`);
    return NextResponse.json(
      { success: false, error: "未找到对应的旅行计划，可能已过期" } as ApiResponse<null>,
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: tripPlan,
  } as ApiResponse<TripPlan>);
}

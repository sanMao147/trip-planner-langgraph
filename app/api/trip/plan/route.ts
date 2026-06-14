import { NextRequest, NextResponse } from "next/server";
import { runTripPlan } from "@/lib/graph/trip-graph";
import { saveTripPlan } from "@/lib/store";
import { generateSessionId } from "@/lib/utils";
import { tripRequestSchema } from "@/types";
import { createLogger } from "@/lib/logger";
import { closeMCPClient } from "@/lib/mcp-client";
import type { ApiResponse } from "@/types";

const logger = createLogger("API:plan");
const PLAN_TIMEOUT_MS = 120_000; // 120 秒超时

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

  // Zod 校验
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

  // 超时控制：120 秒后若未完成则返回 504
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("TIMEOUT")), PLAN_TIMEOUT_MS)
  );

  try {
    const tripPlan = await Promise.race([runTripPlan(tripRequest), timeoutPromise]);
    saveTripPlan(sessionId, tripPlan);

    const elapsed = Date.now() - startTime;
    logger.info(`旅行计划生成完成，sessionId=${sessionId}，耗时 ${elapsed}ms`);

    const response: ApiResponse<{ sessionId: string; plan: typeof tripPlan }> = {
      success: true,
      data: { sessionId, plan: tripPlan },
    };

    return NextResponse.json(response);
  } catch (error) {
    const elapsed = Date.now() - startTime;

    if (error instanceof Error && error.message === "TIMEOUT") {
      logger.error(`旅行计划生成超时，耗时 ${elapsed}ms`);
      return NextResponse.json(
        { success: false, error: "规划超时，请减少旅行天数后重试" } as ApiResponse<null>,
        { status: 504 }
      );
    }

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

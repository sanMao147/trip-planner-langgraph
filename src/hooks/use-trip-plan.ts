"use client";

import useSWR from "swr";
import type { TripPlan, ApiResponse } from "@/types";

/**
 * 数据获取函数
 * 
 * 通过 sessionId 从 API 获取旅行计划数据。
 * 
 * @param url API 请求地址
 * @returns ApiResponse<TripPlan>
 */
const fetcher = (url: string): Promise<ApiResponse<TripPlan>> =>
  fetch(url).then((res) => res.json());

/**
 * 旅行计划数据获取 Hook
 * 
 * 使用 SWR 管理旅行计划数据的获取和缓存。
 * 
 * @param sessionId 会话ID，为 null 时不发起请求
 * @returns 包含旅行计划、加载状态、错误状态等信息的对象
 */
export function useTripPlan(sessionId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<ApiResponse<TripPlan>>(
    // 只有当 sessionId 存在时才发起请求
    sessionId ? `/api/trip/result?sessionId=${sessionId}` : null,
    fetcher,
    {
      // 失去焦点时不重新验证
      revalidateOnFocus: false,
      // 错误时重试
      shouldRetryOnError: true,
      // 重试次数
      errorRetryCount: 3,
    }
  );

  return {
    /** 旅行计划数据（如果请求成功） */
    tripPlan: data?.success ? data.data : null,
    /** 是否正在加载 */
    isLoading,
    /** 是否发生错误 */
    isError: !!error || (data && !data.success),
    /** 错误信息 */
    error: error || (data && !data.success ? data.error : null),
    /** 重新获取数据的方法 */
    mutate,
  };
}
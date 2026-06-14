"use client";

import useSWR from "swr";
import type { TripPlan, ApiResponse } from "@/types";

const fetcher = (url: string): Promise<ApiResponse<TripPlan>> =>
  fetch(url).then((res) => res.json());

export function useTripPlan(sessionId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<ApiResponse<TripPlan>>(
    sessionId ? `/api/trip/result?sessionId=${sessionId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      shouldRetryOnError: true,
      errorRetryCount: 3,
    }
  );

  return {
    tripPlan: data?.success ? data.data : null,
    isLoading,
    isError: !!error || (data && !data.success),
    error: error || (data && !data.success ? data.error : null),
    mutate,
  };
}

"use client";

import { useEffect } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A1628] px-4">
      <div className="glass-card rounded-2xl p-8 sm:p-10 max-w-md w-full text-center">
        <div className="relative inline-flex mb-6">
          <AlertCircle className="w-16 h-16 text-[#FF8C42] relative" />
          <div className="absolute inset-0 bg-[#FF8C42]/20 blur-xl rounded-full" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">出错了</h2>
        <p className="text-[#CBD5E1] text-sm mb-8 break-words">
          {error.message || "发生了一些意外错误，请稍后重试。"}
        </p>
        <button
          onClick={() => unstable_retry()}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#FF8C42] text-white font-medium hover:bg-[#FF6B35] transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          重试
        </button>
      </div>
    </div>
  );
}

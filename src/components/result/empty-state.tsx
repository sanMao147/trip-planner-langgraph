import Link from "next/link";
import { MapPinOff, ArrowLeft } from "lucide-react";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-20 h-20 rounded-full bg-[#1E3050]/50 flex items-center justify-center mb-6">
        <MapPinOff className="w-10 h-10 text-[#94A3B8]" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">暂无旅行计划数据</h2>
      <p className="text-[#94A3B8] max-w-md mb-8">
        未找到旅行计划，可能链接已过期。请返回首页重新创建您的旅行规划。
      </p>
      <Link
        href="/"
        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-sunset-gradient text-white font-medium hover:shadow-lg hover:shadow-[#FF6B35]/25 transition-all"
      >
        <ArrowLeft className="w-4 h-4" />
        返回首页创建行程
      </Link>
    </div>
  );
}

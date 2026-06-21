import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A1628] px-4">
      <div className="glass-card rounded-2xl p-8 sm:p-10 max-w-md w-full text-center">
        <div className="relative inline-flex mb-6">
          <Compass className="w-16 h-16 text-[#FF8C42] relative" />
          <div className="absolute inset-0 bg-[#FF8C42]/20 blur-xl rounded-full" />
        </div>
        <h1 className="text-6xl font-bold gradient-text mb-4">404</h1>
        <h2 className="text-xl font-semibold text-white mb-3">页面未找到</h2>
        <p className="text-[#CBD5E1] text-sm mb-8">
          您访问的页面不存在或已被移除。
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#FF8C42] text-white font-medium hover:bg-[#FF6B35] transition-colors"
        >
          <Compass className="w-4 h-4" />
          返回首页
        </Link>
      </div>
    </div>
  );
}

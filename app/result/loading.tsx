import { LoadingSpinner } from "@/components/shared/loading-spinner";

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A1628]">
      <LoadingSpinner size={40} text="加载旅行计划中..." />
    </div>
  );
}

"use client";

import { useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin } from "lucide-react";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ResultTabs } from "@/components/result/result-tabs";
import { OverviewTab } from "@/components/result/overview-tab";
import { BudgetTab } from "@/components/result/budget-tab";
import { MapTab } from "@/components/result/map-tab";
import { ExportButtons } from "@/components/result/export-buttons";
import { EmptyState } from "@/components/result/empty-state";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { useTripPlan } from "@/hooks/use-trip-plan";
import { useExport } from "@/hooks/use-export";

function ResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("sessionId");
  const { tripPlan, isLoading, isError } = useTripPlan(sessionId);
  const { exportAsPNG, exportAsPDF } = useExport();
  const [exporting, setExporting] = useState(false);

  const [activeTab, setActiveTab] = useState("overview");
  const [selectedMapDay, setSelectedMapDay] = useState(0);

  const handleMapDayChange = useCallback((dayIndex: number) => {
    setSelectedMapDay(dayIndex);
    setActiveTab("map");
  }, []);

  const handleExportImage = useCallback(async () => {
    setExporting(true);
    await exportAsPNG("trip-plan-content", `trip-plan-${tripPlan?.city || "travel"}`);
    setExporting(false);
  }, [exportAsPNG, tripPlan]);

  const handleExportPDF = useCallback(async () => {
    setExporting(true);
    await exportAsPDF("trip-plan-content", `trip-plan-${tripPlan?.city || "travel"}`);
    setExporting(false);
  }, [exportAsPDF, tripPlan]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <LoadingSpinner size={32} text="加载旅行计划中..." />
      </div>
    );
  }

  if (isError || !tripPlan) {
    return <EmptyState />;
  }

  return (
    <>
      <div className="fixed top-16 left-0 right-0 z-40 glass border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/")}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#1E3050]/50 border border-white/10 text-[#CBD5E1] hover:text-white transition-all text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">返回首页</span>
              </button>
              <div className="flex items-center gap-2 text-white">
                <MapPin className="w-4 h-4 text-[#FF8C42]" />
                <span className="font-semibold">{tripPlan.city}</span>
                <span className="text-[#94A3B8] text-sm hidden sm:inline">
                  {tripPlan.days.length}天行程
                </span>
              </div>
            </div>

            <ExportButtons
              onExportImage={handleExportImage}
              onExportPDF={handleExportPDF}
              exporting={exporting}
            />
          </div>

          <div className="mt-3">
            <ResultTabs activeTab={activeTab} onTabChange={setActiveTab} />
          </div>
        </div>
      </div>

      <main className="pt-40 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            id="trip-plan-content"
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === "overview" && <OverviewTab plan={tripPlan} />}
            {activeTab === "budget" && tripPlan.budget && (
              <BudgetTab budget={tripPlan.budget} />
            )}
            {activeTab === "budget" && !tripPlan.budget && (
              <div className="text-center py-16 text-[#94A3B8]">
                暂无预算明细数据
              </div>
            )}
            {activeTab === "map" && (
              <MapTab plan={tripPlan} selectedDay={selectedMapDay} onDayChange={handleMapDayChange} />
            )}
          </motion.div>
        </div>
      </main>
    </>
  );
}

export default function ResultPage() {
  return (
    <>
      <Header />
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen">
            <LoadingSpinner size={32} text="加载中..." />
          </div>
        }
      >
        <ResultContent />
      </Suspense>
      <Footer />
    </>
  );
}

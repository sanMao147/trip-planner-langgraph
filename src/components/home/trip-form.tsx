"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Car,
  Building2,
  Heart,
  MessageSquare,
  Send,
  Sparkles,
} from "lucide-react";
import type { TripRequest } from "@/types";
import { ErrorAlert } from "@/components/home/error-alert";

const TRANSPORT_OPTIONS = ["公共交通", "自驾", "步行", "混合"] as const;
const ACCOMMODATION_OPTIONS = ["经济型酒店", "舒适型酒店", "豪华酒店", "民宿"] as const;
const PREFERENCE_OPTIONS = [
  { value: "历史文化", emoji: "🏛️" },
  { value: "自然风光", emoji: "🏔️" },
  { value: "美食", emoji: "🍜" },
  { value: "购物", emoji: "🛍️" },
  { value: "艺术", emoji: "🎨" },
  { value: "休闲", emoji: "🌴" },
  { value: "亲子", emoji: "👨‍👩‍👧" },
  { value: "摄影", emoji: "📸" },
];

const LOADING_MESSAGES = [
  "正在搜索目的地景点...",
  "查询当地天气信息...",
  "为您筛选合适酒店...",
  "AI 正在规划每日行程...",
  "整合旅行计划中...",
];

export function TripForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);

  const [formData, setFormData] = useState({
    city: "",
    startDate: "",
    endDate: "",
    travelDays: 1,
    transportation: "公共交通" as TripRequest["transportation"],
    accommodation: "舒适型酒店" as TripRequest["accommodation"],
    preferences: [] as string[],
    freeTextInput: "",
  });

  // Loading message carousel
  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setLoadingMsgIdx((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [loading]);

  const handleDateChange = (field: "startDate" | "endDate", value: string) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      if (updated.startDate && updated.endDate) {
        const start = new Date(updated.startDate);
        const end = new Date(updated.endDate);
        const diff = Math.ceil(
          (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (diff >= 0) {
          updated.travelDays = diff + 1;
        }
      }
      return updated;
    });
  };

  const togglePreference = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      preferences: prev.preferences.includes(value)
        ? prev.preferences.filter((p) => p !== value)
        : [...prev.preferences, value],
    }));
  };

  const handleSubmit = async () => {
    if (!formData.city || !formData.startDate || !formData.endDate) {
      setError("请填写目的地城市和出行日期");
      return;
    }

    setError("");
    setLoading(true);

    // 请求超时控制：120 秒（与服务端 maxDuration 保持一致）
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120_000);

    try {
      const response = await fetch("/api/trip/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        setError(
          response.status === 504
            ? "规划超时，请减少旅行天数后重试"
            : errorData?.message || `请求失败 (${response.status})`
        );
        return;
      }

      const data = await response.json();

      if (data.success && data.data?.sessionId) {
        router.push(`/result?sessionId=${data.data.sessionId}`);
      } else {
        setError(data.message || "生成旅行计划时发生错误，请稍后重试");
      }
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof DOMException && err.name === "AbortError") {
        setError("请求超时，请减少旅行天数后重试");
      } else if (err instanceof TypeError) {
        setError("网络连接失败，请检查网络后重试");
      } else {
        setError("发生未知错误，请稍后重试");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <motion.div
        className="flex flex-col items-center justify-center py-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="relative mb-8">
          <div className="w-24 h-24 rounded-full bg-sunset-gradient flex items-center justify-center animate-pulse-glow">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <div className="absolute inset-0 bg-sunset-gradient blur-2xl opacity-30 rounded-full animate-pulse" />
        </div>
        <AnimatePresence mode="wait">
          <motion.p
            key={loadingMsgIdx}
            className="text-lg text-[#CBD5E1] font-medium"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {LOADING_MESSAGES[loadingMsgIdx]}
          </motion.p>
        </AnimatePresence>
        <p className="text-[#94A3B8] text-sm mt-2">AI 正在为您生成个性化旅行计划</p>
      </motion.div>
    );
  }

  return (
    <section id="plan" className="relative py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            规划你的
            <span className="gradient-text">完美旅行</span>
          </h2>
          <p className="text-[#94A3B8]">填写以下信息，AI 将为您生成个性化旅行方案</p>
        </motion.div>

        {error && (
          <div className="mb-6">
            <ErrorAlert message={error} onRetry={() => setError("")} />
          </div>
        )}

        <motion.div
          className="glass rounded-2xl p-6 sm:p-8 space-y-8"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {/* Destination & Dates */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-4 h-4 text-[#FF8C42]" />
              <span className="text-white font-semibold text-sm">目的地与日期</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="sm:col-span-2 lg:col-span-1">
                <label className="block text-[#94A3B8] text-xs mb-1.5">目的地城市</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, city: e.target.value }))
                  }
                  placeholder="例如：北京、上海、成都"
                  className="travel-input"
                />
              </div>
              <div>
                <label className="block text-[#94A3B8] text-xs mb-1.5">开始日期</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleDateChange("startDate", e.target.value)}
                  className="travel-input [color-scheme:dark]"
                />
              </div>
              <div>
                <label className="block text-[#94A3B8] text-xs mb-1.5">结束日期</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleDateChange("endDate", e.target.value)}
                  className="travel-input [color-scheme:dark]"
                />
              </div>
              <div>
                <label className="block text-[#94A3B8] text-xs mb-1.5">旅行天数</label>
                <div className="travel-input flex items-center justify-center text-white font-semibold">
                  {formData.travelDays} 天
                </div>
              </div>
            </div>
          </div>

          {/* Transportation */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Car className="w-4 h-4 text-[#FF8C42]" />
              <span className="text-white font-semibold text-sm">交通方式</span>
            </div>
            <div className="flex flex-wrap gap-3">
              {TRANSPORT_OPTIONS.map((option) => (
                <button
                  key={option}
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, transportation: option }))
                  }
                  className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                    formData.transportation === option
                      ? "bg-[#FF8C42] text-white shadow-lg shadow-[#FF8C42]/25"
                      : "bg-[#1E3050]/50 text-[#CBD5E1] hover:bg-[#1E3050]/70 border border-white/5"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Accommodation */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-4 h-4 text-[#FF8C42]" />
              <span className="text-white font-semibold text-sm">住宿偏好</span>
            </div>
            <div className="flex flex-wrap gap-3">
              {ACCOMMODATION_OPTIONS.map((option) => (
                <button
                  key={option}
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, accommodation: option }))
                  }
                  className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                    formData.accommodation === option
                      ? "bg-[#FF8C42] text-white shadow-lg shadow-[#FF8C42]/25"
                      : "bg-[#1E3050]/50 text-[#CBD5E1] hover:bg-[#1E3050]/70 border border-white/5"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Travel Preferences */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-4 h-4 text-[#FF8C42]" />
              <span className="text-white font-semibold text-sm">旅行偏好（可多选）</span>
            </div>
            <div className="flex flex-wrap gap-3">
              {PREFERENCE_OPTIONS.map(({ value, emoji }) => {
                const selected = formData.preferences.includes(value);
                return (
                  <motion.button
                    key={value}
                    onClick={() => togglePreference(value)}
                    whileTap={{ scale: 0.95 }}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                      selected
                        ? "bg-sunset-gradient text-white shadow-lg"
                        : "bg-[#1E3050]/50 text-[#CBD5E1] hover:bg-[#1E3050]/70 border border-white/5"
                    }`}
                  >
                    <span className="mr-1.5">{emoji}</span>
                    {value}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Additional Requirements */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-4 h-4 text-[#FF8C42]" />
              <span className="text-white font-semibold text-sm">额外要求（可选）</span>
            </div>
            <textarea
              value={formData.freeTextInput}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, freeTextInput: e.target.value }))
              }
              placeholder="例如：希望多安排一些博物馆、需要无障碍设施..."
              rows={3}
              className="travel-input resize-none"
            />
          </div>

          {/* Submit Button */}
          <motion.button
            onClick={handleSubmit}
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 rounded-2xl bg-sunset-gradient text-white font-bold text-lg flex items-center justify-center gap-3 shadow-xl shadow-[#FF6B35]/25 hover:shadow-2xl hover:shadow-[#FF6B35]/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
            开始规划我的旅行
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}

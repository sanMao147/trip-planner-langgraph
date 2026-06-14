"use client";

import { TripPlan } from "@/types";
import { DayCard } from "./day-card";
import { motion } from "framer-motion";

interface OverviewTabProps {
  plan: TripPlan;
}

export function OverviewTab({ plan }: OverviewTabProps) {
  return (
    <motion.div
      className="space-y-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="glass-card rounded-2xl p-5 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-sunset-gradient flex items-center justify-center text-2xl flex-shrink-0">
            🌍
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{plan.city}</h2>
            <p className="text-[#94A3B8] text-sm mt-1">
              {plan.startDate} → {plan.endDate} · {plan.days.length} 天 {plan.days.length - 1} 晚
            </p>
          </div>
        </div>
        {plan.overallSuggestions && (
          <div className="mt-4 p-4 rounded-xl bg-[#FF8C42]/5 border border-[#FF8C42]/10">
            <p className="text-[#CBD5E1] text-sm">{plan.overallSuggestions}</p>
          </div>
        )}
      </div>

      {plan.days.map((day, i) => (
        <DayCard
          key={day.date}
          day={day}
          weather={plan.weatherInfo[i]}
          isLast={i === plan.days.length - 1}
        />
      ))}
    </motion.div>
  );
}

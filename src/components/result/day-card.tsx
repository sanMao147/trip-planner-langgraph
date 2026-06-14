"use client";

import { motion } from "framer-motion";
import { DayPlan, WeatherInfo } from "@/types";
import { AttractionCard } from "./attraction-card";
import { MealCard } from "./meal-card";
import { HotelCard } from "./hotel-card";
import { WeatherDisplay } from "./weather-display";
import { CalendarDays, Car, ChevronDown } from "lucide-react";
import { useState } from "react";

interface DayCardProps {
  day: DayPlan;
  weather?: WeatherInfo;
  isLast: boolean;
}

export function DayCard({ day, weather, isLast }: DayCardProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="relative pl-10">
      <div className="absolute left-0 top-0 bottom-0 flex flex-col items-center">
        <div className="w-8 h-8 rounded-full bg-sunset-gradient flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-[#FF6B35]/25 z-10">
          {day.dayIndex + 1}
        </div>
        {!isLast && (
          <div className="w-0.5 flex-1 bg-gradient-to-b from-[#FF8C42]/50 to-transparent mt-2" />
        )}
      </div>

      <motion.div
        className="glass-card rounded-2xl overflow-hidden mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: day.dayIndex * 0.1 }}
      >
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between p-5 hover:bg-white/[0.02] transition-colors"
        >
          <div className="flex items-center gap-3">
            <CalendarDays className="w-5 h-5 text-[#FF8C42]" />
            <div className="text-left">
              <h3 className="text-white font-bold text-lg">
                第 {day.dayIndex + 1} 天
              </h3>
              <p className="text-[#94A3B8] text-sm">{day.date}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-lg bg-[#1E3050]/50 text-[#94A3B8] text-xs flex items-center gap-1">
              <Car className="w-3 h-3" />
              {day.transportation}
            </span>
            <ChevronDown
              className={`w-5 h-5 text-[#94A3B8] transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
            />
          </div>
        </button>

        {expanded && (
          <div className="px-5 pb-5 space-y-4">
            {weather && <WeatherDisplay weather={weather} />}

            {day.description && (
              <p className="text-[#CBD5E1] text-sm">{day.description}</p>
            )}

            {day.attractions.length > 0 && (
              <div>
                <h4 className="text-[#CBD5E1] text-xs font-semibold uppercase tracking-wider mb-3">
                  景点安排
                </h4>
                <div className="space-y-3">
                  {day.attractions.map((attraction, i) => (
                    <AttractionCard
                      key={`${attraction.name}-${i}`}
                      attraction={attraction}
                      index={i}
                    />
                  ))}
                </div>
              </div>
            )}

            {day.hotel && (
              <div>
                <h4 className="text-[#CBD5E1] text-xs font-semibold uppercase tracking-wider mb-3">
                  推荐住宿
                </h4>
                <HotelCard hotel={day.hotel} />
              </div>
            )}

            {day.meals.length > 0 && (
              <div>
                <h4 className="text-[#CBD5E1] text-xs font-semibold uppercase tracking-wider mb-3">
                  餐饮推荐
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {day.meals.map((meal, i) => (
                    <MealCard key={`${meal.type}-${i}`} meal={meal} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}

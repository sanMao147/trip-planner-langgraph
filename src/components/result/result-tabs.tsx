"use client";

import { motion } from "framer-motion";
import { Calendar, DollarSign, Map } from "lucide-react";

interface ResultTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: "overview", label: "行程概览", icon: Calendar },
  { id: "budget", label: "预算明细", icon: DollarSign },
  { id: "map", label: "景点地图", icon: Map },
];

export function ResultTabs({ activeTab, onTabChange }: ResultTabsProps) {
  return (
    <div className="flex gap-2 p-1.5 rounded-2xl bg-[#1E3050]/50 border border-white/5">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
              isActive ? "text-white" : "text-[#94A3B8] hover:text-[#CBD5E1]"
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-[#FF8C42]/20 rounded-xl border border-[#FF8C42]/30"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <Icon className="w-4 h-4 relative z-10" />
            <span className="relative z-10">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

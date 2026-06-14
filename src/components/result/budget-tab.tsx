"use client";

import { Budget } from "@/types";
import { motion } from "framer-motion";
import {
  Ticket,
  Building2,
  Utensils,
  Bus,
  PiggyBank,
} from "lucide-react";

interface BudgetTabProps {
  budget: Budget;
}

export function BudgetTab({ budget }: BudgetTabProps) {
  const maxAmount = Math.max(
    budget.totalAttractions,
    budget.totalHotels,
    budget.totalMeals,
    budget.totalTransportation
  );

  const getBarWidth = (amount: number) =>
    maxAmount > 0 ? (amount / maxAmount) * 100 : 0;

  const items = [
    { label: "景点门票", amount: budget.totalAttractions, icon: Ticket, color: "from-[#FF8C42] to-[#FFA94D]" },
    { label: "酒店住宿", amount: budget.totalHotels, icon: Building2, color: "from-violet-500 to-purple-400" },
    { label: "餐饮费用", amount: budget.totalMeals, icon: Utensils, color: "from-emerald-500 to-teal-400" },
    { label: "交通费用", amount: budget.totalTransportation, icon: Bus, color: "from-sky-500 to-blue-400" },
  ];

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="glass-card rounded-2xl p-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <PiggyBank className="w-5 h-5 text-[#FF8C42]" />
          <span className="text-[#94A3B8] text-sm">预估总费用</span>
        </div>
        <div className="text-5xl font-extrabold gradient-text">¥{budget.total.toLocaleString()}</div>
        <p className="text-[#64748B] text-xs mt-2">
          {budget.totalHotels > 0 && `住宿 ¥${budget.totalHotels.toLocaleString()} · `}
          {budget.totalAttractions > 0 && `门票 ¥${budget.totalAttractions.toLocaleString()} · `}
          {budget.totalMeals > 0 && `餐饮 ¥${budget.totalMeals.toLocaleString()}`}
        </p>
      </div>

      <div className="space-y-4">
        {items.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.label}
              className="glass-card rounded-xl p-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#1E3050]/50 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-[#FF8C42]" />
                  </div>
                  <span className="text-white text-sm font-medium">{item.label}</span>
                </div>
                <span className="text-white text-lg font-bold">¥{item.amount.toLocaleString()}</span>
              </div>
              <div className="h-2 rounded-full bg-[#1E3050]/50 overflow-hidden">
                <motion.div
                  className={`h-full rounded-full bg-gradient-to-r ${item.color}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${getBarWidth(item.amount)}%` }}
                  transition={{ duration: 1, delay: i * 0.2, ease: "easeOut" }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

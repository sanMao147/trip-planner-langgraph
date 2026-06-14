import { Meal } from "@/types";
import { Coffee, Sun, Moon, Utensils } from "lucide-react";

interface MealCardProps {
  meal: Meal;
}

const mealIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  breakfast: Coffee,
  lunch: Sun,
  dinner: Moon,
  snack: Utensils,
};

const mealLabels: Record<string, string> = {
  breakfast: "早餐",
  lunch: "午餐",
  dinner: "晚餐",
  snack: "小吃",
};

export function MealCard({ meal }: MealCardProps) {
  const Icon = mealIcons[meal.type] || Utensils;

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-[#1E3050]/20 border border-white/5">
      <div className="w-8 h-8 rounded-lg bg-[#FF8C42]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-[#FF8C42]" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[#CBD5E1] text-xs font-medium">
            {mealLabels[meal.type] || meal.type}
          </span>
          {meal.estimatedCost && (
            <span className="text-[#FF8C42] text-xs">¥{meal.estimatedCost}</span>
          )}
        </div>
        <p className="text-white text-sm font-medium mt-0.5">{meal.name}</p>
        <p className="text-[#64748B] text-xs mt-0.5">{meal.description}</p>
      </div>
    </div>
  );
}

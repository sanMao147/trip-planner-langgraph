import { WeatherInfo } from "@/types";
import { Sun, Moon, Wind } from "lucide-react";

interface WeatherDisplayProps {
  weather: WeatherInfo;
}

export function WeatherDisplay({ weather }: WeatherDisplayProps) {
  return (
    <div className="flex items-center gap-4 p-3 rounded-xl bg-sky-500/5 border border-sky-500/10">
      <div className="flex items-center gap-2 min-w-[100px]">
        <Sun className="w-8 h-8 text-[#FFA94D]" />
        <div>
          <div className="text-white text-lg font-bold">{weather.dayTemp}°</div>
          <div className="text-[#64748B] text-xs">{weather.dayWeather}</div>
        </div>
      </div>
      <div className="w-px h-10 bg-white/5" />
      <div className="flex items-center gap-2">
        <Moon className="w-6 h-6 text-indigo-300" />
        <div>
          <div className="text-[#CBD5E1] text-sm font-medium">{weather.nightTemp}°</div>
          <div className="text-[#64748B] text-xs">{weather.nightWeather}</div>
        </div>
      </div>
      <div className="w-px h-10 bg-white/5" />
      <div className="flex items-center gap-2">
        <Wind className="w-5 h-5 text-[#94A3B8]" />
        <div>
          <div className="text-[#CBD5E1] text-sm">{weather.windDirection}</div>
          <div className="text-[#64748B] text-xs">{weather.windPower}</div>
        </div>
      </div>
    </div>
  );
}

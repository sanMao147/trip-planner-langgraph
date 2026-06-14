import { Attraction } from "@/types";
import { MapPin, Clock, Star, Ticket } from "lucide-react";

interface AttractionCardProps {
  attraction: Attraction;
  index: number;
}

export function AttractionCard({ attraction, index }: AttractionCardProps) {
  return (
    <div className="flex gap-4 p-4 rounded-xl bg-[#1E3050]/30 border border-white/5 hover:border-[#FF8C42]/20 transition-all duration-300 group">
      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-sunset-gradient flex items-center justify-center text-white font-bold text-sm shadow-lg">
        {index + 1}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-white font-semibold text-base truncate group-hover:text-[#FF8C42] transition-colors">
            {attraction.name}
          </h4>
          {attraction.rating && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <Star className="w-3.5 h-3.5 text-[#FFA94D] fill-[#FFA94D]" />
              <span className="text-[#FFA94D] text-sm font-medium">{attraction.rating}</span>
            </div>
          )}
        </div>

        <p className="text-[#94A3B8] text-sm mt-1 line-clamp-2">
          {attraction.description}
        </p>

        <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-[#64748B]">
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            <span>{attraction.address || "地址待确认"}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{attraction.visitDuration} 分钟</span>
          </div>
          {attraction.ticketPrice !== undefined && (
            <div className="flex items-center gap-1">
              <Ticket className="w-3 h-3" />
              <span>¥{attraction.ticketPrice}</span>
            </div>
          )}
          {attraction.category && (
            <span className="px-2 py-0.5 rounded-full bg-[#FF8C42]/10 text-[#FF8C42] text-xs">
              {attraction.category}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

import { Hotel } from "@/types";
import { Building2, MapPin, Star, Wallet } from "lucide-react";

interface HotelCardProps {
  hotel: Hotel;
}

export function HotelCard({ hotel }: HotelCardProps) {
  return (
    <div className="p-4 rounded-xl bg-gradient-to-br from-[#FF8C42]/10 to-purple-500/5 border border-[#FF8C42]/10">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#FF8C42]/20 flex items-center justify-center flex-shrink-0">
          <Building2 className="w-5 h-5 text-[#FF8C42]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-white font-semibold text-sm">{hotel.name}</h4>
            <span className="px-2 py-0.5 rounded-lg bg-[#FF8C42]/20 text-[#FF8C42] text-xs font-medium">
              {hotel.type || "酒店"}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-[#94A3B8]">
            {hotel.address && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {hotel.address}
              </span>
            )}
            {hotel.priceRange && (
              <span className="flex items-center gap-1">
                <Wallet className="w-3 h-3" />
                {hotel.priceRange}
              </span>
            )}
            {hotel.rating && (
              <span className="flex items-center gap-1 text-[#FFA94D]">
                <Star className="w-3 h-3 fill-[#FFA94D]" />
                {hotel.rating}
              </span>
            )}
          </div>
          {hotel.distance && (
            <p className="text-[#64748B] text-xs mt-1">{hotel.distance}</p>
          )}
        </div>
      </div>
    </div>
  );
}

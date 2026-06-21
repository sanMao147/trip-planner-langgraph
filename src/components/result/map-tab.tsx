"use client";

import { useEffect, useRef, useState } from "react";
import { TripPlan } from "@/types";
import type { AMapNamespace, AMapMap } from "@/types";
import { motion } from "framer-motion";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { MapPin } from "lucide-react";

interface MapTabProps {
  plan: TripPlan;
  selectedDay: number;
  onDayChange?: (dayIndex: number) => void;
}

declare global {
  interface Window {
    AMap: AMapNamespace;
    _AMapSecurityConfig: { securityJsCode: string };
  }
}

export function MapTab({ plan, selectedDay, onDayChange }: MapTabProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(() => {
    try {
      return typeof window !== "undefined" && !!window.AMap;
    } catch {
      return false;
    }
  });
  const [mapError, setMapError] = useState(!process.env.NEXT_PUBLIC_AMAP_JS_KEY);
  const mapInstanceRef = useRef<AMapMap | null>(null);

  useEffect(() => {
    const jsKey = process.env.NEXT_PUBLIC_AMAP_JS_KEY;
    if (!jsKey) {
      return;
    }

    if (window.AMap) {
      return;
    }

    window._AMapSecurityConfig = { securityJsCode: "" };

    const script = document.createElement("script");
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${jsKey}`;
    script.async = true;
    script.onload = () => setMapLoaded(true);
    script.onerror = () => setMapError(true);
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current || mapError) return;

    const day = plan.days[selectedDay];
    if (!day || day.attractions.length === 0) return;

    // 销毁旧地图实例
    if (mapInstanceRef.current) {
      mapInstanceRef.current.destroy();
      mapInstanceRef.current = null;
    }

    const allPoints = day.attractions.map((a) => [a.location.longitude, a.location.latitude]);

    const map = new window.AMap.Map(mapRef.current, {
      zoom: 12,
      center: allPoints[0] as [number, number],
      mapStyle: "amap://styles/dark",
    });
    mapInstanceRef.current = map;

    day.attractions.forEach((attraction, i) => {
      const content = `<div style="background: linear-gradient(135deg, #FF6B35, #FF8C42); color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; box-shadow: 0 2px 12px rgba(255,107,53,0.5);">${i + 1}</div>`;

      const marker = new window.AMap.Marker({
        position: [attraction.location.longitude, attraction.location.latitude] as [number, number],
        content,
        anchor: "center",
        title: attraction.name,
      });

      marker.on("click", () => {
        const info = new window.AMap.InfoWindow({
          content: `<div style="padding: 8px 12px; font-size: 13px; color: #333;"><strong>${attraction.name}</strong><br/><span style="color: #666; font-size: 11px;">${attraction.description}</span></div>`,
          offset: new window.AMap.Pixel(0, -35),
        });
        info.open(map, marker.getPosition());
      });

      map.add(marker);
    });

    map.setFitView(null, false, [60, 60, 60, 60]);

    return () => {
      map.destroy();
      mapInstanceRef.current = null;
    };
  }, [mapLoaded, selectedDay, plan.days, mapError]);

  if (mapError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-[#94A3B8]">
        <MapPin className="w-12 h-12 mb-4 opacity-50" />
        <p>地图服务未配置</p>
        <p className="text-xs mt-1">请设置 NEXT_PUBLIC_AMAP_JS_KEY 环境变量</p>
      </div>
    );
  }

  if (!mapLoaded) {
    return (
      <div className="flex items-center justify-center py-16">
        <LoadingSpinner text="加载地图中..." />
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="flex gap-2 overflow-x-auto pb-2">
        {plan.days.map((day, i) => (
          <button
            key={day.date}
            onClick={() => onDayChange?.(i)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              i === selectedDay
                ? "bg-[#FF8C42] text-white"
                : "bg-[#1E3050]/50 text-[#94A3B8] hover:text-white"
            }`}
          >
            第 {i + 1} 天
          </button>
        ))}
      </div>

      <div
        ref={mapRef}
        className="w-full h-[400px] sm:h-[500px] rounded-2xl overflow-hidden border border-white/10"
      />
    </motion.div>
  );
}

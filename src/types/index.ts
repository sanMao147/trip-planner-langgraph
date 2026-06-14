import { z } from "zod";

// ==================== 基础类型 ====================

export interface Location {
  longitude: number;
  latitude: number;
}

// ==================== 请求模型 ====================

export interface TripRequest {
  city: string;
  startDate: string;
  endDate: string;
  travelDays: number;
  transportation: "公共交通" | "自驾" | "步行" | "混合";
  accommodation: "经济型酒店" | "舒适型酒店" | "豪华酒店" | "民宿";
  preferences: string[];
  freeTextInput?: string;
}

// ==================== 响应模型 ====================

export interface Attraction {
  name: string;
  address: string;
  location: Location;
  visitDuration: number;
  description: string;
  category: string;
  rating?: number;
  photos?: string[];
  poiId?: string;
  imageUrl?: string;
  ticketPrice?: number;
}

export interface Meal {
  type: "breakfast" | "lunch" | "dinner" | "snack";
  name: string;
  address?: string;
  location?: Location;
  description: string;
  estimatedCost?: number;
}

export interface Hotel {
  name: string;
  address: string;
  location: Location;
  priceRange: string;
  rating?: number;
  distance?: string;
  type: string;
  estimatedCost?: number;
}

export interface WeatherInfo {
  date: string;
  dayWeather: string;
  nightWeather: string;
  dayTemp: number;
  nightTemp: number;
  windDirection: string;
  windPower: string;
}

export interface Budget {
  totalAttractions: number;
  totalHotels: number;
  totalMeals: number;
  totalTransportation: number;
  total: number;
}

export interface DayPlan {
  date: string;
  dayIndex: number;
  description: string;
  transportation: string;
  accommodation: string;
  hotel?: Hotel;
  attractions: Attraction[];
  meals: Meal[];
}

export interface TripPlan {
  city: string;
  startDate: string;
  endDate: string;
  days: DayPlan[];
  weatherInfo: WeatherInfo[];
  overallSuggestions: string;
  budget?: Budget;
}

// ==================== API 响应包装 ====================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ==================== Zod 验证 Schema ====================

export const tripRequestSchema = z.object({
  city: z.string().min(1, "请输入目的地城市"),
  startDate: z.string().min(1, "请选择出发日期"),
  endDate: z.string().min(1, "请选择结束日期"),
  travelDays: z.number().min(1).max(14),
  transportation: z.enum(["公共交通", "自驾", "步行", "混合"]),
  accommodation: z.enum(["经济型酒店", "舒适型酒店", "豪华酒店", "民宿"]),
  preferences: z.array(z.string()).min(1, "请至少选择一个旅行偏好"),
  freeTextInput: z.string().optional(),
});



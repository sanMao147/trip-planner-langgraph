import { z } from "zod";

// ==================== 基础类型 ====================

/**
 * 地理坐标位置接口
 * 用于表示景点、酒店、餐厅等位置的经纬度信息
 */
export interface Location {
  /** 经度，范围 -180 至 180 */
  longitude: number;
  /** 纬度，范围 -90 至 90 */
  latitude: number;
}

// ==================== 请求模型 ====================

/**
 * 旅行请求接口
 * 用户提交的旅行规划请求参数
 */
export interface TripRequest {
  /** 目的地城市名称，如：北京、上海、成都 */
  city: string;
  /** 出发日期，格式 YYYY-MM-DD */
  startDate: string;
  /** 结束日期，格式 YYYY-MM-DD */
  endDate: string;
  /** 旅行天数，由开始日期和结束日期计算得出 */
  travelDays: number;
  /** 交通方式：公共交通、自驾、步行、混合 */
  transportation: "公共交通" | "自驾" | "步行" | "混合";
  /** 住宿偏好：经济型酒店、舒适型酒店、豪华酒店、民宿 */
  accommodation: "经济型酒店" | "舒适型酒店" | "豪华酒店" | "民宿";
  /** 旅行偏好列表，可多选：历史文化、自然风光、美食、购物等 */
  preferences: string[];
  /** 额外要求（可选），用户自定义的特殊需求 */
  freeTextInput?: string;
}

// ==================== 响应模型 ====================

/**
 * 景点信息接口
 * 描述一个旅游景点的详细信息
 */
export interface Attraction {
  /** 景点名称 */
  name: string;
  /** 详细地址 */
  address: string;
  /** 地理坐标 */
  location: Location;
  /** 建议游玩时长（分钟） */
  visitDuration: number;
  /** 景点描述，建议控制在100字以内 */
  description: string;
  /** 景点类别：历史文化/自然风光/美食/购物/娱乐 */
  category: string;
  /** 评分，范围 0-5 */
  rating?: number;
  /** 图片URL列表 */
  photos?: string[];
  /** POI唯一标识（来自高德地图） */
  poiId?: string;
  /** 封面图片URL */
  imageUrl?: string;
  /** 门票价格（元） */
  ticketPrice?: number;
}

/**
 * 餐饮信息接口
 * 描述一餐的详细信息
 */
export interface Meal {
  /** 餐食类型：早餐、午餐、晚餐、小吃 */
  type: "breakfast" | "lunch" | "dinner" | "snack";
  /** 餐厅名称 */
  name: string;
  /** 餐厅地址（可选） */
  address?: string;
  /** 餐厅位置坐标（可选） */
  location?: Location;
  /** 餐厅/菜品描述 */
  description: string;
  /** 预估费用（元） */
  estimatedCost?: number;
}

/**
 * 酒店信息接口
 * 描述酒店的详细信息
 */
export interface Hotel {
  /** 酒店名称 */
  name: string;
  /** 详细地址 */
  address: string;
  /** 地理坐标 */
  location: Location;
  /** 价格范围，如：¥200-400/晚 */
  priceRange: string;
  /** 评分，范围 0-5 */
  rating?: number;
  /** 距离描述，如：距市中心2km */
  distance?: string;
  /** 酒店类型：经济型酒店、舒适型酒店、豪华酒店、民宿 */
  type: string;
  /** 预估每晚费用（元） */
  estimatedCost?: number;
}

/**
 * 天气信息接口
 * 描述单日天气预报
 */
export interface WeatherInfo {
  /** 日期，格式 YYYY-MM-DD */
  date: string;
  /** 白天天气状况，如：晴、多云、阴、雨 */
  dayWeather: string;
  /** 夜间天气状况 */
  nightWeather: string;
  /** 白天最高温度（摄氏度） */
  dayTemp: number;
  /** 夜间最低温度（摄氏度） */
  nightTemp: number;
  /** 风向，如：南风、北风 */
  windDirection: string;
  /** 风力等级，如：2-3级 */
  windPower: string;
}

/**
 * 预算信息接口
 * 旅行计划的费用预算明细
 */
export interface Budget {
  /** 景点门票总费用 */
  totalAttractions: number;
  /** 酒店住宿总费用 */
  totalHotels: number;
  /** 餐饮总费用 */
  totalMeals: number;
  /** 交通总费用（含市内交通） */
  totalTransportation: number;
  /** 总预算 */
  total: number;
}

/**
 * 单日行程计划接口
 * 描述旅行中某一天的详细安排
 */
export interface DayPlan {
  /** 日期，格式 YYYY-MM-DD */
  date: string;
  /** 行程天数索引，从0开始 */
  dayIndex: number;
  /** 当日行程概述 */
  description: string;
  /** 交通方式 */
  transportation: string;
  /** 住宿类型 */
  accommodation: string;
  /** 推荐酒店（可选） */
  hotel?: Hotel;
  /** 当日景点列表 */
  attractions: Attraction[];
  /** 当日餐饮安排 */
  meals: Meal[];
}

/**
 * 完整旅行计划接口
 * 包含所有旅行相关信息的顶层接口
 */
export interface TripPlan {
  /** 目的地城市 */
  city: string;
  /** 出发日期 */
  startDate: string;
  /** 结束日期 */
  endDate: string;
  /** 每日行程计划 */
  days: DayPlan[];
  /** 天气信息列表 */
  weatherInfo: WeatherInfo[];
  /** 整体旅行建议（穿衣、饮食、交通等） */
  overallSuggestions: string;
  /** 预算信息（可选） */
  budget?: Budget;
}

// ==================== API 响应包装 ====================

/**
 * API 响应通用包装接口
 * 统一所有 API 响应格式
 */
export interface ApiResponse<T> {
  /** 请求是否成功 */
  success: boolean;
  /** 响应数据 */
  data?: T;
  /** 错误信息 */
  error?: string;
  /** 提示消息 */
  message?: string;
}

// ==================== Zod 验证 Schema ====================

/**
 * 旅行请求参数验证 Schema
 * 使用 Zod 进行严格的参数校验
 */
export const tripRequestSchema = z.object({
  city: z.string().min(1, "请输入目的地城市"),
  startDate: z.string().min(1, "请选择出发日期"),
  endDate: z.string().min(1, "请选择结束日期"),
  travelDays: z.number().min(1).max(14, "旅行天数不能超过14天"),
  transportation: z.enum(["公共交通", "自驾", "步行", "混合"]),
  accommodation: z.enum(["经济型酒店", "舒适型酒店", "豪华酒店", "民宿"]),
  preferences: z.array(z.string()).min(1, "请至少选择一个旅行偏好"),
  freeTextInput: z.string().optional(),
});
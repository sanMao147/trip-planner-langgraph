import type { TripRequest, WeatherInfo, TripPlan, Meal } from "@/types";
import { createLogger } from "@/lib/infra/logger";

/** 日志记录器实例 */
const logger = createLogger("TripGraph");

// ==================== 城市坐标映射（降级方案用） ====================

/**
 * 预设的城市坐标映射表
 * 
 * 当 MCP 工具调用失败时，使用此映射表获取城市坐标作为降级方案。
 * 包含国内主要旅游城市的经纬度。
 */
export const CITY_COORDS: Record<string, { longitude: number; latitude: number }> = {
  北京: { longitude: 116.4074, latitude: 39.9042 },
  上海: { longitude: 121.4737, latitude: 31.2304 },
  广州: { longitude: 113.2644, latitude: 23.1291 },
  深圳: { longitude: 114.0579, latitude: 22.5431 },
  成都: { longitude: 104.0665, latitude: 30.5728 },
  杭州: { longitude: 120.1551, latitude: 30.2741 },
  南京: { longitude: 118.7969, latitude: 32.0603 },
  武汉: { longitude: 114.3054, latitude: 30.5931 },
  重庆: { longitude: 106.5516, latitude: 29.5630 },
  西安: { longitude: 108.9402, latitude: 34.3416 },
  厦门: { longitude: 118.0894, latitude: 24.4798 },
  青岛: { longitude: 120.3826, latitude: 36.0671 },
  大连: { longitude: 121.6147, latitude: 38.9140 },
  三亚: { longitude: 109.5082, latitude: 18.2528 },
  昆明: { longitude: 102.8329, latitude: 24.8801 },
  长沙: { longitude: 112.9388, latitude: 28.2277 },
  苏州: { longitude: 120.5954, latitude: 31.2989 },
  天津: { longitude: 117.1902, latitude: 39.1252 },
  哈尔滨: { longitude: 126.6424, latitude: 45.7567 },
  拉萨: { longitude: 91.1721, latitude: 29.6562 },
};

/**
 * 获取城市坐标
 * 
 * 支持精确匹配和去后缀匹配（去掉市/省/自治区后缀）。
 * 如果均未匹配到，返回默认坐标（北京天安门附近）。
 * 
 * @param city 城市名称
 * @returns 经纬度坐标对象
 */
export function getCityCoord(city: string): { longitude: number; latitude: number } {
  // 精确匹配
  if (CITY_COORDS[city]) return CITY_COORDS[city];

  // 去后缀匹配（去掉"市/省/自治区"后缀）
  const trimmed = city.replace(/[市省自治区]$/, "");
  if (CITY_COORDS[trimmed]) return CITY_COORDS[trimmed];

  // 兜底：默认坐标（北京天安门）
  return { longitude: 116.397128, latitude: 39.916527 };
}

// ==================== 工具函数 ====================

/**
 * 从文本中提取 JSON 内容
 * 
 * 处理 LLM 返回的响应，支持两种格式：
 * 1. 带代码块标记的 JSON：```json ... ```
 * 2. 直接的 JSON 对象或数组
 * 
 * @param text 包含 JSON 的文本
 * @returns 提取出的 JSON 字符串
 */
export function extractJSON(text: string): string {
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || text.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
  return jsonMatch ? jsonMatch[1].trim() : text.trim();
}

/**
 * 安全解析 JSON
 * 
 * 封装 JSON.parse，提供错误处理和类型验证。
 * 如果解析失败或类型不匹配，返回 fallback 值。
 * 当 fallback 为数组时，会校验解析结果是否也为数组。
 * 
 * @param text 待解析的文本
 * @param fallback 解析失败时的默认返回值
 * @param expectedKeys 期望的对象键（可选），用于基本形状验证
 * @returns 解析后的对象或 fallback 值
 */
export function safeJSONParse<T extends object>(text: string, fallback: T, expectedKeys?: string[]): T {
  try {
    const parsed = JSON.parse(extractJSON(text));

    // 数组类型守卫：当 fallback 为数组时，校验 parsed 是否也为数组
    if (Array.isArray(fallback) && !Array.isArray(parsed)) {
      logger.warn("JSON 解析结果不是数组，使用 fallback");
      return fallback;
    }

    // 基本形状验证：如果提供了 expectedKeys，检查结果是否为包含这些键的对象
    if (expectedKeys && (typeof parsed !== "object" || parsed === null || Array.isArray(parsed))) {
      logger.warn("JSON 解析结果类型不符合预期，使用 fallback");
      return fallback;
    }

    return parsed as T;
  } catch (e) {
    logger.error("JSON 解析失败:", e);
    return fallback;
  }
}

// ==================== 硬编码降级方案 ====================

/**
 * 生成硬编码的旅行计划（降级方案）
 * 
 * 当所有 AI 生成方案都失败时，使用此函数生成一个基础的旅行计划。
 * 确保系统在任何情况下都能返回可用的旅行计划。
 * 
 * @param request 旅行请求参数
 * @param weather 天气信息列表
 * @returns 硬编码生成的旅行计划
 */
export function generateHardcodedPlan(request: TripRequest, weather: WeatherInfo[]): TripPlan {
  const cityCoord = getCityCoord(request.city);
  const days = [];

  for (let i = 0; i < request.travelDays; i++) {
    const date = new Date(request.startDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split("T")[0];

    days.push({
      date: dateStr,
      dayIndex: i,
      description: `第 ${i + 1} 天：探索${request.city}的精彩之处`,
      transportation: request.transportation,
      accommodation: request.accommodation,
      hotel: {
        name: `${request.city}${request.accommodation}`,
        address: `${request.city}市中心`,
        location: cityCoord,
        priceRange: "¥200-500/晚",
        rating: 4.0,
        type: request.accommodation,
        estimatedCost: 300,
      },
      attractions: [
        {
          name: `${request.city}中心广场`,
          address: `${request.city}市中心`,
          location: cityCoord,
          visitDuration: 120,
          description: `${request.city}的标志性景点，游客必到之处`,
          category: request.preferences[0] || "历史文化",
          rating: 4.3,
          ticketPrice: 50,
        },
      ],
      meals: [
        {
          type: "breakfast" as const,
          name: "当地早餐店",
          description: "品尝当地特色早餐",
          estimatedCost: 30,
        },
        {
          type: "lunch" as const,
          name: "特色餐厅",
          description: "享用当地美食午餐",
          estimatedCost: 60,
        },
        {
          type: "dinner" as const,
          name: "本地风味餐厅",
          description: "体验地道晚餐",
          estimatedCost: 80,
        },
      ] as Meal[],
    });
  }

  const budget = {
    totalAttractions: days.reduce((s, d) => s + d.attractions.reduce((a, b) => a + (b.ticketPrice || 0), 0), 0),
    totalHotels: days.reduce((s, d) => s + (d.hotel?.estimatedCost || 0), 0),
    totalMeals: days.reduce((s, d) => s + d.meals.reduce((a, b) => a + (b.estimatedCost || 0), 0), 0),
    totalTransportation: days.length * 50,
    total: 0,
  };
  budget.total = budget.totalAttractions + budget.totalHotels + budget.totalMeals + budget.totalTransportation;

  return {
    city: request.city,
    startDate: request.startDate,
    endDate: request.endDate,
    days,
    weatherInfo: weather.length > 0 ? weather : [],
    overallSuggestions: `欢迎来到${request.city}！建议穿着舒适的鞋子，随身携带水和防晒用品。`,
    budget,
  };
}

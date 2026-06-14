import { StateGraph, Annotation, END, START } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { getMCPTools, findTool } from "@/lib/mcp-client";
import {
  ATTRACTION_AGENT_PROMPT,
  HOTEL_AGENT_PROMPT,
  WEATHER_AGENT_PROMPT,
  PLANNER_AGENT_PROMPT,
  FALLBACK_PLANNER_PROMPT,
} from "@/lib/prompts";
import { createLogger } from "@/lib/logger";
import type { Attraction, Hotel, WeatherInfo, TripPlan, TripRequest, Meal } from "@/types";

const logger = createLogger("TripGraph");

// ==================== State 定义 ====================

const TripState = Annotation.Root({
  messages: Annotation<string[]>({
    reducer: (a, b) => [...(a || []), ...(b || [])],
    default: () => [],
  }),
  tripRequest: Annotation<TripRequest | null>({
    reducer: (_, b) => b,
    default: () => null,
  }),
  attractions: Annotation<Attraction[]>({
    reducer: (_, b) => b,
    default: () => [],
  }),
  hotels: Annotation<Hotel[]>({
    reducer: (_, b) => b,
    default: () => [],
  }),
  weather: Annotation<WeatherInfo[]>({
    reducer: (_, b) => b,
    default: () => [],
  }),
  tripPlan: Annotation<TripPlan | null>({
    reducer: (_, b) => b,
    default: () => null,
  }),
  error: Annotation<string | null>({
    reducer: (_, b) => b,
    default: () => null,
  }),
  stage: Annotation<string>({
    reducer: (_, b) => b,
    default: () => "idle",
  }),
});

// ==================== LLM 实例（模块级单例） ====================

let llmInstance: ChatOpenAI | null = null;

function getLLM(): ChatOpenAI {
  if (llmInstance) return llmInstance;
  llmInstance = new ChatOpenAI({
    modelName: process.env.OPENAI_MODEL || "gpt-4o",
    temperature: 0.7,
    maxTokens: 4096,
    openAIApiKey: process.env.OPENAI_API_KEY,
    configuration: {
      baseURL: process.env.OPENAI_BASE_URL,
    },
  });
  return llmInstance;
}

// ==================== 城市坐标映射（降级方案用） ====================

const CITY_COORDS: Record<string, { longitude: number; latitude: number }> = {
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

function getCityCoord(city: string): { longitude: number; latitude: number } {
  // 精确匹配
  if (CITY_COORDS[city]) return CITY_COORDS[city];
  // 模糊匹配（去掉"市"后缀）
  const trimmed = city.replace(/[市省自治区]$/, "");
  if (CITY_COORDS[trimmed]) return CITY_COORDS[trimmed];
  // 部分匹配
  for (const [key, coord] of Object.entries(CITY_COORDS)) {
    if (city.includes(key) || key.includes(trimmed)) return coord;
  }
  // 兜底：默认坐标
  return { longitude: 116.397128, latitude: 39.916527 };
}

// ==================== 工具函数 ====================

function extractJSON(text: string): string {
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || text.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
  return jsonMatch ? jsonMatch[1].trim() : text.trim();
}

function safeJSONParse<T extends object>(text: string, fallback: T, expectedKeys?: string[]): T {
  try {
    const parsed = JSON.parse(extractJSON(text));
    // Basic shape validation: if expectedKeys provided, check result is object with those keys
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

// ==================== 节点定义 ====================

async function parseInput(state: typeof TripState.State): Promise<Partial<typeof TripState.State>> {
  logger.info("parse_input 开始");
  const request = state.tripRequest;
  if (!request) {
    return { error: "缺少旅行请求参数", stage: "error" };
  }
  return {
    messages: ["✅ 旅行请求解析完成"],
    stage: "parsed",
  };
}

async function searchAttractions(state: typeof TripState.State): Promise<Partial<typeof TripState.State>> {
  logger.info("search_attractions 开始");
  const request = state.tripRequest;
  if (!request) return { error: "缺少请求", stage: "error" };

  // 获取 MCP 工具并调用高德关键词搜索
  const mcpTools = await getMCPTools();
  const keywordTool = findTool(mcpTools, "keywords_search") || findTool(mcpTools, "keyword");

  // 收集 MCP 原始结果用于注入 LLM context
  const mcpContextParts: string[] = [];

  if (keywordTool) {
    const preferences = request.preferences.length > 0 ? request.preferences[0] : "景点";
    const result = await keywordTool.invoke({
      keywords: `${request.city} ${preferences} 热门景点`,
      city: request.city,
    });
    const resultStr = typeof result === "string" ? result : JSON.stringify(result);
    logger.debug("MCP 关键词搜索结果:", resultStr.substring(0, 500));
    mcpContextParts.push(`## 高德地图 POI 搜索原始数据\n\`\`\`json\n${resultStr.substring(0, 3000)}\n\`\`\``);
  }

  const llm = getLLM();
  const prompt = ATTRACTION_AGENT_PROMPT(request);

  // 将 MCP 真实数据拼入 LLM context
  const mcpContext = mcpContextParts.length > 0 ? mcpContextParts.join("\n\n") + "\n\n---\n\n" : "";
  const response = await llm.invoke([
    new SystemMessage("你是一个专业旅行规划助手，只输出 JSON 格式数据。请基于提供的高德地图真实 POI 数据生成景点列表。"),
    new HumanMessage(`${mcpContext}${prompt}`),
  ]);

  const text = typeof response.content === "string" ? response.content : JSON.stringify(response.content);
  const attractions = safeJSONParse<Attraction[]>(text, []);
  logger.info(`search_attractions 完成，共 ${attractions.length} 个景点`);

  return {
    attractions,
    messages: [`✅ 景点搜索完成，找到 ${attractions.length} 个景点`],
    stage: "attractions_done",
  };
}

async function queryWeather(state: typeof TripState.State): Promise<Partial<typeof TripState.State>> {
  logger.info("query_weather 开始");
  const request = state.tripRequest;
  if (!request) return { error: "缺少请求", stage: "error" };

  const mcpTools = await getMCPTools();
  const weatherTool = findTool(mcpTools, "weather");

  const mcpContextParts: string[] = [];

  if (weatherTool) {
    const result = await weatherTool.invoke({ city: request.city });
    const resultStr = typeof result === "string" ? result : JSON.stringify(result);
    logger.debug("MCP 天气查询结果:", resultStr.substring(0, 500));
    mcpContextParts.push(`## 高德天气 API 原始数据\n\`\`\`json\n${resultStr.substring(0, 3000)}\n\`\`\``);
  }

  const llm = getLLM();
  const prompt = WEATHER_AGENT_PROMPT(request);

  const mcpContext = mcpContextParts.length > 0 ? mcpContextParts.join("\n\n") + "\n\n---\n\n" : "";
  const response = await llm.invoke([
    new SystemMessage("你是一个天气预报助手，只输出 JSON 格式数据。请基于提供的高德天气真实数据生成天气预报。"),
    new HumanMessage(`${mcpContext}${prompt}`),
  ]);

  const text = typeof response.content === "string" ? response.content : JSON.stringify(response.content);
  const weather = safeJSONParse<WeatherInfo[]>(text, []);
  logger.info(`query_weather 完成，共 ${weather.length} 天天气`);

  return {
    weather,
    messages: [`✅ 天气查询完成，获取 ${weather.length} 天天气数据`],
    stage: "weather_done",
  };
}

async function searchHotels(state: typeof TripState.State): Promise<Partial<typeof TripState.State>> {
  logger.info("search_hotels 开始");
  const request = state.tripRequest;
  if (!request) return { error: "缺少请求", stage: "error" };

  const mcpTools = await getMCPTools();
  const keywordTool = findTool(mcpTools, "keywords_search") || findTool(mcpTools, "keyword");

  const mcpContextParts: string[] = [];

  if (keywordTool) {
    const result = await keywordTool.invoke({
      keywords: `${request.city} ${request.accommodation} 酒店`,
      city: request.city,
    });
    const resultStr = typeof result === "string" ? result : JSON.stringify(result);
    logger.debug("MCP 酒店搜索结果:", resultStr.substring(0, 500));
    mcpContextParts.push(`## 高德地图酒店搜索原始数据\n\`\`\`json\n${resultStr.substring(0, 3000)}\n\`\`\``);
  }

  const llm = getLLM();
  const prompt = HOTEL_AGENT_PROMPT(request);

  const mcpContext = mcpContextParts.length > 0 ? mcpContextParts.join("\n\n") + "\n\n---\n\n" : "";
  const response = await llm.invoke([
    new SystemMessage("你是一个专业酒店推荐助手，只输出 JSON 格式数据。请基于提供的高德真实酒店数据生成推荐。"),
    new HumanMessage(`${mcpContext}${prompt}`),
  ]);

  const text = typeof response.content === "string" ? response.content : JSON.stringify(response.content);
  const hotels = safeJSONParse<Hotel[]>(text, []);
  logger.info(`search_hotels 完成，共 ${hotels.length} 个酒店`);

  return {
    hotels,
    messages: [`✅ 酒店搜索完成，找到 ${hotels.length} 个酒店`],
    stage: "hotels_done",
  };
}

async function planItinerary(state: typeof TripState.State): Promise<Partial<typeof TripState.State>> {
  logger.info("plan_itinerary 开始");
  const request = state.tripRequest;
  if (!request) return { error: "缺少请求", stage: "error" };

  const llm = getLLM();
  const prompt = PLANNER_AGENT_PROMPT(
    request,
    state.attractions.length,
    state.hotels.length,
    state.weather.length
  );

  const contextParts: string[] = [];

  if (state.attractions.length > 0) {
    contextParts.push(`## 已识别的景点\n${JSON.stringify(state.attractions, null, 2)}`);
  }
  if (state.hotels.length > 0) {
    contextParts.push(`## 已筛选的酒店\n${JSON.stringify(state.hotels, null, 2)}`);
  }
  if (state.weather.length > 0) {
    contextParts.push(`## 天气信息\n${JSON.stringify(state.weather, null, 2)}`);
  }

  const contextStr = contextParts.join("\n\n");

  const response = await llm.invoke([
    new SystemMessage("你是一个资深旅行规划师，只输出 JSON 格式数据。请基于提供的景点、酒店和天气数据生成完整行程。"),
    new HumanMessage(`${contextStr}\n\n${prompt}`),
  ]);

  const text = typeof response.content === "string" ? response.content : JSON.stringify(response.content);
  let tripPlan = safeJSONParse<TripPlan>(text, null as unknown as TripPlan, ["city", "days"]);

  // 容错：LLM 输出失败则用 Fallback
  if (!tripPlan || !tripPlan.days || tripPlan.days.length === 0) {
    logger.warn("Planner 输出无效，使用 Fallback Planner");
    const fallbackResponse = await llm.invoke([
      new SystemMessage("你是一个旅行规划助手，只输出 JSON 格式数据。"),
      new HumanMessage(FALLBACK_PLANNER_PROMPT(request)),
    ]);
    const fallbackText =
      typeof fallbackResponse.content === "string"
        ? fallbackResponse.content
        : JSON.stringify(fallbackResponse.content);
    tripPlan = safeJSONParse<TripPlan>(fallbackText, null as unknown as TripPlan, ["city", "days"]);
  }

  // 最终降级：硬编码
  if (!tripPlan || !tripPlan.days || tripPlan.days.length === 0) {
    logger.warn("使用硬编码降级方案");
    tripPlan = generateHardcodedPlan(request, state.weather);
  }

  logger.info(`plan_itinerary 完成，共 ${tripPlan.days.length} 天行程`);

  return {
    tripPlan,
    messages: [`✅ 行程规划完成，共 ${tripPlan.days.length} 天行程`],
    stage: "planning_done",
  };
}

async function formatOutput(state: typeof TripState.State): Promise<Partial<typeof TripState.State>> {
  logger.info("format_output 开始");
  const tripPlan = state.tripPlan;

  if (!tripPlan) {
    return { error: "行程规划失败", stage: "error" };
  }

  // 确保预算字段存在
  if (!tripPlan.budget) {
    let totalAttractions = 0;
    let totalHotels = 0;
    let totalMeals = 0;

    for (const day of tripPlan.days) {
      totalAttractions += day.attractions.reduce((sum, a) => sum + (a.ticketPrice || 0), 0);
      totalMeals += day.meals.reduce((sum, m) => sum + (m.estimatedCost || 0), 0);
      if (day.hotel?.estimatedCost) {
        totalHotels += day.hotel.estimatedCost;
      }
    }

    tripPlan.budget = {
      totalAttractions,
      totalHotels,
      totalMeals,
      totalTransportation: tripPlan.days.length * 50,
      total: totalAttractions + totalHotels + totalMeals + tripPlan.days.length * 50,
    };
  }

  return {
    tripPlan,
    messages: ["✅ 输出格式化完成"],
    stage: "completed",
  };
}

// ==================== 硬编码降级方案 ====================

function generateHardcodedPlan(request: TripRequest, weather: WeatherInfo[]): TripPlan {
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

// ==================== 构建 LangGraph 工作流（模块级单例） ====================

type CompiledGraph = { invoke: (input: typeof INITIAL_STATE_TEMPLATE) => Promise<typeof INITIAL_STATE_TEMPLATE> };

let compiledGraph: CompiledGraph | null = null;

function createTripGraph() {
  const workflow = new StateGraph(TripState)
    .addNode("parse_input", parseInput)
    .addNode("search_attractions", searchAttractions)
    .addNode("query_weather", queryWeather)
    .addNode("search_hotels", searchHotels)
    .addNode("plan_itinerary", planItinerary)
    .addNode("format_output", formatOutput)

    // START -> parse_input
    .addEdge(START, "parse_input")

    // parse_input -> 并行分叉到三个搜索节点
    .addEdge("parse_input", "search_attractions")
    .addEdge("parse_input", "query_weather")
    .addEdge("parse_input", "search_hotels")

    // 三个搜索节点汇合到 plan_itinerary
    .addEdge("search_attractions", "plan_itinerary")
    .addEdge("query_weather", "plan_itinerary")
    .addEdge("search_hotels", "plan_itinerary")

    // plan_itinerary -> format_output
    .addEdge("plan_itinerary", "format_output")

    // format_output -> END
    .addEdge("format_output", END);

  return workflow.compile() as CompiledGraph;
}

function getGraph() {
  if (!compiledGraph) {
    compiledGraph = createTripGraph();
  }
  return compiledGraph;
}

// ==================== 便捷运行函数 ====================

const INITIAL_STATE_TEMPLATE = {
  tripRequest: null as TripRequest | null,
  messages: [] as string[],
  attractions: [] as Attraction[],
  hotels: [] as Hotel[],
  weather: [] as WeatherInfo[],
  tripPlan: null as TripPlan | null,
  error: null as string | null,
  stage: "idle",
};

export async function runTripPlan(request: TripRequest): Promise<TripPlan> {
  logger.info(`开始规划旅行: ${request.city}, ${request.travelDays}天`);

  const graph = getGraph();

  const initialState = {
    ...INITIAL_STATE_TEMPLATE,
    tripRequest: request,
  };

  const result = await graph.invoke(initialState);

  if (result.error) {
    throw new Error(result.error);
  }

  if (!result.tripPlan) {
    throw new Error("旅行计划生成失败");
  }

  return result.tripPlan;
}



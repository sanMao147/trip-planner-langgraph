import { StateGraph, END, START } from "@langchain/langgraph";
import { TripState } from "./state";
import {
  parseInput,
  searchAttractions,
  queryWeather,
  searchHotels,
  planItinerary,
  formatOutput,
} from "./nodes";
import type { Attraction, Hotel, WeatherInfo, TripPlan, TripRequest } from "@/types";

/** 初始状态模板 */
export const INITIAL_STATE_TEMPLATE = {
  tripRequest: null as TripRequest | null,
  messages: [] as string[],
  attractions: [] as Attraction[],
  hotels: [] as Hotel[],
  weather: [] as WeatherInfo[],
  tripPlan: null as TripPlan | null,
  error: null as string | null,
  stage: "idle",
};

// ==================== 构建 LangGraph 工作流（模块级单例） ====================

/**
 * 创建旅行规划工作流图
 * 
 * 工作流架构：
 * START -> parse_input -> [并行执行] search_attractions + query_weather + search_hotels -> plan_itinerary -> format_output -> END
 * 
 * 特点：
 * 1. 三个搜索节点并行执行，提升效率
 * 2. 所有搜索完成后才进行行程规划
 * 3. 完整的错误处理和降级机制
 * 
 * @returns 编译后的状态机图（CompiledStateGraph）
 */
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

  return workflow.compile();
}

/** 编译后的图实例缓存（类型由 createTripGraph 返回值推断，即 LangGraph 官方 CompiledStateGraph） */
let compiledGraph: ReturnType<typeof createTripGraph> | null = null;

/**
 * 获取工作流图实例（单例模式）
 * 
 * @returns 编译后的状态机图实例
 */
export function getGraph() {
  if (!compiledGraph) {
    compiledGraph = createTripGraph();
  }
  return compiledGraph;
}

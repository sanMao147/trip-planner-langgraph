import { Annotation } from "@langchain/langgraph";
import type { Attraction, Hotel, WeatherInfo, TripPlan, TripRequest } from "@/types";

// ==================== State 定义 ====================

/**
 * TripState - LangGraph 工作流的状态定义
 * 
 * 状态是工作流执行过程中传递的数据载体，包含所有需要在节点间共享的信息。
 * 使用 Annotation 定义每个字段的 reducer 策略和默认值。
 */
export const TripState = Annotation.Root({
  /** 执行日志消息列表，用于跟踪工作流进度 */
  messages: Annotation<string[]>({
    reducer: (a, b) => [...(a || []), ...(b || [])],
    default: () => [],
  }),
  /** 用户的旅行请求参数 */
  tripRequest: Annotation<TripRequest | null>({
    reducer: (_, b) => b,
    default: () => null,
  }),
  /** 搜索到的景点列表 */
  attractions: Annotation<Attraction[]>({
    reducer: (_, b) => b,
    default: () => [],
  }),
  /** 搜索到的酒店列表 */
  hotels: Annotation<Hotel[]>({
    reducer: (_, b) => b,
    default: () => [],
  }),
  /** 天气信息列表 */
  weather: Annotation<WeatherInfo[]>({
    reducer: (_, b) => b,
    default: () => [],
  }),
  /** 生成的旅行计划 */
  tripPlan: Annotation<TripPlan | null>({
    reducer: (_, b) => b,
    default: () => null,
  }),
  /** 错误信息，如果执行过程中发生错误 */
  error: Annotation<string | null>({
    reducer: (_, b) => b,
    default: () => null,
  }),
  /** 当前执行阶段：idle -> parsed -> attractions_done -> weather_done -> hotels_done -> planning_done -> completed */
  stage: Annotation<string>({
    reducer: (_, b) => b,
    default: () => "idle",
  }),
});

/** TripState 的类型定义 */
export type TripStateType = typeof TripState.State;

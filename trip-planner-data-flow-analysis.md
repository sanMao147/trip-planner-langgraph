# Trip Planner LangGraph — 全链路数据流转分析报告

> **目标读者**：缺乏后端经验的前端开发人员  
> **核心目的**：系统性理解从"用户填写表单"到"看到旅行计划"的完整数据流动过程  
> **技术栈**：Next.js 16 (App Router) + LangGraph + OpenAI + 高德 MCP + SWR

---

## 1. 项目全景概览

### 1.1 项目架构图

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Trip Planner LangGraph                        │
├───────────────────────┬─────────────────────────────────────────────┤
│     Frontend (React)  │         Backend (Next.js API)               │
│                       │                                             │
│  ┌─────────────────┐  │  ┌──────────────────────────────────────┐  │
│  │  Home Page       │  │  │  POST /api/trip/plan                 │  │
│  │  - HeroSection   │──┼─▶│  - Zod 校验                         │  │
│  │  - TripForm      │  │  │  - 调用 LangGraph Workflow           │  │
│  └────────┬────────┘  │  │  - 持久化到 Store                    │  │
│           │           │  └──────────────┬───────────────────────┘  │
│           │  router.  │                 │                           │
│           │  push()   │                 ▼                           │
│           ▼           │  ┌──────────────────────────────────────┐  │
│  ┌─────────────────┐  │  │   LangGraph State Machine             │  │
│  │  Result Page     │  │  │                                     │  │
│  │  - useTripPlan   │◀─┼──│  parse_input  →  search_attractions  │  │
│  │    (SWR fetch)   │  │  │                   query_weather    │  │
│  │  - OverviewTab   │  │  │                   search_hotels     │  │
│  │  - BudgetTab     │  │  │     ↓  (三个并行) ↓                  │  │
│  │  - MapTab        │  │  │  plan_itinerary → format_output     │  │
│  └─────────────────┘  │  └──────────────────────────────────────┘  │
│                       │              │                              │
│  ┌─────────────────┐  │              ▼                              │
│  │  GET /api/trip/  │  │  ┌──────────────────────────────────────┐  │
│  │  result          │◀─┼──│  In-Memory Store (Map)               │  │
│  └─────────────────┘  │  │  - sessionId → TripPlan               │  │
│                       │  │  - 30分钟 TTL + LRU 淘汰              │  │
│                       │  └──────────────────────────────────────┘  │
└───────────────────────┴─────────────────────────────────────────────┘
```

### 1.2 目录结构及各文件职责

| 路径 | 职责 | 关键词 |
|------|------|--------|
| `app/page.tsx` | 首页入口，组合 Header + HeroSection + TripForm | 页面入口 |
| `app/result/page.tsx` | 结果页入口，含 Tab 切换、导出按钮 | 结果展示 |
| `app/layout.tsx` | 根布局，设置全局字体/样式/Metadata | 全局配置 |
| `app/api/trip/plan/route.ts` | **POST 规划接口**：接收表单、校验、调 Graph、存 Store | API 入口 |
| `app/api/trip/result/route.ts` | **GET 查询接口**：根据 sessionId 读取 Store 返回 | API 查询 |
| `src/types/index.ts` | 所有 TypeScript 类型定义 + Zod 校验 Schema | **类型系统** |
| `src/lib/graph/trip-graph.ts` | **LangGraph 状态机**：6 个节点定义工作流 | **核心引擎** |
| `src/lib/mcp-client.ts` | 高德 MCP 客户端：连接 Amap 获取 POI/天气 | 外部数据源 |
| `src/lib/prompts.ts` | 4 个 Agent 的 System Prompt 模板 | AI 提示词 |
| `src/lib/store.ts` | 内存级会话存储：Map<sessionId, TripPlan> | 数据持久化 |
| `src/lib/utils.ts` | 工具函数：cn()、generateSessionId() | 工具 |
| `src/lib/logger.ts` | 日志工具：按级别控制输出 | 调试 |
| `src/hooks/use-trip-plan.ts` | SWR 封装：自动请求/缓存结果数据 | **前端数据层** |
| `src/hooks/use-export.ts` | 导出 Hook：html2canvas + jsPDF | 导出 |
| `src/components/home/trip-form.tsx` | **表单组件**：采集用户输入、发送请求、Loading态 | **数据起点** |
| `src/components/result/overview-tab.tsx` | 行程概览 Tab：渲染 DayCard 列表 | 展示 |
| `src/components/result/day-card.tsx` | 单日行程卡片：景点/酒店/餐饮/天气 | 展示 |
| `src/components/result/budget-tab.tsx` | 预算 Tab：费用柱状图 | 展示 |
| `src/components/result/map-tab.tsx` | 地图 Tab：高德 JS API 标记景点 | 展示 |
| `src/components/result/weather-display.tsx` | 天气展示组件 | 展示 |
| `src/components/result/attraction-card.tsx` | 景点卡片 | 展示 |
| `src/components/result/hotel-card.tsx` | 酒店卡片 | 展示 |
| `src/components/result/meal-card.tsx` | 餐饮卡片 | 展示 |

---

## 2. 数据类型系统 — 一切数据的起点

所有数据流动的根基在 [src/types/index.ts](file:///d:/workspace/ai/trip-planner-langgraph/src/types/index.ts)。理解这些类型就能理解整个项目在"传递什么"。

### 2.1 核心类型关系图

```
TripRequest (用户输入)
  ├── city: string           — 目的地城市
  ├── startDate/endDate      — 出行日期范围
  ├── travelDays: number     — 旅行天数
  ├── transportation         — 交通方式 (枚举)
  ├── accommodation          — 住宿偏好 (枚举)
  ├── preferences: string[]  — 兴趣标签 ["历史文化","美食"]
  └── freeTextInput?: string — 自由文本需求

         │ POST /api/trip/plan
         ▼
TripPlan (AI 生成结果)
  ├── city / startDate / endDate
  ├── days: DayPlan[]          — 每日行程
  │     ├── date / dayIndex
  │     ├── description        — 当日概述
  │     ├── transportation     — 交通方式
  │     ├── hotel?: Hotel       — 推荐酒店
  │     ├── attractions: Attraction[] — 景点列表
  │     │     ├── name / address / location(经纬度)
  │     │     ├── visitDuration / description / category
  │     │     ├── rating / ticketPrice
  │     │     └── poiId / imageUrl / photos (可选)
  │     └── meals: Meal[]       — 餐饮 (早/午/晚/加餐)
  ├── weatherInfo: WeatherInfo[] — 逐日天气
  │     ├── dayWeather / nightWeather
  │     ├── dayTemp / nightTemp
  │     └── windDirection / windPower
  ├── overallSuggestions       — 整体建议
  └── budget?: Budget          — 预算明细
        ├── totalAttractions / totalHotels
        ├── totalMeals / totalTransportation
        └── total
```

### 2.2 前端开发者的关键理解

```typescript
// 类型是"契约"——前后端共享同一套类型
// 后端 AI 必须生成符合 TripPlan 结构的 JSON
// 前端组件根据 TripPlan 类型安全地渲染 UI

// 🌟 ApiResponse<T> 是 API 响应的通用包装
interface ApiResponse<T> {
  success: boolean;
  data?: T;       // 成功时携带数据
  error?: string; // 失败时携带错误
  message?: string;
}

// 🌟 Zod Schema 在 API 层做运行时验证
const tripRequestSchema = z.object({
  city: z.string().min(1, "请输入目的地城市"),
  // ... 确保收到的数据符合预期
});
```

---

## 3. 数据流动全链路解析

### 3.1 阶段一：前端表单 → API 请求（数据流出前端）

**核心文件**：[src/components/home/trip-form.tsx](file:///d:/workspace/ai/trip-planner-langgraph/src/components/home/trip-form.tsx)

```
用户填写表单
    │
    ▼
TripForm 组件维护 formData 状态
    │
    ▼
点击「开始规划我的旅行」
    │  handleSubmit()
    ▼
fetch POST /api/trip/plan  (60s AbortController 超时)
    │  body: JSON.stringify(formData)
    ▼
等待响应期间:
  ├── 显示 Loading 动画
  └── 轮播提示信息 (每 3s 切换)
    │
    ├── 成功 → router.push(`/result?sessionId=${data.data.sessionId}`)
    └── 失败 → 显示 ErrorAlert
```

**关键代码片段**：

```typescript
// TripForm.tsx — 前端数据流的起点
const handleSubmit = async () => {
  setLoading(true);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60_000);

  try {
    const response = await fetch("/api/trip/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),    // TripRequest → JSON
      signal: controller.signal,
    });

    const data = await response.json();  // ApiResponse<{ sessionId, plan }>

    if (data.success && data.data?.sessionId) {
      router.push(`/result?sessionId=${data.data.sessionId}`);
    }
  }
  // ... 错误处理
};
```

> **💡 前端心得**：这里使用了 `AbortController` 做前端超时控制，和后端 120s 超时形成"双重保险"。请求成功不直接渲染结果，而是拿到 `sessionId` 跳转页面——这是典型的"异步提交 + 轮询/按需查询"模式。

---

### 3.2 阶段二：API 层 — 请求校验与 Graph 调度（数据进入后端）

**核心文件**：[app/api/trip/plan/route.ts](file:///d:/workspace/ai/trip-planner-langgraph/app/api/trip/plan/route.ts)

```
收到 POST 请求
    │
    ├── 1. JSON 解析 → 失败返回 400
    │
    ├── 2. Zod Schema 校验 → 失败返回 400 + 详细错误
    │    tripRequestSchema.safeParse(body)
    │
    ├── 3. 生成 sessionId
    │    generateSessionId() → "trip_1680000000_a1b2c3d"
    │
    ├── 4. 执行 LangGraph (核心)
    │    Promise.race([
    │      runTripPlan(tripRequest),  // LangGraph 工作流
    │      timeoutPromise(120_000),   // 120s 超时保护
    │    ])
    │
    ├── 5. 持久化结果
    │    saveTripPlan(sessionId, tripPlan)
    │
    ├── 6. 清理 MCP 连接 (finally)
    │    closeMCPClient()
    │
    │
    ├── 成功 → 200 { success: true, data: { sessionId, plan } }
    └── 超时 → 504 { success: false, error: "规划超时..." }
        其他 → 500 { success: false, error: "..." }
```

**关键代码片段**：

```typescript
// route.ts — 后端 API 的编排逻辑
export async function POST(request: NextRequest) {
  // 1. 解析
  const body = await request.json();

  // 2. 校验（Zod — 类型安全的运行时验证）
  const parsed = tripRequestSchema.safeParse(body);

  // 3. 执行工作流（核心！）
  const tripPlan = await Promise.race([
    runTripPlan(tripRequest),   // 调用 LangGraph
    timeoutPromise,             // 120s 超时
  ]);

  // 4. 保存到内存 Store
  saveTripPlan(sessionId, tripPlan);

  // 5. 返回 sessionId 给前端
  return NextResponse.json({
    success: true,
    data: { sessionId, plan: tripPlan },
  });
}
```

---

### 3.3 阶段三：LangGraph 状态机 — AI 多智能体协作（核心后端）

**核心文件**：[src/lib/graph/trip-graph.ts](file:///d:/workspace/ai/trip-planner-langgraph/src/lib/graph/trip-graph.ts)

这是**项目最核心的文件**，也是 AI 驱动后端与传统后端最大的区别所在。

#### 3.3.1 State 定义 — 工作流的数据结构

```typescript
// 每个 Node 的输入输出都通过 State 传递
const TripState = Annotation.Root({
  messages:      Annotation<string[]>,    // 执行日志
  tripRequest:   Annotation<TripRequest>, // 原始请求（不变）
  attractions:   Annotation<Attraction[]>, // 景点搜索结果
  hotels:        Annotation<Hotel[]>,     // 酒店搜索结果
  weather:       Annotation<WeatherInfo[]>, // 天气查询结果
  tripPlan:      Annotation<TripPlan>,    // 最终生成的计划
  error:         Annotation<string>,      // 错误信息
  stage:         Annotation<string>,      // 当前阶段标记
});
```

> **💡 前端心得**：可以把 State 理解为一个"全局响应式对象"，和 React 的 `useReducer` 非常像。每个 Node 函数接收当前 State，返回 Partial<State> 来更新。`reducer` 字段决定了如何合并更新（大部分是 `(_, b) => b` 直接替换）。

#### 3.3.2 工作流拓扑图

```
         START
           │
           ▼
    ┌──────────────┐
    │ parse_input   │  验证请求参数，提取城市坐标
    └──────┬───────┘
           │
    ┌──────┴───────┐
    │   并行分叉     │   ←─── LangGraph 自动并行执行
    └──────┬───────┘
           │
    ┌──────┴───────┬──────────────┬──────────────┐
    │              │              │              │
    ▼              ▼              ▼              │
┌─────────┐  ┌─────────┐  ┌─────────┐          │
│search_  │  │ query_  │  │ search_ │          │
│attrac-  │  │ weather │  │ hotels  │          │
│tions    │  │         │  │         │          │
└────┬────┘  └────┬────┘  └────┬────┘          │
    │              │              │              │
    └──────┬───────┴──────────────┘              │
           │  三个节点全部完成后才进入下一步      │
           ▼                                     │
    ┌──────────────┐                              │
    │ plan_        │  整合景点+酒店+天气→生成行程  │
    │ itinerary    │                              │
    └──────┬───────┘                              │
           │                                      │
           ▼                                      │
    ┌──────────────┐                              │
    │ format_output│  确保预算字段存在             │
    └──────┬───────┘                              │
           │                                      │
           ▼                                      │
          END  ◄──────────────────────────────────┘
```

#### 3.3.3 节点执行逻辑详解

**节点 1：`parse_input`**

```typescript
async function parseInput(state) {
  // 职责：验证请求存在，输出一条日志
  // 简单但必要——作为工作流的入口检查点
  return {
    messages: ["✅ 旅行请求解析完成"],
    stage: "parsed",
  };
}
```

**节点 2/3/4：三个并行搜索节点**

这三个节点的结构完全一致，是**理解 AI Agent 工作模式的关键**：

```typescript
async function searchAttractions(state) {
  // STEP 1: 通过 MCP 调用外部 API 获取真实数据
  const mcpTools = await getMCPTools();                  // 连接高德 MCP
  const keywordTool = findTool(mcpTools, "keywords_search");
  const result = await keywordTool.invoke({               // 调用高德 POI 搜索
    keywords: `${request.city} 热门景点`,
    city: request.city,
  });

  // STEP 2: 将 MCP 真实数据作为 Context 注入 LLM
  const mcpContext = `## 高德地图 POI 搜索原始数据\n${result}`;

  // STEP 3: 调用 LLM，让它基于真实数据生成结构化输出
  const llm = getLLM();                                   // OpenAI GPT-4o
  const response = await llm.invoke([
    new SystemMessage("你是一个专业旅行规划助手..."),
    new HumanMessage(`${mcpContext}${prompt}`),
  ]);

  // STEP 4: 解析 LLM 返回的 JSON
  const attractions = safeJSONParse<Attraction[]>(text, []);
  return { attractions, messages: [...], stage: "attractions_done" };
}
```

> **理解要点**：这不是传统后端"查数据库 → 返回数据"的模式，而是：
> 1. Agent 通过工具（MCP）获取**原始数据**
> 2. Agent 带着原始数据去问 LLM："根据这些数据，生成结构化的推荐列表"
> 3. LLM 返回 JSON → 解析后存入 State

**节点 5：`plan_itinerary` — 核心编排节点**

```typescript
async function planItinerary(state) {
  // 把三个搜索节点的结果拼成上下文
  const contextParts = [
    `## 已识别的景点\n${JSON.stringify(state.attractions)}`,
    `## 已筛选的酒店\n${JSON.stringify(state.hotels)}`,
    `## 天气信息\n${JSON.stringify(state.weather)}`,
  ];

  // 让 LLM 综合所有信息生成完整行程
  const response = await llm.invoke([
    new SystemMessage("你是一个资深旅行规划师..."),
    new HumanMessage(`${contextStr}\n\n${prompt}`),
  ]);

  // 容错机制：LLM 失败 → Fallback Prompt → 硬编码方案
  let tripPlan = safeJSONParse<TripPlan>(text, null, ["city", "days"]);
  if (!tripPlan) tripPlan = await fallback();  // 重新用简单 Prompt 生成
  if (!tripPlan) tripPlan = hardcodedPlan();    // 最后兜底
}
```

**节点 6：`format_output` — 数据清洗**

```typescript
async function formatOutput(state) {
  // 确保 budget 字段存在
  if (!tripPlan.budget) {
    // 逐日累加门票、酒店、餐饮费用
    // 交通费用按每天 50 元估算
    tripPlan.budget = {
      totalAttractions, totalHotels, totalMeals,
      totalTransportation: days.length * 50,
      total: 各项总和,
    };
  }
  // 此节点输出最终完整的 TripPlan
}
```

#### 3.3.4 工作流注册

```typescript
function createTripGraph() {
  const workflow = new StateGraph(TripState)
    .addNode("parse_input", parseInput)
    .addNode("search_attractions", searchAttractions)
    .addNode("query_weather", queryWeather)
    .addNode("search_hotels", searchHotels)
    .addNode("plan_itinerary", planItinerary)
    .addNode("format_output", formatOutput)
    .addEdge(START, "parse_input")
    .addEdge("parse_input", "search_attractions")   // 分叉
    .addEdge("parse_input", "query_weather")         // 分叉
    .addEdge("parse_input", "search_hotels")         // 分叉
    .addEdge("search_attractions", "plan_itinerary") // 汇合
    .addEdge("query_weather", "plan_itinerary")      // 汇合
    .addEdge("search_hotels", "plan_itinerary")      // 汇合
    .addEdge("plan_itinerary", "format_output")
    .addEdge("format_output", END);

  return workflow.compile();
}
```

> **💡 前端类比**：可以把 `StateGraph` 想像成一个**发布-订阅系统** + **有向无环图执行引擎**。每个 Node 是事件处理函数，Edge 定义了执行顺序，State 是全局 Store。LangGraph 自动处理并行节点的完成等待——三个搜索节点全部执行完才会触发 `plan_itinerary`。

---

### 3.4 阶段四：MCP 客户端 — 外部数据获取

**核心文件**：[src/lib/mcp-client.ts](file:///d:/workspace/ai/trip-planner-langgraph/src/lib/mcp-client.ts)

MCP (Model Context Protocol) 是 AI 模型与外部工具之间的标准化协议。

```
┌──────────────┐     MCP 协议      ┌───────────────┐
│  LangGraph    │ ◄─────────────►  │  高德 MCP     │
│  Agent Node   │   标准化接口     │  Server       │
│              │                  │               │
│  findTool()  │ ──► invoke() ──► │ POI 关键词搜索 │
│  getMCPTools()│                  │ 天气查询       │
└──────────────┘                  └───────────────┘
```

```typescript
// 单例模式：首次调用时建立连接
export async function getMCPTools() {
  if (cachedTools) return cachedTools;  // 缓存

  mcpClient = new MultiServerMCPClient({
    mcpServers: {
      amap: {
        url: `https://mcp.amap.com/mcp?key=${amapKey}`,
        transport: "http",
      },
    },
  });

  const tools = await client.getTools();
  cachedTools = tools as DynamicStructuredTool[];
  return cachedTools;
}

// 在 Serverless 环境下每次请求后必须清理连接
export async function closeMCPClient() {
  await mcpClient.close();
  mcpClient = null;
  cachedTools = null;
}
```

---

### 3.5 阶段五：结果查询 API — 被动查询模式

**核心文件**：[app/api/trip/result/route.ts](file:///d:/workspace/ai/trip-planner-langgraph/app/api/trip/result/route.ts)

```
GET /api/trip/result?sessionId=trip_xxx
    │
    ├── 检查 sessionId 参数 → 无则 400
    │
    ├── getTripPlan(sessionId) 从 Map 读取
    │
    ├── 找到 → 200 { success: true, data: TripPlan }
    └── 未找到 → 404 { success: false, error: "未找到..." }
```

这个 API 极其简单，只做一件事：**根据 key 从内存 Map 中取数据并返回**。

---

### 3.6 阶段六：Store — 内存中的临时数据库

**核心文件**：[src/lib/store.ts](file:///d:/workspace/ai/trip-planner-langgraph/src/lib/store.ts)

```typescript
// 就是一个 Map —— 前端开发者可以理解为 useState 的全局版本
const store = new Map<string, StoreEntry>();

// StoreEntry 结构
interface StoreEntry {
  plan: TripPlan;                    // 规划的旅行方案
  createdAt: number;                 // 创建时间戳
  timer: ReturnType<typeof setTimeout>; // TTL 定时器
}
```

**特性**：
- **TTL 自动过期**：30 分钟后自动删除（`setTimeout` + `cleanupEntry`）
- **LRU 淘汰**：最多存 1000 条，超出时淘汰最旧条目
- **两个操作函数**：`saveTripPlan(sessionId, plan)` 和 `getTripPlan(sessionId)`

> **💡 为什么用内存存储而不是数据库？**  
> 这个项目的目标是展示 LangGraph 的 AI 工作流能力。用内存 Map 存储结果，简化了基础设施。生产环境通常会替换为 Redis 或数据库。

---

### 3.7 阶段七：前端结果页 — 数据回流展示

**核心文件**：[src/hooks/use-trip-plan.ts](file:///d:/workspace/ai/trip-planner-langgraph/src/hooks/use-trip-plan.ts) + [app/result/page.tsx](file:///d:/workspace/ai/trip-planner-langgraph/app/result/page.tsx)

```
Result Page 加载
    │  URL: /result?sessionId=trip_xxx
    ▼
useTripPlan(sessionId) Hook
    │  useSWR(`/api/trip/result?sessionId=${sessionId}`)
    ▼
SWR 自动发起 GET 请求
    │
    ├── isLoading → 显示 LoadingSpinner
    │
    ├── isError → 显示 EmptyState (404 过期等)
    │
    └── 成功 → tripPlan 数据可用
          │
          ▼
    ResultTabs 切换三种视图
    ├── OverviewTab → DayCard[] → AttractionCard / HotelCard / MealCard / WeatherDisplay
    ├── BudgetTab   → 费用柱状图 + 总费用
    └── MapTab      → 高德 JS API 地图标记景点
```

**SWR Hook 实现**：

```typescript
export function useTripPlan(sessionId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<ApiResponse<TripPlan>>(
    sessionId ? `/api/trip/result?sessionId=${sessionId}` : null,
    fetcher,  // fetcher = (url) => fetch(url).then(res => res.json())
    {
      revalidateOnFocus: false,  // 不因焦点变化重新请求
      shouldRetryOnError: true,  // 失败自动重试
      errorRetryCount: 3,        // 最多重试 3 次
    }
  );

  return {
    tripPlan: data?.success ? data.data : null,
    isLoading,
    isError: !!error || (data && !data.success),
  };
}
```

> **💡 SWR 的好处**：自动缓存、自动重试、消除竞态条件。不需要手动管理 loading/error 状态。`sessionId` 为 null 时不发起请求（对应还未跳转的场景）。

---

## 4. 完整数据流时序图

```
User              TripForm              API Route            LangGraph              MCP (Amap)           ResultPage
 │                    │                     │                     │                      │                    │
 │ 填写表单           │                     │                     │                      │                    │
 │───────────────────▶│                     │                     │                      │                    │
 │                    │                     │                     │                      │                    │
 │ 点击提交           │                     │                     │                      │                    │
 │───────────────────▶│                     │                     │                      │                    │
 │                    │ POST /api/trip/plan │                     │                      │                    │
 │                    │────────────────────▶│                     │                      │                    │
 │                    │                     │ Zod 校验            │                      │                    │
 │                    │                     │ 生成 sessionId       │                      │                    │
 │                    │                     │ runTripPlan()       │                      │                    │
 │                    │                     │────────────────────▶│                      │                    │
 │                    │                     │                     │ parse_input          │                    │
 │                    │                     │                     │────┐                 │                    │
 │                    │                     │                     │    │并行            │                    │
 │                    │                     │                     │◄───┘                 │                    │
 │                    │                     │                     │                      │                    │
 │                    │                     │                     │ search_attractions   │                    │
 │                    │                     │                     │─────────────────────▶│ POI搜索            │
 │                    │                     │                     │◀─────────────────────│                    │
 │                    │                     │                     │                      │                    │
 │                    │                     │                     │ query_weather        │                    │
 │                    │                     │                     │─────────────────────▶│ 天气查询            │
 │                    │                     │                     │◀─────────────────────│                    │
 │                    │                     │                     │                      │                    │
 │                    │                     │                     │ search_hotels        │                    │
 │                    │                     │                     │─────────────────────▶│ 酒店搜索            │
 │                    │                     │                     │◀─────────────────────│                    │
 │                    │                     │                     │                      │                    │
 │                    │                     │                     │ plan_itinerary       │                    │
 │                    │                     │                     │ (LLM 整合+生成)      │                    │
 │                    │                     │                     │                      │                    │
 │                    │                     │                     │ format_output        │                    │
 │                    │                     │                     │ (补充预算)           │                    │
 │                    │                     │                     │                      │                    │
 │                    │                     │ saveTripPlan()      │                      │                    │
 │                    │                     │◀────────────────────│ TripPlan              │                    │
 │                    │                     │                     │                      │                    │
 │                    │  ◀─── {sessionId} ──┤                     │                      │                    │
 │                    │                     │                     │                      │                    │
 │   router.push()    │                     │                     │                      │                    │
 │◀───────────────────│                     │                     │                      │                    │
 │                    │                     │                     │                      │                    │
 │   /result?sessionId=trip_xxx                                  │                      │                    │
 │──────────────────────────────────────────────────────────────────────────────────────▶ Result Page
 │                                                                                       │
 │                                                              GET /api/trip/result       │
 │                                                         useSWR 自动发起                │
 │◀───────────────────────────────────────────────────────────────────────────────────────│
 │                                                                                       │
 │                                                        ┌─── OverviewTab               │
 │                                                  渲染  ├─── BudgetTab                  │
 │                                                        └─── MapTab                    │
```

---

## 5. 推荐学习路径

### 5.1 最佳入门文件

**首选：[src/types/index.ts](file:///d:/workspace/ai/trip-planner-langgraph/src/types/index.ts)**

**理由**：
1. **零业务逻辑**：纯类型定义，前端开发者完全没有理解障碍
2. **全局视角**：读完类型定义就能知道整个项目在"处理什么数据"
3. **既是起点也是终点**：`TripRequest` 是数据流的起点，`TripPlan` 是终点
4. **包含 Zod Schema**：可以学习如何用 Zod 做运行时验证——这是全栈开发的必备技能

**学习步骤**：

```
Step 1: src/types/index.ts
        └── 理解 TripRequest → TripPlan 的完整数据结构
        
Step 2: src/components/home/trip-form.tsx
        └── 数据从"用户输入"变成"API 请求"的过程
        
Step 3: app/api/trip/plan/route.ts
        └── 数据从"HTTP 请求"进入"后端处理"的边界
        
Step 4: src/lib/graph/trip-graph.ts
        └── 核心！理解 State → Node → Edge 的 LangGraph 模式
        
Step 5: src/lib/mcp-client.ts + src/lib/prompts.ts
        └── 理解 Agent 如何通过 MCP 获取外部数据 + LLM 如何生成结果

Step 6: src/lib/store.ts
        └── 理解结果如何被暂存

Step 7: src/hooks/use-trip-plan.ts
        └── 理解前端如何消费后端数据

Step 8: app/result/page.tsx + src/components/result/*
        └── 理解数据最终如何渲染为 UI
```

---

## 6. 关键概念速查表

### 6.1 LangGraph 核心概念

| 概念 | 类比前端 | 说明 |
|------|----------|------|
| **StateGraph** | Redux Store + 中间件 | 全局状态容器，定义状态结构和更新方式 |
| **State** | Store 的状态树 | 所有节点共享的数据对象 |
| **Node** | Redux Reducer | 一个处理函数，接收旧状态，返回部分更新 |
| **Edge** | 流程控制 | 定义节点的执行顺序 |
| **Annotation** | TypeScript 类型 + Reducer 定义 | 描述状态的类型和如何合并更新 |
| **编译(compile)** | 创建 Store | 将定义好的图编译成可执行的实例 |

### 6.2 MCP (Model Context Protocol) 核心概念

| 概念 | 说明 |
|------|------|
| **MCP Server** | 暴露标准化 API 的工具服务器（如高德地图） |
| **MCP Client** | AI Agent 用来调用工具的统一客户端 |
| **Tool** | 一个具体的功能调用（如 `keywords_search`、`weather`） |
| **Transport** | 通信协议（本项目使用 HTTP） |

### 6.3 前端技术点

| 技术 | 在本项目中的用途 |
|------|------------------|
| **SWR** | 自动发送 GET 请求获取结果数据，内置缓存和重试 |
| **Zod** | API 层运行时校验，确保用户输入符合预期格式 |
| **Framer Motion** | Loading 动画、Tab 切换动画、卡片入场动效 |
| **html2canvas + jsPDF** | 导出功能：将 DOM 渲染为图片/PDF |
| **AbortController** | 前端请求超时控制（60s） |

---

## 7. 容错机制总结

本项目的多层容错设计值得学习：

```
┌─────────────────────────────────────────────────────┐
│                   容错金字塔                          │
│                                                     │
│  第一层：Zod Schema 校验 (API 入口)                    │
│  拦截非法请求，返回明确的 400 错误                      │
│                                                     │
│  第二层：Promise.race 超时 (API 层)                     │
│  120s 超时 → 504，防止请求挂死                        │
│                                                     │
│  第三层：Frontend AbortController                     │
│  60s 前端超时，避免用户无限等待                        │
│                                                     │
│  第四层：safeJSONParse + Fallback Prompt (Graph 内)   │
│  LLM 返回非 JSON → 用 Fallback Prompt 重试            │
│                                                     │
│  第五层：Hardcoded Plan 降级                          │
│  LLM 完全失败 → 生成硬编码的通用计划                   │
│                                                     │
│  第六层：SWR Auto Retry                              │
│  结果页请求失败 → 自动重试 3 次                        │
│                                                     │
│  第七层：Store TTL 过期通知                           │
│  结果过期 → 404 + EmptyState 引导用户重新创建           │
└─────────────────────────────────────────────────────┘
```

---

## 8. 总结：前后端数据流映射

| 阶段 | 数据结构 | 所在层 | 关键文件 |
|------|----------|--------|----------|
| 用户输入 | `TripRequest` | 前端 | `trip-form.tsx` |
| HTTP 请求 | JSON body | 网络 | `fetch()` |
| 请求校验 | `tripRequestSchema` | API | `app/api/trip/plan/route.ts` |
| AI 处理 | `LangGraph State` | 后端 | `trip-graph.ts` |
| 外部数据 | `MCP Tool Result` | 网络 | `mcp-client.ts` |
| 结果存储 | `Map<sessionId, TripPlan>` | 后端 | `store.ts` |
| 结果查询 | `GET + sessionId` | API | `app/api/trip/result/route.ts` |
| 前端消费 | `SWR → TripPlan` | 前端 | `use-trip-plan.ts` |
| UI 渲染 | `React Components` | 前端 | `result/*.tsx` |

---

> **一句话总结**：  
> 用户在表单中输入 `TripRequest` → API 触发 LangGraph 多智能体工作流 → 三个 AI Agent 并行通过 MCP 调用高德地图获取数据 → 主 Planner Agent 整合所有信息生成 `TripPlan` → 存入内存 Store → 前端通过 SWR 拉取并分 Tab 展示。
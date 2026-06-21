# Trip Planner LangGraph

基于 LangGraph 多智能体工作流的智能旅行规划应用。

## 功能特性

- **智能行程规划**：输入目的地、日期、偏好等，自动生成完整旅行计划
- **多智能体并行协作**：使用 LangGraph StateGraph 构建多个专业 Agent 并行处理任务
  - 景点搜索 Agent
  - 酒店推荐 Agent
  - 天气查询 Agent
  - 行程规划 Agent（三搜索节点完成后汇合执行）
- **高德地图集成**：通过 MCP (Model Context Protocol) 调用高德地图 API
  - POI 关键词搜索
  - 天气查询
- **可视化行程展示**：按日展示行程卡片，支持展开/收起详情；集成高德 JS API 地图视图
- **预算估算**：自动计算景点门票、住宿、餐饮费用，柱状图可视化各项占比
- **导出功能**：支持导出 PDF 和 PNG 格式行程单
- **渐进式加载反馈**：分阶段显示加载文案，实时感知规划进度

## 技术栈

| 层 | 技术选型 |
|---|---|
| 前端框架 | Next.js 16 + React 19 + TypeScript |
| 样式方案 | Tailwind CSS 4 |
| AI 引擎 | LangChain + LangGraph |
| LLM | OpenAI GPT-4o（支持自定义 Base URL） |
| 地图服务 | 高德地图 MCP + Web JS API v2.0 |
| 动画 | Framer Motion |
| 数据获取 | SWR |
| 校验 | Zod |
| 可观测性 | LangSmith（可选） |
| 测试 | Vitest + @testing-library/react |

## 项目结构

```
├── app/                        # Next.js App Router
│   ├── api/trip/              # API 路由
│   │   ├── plan/              # POST /api/trip/plan — 提交规划请求
│   │   └── result/            # GET /api/trip/result — 查询规划结果
│   ├── result/                # 结果展示页面
│   │   └── loading.tsx        # 结果页加载态
│   ├── error.tsx              # 根错误边界（捕获未预期异常 + 重试按钮）
│   ├── loading.tsx            # 根加载态
│   └── not-found.tsx          # 404 页面
├── src/
│   ├── components/            # React 组件
│   │   ├── home/              # 首页组件（HeroSection、TripForm、ErrorAlert）
│   │   ├── layout/            # 布局组件（Header、Footer）
│   │   ├── result/            # 结果展示组件
│   │   │   ├── day-card.tsx   # 每日行程卡片（展开/收起）
│   │   │   ├── budget-tab.tsx # 预算图表
│   │   │   ├── map-tab.tsx    # 高德地图视图
│   │   │   ├── overview-tab.tsx # 概览标签页
│   │   │   ├── weather-display.tsx # 天气展示
│   │   │   └── export-buttons.tsx # PDF/PNG 导出按钮
│   │   └── shared/            # 共享组件（LoadingSpinner）
│   ├── hooks/                 # 自定义 Hooks
│   │   ├── use-trip-plan.ts   # SWR 轮询 hooks
│   │   └── use-export.ts      # 导出 hooks（PDF/PNG）
│   ├── lib/
│   │   ├── graph/             # LangGraph 工作流（模块化）
│   │   │   ├── state.ts       # TripState Annotation 定义
│   │   │   ├── nodes/         # 节点函数（各 Agent 独立文件）
│   │   │   │   ├── parse-input.ts
│   │   │   │   ├── search-attractions.ts
│   │   │   │   ├── query-weather.ts
│   │   │   │   ├── search-hotels.ts
│   │   │   │   ├── plan-itinerary.ts
│   │   │   │   └── format-output.ts
│   │   │   ├── utils.ts       # 工具函数（extractJSON、safeJSONParse、getCityCoord）
│   │   │   ├── graph.ts       # StateGraph 组装
│   │   │   └── index.ts       # 对外 API（runTripPlan）
│   │   ├── agents/            # AI Agent 相关
│   │   │   ├── llm.ts         # LLM 实例封装（单例 + LangSmith）
│   │   │   └── prompts.ts     # Agent 提示词模板
│   │   ├── infra/              # 基础设施层
│   │   │   ├── mcp-client.ts   # MCP 客户端（工具发现 + 容错降级）
│   │   │   ├── store.ts        # 内存存储（TTL + LRU 淘汰）
│   │   │   ├── logger.ts       # 结构化日志
│   │   │   └── langsmith.ts    # LangSmith 追踪封装
│   │   └── utils.ts           # 通用工具（cn、generateSessionId）
│   └── types/                  # TypeScript 类型定义
├── proxy.ts                    # Next.js 16 中间件（API 请求日志）
├── vitest.config.mts           # Vitest 配置
└── 面试准备.md                 # 技术面试问答与项目复盘
```

## 工作流架构

```
START → parse_input
          ↓
    ┌─────┼─────┐
    ↓     ↓     ↓
search_ query_ search_
attractions weather hotels
    └─────┼─────┘
          ↓
   plan_itinerary
          ↓
   format_output
          ↓
        END
```

**三级降级容错链路**：
- Level 1：LLM Planner（基于真实 MCP 数据）
- Level 2：Fallback Planner（简化 prompt）
- Level 3：generateHardcodedPlan()（基于预设城市坐标）

## 快速开始

### 环境要求

- Node.js 20+
- npm

### 安装依赖

```bash
npm install
```

### 环境变量配置

创建 `.env.local` 文件：

```env
# OpenAI API 配置
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o
OPENAI_BASE_URL=https://api.openai.com/v1

# 高德地图 MCP 服务地址（可选，缺省时使用坐标降级方案）
MCP_SERVER_URL=http://localhost:3001/mcp

# LangSmith 追踪（可选）
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=your_langsmith_api_key
LANGCHAIN_PROJECT=trip-planner
```

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

### 运行测试

```bash
npm run test      # 监视模式
npm run test:run  # 单次运行
```

### 构建生产版本

```bash
npm run build
npm start
```

## 核心实现亮点

### 三级降级容错（MCP 容错）

MCP 外部工具调用存在网络超时、接口限流、返回格式不一致等问题。系统在 `mcp-client.ts` 中实现了：
- **模糊工具发现**：兼容不同版本的 MCP Server 工具名称（`keywords_search` vs `keyword`）
- **预设坐标降级**：当 MCP 调用失败时，使用内置的城市坐标映射表作为替代
- **三级容错链路**：LLM Planner → Fallback Planner → 硬编码方案

### LLM 输出鲁棒解析

LLM 输出的 JSON 格式不可控（多余 Markdown 标记、注释、截断等）。在 `utils.ts` 中实现：
- `extractJSON`：正则提取代码块或 JSON 结构
- `safeJSONParse`：安全解析 + 形状验证 + 多级 fallback
- 解析成功率从 ~92% 提升至 ~98%

### LangGraph 状态管理

- `TripState` 使用 `Annotation.Root` 定义，各字段独立 reducer（避免并行节点写入冲突）
- 三个搜索节点并行执行 → 汇合到 `plan_itinerary`（LangGraph 的「n 汇 1」边天然满足等待全部完成）
- LLM 实例和编译后的 Graph 均使用模块级单例缓存

### Serverless 资源管理

- API 路由 `finally` 块确保 MCP 连接释放
- 内存存储使用读取时惰性过期校验（无 `setTimeout`，兼容 Serverless）
- 120s 全局超时 + LRU 容量淘汰（MAX_CAPACITY=1000）

## API 接口

### POST /api/trip/plan

提交旅行规划请求，返回 sessionId，前端通过 SWR 轮询结果。

**请求体：**

```json
{
  "city": "北京",
  "startDate": "2024-01-01",
  "endDate": "2024-01-03",
  "travelDays": 3,
  "transportation": "公共交通",
  "accommodation": "舒适型酒店",
  "preferences": ["历史文化", "美食"],
  "freeTextInput": "想看故宫和长城"
}
```

**响应：**

```json
{
  "success": true,
  "data": {
    "sessionId": "abc123",
    "plan": { ... }
  }
}
```

### GET /api/trip/result?sessionId=xxx

查询规划结果（支持轮询）。

## 扩展开发

### 添加新的 Agent

1. 在 `src/lib/graph/nodes/` 创建新节点函数（如 `search_restaurants.ts`）
2. 在 `src/lib/graph/state.ts` 的 `TripState` 中添加对应的状态字段
3. 在 `src/lib/graph/graph.ts` 中更新工作流图，添加节点和边
4. 为新节点编写单元测试和集成测试

### 自定义提示词

修改 `src/lib/agents/prompts.ts` 中的 Agent 提示词模板。

### 接入 LangSmith 追踪

设置环境变量 `LANGCHAIN_TRACING_V2=true` 和 `LANGCHAIN_API_KEY`，即可在 LangSmith UI 中查看完整的执行轨迹、token 消耗和各节点耗时。

## 测试覆盖

| 测试类型 | 覆盖范围 | 测试用例 |
|---------|---------|---------|
| 单元测试 | 工具函数、store LRU/过期、Zod 校验 | 25+ |
| 集成测试 | 完整工作流（mock LLM + mock MCP） | 7 |
| API 路由测试 | 参数校验、超时路径、错误处理 | 8 |
| 组件测试 | DayCard、BudgetTab、EmptyState 渲染与交互 | 12 |
| **总计** | | **58** |

## License

MIT

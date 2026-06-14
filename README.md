# Trip Planner LangGraph

基于 LangGraph 多智能体工作流的智能旅行规划应用。

## 功能特性

- **智能行程规划**：输入目的地、日期、偏好等，自动生成完整旅行计划
- **多智能体协作**：使用 LangGraph 构建多个专业 Agent 并行处理任务
  - 景点搜索 Agent
  - 酒店推荐 Agent
  - 天气查询 Agent
  - 行程规划 Agent
- **高德地图集成**：通过 MCP (Model Context Protocol) 调用高德地图 API
  - POI 关键词搜索
  - 天气查询
- **预算估算**：自动计算景点门票、住宿、餐饮、交通费用
- **导出功能**：支持导出 PDF 格式行程单

## 技术栈

- **前端框架**：Next.js 16 + React 19 + TypeScript
- **样式**：Tailwind CSS 4
- **AI 框架**：LangChain + LangGraph
- **LLM**：OpenAI API (支持自定义 Base URL)
- **地图服务**：高德地图 MCP
- **动画**：Framer Motion
- **PDF 导出**：jsPDF + html2canvas

## 项目结构

```
├── app/                    # Next.js App Router
│   ├── api/trip/          # API 路由
│   │   ├── plan/          # 行程规划接口
│   │   └── result/         # 结果查询接口
│   └── result/            # 结果展示页面
├── src/
│   ├── components/        # React 组件
│   │   ├── home/          # 首页组件
│   │   ├── layout/        # 布局组件
│   │   ├── result/        # 结果展示组件
│   │   └── shared/        # 共享组件
│   ├── hooks/             # 自定义 Hooks
│   ├── lib/
│   │   ├── graph/         # LangGraph 工作流定义
│   │   ├── mcp-client.ts   # MCP 客户端
│   │   ├── prompts.ts      # Agent 提示词
│   │   └── store.ts        # 状态存储
│   └── types/              # TypeScript 类型定义
└── public/                 # 静态资源
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

## 快速开始

### 环境要求

- Node.js 18+
- npm 或 pnpm

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

# 高德地图 MCP 服务地址（可选）
MCP_SERVER_URL=http://localhost:3001/mcp
```

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

### 构建生产版本

```bash
npm run build
npm start
```

## API 接口

### POST /api/trip/plan

提交旅行规划请求。

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

### GET /api/trip/result?taskId=xxx

查询规划结果。

## 扩展开发

### 添加新的 Agent

1. 在 `src/lib/graph/trip-graph.ts` 中定义新节点函数
2. 在 State 中添加对应的状态字段
3. 更新工作流图，添加节点和边

### 自定义提示词

修改 `src/lib/prompts.ts` 中的 Agent 提示词模板。

## License

MIT
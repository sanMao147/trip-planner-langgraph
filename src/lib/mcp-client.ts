import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import type { DynamicStructuredTool } from "@langchain/core/tools";
import { createLogger } from "@/lib/logger";

/** 日志记录器实例 */
const logger = createLogger("MCP");

/** MCP 客户端实例缓存 */
let mcpClient: MultiServerMCPClient | null = null;

/** MCP 工具缓存 */
let cachedTools: DynamicStructuredTool[] | null = null;

/**
 * 获取 MCP 客户端实例（单例模式）
 * 
 * 创建并返回连接到高德地图 MCP Server 的客户端实例。
 * 使用单例模式避免重复创建连接，提升性能。
 * 
 * @returns MultiServerMCPClient 实例
 * @throws 如果环境变量 AMAP_KEY 未设置，抛出错误
 */
export async function getMCPClient(): Promise<MultiServerMCPClient> {
  // 如果已有实例，直接返回
  if (mcpClient) return mcpClient;

  // 检查高德地图 API Key
  const amapKey = process.env.AMAP_KEY;
  if (!amapKey) {
    throw new Error("AMAP_KEY 环境变量未设置，无法连接高德 MCP Server");
  }

  // 创建 MCP 客户端实例
  mcpClient = new MultiServerMCPClient({
    mcpServers: {
      amap: {
        url: `https://mcp.amap.com/mcp?key=${amapKey}`,
        transport: "http",
      },
    },
  });

  return mcpClient;
}

/**
 * 获取 MCP 工具列表（带缓存）
 * 
 * 从高德 MCP Server 获取可用的工具列表，并缓存结果以避免重复请求。
 * 
 * @returns DynamicStructuredTool 工具数组
 */
export async function getMCPTools(): Promise<DynamicStructuredTool[]> {
  // 如果已有缓存，直接返回
  if (cachedTools) return cachedTools;

  // 获取 MCP 客户端并获取工具列表
  const client = await getMCPClient();
  const tools = await client.getTools();
  cachedTools = tools as DynamicStructuredTool[];

  // 记录加载的工具信息
  logger.info(
    `加载高德 MCP 工具完成，共 ${cachedTools.length} 个工具:`,
    cachedTools.map((t) => t.name).join(", ")
  );

  return cachedTools;
}

/**
 * 关闭 MCP 客户端连接并清理缓存
 * 
 * 在 Serverless 环境（如 Vercel）中，应在请求完成后调用此方法，
 * 以防止模块复用时连接累积泄漏。
 * 
 * @returns void
 */
export async function closeMCPClient(): Promise<void> {
  if (mcpClient) {
    try {
      await mcpClient.close();
      logger.info("MCP 客户端连接已关闭");
    } catch (error) {
      logger.error("关闭 MCP 客户端时出错:", error);
    }
    // 重置缓存
    mcpClient = null;
    cachedTools = null;
  }
}

/**
 * 根据名称模式查找工具
 * 
 * 支持精确匹配、包含匹配和大小写不敏感匹配，提高工具查找的灵活性。
 * 
 * @param tools 工具数组
 * @param namePattern 工具名称模式
 * @returns 匹配的工具或 undefined
 */
export function findTool(
  tools: DynamicStructuredTool[],
  namePattern: string
): DynamicStructuredTool | undefined {
  return tools.find(
    (t) =>
      // 精确匹配
      t.name === namePattern ||
      // 包含匹配
      t.name.includes(namePattern) ||
      // 大小写不敏感包含匹配
      t.name.toLowerCase().includes(namePattern.toLowerCase())
  );
}
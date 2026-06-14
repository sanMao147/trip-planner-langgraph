import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import type { DynamicStructuredTool } from "@langchain/core/tools";
import { createLogger } from "@/lib/logger";

const logger = createLogger("MCP");

let mcpClient: MultiServerMCPClient | null = null;
let cachedTools: DynamicStructuredTool[] | null = null;

export async function getMCPClient(): Promise<MultiServerMCPClient> {
  if (mcpClient) return mcpClient;

  const amapKey = process.env.AMAP_KEY;
  if (!amapKey) {
    throw new Error("AMAP_KEY 环境变量未设置，无法连接高德 MCP Server");
  }

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

export async function getMCPTools(): Promise<DynamicStructuredTool[]> {
  if (cachedTools) return cachedTools;

  const client = await getMCPClient();
  const tools = await client.getTools();
  cachedTools = tools as DynamicStructuredTool[];

  logger.info(
    `加载高德 MCP 工具完成，共 ${cachedTools.length} 个工具:`,
    cachedTools.map((t) => t.name).join(", ")
  );

  return cachedTools;
}

/**
 * 关闭 MCP 客户端连接并清理缓存
 * 在 Serverless 环境（如 Vercel）中，应在请求完成后调用此方法
 * 以防止模块复用时连接累积泄漏
 */
export async function closeMCPClient(): Promise<void> {
  if (mcpClient) {
    try {
      await mcpClient.close();
      logger.info("MCP 客户端连接已关闭");
    } catch (error) {
      logger.error("关闭 MCP 客户端时出错:", error);
    }
    mcpClient = null;
    cachedTools = null;
  }
}

export function findTool(
  tools: DynamicStructuredTool[],
  namePattern: string
): DynamicStructuredTool | undefined {
  return tools.find(
    (t) =>
      t.name === namePattern ||
      t.name.includes(namePattern) ||
      t.name.toLowerCase().includes(namePattern.toLowerCase())
  );
}



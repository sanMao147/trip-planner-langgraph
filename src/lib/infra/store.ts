import { TripPlan } from "@/types";
import { createLogger } from "@/lib/infra/logger";

/** 日志记录器实例 */
const logger = createLogger("Store");

/** 默认缓存过期时间：30分钟（毫秒） */
const DEFAULT_MAX_AGE_MS = 30 * 60 * 1000;

/** 缓存最大容量 */
const MAX_CAPACITY = 1000;

/**
 * 存储条目接口
 * 包含旅行计划和创建时间，使用惰性过期策略
 */
interface StoreEntry {
  /** 旅行计划数据 */
  plan: TripPlan;
  /** 创建时间戳（毫秒） */
  createdAt: number;
}

/**
 * 内存存储映射
 * 使用 sessionId 作为键，存储对应的旅行计划
 */
const store = new Map<string, StoreEntry>();

/**
 * 清理指定会话的存储条目
 * 
 * 从存储中删除条目。
 * 
 * @param sessionId 会话ID
 */
function cleanupEntry(sessionId: string): void {
  if (store.delete(sessionId)) {
    logger.debug(`会话 ${sessionId} 已清理`);
  }
}

/**
 * 强制执行容量限制
 * 
 * 当存储数量超过最大容量时，使用 LRU（最近最少使用）策略淘汰最旧的条目。
 */
function enforceCapacity(): void {
  while (store.size > MAX_CAPACITY) {
    // 查找最旧的条目
    let oldestKey = "";
    let oldestTime = Infinity;
    
    for (const [key, entry] of store.entries()) {
      if (entry.createdAt < oldestTime) {
        oldestTime = entry.createdAt;
        oldestKey = key;
      }
    }
    
    // 淘汰最旧条目
    if (oldestKey) {
      cleanupEntry(oldestKey);
      logger.warn(`Store 容量超限，淘汰会话 ${oldestKey}`);
    }
  }
}

/**
 * 保存旅行计划到内存存储
 * 
 * 使用 sessionId 作为键存储旅行计划，使用惰性过期策略，在读取时检查 TTL。
 * 如果已存在相同 sessionId 的条目，会直接覆盖。
 * 
 * @param sessionId 会话ID
 * @param plan 旅行计划数据
 * @param maxAgeMs 过期时间（毫秒），默认30分钟（仅用于日志展示，实际过期在读取时检查）
 */
export function saveTripPlan(sessionId: string, plan: TripPlan, maxAgeMs = DEFAULT_MAX_AGE_MS): void {
  // 如果已存在则直接覆盖（无需清理定时器）
  // 存储条目
  store.set(sessionId, {
    plan,
    createdAt: Date.now(),
  });

  // 强制执行容量限制
  enforceCapacity();

  logger.info(`会话 ${sessionId} 已保存，TTL=${maxAgeMs / 1000}s，当前存储数=${store.size}`);
}

/**
 * 根据会话ID获取旅行计划
 * 
 * 使用惰性过期策略：如果条目已超过 TTL，则删除并返回 undefined。
 * 
 * @param sessionId 会话ID
 * @returns 旅行计划或 undefined（未找到或已过期）
 */
export function getTripPlan(sessionId: string): TripPlan | undefined {
  const entry = store.get(sessionId);
  if (!entry) return undefined;

  // 惰性过期检查：如果条目已超过 TTL，删除并返回 undefined
  if (Date.now() - entry.createdAt > DEFAULT_MAX_AGE_MS) {
    store.delete(sessionId);
    logger.debug(`会话 ${sessionId} 已过期（惰性清理）`);
    return undefined;
  }

  return entry.plan;
}

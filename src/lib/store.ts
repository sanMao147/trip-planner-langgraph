import { TripPlan } from "@/types";
import { createLogger } from "@/lib/logger";

/** 日志记录器实例 */
const logger = createLogger("Store");

/** 默认缓存过期时间：30分钟（毫秒） */
const DEFAULT_MAX_AGE_MS = 30 * 60 * 1000;

/** 缓存最大容量 */
const MAX_CAPACITY = 1000;

/**
 * 存储条目接口
 * 包含旅行计划、创建时间和自动清理定时器
 */
interface StoreEntry {
  /** 旅行计划数据 */
  plan: TripPlan;
  /** 创建时间戳（毫秒） */
  createdAt: number;
  /** 自动过期清理定时器 */
  timer: ReturnType<typeof setTimeout>;
}

/**
 * 内存存储映射
 * 使用 sessionId 作为键，存储对应的旅行计划
 */
const store = new Map<string, StoreEntry>();

/**
 * 清理指定会话的存储条目
 * 
 * 清除定时器并从存储中删除条目。
 * 
 * @param sessionId 会话ID
 */
function cleanupEntry(sessionId: string): void {
  const entry = store.get(sessionId);
  if (entry) {
    // 清除定时器
    clearTimeout(entry.timer);
    // 从存储中删除
    store.delete(sessionId);
    logger.debug(`会话 ${sessionId} 已过期并清理`);
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
 * 使用 sessionId 作为键存储旅行计划，并设置自动过期清理定时器。
 * 如果已存在相同 sessionId 的条目，会先清理旧的定时器和数据。
 * 
 * @param sessionId 会话ID
 * @param plan 旅行计划数据
 * @param maxAgeMs 过期时间（毫秒），默认30分钟
 */
export function saveTripPlan(sessionId: string, plan: TripPlan, maxAgeMs = DEFAULT_MAX_AGE_MS): void {
  // 如果已存在则先清理旧定时器
  if (store.has(sessionId)) {
    cleanupEntry(sessionId);
  }

  // 设置自动过期定时器
  const timer = setTimeout(() => {
    cleanupEntry(sessionId);
  }, maxAgeMs);

  // 存储条目
  store.set(sessionId, {
    plan,
    createdAt: Date.now(),
    timer,
  });

  // 强制执行容量限制
  enforceCapacity();
  
  logger.info(`会话 ${sessionId} 已保存，TTL=${maxAgeMs / 1000}s，当前存储数=${store.size}`);
}

/**
 * 根据会话ID获取旅行计划
 * 
 * @param sessionId 会话ID
 * @returns 旅行计划或 undefined（未找到）
 */
export function getTripPlan(sessionId: string): TripPlan | undefined {
  const entry = store.get(sessionId);
  return entry?.plan;
}
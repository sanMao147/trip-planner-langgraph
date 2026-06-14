import { TripPlan } from "@/types";
import { createLogger } from "@/lib/logger";

const logger = createLogger("Store");

const DEFAULT_MAX_AGE_MS = 30 * 60 * 1000; // 30 分钟
const MAX_CAPACITY = 1000;

interface StoreEntry {
  plan: TripPlan;
  createdAt: number;
  timer: ReturnType<typeof setTimeout>;
}

const store = new Map<string, StoreEntry>();

function cleanupEntry(sessionId: string): void {
  const entry = store.get(sessionId);
  if (entry) {
    clearTimeout(entry.timer);
    store.delete(sessionId);
    logger.debug(`会话 ${sessionId} 已过期并清理`);
  }
}

function enforceCapacity(): void {
  while (store.size > MAX_CAPACITY) {
    // 淘汰最旧条目（LRU）
    let oldestKey = "";
    let oldestTime = Infinity;
    for (const [key, entry] of store.entries()) {
      if (entry.createdAt < oldestTime) {
        oldestTime = entry.createdAt;
        oldestKey = key;
      }
    }
    if (oldestKey) {
      cleanupEntry(oldestKey);
      logger.warn(`Store 容量超限，淘汰会话 ${oldestKey}`);
    }
  }
}

export function saveTripPlan(sessionId: string, plan: TripPlan, maxAgeMs = DEFAULT_MAX_AGE_MS): void {
  // 如果已存在则先清理旧定时器
  if (store.has(sessionId)) {
    cleanupEntry(sessionId);
  }

  const timer = setTimeout(() => {
    cleanupEntry(sessionId);
  }, maxAgeMs);

  store.set(sessionId, {
    plan,
    createdAt: Date.now(),
    timer,
  });

  enforceCapacity();
  logger.info(`会话 ${sessionId} 已保存，TTL=${maxAgeMs / 1000}s，当前存储数=${store.size}`);
}

export function getTripPlan(sessionId: string): TripPlan | undefined {
  const entry = store.get(sessionId);
  return entry?.plan;
}



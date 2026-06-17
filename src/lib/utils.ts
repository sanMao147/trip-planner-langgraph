import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * 合并 CSS 类名的工具函数
 * 
 * 使用 clsx 处理条件类名，再用 twMerge 合并 Tailwind CSS 类名，
 * 解决 Tailwind 类名冲突问题。
 * 
 * @param inputs CSS 类名数组（支持条件类名）
 * @returns 合并后的类名字符串
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 生成唯一的会话 ID
 * 
 * 格式：trip_{时间戳}_{7位随机字符串}
 * 确保会话 ID 的唯一性，用于标识每次旅行规划请求。
 * 
 * @returns 唯一的会话 ID
 */
export function generateSessionId(): string {
  return `trip_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
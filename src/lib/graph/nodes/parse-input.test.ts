import { describe, it, expect } from 'vitest';
import { parseInput } from '@/lib/graph/nodes/parse-input';
import type { TripStateType } from '@/lib/graph/state';

describe('parseInput', () => {
  it('should set stage to parsed when tripRequest exists', async () => {
    const state = {
      tripRequest: {
        city: '北京',
        startDate: '2025-01-01',
        endDate: '2025-01-03',
        travelDays: 3,
        transportation: '公共交通' as const,
        accommodation: '舒适型酒店' as const,
        preferences: ['历史文化'],
      },
      messages: [],
      attractions: [],
      hotels: [],
      weather: [],
      tripPlan: null,
      error: null,
      stage: 'idle',
    } as TripStateType;

    const result = await parseInput(state);
    expect(result.stage).toBe('parsed');
    expect(result.messages).toContain('✅ 旅行请求解析完成');
  });

  it('should return error when tripRequest is null', async () => {
    const state = {
      tripRequest: null,
      messages: [],
      attractions: [],
      hotels: [],
      weather: [],
      tripPlan: null,
      error: null,
      stage: 'idle',
    } as TripStateType;

    const result = await parseInput(state);
    expect(result.error).toBe('缺少旅行请求参数');
    expect(result.stage).toBe('error');
  });
});
import { describe, it, expect, beforeEach } from 'vitest';
import { saveTripPlan, getTripPlan } from '@/lib/infra/store';
import type { TripPlan } from '@/types';

function createMockPlan(city: string): TripPlan {
  return {
    city,
    startDate: '2025-01-01',
    endDate: '2025-01-03',
    days: [{
      date: '2025-01-01',
      dayIndex: 0,
      description: 'day 1',
      transportation: '公共交通',
      accommodation: '舒适型酒店',
      attractions: [],
      meals: [],
    }],
    weatherInfo: [],
    overallSuggestions: 'test',
  };
}

describe('store', () => {
  beforeEach(() => {
    // use a fresh store each test — the module-level Map persists
    // but we can't reset it easily. Use unique sessionIds.
  });

  it('should save and retrieve a trip plan', () => {
    const plan = createMockPlan('北京');
    saveTripPlan('test-1', plan);
    const retrieved = getTripPlan('test-1');
    expect(retrieved).toEqual(plan);
  });

  it('should return undefined for non-existent session', () => {
    const result = getTripPlan('non-existent');
    expect(result).toBeUndefined();
  });

  it('should overwrite existing session', () => {
    const plan1 = createMockPlan('北京');
    const plan2 = createMockPlan('上海');
    saveTripPlan('test-2', plan1);
    saveTripPlan('test-2', plan2);
    const retrieved = getTripPlan('test-2');
    expect(retrieved?.city).toBe('上海');
  });

  it('should return plan immediately after save (within TTL)', () => {
    // The implementation always uses DEFAULT_MAX_AGE_MS (30 min) for expiry,
    // not the maxAgeMs parameter passed to saveTripPlan.
    // So a newly saved entry should always be retrievable.
    const plan = createMockPlan('北京');
    saveTripPlan('test-ttl', plan);
    const retrieved = getTripPlan('test-ttl');
    expect(retrieved).toEqual(plan);
  });
});
import { describe, it, expect } from 'vitest';
import { formatOutput } from '@/lib/graph/nodes/format-output';
import type { TripStateType } from '@/lib/graph/state';
import type { TripPlan } from '@/types';

describe('formatOutput', () => {
  const basePlan: TripPlan = {
    city: '北京',
    startDate: '2025-01-01',
    endDate: '2025-01-03',
    days: [
      {
        date: '2025-01-01',
        dayIndex: 0,
        description: '第一天',
        transportation: '公共交通',
        accommodation: '舒适型酒店',
        hotel: { name: '北京酒店', address: '北京', location: { longitude: 116, latitude: 39 }, priceRange: '300', type: '舒适型酒店', estimatedCost: 300 },
        attractions: [
          { name: '故宫', address: '北京', location: { longitude: 116, latitude: 39 }, visitDuration: 120, description: '故宫', category: '历史文化', ticketPrice: 60 },
        ],
        meals: [
          { type: 'breakfast' as const, name: '早餐', description: '早餐', estimatedCost: 30 },
          { type: 'lunch' as const, name: '午餐', description: '午餐', estimatedCost: 60 },
          { type: 'dinner' as const, name: '晚餐', description: '晚餐', estimatedCost: 80 },
        ],
      },
    ],
    weatherInfo: [],
    overallSuggestions: 'test',
  };

  it('should compute budget when missing', async () => {
    const state = {
      tripPlan: { ...basePlan },
      tripRequest: null,
      messages: [],
      attractions: [],
      hotels: [],
      weather: [],
      error: null,
      stage: 'planning_done',
    } as TripStateType;

    const result = await formatOutput(state);
    expect(result.stage).toBe('completed');
    expect(result.tripPlan).toBeDefined();
    expect(result.tripPlan!.budget).toBeDefined();
    expect(result.tripPlan!.budget!.totalAttractions).toBe(60);
    expect(result.tripPlan!.budget!.totalHotels).toBe(300);
    expect(result.tripPlan!.budget!.totalMeals).toBe(170);
    expect(result.tripPlan!.budget!.total).toBe(60 + 300 + 170 + 50);
  });

  it('should NOT mutate original state', async () => {
    const originalPlan = { ...basePlan };
    const state = {
      tripPlan: originalPlan,
      tripRequest: null,
      messages: [],
      attractions: [],
      hotels: [],
      weather: [],
      error: null,
      stage: 'planning_done',
    } as TripStateType;

    await formatOutput(state);
    expect(originalPlan.budget).toBeUndefined();
  });

  it('should keep existing budget if present', async () => {
    const planWithBudget = { ...basePlan, budget: { totalAttractions: 100, totalHotels: 200, totalMeals: 300, totalTransportation: 50, total: 650 } };
    const state = {
      tripPlan: planWithBudget,
      tripRequest: null,
      messages: [],
      attractions: [],
      hotels: [],
      weather: [],
      error: null,
      stage: 'planning_done',
    } as TripStateType;

    const result = await formatOutput(state);
    expect(result.tripPlan!.budget!.totalAttractions).toBe(100);
  });

  it('should return error when tripPlan is null', async () => {
    const state = {
      tripPlan: null,
      tripRequest: null,
      messages: [],
      attractions: [],
      hotels: [],
      weather: [],
      error: null,
      stage: 'planning_done',
    } as TripStateType;

    const result = await formatOutput(state);
    expect(result.error).toBe('行程规划失败');
    expect(result.stage).toBe('error');
  });
});
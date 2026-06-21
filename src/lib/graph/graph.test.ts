import { describe, it, expect, vi } from 'vitest';

const mockTripPlanJson = JSON.stringify({
  city: '北京',
  startDate: '2025-01-01',
  endDate: '2025-01-03',
  days: [
    {
      date: '2025-01-01',
      dayIndex: 0,
      description: '第一天行程',
      transportation: '公共交通',
      accommodation: '舒适型酒店',
      hotel: {
        name: '测试酒店',
        address: '北京',
        location: { longitude: 116, latitude: 39 },
        priceRange: '300',
        rating: 4.0,
        type: '舒适型酒店',
        estimatedCost: 300,
      },
      attractions: [
        {
          name: '故宫',
          address: '北京',
          location: { longitude: 116.397, latitude: 39.916 },
          visitDuration: 120,
          description: '故宫',
          category: '历史文化',
          rating: 4.5,
          ticketPrice: 60,
        },
      ],
      meals: [
        { type: 'breakfast', name: '早餐', description: '早餐', estimatedCost: 30 },
        { type: 'lunch', name: '午餐', description: '午餐', estimatedCost: 60 },
        { type: 'dinner', name: '晚餐', description: '晚餐', estimatedCost: 80 },
      ],
    },
  ],
  weatherInfo: [],
  overallSuggestions: '测试建议',
});

// Mock getLLM directly — simpler than mocking ChatOpenAI constructor
vi.mock('@/lib/agents/llm', () => ({
  getLLM: vi.fn().mockReturnValue({
    invoke: vi.fn().mockResolvedValue({
      content: mockTripPlanJson,
    }),
  }),
}));

// Mock MCP client
vi.mock('@/lib/infra/mcp-client', () => ({
  getMCPTools: vi.fn().mockResolvedValue([]),
  findTool: vi.fn().mockReturnValue(undefined),
  getMCPClient: vi.fn().mockResolvedValue({}),
  closeMCPClient: vi.fn(),
}));

describe('Trip Graph Integration', () => {
  it('should run full workflow and return TripPlan with budget', async () => {
    const { runTripPlan } = await import('@/lib/graph');

    const plan = await runTripPlan({
      city: '北京',
      startDate: '2025-01-01',
      endDate: '2025-01-03',
      travelDays: 3,
      transportation: '公共交通',
      accommodation: '舒适型酒店',
      preferences: ['历史文化'],
    });

    expect(plan).toBeDefined();
    expect(plan.city).toBe('北京');
    expect(plan.days).toBeDefined();
    expect(plan.days.length).toBeGreaterThan(0);
    expect(plan.budget).toBeDefined();
    expect(plan.budget!.totalAttractions).toBeGreaterThanOrEqual(0);
    expect(plan.budget!.totalHotels).toBeGreaterThanOrEqual(0);
    expect(plan.budget!.totalMeals).toBeGreaterThanOrEqual(0);
    expect(plan.budget!.total).toBeGreaterThan(0);
  }, 30000);
});
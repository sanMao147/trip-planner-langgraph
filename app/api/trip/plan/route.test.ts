import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/graph', () => ({
  runTripPlan: vi.fn(),
}));

vi.mock('@/lib/infra/store', () => ({
  saveTripPlan: vi.fn(),
}));

vi.mock('@/lib/infra/mcp-client', () => ({
  closeMCPClient: vi.fn(),
}));

// Mock logger
vi.mock('@/lib/infra/logger', () => ({
  createLogger: vi.fn(() => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

function createRequest(body: unknown, url = 'http://localhost:3000/api/trip/plan'): NextRequest {
  return new NextRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/trip/plan', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 for invalid JSON body', async () => {
    const { POST } = await import('./route');
    const req = new NextRequest('http://localhost:3000/api/trip/plan', {
      method: 'POST',
    });
    vi.spyOn(req, 'json').mockRejectedValue(new Error('Invalid JSON'));
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
  });

  it('should return 400 for missing required fields', async () => {
    const { POST } = await import('./route');
    const req = createRequest({ city: '' });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
  });

  it('should return 400 for empty preferences', async () => {
    const { POST } = await import('./route');
    const req = createRequest({
      city: '北京',
      startDate: '2025-01-01',
      endDate: '2025-01-03',
      travelDays: 3,
      transportation: '公共交通',
      accommodation: '舒适型酒店',
      preferences: [],
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
  });

  it('should return 200 for valid request', async () => {
    const { runTripPlan } = await import('@/lib/graph');
    const mockPlan = {
      city: '北京',
      startDate: '2025-01-01',
      endDate: '2025-01-03',
      days: [{
        date: '2025-01-01',
        dayIndex: 0,
        description: 'test',
        transportation: '公共交通',
        accommodation: '舒适型酒店',
        attractions: [],
        meals: [],
      }],
      weatherInfo: [],
      overallSuggestions: 'test',
    };
    (runTripPlan as ReturnType<typeof vi.fn>).mockResolvedValue(mockPlan);

    const { POST } = await import('./route');
    const req = createRequest({
      city: '北京',
      startDate: '2025-01-01',
      endDate: '2025-01-03',
      travelDays: 3,
      transportation: '公共交通',
      accommodation: '舒适型酒店',
      preferences: ['历史文化'],
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.sessionId).toBeDefined();
    expect(data.data.plan).toBeDefined();
  });

  it('should return 500 on runTripPlan failure', async () => {
    const { runTripPlan } = await import('@/lib/graph');
    (runTripPlan as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('LLM error'));

    const { POST } = await import('./route');
    const req = createRequest({
      city: '北京',
      startDate: '2025-01-01',
      endDate: '2025-01-03',
      travelDays: 3,
      transportation: '公共交通',
      accommodation: '舒适型酒店',
      preferences: ['历史文化'],
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.success).toBe(false);
  });
});
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock store
vi.mock('@/lib/infra/store', () => ({
  getTripPlan: vi.fn(),
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

function createRequest(sessionId: string | null): NextRequest {
  const url = sessionId 
    ? `http://localhost:3000/api/trip/result?sessionId=${sessionId}`
    : 'http://localhost:3000/api/trip/result';
  return new NextRequest(url);
}

describe('GET /api/trip/result', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 when sessionId is missing', async () => {
    const { GET } = await import('./route');
    const req = createRequest(null);
    const res = await GET(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
  });

  it('should return 404 when plan not found', async () => {
    const { getTripPlan } = await import('@/lib/infra/store');
    (getTripPlan as ReturnType<typeof vi.fn>).mockReturnValue(undefined);

    const { GET } = await import('./route');
    const req = createRequest('non-existent-session');
    const res = await GET(req);
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.success).toBe(false);
  });

  it('should return 200 with plan when found', async () => {
    const mockPlan = {
      city: '北京',
      startDate: '2025-01-01',
      endDate: '2025-01-03',
      days: [],
      weatherInfo: [],
      overallSuggestions: 'test',
    };
    const { getTripPlan } = await import('@/lib/infra/store');
    (getTripPlan as ReturnType<typeof vi.fn>).mockReturnValue(mockPlan);

    const { GET } = await import('./route');
    const req = createRequest('valid-session');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data).toEqual(mockPlan);
  });
});
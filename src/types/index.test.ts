import { describe, it, expect } from 'vitest';
import { tripRequestSchema } from '@/types';

describe('tripRequestSchema', () => {
  it('should accept valid request', () => {
    const result = tripRequestSchema.safeParse({
      city: '北京',
      startDate: '2025-01-01',
      endDate: '2025-01-03',
      travelDays: 3,
      transportation: '公共交通',
      accommodation: '舒适型酒店',
      preferences: ['历史文化'],
    });
    expect(result.success).toBe(true);
  });

  it('should reject empty city', () => {
    const result = tripRequestSchema.safeParse({
      city: '',
      startDate: '2025-01-01',
      endDate: '2025-01-03',
      travelDays: 3,
      transportation: '公共交通',
      accommodation: '舒适型酒店',
      preferences: ['历史文化'],
    });
    expect(result.success).toBe(false);
  });

  it('should reject travelDays > 14', () => {
    const result = tripRequestSchema.safeParse({
      city: '北京',
      startDate: '2025-01-01',
      endDate: '2025-01-20',
      travelDays: 15,
      transportation: '公共交通',
      accommodation: '舒适型酒店',
      preferences: ['历史文化'],
    });
    expect(result.success).toBe(false);
  });

  it('should reject empty preferences', () => {
    const result = tripRequestSchema.safeParse({
      city: '北京',
      startDate: '2025-01-01',
      endDate: '2025-01-03',
      travelDays: 3,
      transportation: '公共交通',
      accommodation: '舒适型酒店',
      preferences: [],
    });
    expect(result.success).toBe(false);
  });

  it('should accept optional freeTextInput', () => {
    const result = tripRequestSchema.safeParse({
      city: '北京',
      startDate: '2025-01-01',
      endDate: '2025-01-03',
      travelDays: 3,
      transportation: '公共交通',
      accommodation: '舒适型酒店',
      preferences: ['历史文化'],
      freeTextInput: '想看故宫',
    });
    expect(result.success).toBe(true);
  });
});
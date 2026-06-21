import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { BudgetTab } from '@/components/result/budget-tab';
import type { Budget } from '@/types';

afterEach(cleanup);

const mockBudget: Budget = {
  totalAttractions: 200,
  totalHotels: 1200,
  totalMeals: 800,
  totalTransportation: 300,
  total: 2500,
};

describe('BudgetTab', () => {
  it('should render total budget', () => {
    render(<BudgetTab budget={mockBudget} />);
    expect(screen.getByText('¥2,500')).toBeDefined();
  });

  it('should render category breakdowns', () => {
    render(<BudgetTab budget={mockBudget} />);
    expect(screen.getByText('景点门票')).toBeDefined();
    expect(screen.getByText('酒店住宿')).toBeDefined();
    expect(screen.getByText('餐饮费用')).toBeDefined();
    expect(screen.getByText('交通费用')).toBeDefined();
  });
});
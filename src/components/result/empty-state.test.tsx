import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { EmptyState } from '@/components/result/empty-state';

afterEach(cleanup);

describe('EmptyState', () => {
  it('should render the empty state message', () => {
    render(<EmptyState />);
    expect(screen.getByText('暂无旅行计划数据')).toBeDefined();
  });

  it('should render the description text', () => {
    render(<EmptyState />);
    expect(screen.getByText('未找到旅行计划，可能链接已过期。请返回首页重新创建您的旅行规划。')).toBeDefined();
  });

  it('should render link back to home', () => {
    render(<EmptyState />);
    const link = screen.getByRole('link', { name: '返回首页创建行程' });
    expect(link).toBeDefined();
    expect(link.getAttribute('href')).toBe('/');
  });
});
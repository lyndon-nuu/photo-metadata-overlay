import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingSpinner } from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  it('should render with default props', () => {
    render(<LoadingSpinner />);
    // 检查是否渲染了加载动画
    const spinner = screen.getByRole('status', { hidden: true });
    expect(spinner).toBeDefined();
  });

  it('should render with text', () => {
    render(<LoadingSpinner text="Loading..." />);
    expect(screen.getByText('Loading...')).toBeDefined();
  });

  it('should render different variants', () => {
    const { rerender } = render(<LoadingSpinner variant="dots" />);
    expect(screen.getByRole('status', { hidden: true })).toBeDefined();
    
    rerender(<LoadingSpinner variant="pulse" />);
    expect(screen.getByRole('status', { hidden: true })).toBeDefined();
    
    rerender(<LoadingSpinner variant="bars" />);
    expect(screen.getByRole('status', { hidden: true })).toBeDefined();
  });

  it('should render different sizes', () => {
    const { rerender } = render(<LoadingSpinner size="sm" />);
    expect(screen.getByRole('status', { hidden: true })).toBeDefined();
    
    rerender(<LoadingSpinner size="lg" />);
    expect(screen.getByRole('status', { hidden: true })).toBeDefined();
  });
});
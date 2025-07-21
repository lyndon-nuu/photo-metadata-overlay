import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StatusBar, MiniStatus } from '../StatusBar';

describe('StatusBar', () => {
  it('should render loading status', () => {
    render(
      <StatusBar 
        status="loading" 
        message="Loading data..." 
      />
    );
    
    expect(screen.getByText('Loading data...')).toBeDefined();
    expect(screen.getByRole('status')).toBeDefined();
  });

  it('should render success status', () => {
    render(
      <StatusBar 
        status="success" 
        message="Operation completed successfully" 
      />
    );
    
    expect(screen.getByText('Operation completed successfully')).toBeDefined();
  });

  it('should render error status', () => {
    render(
      <StatusBar 
        status="error" 
        message="Something went wrong" 
      />
    );
    
    expect(screen.getByText('Something went wrong')).toBeDefined();
  });

  it('should show progress when enabled', () => {
    render(
      <StatusBar 
        status="loading" 
        message="Processing..." 
        progress={50}
        showProgress={true}
      />
    );
    
    expect(screen.getByText('50%')).toBeDefined();
  });

  it('should call onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <StatusBar 
        status="success" 
        message="Done" 
        onClose={onClose}
      />
    );
    
    const closeButton = screen.getByRole('button');
    fireEvent.click(closeButton);
    
    expect(onClose).toHaveBeenCalled();
  });

  it('should not render when status is idle and no message', () => {
    const { container } = render(
      <StatusBar status="idle" />
    );
    
    expect(container.firstChild).toBeNull();
  });
});

describe('MiniStatus', () => {
  it('should render with different statuses', () => {
    const { rerender } = render(<MiniStatus status="success" />);
    expect(document.querySelector('.bg-green-500')).toBeTruthy();
    
    rerender(<MiniStatus status="error" />);
    expect(document.querySelector('.bg-red-500')).toBeTruthy();
    
    rerender(<MiniStatus status="loading" />);
    expect(document.querySelector('.bg-blue-500')).toBeTruthy();
  });

  it('should render with different sizes', () => {
    const { rerender } = render(<MiniStatus status="success" size="sm" />);
    expect(document.querySelector('.w-2')).toBeTruthy();
    
    rerender(<MiniStatus status="success" size="lg" />);
    expect(document.querySelector('.w-4')).toBeTruthy();
  });
});
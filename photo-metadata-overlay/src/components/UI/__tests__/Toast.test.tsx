import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ToastContainer } from '../Toast';

describe('ToastContainer', () => {
  it('should render empty container when no toasts', () => {
    render(<ToastContainer toasts={[]} onClose={vi.fn()} />);
    // 容器应该存在但为空
    const container = document.querySelector('.fixed');
    expect(container).toBeTruthy();
  });

  it('should render toast with success type', () => {
    const mockToast = {
      id: '1',
      type: 'success' as const,
      title: 'Success!',
      message: 'Operation completed successfully',
    };

    render(<ToastContainer toasts={[mockToast]} onClose={vi.fn()} />);
    
    expect(screen.getByText('Success!')).toBeDefined();
    expect(screen.getByText('Operation completed successfully')).toBeDefined();
  });

  it('should render toast with error type', () => {
    const mockToast = {
      id: '2',
      type: 'error' as const,
      title: 'Error!',
      message: 'Something went wrong',
    };

    render(<ToastContainer toasts={[mockToast]} onClose={vi.fn()} />);
    
    expect(screen.getByText('Error!')).toBeDefined();
    expect(screen.getByText('Something went wrong')).toBeDefined();
  });

  it('should render multiple toasts', () => {
    const mockToasts = [
      {
        id: '1',
        type: 'success' as const,
        title: 'Success!',
      },
      {
        id: '2',
        type: 'warning' as const,
        title: 'Warning!',
      },
    ];

    render(<ToastContainer toasts={mockToasts} onClose={vi.fn()} />);
    
    expect(screen.getByText('Success!')).toBeDefined();
    expect(screen.getByText('Warning!')).toBeDefined();
  });
});
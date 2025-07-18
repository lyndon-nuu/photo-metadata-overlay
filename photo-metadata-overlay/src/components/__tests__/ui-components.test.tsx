import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../UI/Button';
import { Input } from '../UI/Input';
import { Slider } from '../UI/Slider';
import { FileDropzone } from '../FileDropzone/FileDropzone';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Loader2: () => <div data-testid="loader-icon" />,
  Upload: () => <div data-testid="upload-icon" />,
  File: () => <div data-testid="file-icon" />,
  Image: () => <div data-testid="image-icon" />,
  AlertCircle: () => <div data-testid="alert-icon" />,
  Eye: () => <div data-testid="eye-icon" />,
  EyeOff: () => <div data-testid="eye-off-icon" />,
}));

describe('UI Components', () => {
  describe('Button', () => {
    it('should render with default props', () => {
      render(<Button>Click me</Button>);
      const button = screen.getByRole('button', { name: /click me/i });
      expect(button).toBeInTheDocument();
    });

    it('should show loading state', () => {
      render(<Button loading>Loading</Button>);
      expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
    });

    it('should be disabled when loading', () => {
      render(<Button loading>Loading</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should handle click events', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click me</Button>);
      
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should support different variants', () => {
      const { rerender } = render(<Button variant="primary">Primary</Button>);
      expect(screen.getByRole('button')).toHaveClass('bg-blue-600');

      rerender(<Button variant="secondary">Secondary</Button>);
      expect(screen.getByRole('button')).toHaveClass('bg-gray-600');

      rerender(<Button variant="danger">Danger</Button>);
      expect(screen.getByRole('button')).toHaveClass('bg-red-600');
    });
  });

  describe('Input', () => {
    it('should render with label', () => {
      render(<Input id="test-input" label="Test Label" />);
      expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
    });

    it('should show error message', () => {
      render(<Input error="This field is required" />);
      expect(screen.getByText('This field is required')).toBeInTheDocument();
      expect(screen.getByTestId('alert-icon')).toBeInTheDocument();
    });

    it('should show helper text', () => {
      render(<Input helperText="Enter your name" />);
      expect(screen.getByText('Enter your name')).toBeInTheDocument();
    });

    it('should handle password type with toggle', () => {
      render(<Input type="password" />);
      const input = screen.getByDisplayValue('');
      const toggleButton = screen.getByRole('button');
      
      expect(input).toHaveAttribute('type', 'password');
      expect(screen.getByTestId('eye-icon')).toBeInTheDocument();
      
      fireEvent.click(toggleButton);
      expect(input).toHaveAttribute('type', 'text');
      expect(screen.getByTestId('eye-off-icon')).toBeInTheDocument();
    });

    it('should handle value changes', () => {
      const handleChange = vi.fn();
      render(<Input onChange={handleChange} />);
      
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'test value' } });
      
      expect(handleChange).toHaveBeenCalled();
    });
  });

  describe('Slider', () => {
    it('should render with default props', () => {
      const handleChange = vi.fn();
      render(<Slider value={50} onChange={handleChange} />);
      
      const slider = screen.getByRole('slider');
      expect(slider).toBeInTheDocument();
      expect(slider).toHaveValue('50');
    });

    it('should show label and value', () => {
      const handleChange = vi.fn();
      render(
        <Slider 
          value={75} 
          onChange={handleChange} 
          label="Test Slider" 
          showValue={true}
          unit="px"
        />
      );
      
      expect(screen.getByText('Test Slider')).toBeInTheDocument();
      expect(screen.getByText('75px')).toBeInTheDocument();
    });

    it('should handle value changes', () => {
      const handleChange = vi.fn();
      render(<Slider value={50} onChange={handleChange} />);
      
      const slider = screen.getByRole('slider');
      fireEvent.change(slider, { target: { value: '75' } });
      
      expect(handleChange).toHaveBeenCalledWith(75);
    });

    it('should respect min and max values', () => {
      const handleChange = vi.fn();
      render(<Slider value={50} onChange={handleChange} min={10} max={90} />);
      
      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('min', '10');
      expect(slider).toHaveAttribute('max', '90');
    });

    it('should be disabled when specified', () => {
      const handleChange = vi.fn();
      render(<Slider value={50} onChange={handleChange} disabled />);
      
      const slider = screen.getByRole('slider');
      expect(slider).toBeDisabled();
    });
  });

  describe('FileDropzone', () => {
    it('should render with default props', () => {
      const handleFilesSelected = vi.fn();
      render(<FileDropzone onFilesSelected={handleFilesSelected} />);
      
      expect(screen.getByText(/拖拽文件到这里/i)).toBeInTheDocument();
      expect(screen.getByText(/点击选择文件/i)).toBeInTheDocument();
    });

    it('should show file format and size information', () => {
      const handleFilesSelected = vi.fn();
      render(
        <FileDropzone 
          onFilesSelected={handleFilesSelected}
          accept={['image/jpeg', 'image/png']}
          maxSize={10 * 1024 * 1024} // 10MB
        />
      );
      
      expect(screen.getByText(/支持格式: image\/jpeg, image\/png/i)).toBeInTheDocument();
      expect(screen.getByText(/最大大小: 10MB/i)).toBeInTheDocument();
    });

    it('should handle drag events', () => {
      const handleFilesSelected = vi.fn();
      render(<FileDropzone onFilesSelected={handleFilesSelected} />);
      
      const dropzone = screen.getByText(/拖拽文件到这里/i).closest('div');
      
      // Test drag enter
      fireEvent.dragEnter(dropzone!);
      expect(screen.getByText(/放置文件到这里/i)).toBeInTheDocument();
      
      // Test drag leave
      fireEvent.dragLeave(dropzone!);
      expect(screen.getByText(/拖拽文件到这里/i)).toBeInTheDocument();
    });

    it('should be disabled when specified', () => {
      const handleFilesSelected = vi.fn();
      render(<FileDropzone onFilesSelected={handleFilesSelected} disabled />);
      
      const dropzone = screen.getByText(/拖拽文件到这里/i).closest('div')?.parentElement;
      expect(dropzone).toHaveClass('opacity-50', 'cursor-not-allowed');
    });

    it('should handle multiple file selection', () => {
      const handleFilesSelected = vi.fn();
      render(<FileDropzone onFilesSelected={handleFilesSelected} multiple />);
      
      expect(screen.getByText(/支持多文件选择/i)).toBeInTheDocument();
    });
  });
});
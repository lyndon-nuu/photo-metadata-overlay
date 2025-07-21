import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAutoSave } from '../useAutoSave';
import { DEFAULT_OVERLAY_SETTINGS, DEFAULT_FRAME_SETTINGS } from '../../constants/design-tokens';
import { OverlaySettings, FrameSettings } from '../../types';

// Mock the storage service
vi.mock('../../services/storage.service', () => ({
  storageService: {
    saveOverlaySettings: vi.fn().mockResolvedValue(undefined),
    saveFrameSettings: vi.fn().mockResolvedValue(undefined),
  },
}));

// Mock the settings store
vi.mock('../../stores', () => ({
  useSettingsStore: () => ({
    settings: {
      autoSave: true,
    },
  }),
}));

describe('useAutoSave', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with correct default values', () => {
    const { result } = renderHook(() =>
      useAutoSave(null, null)
    );

    expect(result.current.isAutoSaveEnabled).toBe(true);
    expect(typeof result.current.saveNow).toBe('function');
  });

  it('should auto-save overlay settings when they change', async () => {
    const { storageService } = await import('../../services/storage.service');
    
    const overlaySettings: OverlaySettings = {
      ...DEFAULT_OVERLAY_SETTINGS,
      position: 'top-right',
    };

    const { rerender } = renderHook(
      ({ overlay, frame }) => useAutoSave(overlay, frame),
      {
        initialProps: {
          overlay: null as OverlaySettings | null,
          frame: null as FrameSettings | null,
        },
      }
    );

    // Update overlay settings
    rerender({
      overlay: overlaySettings,
      frame: null,
    });

    // Fast-forward time to trigger debounced save
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    await vi.waitFor(() => {
      expect(storageService.saveOverlaySettings).toHaveBeenCalledWith(overlaySettings);
    });
  });

  it('should auto-save frame settings when they change', async () => {
    const { storageService } = await import('../../services/storage.service');
    
    const frameSettings: FrameSettings = {
      ...DEFAULT_FRAME_SETTINGS,
      enabled: true,
      width: 30,
    };

    const { rerender } = renderHook(
      ({ overlay, frame }) => useAutoSave(overlay, frame),
      {
        initialProps: {
          overlay: null as OverlaySettings | null,
          frame: null as FrameSettings | null,
        },
      }
    );

    // Update frame settings
    rerender({
      overlay: null,
      frame: frameSettings,
    });

    // Fast-forward time to trigger debounced save
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    await vi.waitFor(() => {
      expect(storageService.saveFrameSettings).toHaveBeenCalledWith(frameSettings);
    });
  });

  it('should debounce multiple rapid changes', async () => {
    const { storageService } = await import('../../services/storage.service');
    
    const { rerender } = renderHook(
      ({ overlay }) => useAutoSave(overlay, null),
      {
        initialProps: {
          overlay: null as OverlaySettings | null,
        },
      }
    );

    // Make multiple rapid changes
    const settings1 = { ...DEFAULT_OVERLAY_SETTINGS, position: 'top-left' as const };
    const settings2 = { ...DEFAULT_OVERLAY_SETTINGS, position: 'top-right' as const };
    const settings3 = { ...DEFAULT_OVERLAY_SETTINGS, position: 'bottom-left' as const };

    rerender({ overlay: settings1 });
    rerender({ overlay: settings2 });
    rerender({ overlay: settings3 });

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Should only save the final settings once
    await vi.waitFor(() => {
      expect(storageService.saveOverlaySettings).toHaveBeenCalledTimes(1);
      expect(storageService.saveOverlaySettings).toHaveBeenCalledWith(settings3);
    });
  });

  it('should not auto-save when disabled', async () => {
    const { storageService } = await import('../../services/storage.service');
    
    const overlaySettings = {
      ...DEFAULT_OVERLAY_SETTINGS,
      position: 'top-right' as const,
    };

    const { rerender } = renderHook(
      ({ overlay, frame }) => useAutoSave(overlay, frame, { enabled: false }),
      {
        initialProps: {
          overlay: null as OverlaySettings | null,
          frame: null as FrameSettings | null,
        },
      }
    );

    rerender({
      overlay: overlaySettings,
      frame: null,
    });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(storageService.saveOverlaySettings).not.toHaveBeenCalled();
  });

  it('should save immediately when saveNow is called', async () => {
    const { storageService } = await import('../../services/storage.service');
    
    const overlaySettings = DEFAULT_OVERLAY_SETTINGS;
    const frameSettings = DEFAULT_FRAME_SETTINGS;

    const { result } = renderHook(() =>
      useAutoSave(overlaySettings, frameSettings)
    );

    await act(async () => {
      await result.current.saveNow();
    });

    expect(storageService.saveOverlaySettings).toHaveBeenCalledWith(overlaySettings);
    expect(storageService.saveFrameSettings).toHaveBeenCalledWith(frameSettings);
  });

  it('should handle save errors gracefully', async () => {
    const { storageService } = await import('../../services/storage.service');
    
    // Mock save to throw error
    vi.mocked(storageService.saveOverlaySettings).mockRejectedValue(new Error('Save failed'));
    
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const overlaySettings = {
      ...DEFAULT_OVERLAY_SETTINGS,
      position: 'top-right' as const,
    };

    const { rerender } = renderHook(
      ({ overlay }) => useAutoSave(overlay, null),
      {
        initialProps: {
          overlay: null as OverlaySettings | null,
        },
      }
    );

    rerender({ overlay: overlaySettings });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    await vi.waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('自动保存叠加设置失败:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });

  it('should use custom debounce time', async () => {
    const { storageService } = await import('../../services/storage.service');
    
    const overlaySettings = {
      ...DEFAULT_OVERLAY_SETTINGS,
      position: 'top-right' as const,
    };

    const { rerender } = renderHook(
      ({ overlay }) => useAutoSave(overlay, null, { debounceMs: 2000 }),
      {
        initialProps: {
          overlay: null as OverlaySettings | null,
        },
      }
    );

    rerender({ overlay: overlaySettings });

    // Should not save after 1 second
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(storageService.saveOverlaySettings).not.toHaveBeenCalled();

    // Should save after 2 seconds
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    await vi.waitFor(() => {
      expect(storageService.saveOverlaySettings).toHaveBeenCalledWith(overlaySettings);
    });
  });
});
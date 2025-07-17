import { create } from 'zustand';
import {
  PhotoMetadata,
  OverlayConfig,
  FrameSettings,
  AppState,
  AppError,
  ProcessingTask,
  UserSettings,
} from '../types';

interface AppStore extends AppState {
  // Actions
  setCurrentPhoto: (photo: PhotoMetadata | null) => void;
  setOverlayConfig: (config: OverlayConfig | null) => void;
  setFrameSettings: (settings: FrameSettings | null) => void;
  setPreviewMode: (isPreview: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: AppError | null) => void;
  setSelectedFiles: (files: PhotoMetadata[]) => void;
  addSelectedFile: (file: PhotoMetadata) => void;
  removeSelectedFile: (filePath: string) => void;
  clearSelectedFiles: () => void;
  addProcessingTask: (task: ProcessingTask) => void;
  updateProcessingTask: (
    taskId: string,
    updates: Partial<ProcessingTask>
  ) => void;
  removeProcessingTask: (taskId: string) => void;
  clearProcessingQueue: () => void;

  // Computed values
  hasPhoto: () => boolean;
  hasOverlay: () => boolean;
  hasFrame: () => boolean;
  isProcessing: () => boolean;
  getProcessingProgress: () => number;
}

export const useAppStore = create<AppStore>((set, get) => ({
  // Initial state
  currentPhoto: null,
  overlayConfig: null,
  frameSettings: null,
  isPreviewMode: false,
  isLoading: false,
  error: null,
  selectedFiles: [],
  processingQueue: [],

  // Actions
  setCurrentPhoto: photo => set({ currentPhoto: photo }),
  setOverlayConfig: config => set({ overlayConfig: config }),
  setFrameSettings: settings => set({ frameSettings: settings }),
  setPreviewMode: isPreview => set({ isPreviewMode: isPreview }),
  setLoading: isLoading => set({ isLoading }),
  setError: error => set({ error }),

  setSelectedFiles: files => set({ selectedFiles: files }),
  addSelectedFile: file =>
    set(state => ({
      selectedFiles: [...state.selectedFiles, file],
    })),
  removeSelectedFile: filePath =>
    set(state => ({
      selectedFiles: state.selectedFiles.filter(f => f.filePath !== filePath),
    })),
  clearSelectedFiles: () => set({ selectedFiles: [] }),

  addProcessingTask: task =>
    set(state => ({
      processingQueue: [...state.processingQueue, task],
    })),
  updateProcessingTask: (taskId, updates) =>
    set(state => ({
      processingQueue: state.processingQueue.map(task =>
        task.id === taskId ? { ...task, ...updates } : task
      ),
    })),
  removeProcessingTask: taskId =>
    set(state => ({
      processingQueue: state.processingQueue.filter(t => t.id !== taskId),
    })),
  clearProcessingQueue: () => set({ processingQueue: [] }),

  // Computed values
  hasPhoto: () => get().currentPhoto !== null,
  hasOverlay: () => get().overlayConfig !== null,
  hasFrame: () => get().frameSettings !== null,
  isProcessing: () =>
    get().processingQueue.some(task => task.status === 'processing'),
  getProcessingProgress: () => {
    const tasks = get().processingQueue;
    if (tasks.length === 0) return 0;
    const totalProgress = tasks.reduce((sum, task) => sum + task.progress, 0);
    return totalProgress / tasks.length;
  },
}));

// Overlay configuration store
interface OverlayStore {
  templates: OverlayConfig[];
  currentTemplate: OverlayConfig | null;

  // Actions
  addTemplate: (template: OverlayConfig) => void;
  updateTemplate: (id: string, updates: Partial<OverlayConfig>) => void;
  deleteTemplate: (id: string) => void;
  setCurrentTemplate: (template: OverlayConfig | null) => void;

  // Getters
  getTemplateById: (id: string) => OverlayConfig | undefined;
}

export const useOverlayStore = create<OverlayStore>((set, get) => ({
  templates: [],
  currentTemplate: null,

  addTemplate: template =>
    set(state => ({ templates: [...state.templates, template] })),

  updateTemplate: (id, updates) =>
    set(state => ({
      templates: state.templates.map(t =>
        t.id === id ? { ...t, ...updates } : t
      ),
      currentTemplate:
        state.currentTemplate?.id === id
          ? { ...state.currentTemplate, ...updates }
          : state.currentTemplate,
    })),

  deleteTemplate: id =>
    set(state => ({
      templates: state.templates.filter(t => t.id !== id),
      currentTemplate:
        state.currentTemplate?.id === id ? null : state.currentTemplate,
    })),

  setCurrentTemplate: template => set({ currentTemplate: template }),

  getTemplateById: id => get().templates.find(t => t.id === id),
}));

// Frame settings store
interface FrameStore {
  presets: FrameSettings[];
  currentPreset: FrameSettings | null;

  // Actions
  addPreset: (preset: FrameSettings) => void;
  updatePreset: (id: string, updates: Partial<FrameSettings>) => void;
  deletePreset: (id: string) => void;
  setCurrentPreset: (preset: FrameSettings | null) => void;

  // Getters
  getPresetById: (id: string) => FrameSettings | undefined;
}

export const useFrameStore = create<FrameStore>((set, get) => ({
  presets: [],
  currentPreset: null,

  addPreset: preset => set(state => ({ presets: [...state.presets, preset] })),

  updatePreset: (id, updates) =>
    set(state => ({
      presets: state.presets.map(p => (p.id === id ? { ...p, ...updates } : p)),
      currentPreset:
        state.currentPreset?.id === id
          ? { ...state.currentPreset, ...updates }
          : state.currentPreset,
    })),

  deletePreset: id =>
    set(state => ({
      presets: state.presets.filter(p => p.id !== id),
      currentPreset:
        state.currentPreset?.id === id ? null : state.currentPreset,
    })),

  setCurrentPreset: preset => set({ currentPreset: preset }),

  getPresetById: id => get().presets.find(p => p.id === id),
}));

// Settings store
interface SettingsStore {
  settings: UserSettings;

  // Actions
  updateSettings: (updates: Partial<UserSettings>) => void;
  resetSettings: () => void;
  loadSettings: () => Promise<void>;
  saveSettings: () => Promise<void>;
}

const DEFAULT_SETTINGS: UserSettings = {
  theme: 'auto',
  language: 'en',
  defaultExportFormat: 'jpeg',
  defaultExportQuality: 0.9,
  autoSave: true,
  recentTemplates: [],
  shortcuts: {
    openFile: 'Ctrl+O',
    exportImage: 'Ctrl+E',
    togglePreview: 'Space',
    undo: 'Ctrl+Z',
    redo: 'Ctrl+Y',
    save: 'Ctrl+S',
  },
};

export const useSettingsStore = create<SettingsStore>(set => ({
  settings: DEFAULT_SETTINGS,

  updateSettings: updates =>
    set(state => ({
      settings: { ...state.settings, ...updates },
    })),

  resetSettings: () => set({ settings: DEFAULT_SETTINGS }),

  loadSettings: async () => {
    // TODO: Implement loading from Tauri storage
    console.log('Loading settings...');
  },

  saveSettings: async () => {
    // TODO: Implement saving to Tauri storage
    console.log('Saving settings...');
  },
}));

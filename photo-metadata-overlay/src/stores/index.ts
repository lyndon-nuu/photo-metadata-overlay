import { create } from 'zustand';
import { PhotoMetadata, OverlayConfig, AppState } from '../types';

interface AppStore extends AppState {
  // Actions
  setCurrentPhoto: (photo: PhotoMetadata | null) => void;
  setOverlayConfig: (config: OverlayConfig | null) => void;
  setPreviewMode: (isPreview: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;

  // Computed values
  hasPhoto: () => boolean;
  hasOverlay: () => boolean;
}

export const useAppStore = create<AppStore>((set, get) => ({
  // Initial state
  currentPhoto: null,
  overlayConfig: null,
  isPreviewMode: false,
  isLoading: false,
  error: null,

  // Actions
  setCurrentPhoto: photo => set({ currentPhoto: photo }),
  setOverlayConfig: config => set({ overlayConfig: config }),
  setPreviewMode: isPreview => set({ isPreviewMode: isPreview }),
  setLoading: isLoading => set({ isLoading }),
  setError: error => set({ error }),

  // Computed values
  hasPhoto: () => get().currentPhoto !== null,
  hasOverlay: () => get().overlayConfig !== null,
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

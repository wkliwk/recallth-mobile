import { create } from 'zustand';
import * as storage from '../services/storage';

export type AppearanceMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'recallth:appearance-mode';

interface AppearanceState {
  mode: AppearanceMode;
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  setMode: (mode: AppearanceMode) => Promise<void>;
}

export const useAppearanceStore = create<AppearanceState>((set) => ({
  mode: 'system',
  isHydrated: false,

  hydrate: async () => {
    const stored = await storage.getItem(STORAGE_KEY).catch(() => null);
    const mode = (stored === 'light' || stored === 'dark' || stored === 'system') ? stored : 'system';
    set({ mode, isHydrated: true });
  },

  setMode: async (mode: AppearanceMode) => {
    set({ mode });
    await storage.setItem(STORAGE_KEY, mode).catch(() => {/* non-critical */});
  },
}));

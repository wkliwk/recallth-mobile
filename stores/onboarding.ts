import { create } from 'zustand';

import * as storage from '../services/storage';

const ONBOARDING_KEY = 'recallth.onboarding.seen';

export type Sex = 'male' | 'female' | 'other' | null;
export type Goal = 'energy' | 'sleep' | 'recovery' | 'longevity' | 'other' | null;

export type OnboardingState = {
  // Step 1: body stats
  heightCm: string;
  weightKg: string;
  sex: Sex;
  age: string;

  // Step 2: cabinet items (up to 3)
  cabinetItems: string[];

  // Step 3: primary goal
  goal: Goal;

  // Persistence flag
  hasSeen: boolean;
  isHydrated: boolean;

  // Actions
  setBodyStats: (stats: {
    heightCm?: string;
    weightKg?: string;
    sex?: Sex;
    age?: string;
  }) => void;
  setCabinetItems: (items: string[]) => void;
  setGoal: (goal: Goal) => void;
  markSeen: () => Promise<void>;
  hydrate: () => Promise<void>;
  reset: () => void;
};

const defaults = {
  heightCm: '',
  weightKg: '',
  sex: null as Sex,
  age: '',
  cabinetItems: [] as string[],
  goal: null as Goal,
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  ...defaults,
  hasSeen: false,
  isHydrated: false,

  setBodyStats: (stats) => set((s) => ({ ...s, ...stats })),
  setCabinetItems: (items) => set({ cabinetItems: items }),
  setGoal: (goal) => set({ goal }),

  markSeen: async () => {
    await storage.setItem(ONBOARDING_KEY, 'true');
    set({ hasSeen: true });
  },

  hydrate: async () => {
    try {
      const seen = await storage.getItem(ONBOARDING_KEY);
      set({ hasSeen: seen === 'true', isHydrated: true });
    } catch {
      set({ hasSeen: false, isHydrated: true });
    }
  },

  reset: () => set({ ...defaults }),
}));

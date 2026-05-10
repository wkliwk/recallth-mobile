import { create } from 'zustand';

import * as authService from '../services/auth';
import * as storage from '../services/storage';

const TOKEN_KEY = 'recallth.auth.token';
const USER_KEY = 'recallth.auth.user';

export type AuthUser = authService.AuthUser;

type AuthState = {
  token: string | null;
  user: AuthUser | null;
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

async function persist(token: string, user: AuthUser): Promise<void> {
  await storage.setItem(TOKEN_KEY, token);
  await storage.setItem(USER_KEY, JSON.stringify(user));
}

async function clearPersisted(): Promise<void> {
  await storage.deleteItem(TOKEN_KEY);
  await storage.deleteItem(USER_KEY);
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isHydrated: false,

  hydrate: async () => {
    try {
      const [token, userJson] = await Promise.all([
        storage.getItem(TOKEN_KEY),
        storage.getItem(USER_KEY),
      ]);
      if (token && userJson) {
        const user = JSON.parse(userJson) as AuthUser;
        set({ token, user, isHydrated: true });
        return;
      }
      set({ token: null, user: null, isHydrated: true });
    } catch {
      // Corrupted secure-store state — start signed out rather than crash.
      await clearPersisted();
      set({ token: null, user: null, isHydrated: true });
    }
  },

  login: async (email: string, password: string) => {
    const { token, user } = await authService.login(email, password);
    await persist(token, user);
    set({ token, user });
  },

  signup: async (email: string, password: string) => {
    const { token, user } = await authService.register(email, password);
    await persist(token, user);
    set({ token, user });
  },

  logout: async () => {
    await clearPersisted();
    set({ token: null, user: null });
  },
}));

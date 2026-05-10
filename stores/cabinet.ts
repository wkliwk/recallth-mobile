/**
 * Cabinet store — Zustand with optimistic updates + rollback.
 *
 * Fetches all items (active + inactive) in one shot by making two parallel
 * requests (backend filters by active=true by default, we also need inactive).
 *
 * Interactions are fetched separately and stored as a map:
 *   itemName → highest severity for that item.
 */

import { create } from 'zustand';

import {
  CabinetItem,
  CreateCabinetItemInput,
  Interaction,
  UpdateCabinetItemInput,
  createCabinetItem,
  deleteCabinetItem,
  getInteractions,
  listAllCabinetItems,
  updateCabinetItem,
} from '../services/cabinet';

// ─── Types ────────────────────────────────────────────────────────────────────

type LoadingState = 'idle' | 'loading' | 'error';

type CabinetState = {
  items: CabinetItem[];
  interactions: Interaction[];
  /** name (lowercase) → highest severity for quick badge lookup */
  interactionMap: Record<string, 'minor' | 'moderate' | 'major'>;
  loadingState: LoadingState;
  error: string | null;

  fetch: (token: string) => Promise<void>;
  add: (input: CreateCabinetItemInput, token: string) => Promise<CabinetItem>;
  update: (id: string, input: UpdateCabinetItemInput, token: string) => Promise<void>;
  remove: (id: string, token: string) => Promise<void>;
  refreshInteractions: (token: string) => Promise<void>;
};

// ─── Severity rank (higher = worse) ──────────────────────────────────────────

const SEVERITY_RANK: Record<'minor' | 'moderate' | 'major', number> = {
  minor: 1,
  moderate: 2,
  major: 3,
};

function buildInteractionMap(
  interactions: Interaction[],
): Record<string, 'minor' | 'moderate' | 'major'> {
  const map: Record<string, 'minor' | 'moderate' | 'major'> = {};
  for (const ix of interactions) {
    for (const name of [ix.item1, ix.item2]) {
      const key = name.toLowerCase();
      const current = map[key];
      if (!current || SEVERITY_RANK[ix.severity] > SEVERITY_RANK[current]) {
        map[key] = ix.severity;
      }
    }
  }
  return map;
}

// ─── Temp ID for optimistic inserts ──────────────────────────────────────────

let _tempId = 0;
function tempId(): string {
  return `__temp_${++_tempId}`;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useCabinetStore = create<CabinetState>((set, get) => ({
  items: [],
  interactions: [],
  interactionMap: {},
  loadingState: 'idle',
  error: null,

  fetch: async (token: string) => {
    set({ loadingState: 'loading', error: null });
    try {
      const [items, interactions] = await Promise.all([
        listAllCabinetItems(token),
        getInteractions(token),
      ]);
      set({
        items,
        interactions,
        interactionMap: buildInteractionMap(interactions),
        loadingState: 'idle',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load cabinet';
      set({ loadingState: 'error', error: message });
    }
  },

  add: async (input: CreateCabinetItemInput, token: string): Promise<CabinetItem> => {
    // Optimistic insert — use a temp item so the UI updates immediately.
    const optimisticId = tempId();
    const optimisticItem: CabinetItem = {
      _id: optimisticId,
      name: input.name,
      type: input.type,
      dosage: input.dosage,
      frequency: input.frequency,
      timing: input.timing,
      brand: input.brand,
      notes: input.notes,
      active: input.active !== false,
      startDate: input.startDate ?? new Date().toISOString(),
      endDate: input.endDate,
      source: input.source ?? 'user_input',
      price: undefined,
      currency: 'HKD',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    set((s) => ({ items: [optimisticItem, ...s.items] }));

    try {
      const created = await createCabinetItem(input, token);
      // Replace the temp item with the server-confirmed one.
      set((s) => ({
        items: s.items.map((item) => (item._id === optimisticId ? created : item)),
      }));
      return created;
    } catch (err) {
      // Rollback — remove the optimistic item.
      set((s) => ({ items: s.items.filter((item) => item._id !== optimisticId) }));
      throw err;
    }
  },

  update: async (id: string, input: UpdateCabinetItemInput, token: string): Promise<void> => {
    const previous = get().items.find((i) => i._id === id);
    if (!previous) return;

    // Optimistic update.
    set((s) => ({
      items: s.items.map((item) =>
        item._id === id ? { ...item, ...input, updatedAt: new Date().toISOString() } : item,
      ),
    }));

    try {
      const updated = await updateCabinetItem(id, input, token);
      set((s) => ({
        items: s.items.map((item) => (item._id === id ? updated : item)),
      }));
    } catch (err) {
      // Rollback.
      set((s) => ({
        items: s.items.map((item) => (item._id === id ? previous : item)),
      }));
      throw err;
    }
  },

  remove: async (id: string, token: string): Promise<void> => {
    const previous = get().items;

    // Optimistic remove.
    set((s) => ({ items: s.items.filter((item) => item._id !== id) }));

    try {
      await deleteCabinetItem(id, token);
    } catch (err) {
      // Rollback.
      set({ items: previous });
      throw err;
    }
  },

  refreshInteractions: async (token: string): Promise<void> => {
    try {
      const interactions = await getInteractions(token);
      set({ interactions, interactionMap: buildInteractionMap(interactions) });
    } catch {
      // Non-fatal — keep existing interaction data.
    }
  },
}));

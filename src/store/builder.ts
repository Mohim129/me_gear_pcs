// src/store/builder.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Define all possible component slots
export type ComponentSlot =
  | 'cpu'
  | 'gpu'
  | 'motherboard'
  | 'ram'
  | 'storage'
  | 'psu'
  | 'casing'
  | 'cooler'
  | 'monitor'
  | 'keyboard'
  | 'mouse'
  | 'headphone'
  | 'speaker';

// Product shape used throughout the app
export interface Product {
  _id: string;
  name: string;
  price: number;
  image?: string;
  specifications?: Record<string, any>;
  category: { name: string; slug: string };
  suggested?: boolean;
  reasoning?: string;
  brand?: string;
}

/**
 * Zustand store shape.
 *
 * The state contains three data collections:
 *  - selectedComponents: the user‑chosen product for each slot (or null)
 *  - aiSuggestions: optional AI‑generated suggestions per slot
 *  - confirmedSlots: a Set of slots the user has explicitly confirmed
 *
 * Actions mutate the state; they are kept deliberately small so the UI can call
 * them directly (PCBuilderClient expects these exact names).
 */
export interface BuilderState {
  // ----- State -----
  selectedComponents: Record<ComponentSlot, Product | null>;
  aiSuggestions: Partial<Record<ComponentSlot, Product>>;
  confirmedSlots: Set<ComponentSlot>;

  // ----- Actions -----
  /**
   * Set a component for a slot and clear any AI suggestion for that slot.
   */
  setComponent: (slot: ComponentSlot, product: Product | null) => void;

  /**
   * Alias for setComponent – kept for backwards‑compatibility with existing UI.
   */
  selectComponent: (slot: ComponentSlot, product: Product | null) => void;

  /**
   * Remove the component from a slot (set to null) and clear its AI suggestion.
   */
  removeComponent: (slot: ComponentSlot) => void;

  /**
   * Confirm the whole build – creates a Set of all slots that currently have a
   * non‑null component.
   */
  confirmBuild: () => void;

  /**
   * Store an AI suggestion for a given slot.
   */
  setAiSuggestion: (slot: ComponentSlot, product: Product) => void;

  /**
   * Mark a single slot as confirmed (used by the UI when a user manually
   * confirms a part of the build).
   */
  confirmSlot: (slot: ComponentSlot) => void;

  /**
   * Reset the entire builder to its initial empty state.
   */
  clearBuild: () => void;
}

// Helper to generate the initial empty selections object.
const emptySelection: Record<ComponentSlot, Product | null> = {
  cpu: null,
  gpu: null,
  motherboard: null,
  ram: null,
  storage: null,
  psu: null,
  casing: null,
  cooler: null,
  monitor: null,
  keyboard: null,
  mouse: null,
  headphone: null,
  speaker: null,
};

export const useBuilderStore = create<BuilderState>()(
  devtools((set, get) => ({
    // ----- Initial State -----
    selectedComponents: { ...emptySelection },
    aiSuggestions: {},
    confirmedSlots: new Set<ComponentSlot>(),

    // ----- Action Implementations -----
    setComponent: (slot, product) =>
      set(state => ({
        selectedComponents: { ...state.selectedComponents, [slot]: product },
        aiSuggestions: { ...state.aiSuggestions, [slot]: undefined },
      })),

    // Alias – same implementation as setComponent
    selectComponent: (slot, product) =>
      set(state => ({
        selectedComponents: { ...state.selectedComponents, [slot]: product },
        aiSuggestions: { ...state.aiSuggestions, [slot]: undefined },
      })),

    removeComponent: slot =>
      set(state => ({
        selectedComponents: { ...state.selectedComponents, [slot]: null },
        aiSuggestions: { ...state.aiSuggestions, [slot]: undefined },
      })),

    confirmBuild: () =>
      set(state => {
        const newSet = new Set<ComponentSlot>();
        (Object.entries(state.selectedComponents) as [ComponentSlot, Product | null][]).forEach(
          ([slot, product]) => {
            if (product) newSet.add(slot);
          },
        );
        return { confirmedSlots: newSet };
      }),

    setAiSuggestion: (slot, product) =>
      set(state => ({
        aiSuggestions: { ...state.aiSuggestions, [slot]: product },
      })),

    confirmSlot: slot =>
      set(state => {
        const newSet = new Set(state.confirmedSlots);
        newSet.add(slot);
        return { confirmedSlots: newSet };
      }),

    clearBuild: () =>
      set({
        selectedComponents: { ...emptySelection },
        aiSuggestions: {},
        confirmedSlots: new Set<ComponentSlot>(),
      }),
  })),
);

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Product {
  _id: string;
  name: string;
  slug?: string;
  description?: string;
  price: number;
  originalPrice?: number;
  image?: string;
  category?: { name: string; slug: string };
  brand?: string;
  stock?: number;
  rating?: number;
  reviewCount?: number;
  features?: string[];
  specifications?: Record<string, any>;
}

export interface BuilderState {
  selectedComponents: Record<string, Product>;
  aiSuggestions: Record<string, { suggested: boolean; reasoning: string }>;
  selectComponent: (slotId: string, product: Product, isAi?: boolean, reasoning?: string) => void;
  removeComponent: (slotId: string) => void;
  confirmBuild: () => void;
  clearBuild: () => void;
}

export const useBuilderStore = create<BuilderState>()(
  persist(
    (set) => ({
      selectedComponents: {},
      aiSuggestions: {},
      selectComponent: (slotId, product, isAi = false, reasoning = "") =>
        set((state) => ({
          selectedComponents: {
            ...state.selectedComponents,
            [slotId]: product,
          },
          aiSuggestions: {
            ...state.aiSuggestions,
            [slotId]: { suggested: isAi, reasoning },
          },
        })),
      removeComponent: (slotId) =>
        set((state) => {
          const newSelected = { ...state.selectedComponents };
          delete newSelected[slotId];
          const newSuggestions = { ...state.aiSuggestions };
          delete newSuggestions[slotId];
          return {
            selectedComponents: newSelected,
            aiSuggestions: newSuggestions,
          };
        }),
      confirmBuild: () =>
        set((state) => {
          const confirmedSuggestions = { ...state.aiSuggestions };
          Object.keys(confirmedSuggestions).forEach((key) => {
            confirmedSuggestions[key] = {
              ...confirmedSuggestions[key],
              suggested: false,
            };
          });
          return { aiSuggestions: confirmedSuggestions };
        }),
      clearBuild: () => set({ selectedComponents: {}, aiSuggestions: {} }),
    }),
    {
      name: "meg-pcs-builder",
    }
  )
);

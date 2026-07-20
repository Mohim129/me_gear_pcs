import { create } from "zustand";

interface WishlistState {
  items: string[]; // product IDs
  isLoading: boolean;
  fetchWishlist: () => Promise<void>;
  addItem: (productId: string) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistState>()((set, get) => ({
  items: [],
  isLoading: false,

  fetchWishlist: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch("/api/wishlist");
      if (!res.ok) throw new Error("Failed to fetch wishlist");
      const data = await res.json();
      const ids = data.map((item: any) => item.productId);
      set({ items: ids });
    } catch {
      // Silently fail – user may not be logged in
    } finally {
      set({ isLoading: false });
    }
  },

  addItem: async (productId: string) => {
    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add to wishlist");
      }
      set((state) => ({
        items: state.items.includes(productId)
          ? state.items
          : [...state.items, productId],
      }));
    } catch (err: any) {
      throw err;
    }
  },

  removeItem: async (productId: string) => {
    try {
      const res = await fetch(`/api/wishlist?productId=${productId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to remove from wishlist");
      }
      set((state) => ({
        items: state.items.filter((id) => id !== productId),
      }));
    } catch (err: any) {
      throw err;
    }
  },

  clearWishlist: () => set({ items: [] }),
}));

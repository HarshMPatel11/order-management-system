import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MenuItem } from "@shared/schema";

export interface CartItem extends MenuItem {
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: MenuItem) => void;
  removeItem: (itemId: number) => void;
  updateQuantity: (itemId: number, delta: number) => void;
  clearCart: () => void;
  total: () => number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          const existing = state.items.find((i) => i.id === item.id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
              ),
            };
          }
          return { items: [...state.items, { ...item, quantity: 1 }] };
        }),
      removeItem: (itemId) =>
        set((state) => ({
          items: state.items.filter((i) => i.id !== itemId),
        })),
      updateQuantity: (itemId, delta) =>
        set((state) => {
          const newItems = state.items
            .map((i) => {
              if (i.id === itemId) {
                return { ...i, quantity: Math.max(0, i.quantity + delta) };
              }
              return i;
            })
            .filter((i) => i.quantity > 0);
          return { items: newItems };
        }),
      clearCart: () => set({ items: [] }),
      total: () => {
        const items = get().items;
        return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      },
    }),
    {
      name: "food-delivery-cart",
    }
  )
);

import { create } from 'zustand';
import { CartItem, Product } from '../types';

interface CartState {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  setDiscount: (amount: number) => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  subtotal: 0,
  tax: 0,
  discount: 0,
  total: 0,
  
  addItem: (product) => {
    set((state) => {
      const existingItem = state.items.find(item => item.id === product.id);
      let newItems;
      if (existingItem) {
        newItems = state.items.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        newItems = [...state.items, { ...product, cartItemId: crypto.randomUUID(), quantity: 1 }];
      }
      return calculateTotals(newItems, state.discount);
    });
  },
  
  removeItem: (cartItemId) => {
    set((state) => {
      const newItems = state.items.filter(item => item.cartItemId !== cartItemId);
      return calculateTotals(newItems, state.discount);
    });
  },
  
  updateQuantity: (cartItemId, quantity) => {
    set((state) => {
      const newItems = state.items.map(item => 
        item.cartItemId === cartItemId ? { ...item, quantity: Math.max(1, quantity) } : item
      );
      return calculateTotals(newItems, state.discount);
    });
  },
  
  clearCart: () => set({ items: [], subtotal: 0, tax: 0, total: 0, discount: 0 }),
  
  setDiscount: (amount) => {
    set((state) => calculateTotals(state.items, amount));
  }
}));

function calculateTotals(items: CartItem[], discount: number) {
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = 0; // Set 0 by default to avoid confusion for MVP, configurable later.
  const total = subtotal + tax - discount;
  return { items, subtotal, tax, discount, total };
}

export interface Product {
  id?: number;
  name: string;
  sku: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  unit: string;
  image?: string;
}

export interface CartItem extends Product {
  cartItemId: string;
  quantity: number;
}

export interface Transaction {
  id?: number;
  date: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: string;
  cashGiven?: number;
  change?: number;
  status: 'completed' | 'voided' | 'held';
  items: TransactionItem[];
}

export interface TransactionItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface CashSession {
  id?: number;
  startTime: string;
  endTime?: string;
  startingCash: number;
  endingCash?: number;
  expectedCash?: number;
  difference?: number;
  status: 'open' | 'closed';
  cashierName: string;
}

export interface StoreSettings {
  id?: number;
  storeName: string;
  address: string;
  phone: string;
  taxRate: number;
  receiptFooter: string;
}

export interface StockMovement {
  id?: number;
  productId: number;
  date: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason: string;
}

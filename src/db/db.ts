import Dexie, { type Table } from 'dexie';
import { Product, Transaction, CashSession, StoreSettings, StockMovement } from '../types';

export class POSDatabase extends Dexie {
  products!: Table<Product, number>;
  transactions!: Table<Transaction, number>;
  cashSessions!: Table<CashSession, number>;
  settings!: Table<StoreSettings, number>;
  stockMovements!: Table<StockMovement, number>;

  constructor() {
    super('POSDatabase');
    this.version(2).stores({
      products: '++id, name, sku, category',
      transactions: '++id, date, status',
      cashSessions: '++id, status, startTime',
      settings: '++id',
      stockMovements: '++id, productId, date, type'
    });
  }
}

export const db = new POSDatabase();

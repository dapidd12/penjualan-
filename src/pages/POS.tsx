import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useCartStore } from '../store/useCartStore';
import { formatCurrency } from '../utils/currency';
import { Search, Plus, Minus, Trash2, ShoppingBag, X } from 'lucide-react';
import { Transaction } from '../types';
import { clsx } from 'clsx';

export function POS() {
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Tunai');
  const [cashGiven, setCashGiven] = useState('');
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  
  const products = useLiveQuery(
    () => {
      if (searchTerm) {
        return db.products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase())).toArray();
      }
      return db.products.toArray();
    },
    [searchTerm]
  );

  const { items, addItem, removeItem, updateQuantity, clearCart, subtotal, total, discount } = useCartStore();

  const handleCheckout = async () => {
    if (items.length === 0) return;
    
    const cash = Number(cashGiven) || 0;
    const change = paymentMethod === 'Tunai' ? cash - total : 0;

    if (paymentMethod === 'Tunai' && cash < total) {
      alert("Uang tunai kurang dari total belanja!");
      return;
    }

    try {
      const transaction: Transaction = {
        date: new Date().toISOString(),
        subtotal,
        tax: 0,
        discount,
        total,
        paymentMethod,
        cashGiven: paymentMethod === 'Tunai' ? cash : undefined,
        change,
        status: 'completed',
        items: items.map(item => ({
          productId: item.id!,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          subtotal: item.price * item.quantity
        }))
      };

      // Reduce stock
      await db.transaction('rw', db.products, db.transactions, async () => {
        for (const item of items) {
          const product = await db.products.get(item.id!);
          if (product) {
            await db.products.update(item.id!, { stock: product.stock - item.quantity });
          }
        }
        await db.transactions.add(transaction);
      });

      clearCart();
      setIsCheckoutModalOpen(false);
      setIsMobileCartOpen(false);
      setCashGiven('');
      alert("Transaksi Berhasil!");
    } catch (error) {
      console.error(error);
      alert("Gagal memproses transaksi");
    }
  };

  return (
    <div className="h-full flex flex-col md:flex-row gap-4 relative overflow-hidden">
      {/* Product List Section */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="glass-panel p-4 mb-4 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={20} />
            <input 
              type="text" 
              placeholder="Cari produk (Nama / SKU)..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="glass-input w-full pl-10 h-12 text-lg"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 pb-20 md:pb-0">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products?.map(product => (
              <button 
                key={product.id}
                onClick={() => {
                  addItem(product);
                  // Optional: Can automatically open cart on mobile or just show toast
                }}
                disabled={product.stock <= 0}
                className={`glass-panel p-4 text-left transition-transform active:scale-95 flex flex-col h-full ${product.stock <= 0 ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:-translate-y-1'}`}
              >
                <div className="flex-1">
                  <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded-full mb-2 inline-block">
                    {product.category || 'Umum'}
                  </span>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 line-clamp-2 mb-1">{product.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 mb-2">Stok: {product.stock} {product.unit}</p>
                </div>
                <div className="text-lg font-bold text-slate-900 dark:text-white mt-2">
                  {formatCurrency(product.price)}
                </div>
              </button>
            ))}
            {products?.length === 0 && (
              <div className="col-span-full p-12 text-center text-slate-500 dark:text-slate-400 dark:text-slate-500 glass-panel">
                <ShoppingBag className="mx-auto mb-4 opacity-20" size={48} />
                <p>Tidak ada produk ditemukan. Tambahkan produk di menu Produk.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Cart Button for Mobile */}
      <div className="md:hidden fixed bottom-[72px] left-4 right-4 z-40">
        <button
          onClick={() => setIsMobileCartOpen(true)}
          className="w-full bg-blue-600 text-white rounded-2xl shadow-xl p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="bg-white dark:bg-slate-800/20 p-2 rounded-xl">
              <ShoppingBag size={24} />
            </div>
            <div className="text-left">
              <p className="text-xs font-medium text-blue-100">{items.length} item di keranjang</p>
              <p className="font-bold text-lg">{formatCurrency(total)}</p>
            </div>
          </div>
          <span className="font-semibold px-4 py-2 bg-white dark:bg-slate-800/20 rounded-xl">
            Lihat Detail
          </span>
        </button>
      </div>

      {/* Cart Section - Drawer on mobile, sidebar on desktop */}
      <div className={clsx(
        "w-full md:w-96 glass-panel flex flex-col h-full flex-shrink-0 z-50 transition-transform duration-300",
        "fixed md:relative inset-0 md:inset-auto",
        isMobileCartOpen ? "translate-y-0" : "translate-y-full md:translate-y-0"
      )}>
        <div className="p-4 border-b border-white/20 dark:border-slate-700/50 bg-white dark:bg-slate-800/40 flex justify-between items-center pt-8 md:pt-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Keranjang Belanja</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">{items.length} item</p>
          </div>
          <button 
            className="md:hidden p-2 bg-white dark:bg-slate-800/50 rounded-full text-slate-600 dark:text-slate-300"
            onClick={() => setIsMobileCartOpen(false)}
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-2 bg-slate-50 dark:bg-slate-900/50 md:bg-transparent">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 p-8 text-center">
              <ShoppingBag size={48} className="mb-4 opacity-50" />
              <p>Keranjang masih kosong</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {items.map(item => (
                <div key={item.cartItemId} className="bg-white dark:bg-slate-800/50 border border-white/40 dark:border-slate-700/50 rounded-xl p-3 flex flex-col gap-2 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div className="font-semibold text-slate-800 dark:text-slate-100">{item.name}</div>
                    <button onClick={() => removeItem(item.cartItemId)} className="text-red-400 hover:text-red-600 p-1">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <div className="text-blue-700 font-bold">{formatCurrency(item.price)}</div>
                    <div className="flex items-center gap-3 bg-white dark:bg-slate-800/60 rounded-lg p-1 border border-white/40 dark:border-slate-700/50">
                      <button 
                        onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                        className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-slate-200 transition-colors"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-6 text-center font-semibold">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                        className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-slate-200 transition-colors"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 bg-white dark:bg-slate-800 border-t border-white/20 dark:border-slate-700/50 pb-safe md:bg-white dark:bg-slate-800/40">
          <div className="space-y-2 mb-4 text-slate-700 dark:text-slate-200">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Diskon</span>
                <span>-{formatCurrency(discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-xl text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-700/50">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
          
          <button 
            onClick={() => setIsCheckoutModalOpen(true)}
            disabled={items.length === 0}
            className="w-full h-14 text-lg glass-button-primary"
          >
            Bayar Pesanan
          </button>
        </div>
      </div>

      {/* Checkout Modal */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md p-6 max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800/90">
            <h2 className="text-2xl font-bold mb-6 text-center">Pembayaran</h2>
            
            <div className="bg-blue-50 rounded-xl p-4 text-center mb-6 border border-blue-100">
              <p className="text-slate-500 dark:text-slate-400 dark:text-slate-500 text-sm mb-1">Total Tagihan</p>
              <p className="text-4xl font-bold text-blue-700">{formatCurrency(total)}</p>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200 block mb-2">Metode Pembayaran</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Tunai', 'QRIS', 'Transfer', 'Kartu'].map(method => (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className={`py-3 rounded-xl border font-semibold transition-all ${paymentMethod === method ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white dark:bg-slate-800/50 border-white/50 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-white dark:bg-slate-800/80'}`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              {paymentMethod === 'Tunai' && (
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200 block mb-2">Uang Diterima (Rp)</label>
                  <input 
                    type="number" 
                    value={cashGiven}
                    onChange={(e) => setCashGiven(e.target.value)}
                    className="glass-input w-full h-14 text-2xl font-bold text-right"
                    placeholder="0"
                    autoFocus
                  />
                  
                  {Number(cashGiven) > total && (
                    <div className="mt-3 bg-green-50/50 rounded-xl p-3 border border-green-100 flex justify-between items-center">
                      <span className="text-green-700 font-medium">Kembalian:</span>
                      <span className="text-2xl font-bold text-green-700">{formatCurrency(Number(cashGiven) - total)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={() => setIsCheckoutModalOpen(false)} className="glass-button flex-1 h-12">Batal</button>
              <button 
                onClick={handleCheckout} 
                className="glass-button-primary flex-1 h-12 font-bold"
                disabled={paymentMethod === 'Tunai' && Number(cashGiven) < total}
              >
                Selesaikan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

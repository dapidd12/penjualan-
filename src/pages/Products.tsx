import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { Product } from '../types';
import { Plus, Search, Edit2, Trash2, X, PackagePlus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { formatCurrency } from '../utils/currency';

export function Products() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const products = useLiveQuery(
    () => {
      if (searchTerm) {
        return db.products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase())).toArray();
      }
      return db.products.toArray();
    },
    [searchTerm]
  );

  const { register, handleSubmit, reset, setValue } = useForm<Product>();
  const { register: registerStock, handleSubmit: handleStockSubmit, reset: resetStock } = useForm<{ addedStock: number, reason: string }>();

  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setValue('name', product.name);
      setValue('sku', product.sku);
      setValue('category', product.category);
      setValue('price', product.price);
      setValue('cost', product.cost);
      setValue('stock', product.stock);
      setValue('unit', product.unit);
    } else {
      setEditingProduct(null);
      reset();
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    reset();
  };

  const openStockModal = (product: Product) => {
    setEditingProduct(product);
    resetStock();
    setIsStockModalOpen(true);
  };

  const closeStockModal = () => {
    setIsStockModalOpen(false);
    setEditingProduct(null);
    resetStock();
  };

  const onSubmit = async (data: Product) => {
    try {
      data.price = Number(data.price);
      data.cost = Number(data.cost);
      data.stock = Number(data.stock);

      if (editingProduct?.id) {
        await db.products.update(editingProduct.id, data);
      } else {
        const id = await db.products.add(data);
        await db.stockMovements.add({
          productId: id as number,
          date: new Date().toISOString(),
          type: 'in',
          quantity: data.stock,
          reason: 'Stok Awal'
        });
      }
      closeModal();
    } catch (error) {
      console.error("Failed to save product", error);
      alert("Gagal menyimpan produk.");
    }
  };

  const onStockSubmit = async (data: { addedStock: number, reason: string }) => {
    if (!editingProduct?.id) return;
    try {
      const added = Number(data.addedStock);
      const newStock = editingProduct.stock + added;
      
      await db.transaction('rw', db.products, db.stockMovements, async () => {
        await db.products.update(editingProduct.id!, { stock: newStock });
        await db.stockMovements.add({
          productId: editingProduct.id!,
          date: new Date().toISOString(),
          type: added >= 0 ? 'in' : 'adjustment',
          quantity: Math.abs(added),
          reason: data.reason || 'Penyesuaian stok manual'
        });
      });
      closeStockModal();
    } catch (error) {
      console.error(error);
      alert("Gagal menyesuaikan stok.");
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Apakah Anda yakin ingin menghapus produk ini?")) {
      await db.products.delete(id);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Manajemen Produk</h1>
        <button 
          onClick={() => openModal()}
          className="glass-button-primary flex items-center gap-2"
        >
          <Plus size={20} />
          <span>Tambah Produk</span>
        </button>
      </div>

      <div className="glass-panel p-4 mb-6 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={20} />
          <input 
            type="text" 
            placeholder="Cari produk (Nama, SKU)..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="glass-input w-full pl-10"
          />
        </div>
      </div>

      <div className="glass-panel flex-1 overflow-auto">
        <table className="w-full min-w-[800px] text-left border-collapse">
          <thead>
            <tr className="border-b border-white/20 dark:border-slate-700/50">
              <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">SKU</th>
              <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Nama Produk</th>
              <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Kategori</th>
              <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-right">Stok</th>
              <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-right">Harga Jual</th>
              <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {products?.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500 dark:text-slate-400 dark:text-slate-500">
                  Tidak ada produk ditemukan.
                </td>
              </tr>
            ) : (
              products?.map(product => (
                <tr key={product.id} className="border-b border-white/10 dark:border-slate-700/50 hover:bg-white dark:bg-slate-800/40 transition-colors">
                  <td className="p-4">{product.sku}</td>
                  <td className="p-4 font-medium">{product.name}</td>
                  <td className="p-4">
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                      {product.category || 'Umum'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <span className={product.stock <= 5 ? "text-red-600 font-bold" : ""}>
                      {product.stock} {product.unit}
                    </span>
                  </td>
                  <td className="p-4 text-right font-medium">{formatCurrency(product.price)}</td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => openStockModal(product)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Penyesuaian Stok">
                        <PackagePlus size={18} />
                      </button>
                      <button onClick={() => openModal(product)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit Produk">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => product.id && handleDelete(product.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Hapus Produk">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isStockModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Sesuaikan Stok</h2>
              <button onClick={closeStockModal} className="p-2 text-slate-500 dark:text-slate-400 dark:text-slate-500 hover:bg-white dark:bg-slate-800/50 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleStockSubmit(onStockSubmit)} className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700/30 mb-4">
                <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">Produk</p>
                <p className="font-bold text-slate-800 dark:text-slate-100">{editingProduct.name}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500 mt-2">Stok Saat Ini: <span className="font-bold text-slate-800 dark:text-slate-100">{editingProduct.stock} {editingProduct.unit}</span></p>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Penambahan/Pengurangan Stok *</label>
                <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 mb-2">Gunakan angka minus (-) untuk mengurangi stok.</p>
                <input type="number" {...registerStock('addedStock', { required: true })} className="glass-input w-full font-bold" placeholder="Cth: 10 atau -5" />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Keterangan / Alasan</label>
                <input type="text" {...registerStock('reason')} className="glass-input w-full" placeholder="Cth: Barang masuk dari supplier" />
              </div>

              <div className="flex justify-end gap-3 pt-4 mt-6 border-t border-white/20 dark:border-slate-700/50">
                <button type="button" onClick={closeStockModal} className="glass-button">Batal</button>
                <button type="submit" className="glass-button-primary">Simpan Stok</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">{editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}</h2>
              <button onClick={closeModal} className="p-2 text-slate-500 dark:text-slate-400 dark:text-slate-500 hover:bg-white dark:bg-slate-800/50 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Nama Produk *</label>
                  <input {...register('name', { required: true })} className="glass-input w-full" placeholder="Cth: Kopi Susu" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">SKU / Barcode *</label>
                  <input {...register('sku', { required: true })} className="glass-input w-full" placeholder="Cth: KPS-001" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Kategori</label>
                  <input {...register('category')} className="glass-input w-full" placeholder="Cth: Minuman" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Satuan</label>
                  <input {...register('unit', { required: true })} className="glass-input w-full" placeholder="Cth: Pcs, Gelas" defaultValue="Pcs" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Harga Modal (Rp)</label>
                  <input type="number" {...register('cost')} className="glass-input w-full" placeholder="0" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Harga Jual (Rp) *</label>
                  <input type="number" {...register('price', { required: true })} className="glass-input w-full" placeholder="0" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Stok Awal *</label>
                <input type="number" {...register('stock', { required: true })} className="glass-input w-full" placeholder="0" />
              </div>

              <div className="flex justify-end gap-3 pt-4 mt-6 border-t border-white/20 dark:border-slate-700/50">
                <button type="button" onClick={closeModal} className="glass-button">Batal</button>
                <button type="submit" className="glass-button-primary">Simpan Produk</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

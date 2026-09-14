import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { formatCurrency } from '../utils/currency';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Receipt, Printer } from 'lucide-react';
import { useState, useRef } from 'react';
import { Transaction } from '../types';
import { useReactToPrint } from 'react-to-print';

export function Transactions() {
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const componentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: 'Struk_Pembelian',
  });

  const transactions = useLiveQuery(
    () => db.transactions.orderBy('date').reverse().toArray()
  );

  return (
    <div className="h-full flex flex-col md:flex-row gap-4">
      <div className="flex-1 flex flex-col h-full">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Riwayat Transaksi</h1>
        </div>

        <div className="glass-panel flex-1 overflow-auto">
          <table className="w-full min-w-[600px] text-left border-collapse">
            <thead>
              <tr className="border-b border-white/20 dark:border-slate-700/50 bg-white dark:bg-slate-800/30 sticky top-0">
                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">ID</th>
                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Tanggal</th>
                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Metode</th>
                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-right">Total</th>
                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {transactions?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 dark:text-slate-400 dark:text-slate-500">
                    Belum ada transaksi.
                  </td>
                </tr>
              ) : (
                transactions?.map(trx => (
                  <tr key={trx.id} className="border-b border-white/10 dark:border-slate-700/50 hover:bg-white dark:bg-slate-800/40 transition-colors">
                    <td className="p-4 text-slate-500 dark:text-slate-400 dark:text-slate-500 font-mono text-sm">#{trx.id?.toString().padStart(6, '0')}</td>
                    <td className="p-4">{format(new Date(trx.date), 'dd MMM yyyy, HH:mm', { locale: id })}</td>
                    <td className="p-4">
                      <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-sm font-medium border border-blue-100">
                        {trx.paymentMethod}
                      </span>
                    </td>
                    <td className="p-4 text-right font-bold text-slate-800 dark:text-slate-100">{formatCurrency(trx.total)}</td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => setSelectedTransaction(trx)}
                        className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors inline-flex items-center gap-2"
                      >
                        <Receipt size={18} />
                        <span className="text-sm font-medium">Detail</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedTransaction && (
        <div className="w-full md:w-96 glass-panel flex flex-col h-full flex-shrink-0 relative overflow-hidden">
          <div className="p-6 overflow-y-auto flex-1 bg-white dark:bg-slate-800/30" ref={componentRef}>
            <div className="text-center mb-6 pb-6 border-b border-dashed border-slate-300">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600 print:hidden">
                <Receipt size={32} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Toko KasirKu</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">Struk Pembelian</p>
            </div>

            <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300 mb-6">
              <div className="flex justify-between">
                <span>No. Transaksi:</span>
                <span className="font-mono">#{selectedTransaction.id?.toString().padStart(6, '0')}</span>
              </div>
              <div className="flex justify-between">
                <span>Tanggal:</span>
                <span>{format(new Date(selectedTransaction.date), 'dd/MM/yyyy HH:mm')}</span>
              </div>
              <div className="flex justify-between">
                <span>Metode:</span>
                <span>{selectedTransaction.paymentMethod}</span>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              {selectedTransaction.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <div>
                    <div className="font-semibold text-slate-800 dark:text-slate-100">{item.name}</div>
                    <div className="text-slate-500 dark:text-slate-400 dark:text-slate-500">{item.quantity} x {formatCurrency(item.price)}</div>
                  </div>
                  <div className="font-medium text-slate-800 dark:text-slate-100">{formatCurrency(item.subtotal)}</div>
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-slate-300 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Subtotal</span>
                <span>{formatCurrency(selectedTransaction.subtotal)}</span>
              </div>
              {selectedTransaction.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Diskon</span>
                  <span>-{formatCurrency(selectedTransaction.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-700/50">
                <span>Total</span>
                <span>{formatCurrency(selectedTransaction.total)}</span>
              </div>
              {selectedTransaction.paymentMethod === 'Tunai' && (
                <>
                  <div className="flex justify-between text-slate-600 dark:text-slate-300 pt-2">
                    <span>Tunai</span>
                    <span>{formatCurrency(selectedTransaction.cashGiven || 0)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>Kembalian</span>
                    <span>{formatCurrency(selectedTransaction.change || 0)}</span>
                  </div>
                </>
              )}
            </div>
            
            <div className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">
              Terima kasih telah berbelanja!
            </div>
          </div>
          
          <div className="p-4 bg-white dark:bg-slate-800/50 border-t border-white/40 dark:border-slate-700/50 flex gap-2 print:hidden">
            <button onClick={() => handlePrint()} className="glass-button flex-1 flex justify-center items-center gap-2">
              <Printer size={18} />
              Cetak
            </button>
            <button onClick={() => setSelectedTransaction(null)} className="glass-button flex-1">
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

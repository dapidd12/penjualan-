import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { formatCurrency } from '../utils/currency';
import { Clock, Play, Square, Wallet, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { CashSession } from '../types';

export function Shift() {
  const [startingCash, setStartingCash] = useState('');
  const [endingCash, setEndingCash] = useState('');
  const [cashierName, setCashierName] = useState('');

  const activeSession = useLiveQuery(
    async () => {
      const sessions = await db.cashSessions.where('status').equals('open').toArray();
      return sessions.length > 0 ? sessions[0] : null;
    }
  );

  const pastSessions = useLiveQuery(
    () => db.cashSessions.where('status').equals('closed').reverse().toArray()
  );

  const handleOpenShift = async () => {
    if (!startingCash || !cashierName) {
      alert('Mohon isi nama kasir dan modal awal');
      return;
    }
    
    await db.cashSessions.add({
      startTime: new Date().toISOString(),
      startingCash: Number(startingCash),
      status: 'open',
      cashierName,
    });
    setStartingCash('');
    setCashierName('');
  };

  const handleCloseShift = async () => {
    if (!activeSession || !activeSession.id) return;
    if (!endingCash) {
      alert('Mohon isi jumlah uang di laci kasir saat ini');
      return;
    }

    // Calculate expected cash: starting cash + total cash from transactions during shift
    const shiftTransactions = await db.transactions
      .where('date').aboveOrEqual(activeSession.startTime)
      .toArray();
    
    const cashIncome = shiftTransactions
      .filter(t => t.paymentMethod === 'Tunai' && t.status === 'completed')
      .reduce((sum, t) => sum + t.total, 0);
    
    const expectedCash = activeSession.startingCash + cashIncome;
    const actualCash = Number(endingCash);
    const difference = actualCash - expectedCash;

    await db.cashSessions.update(activeSession.id, {
      endTime: new Date().toISOString(),
      endingCash: actualCash,
      expectedCash,
      difference,
      status: 'closed'
    });
    setEndingCash('');
  };

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex justify-between items-center mb-2 px-1">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Manajemen Shift Kasir</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Active Shift Card */}
        <div className="glass-panel p-6">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-200 dark:border-slate-700/50 pb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <Clock size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Status Shift</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">
                {activeSession ? 'Shift sedang aktif' : 'Belum ada shift aktif'}
              </p>
            </div>
          </div>

          {!activeSession ? (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Nama Kasir *</label>
                <input 
                  type="text" 
                  value={cashierName}
                  onChange={(e) => setCashierName(e.target.value)}
                  className="glass-input w-full" 
                  placeholder="Cth: Budi" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Modal Awal Kas Laci (Rp) *</label>
                <input 
                  type="number" 
                  value={startingCash}
                  onChange={(e) => setStartingCash(e.target.value)}
                  className="glass-input w-full font-bold text-lg" 
                  placeholder="0" 
                />
              </div>
              <button 
                onClick={handleOpenShift}
                className="w-full h-12 glass-button-primary flex justify-center items-center gap-2 mt-4"
              >
                <Play size={18} fill="currentColor" /> Buka Shift Sekarang
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-300">Kasir:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">{activeSession.cashierName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-300">Waktu Buka:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-100">
                    {format(new Date(activeSession.startTime), 'HH:mm, dd MMM', { locale: id })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-300">Modal Awal:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-100">{formatCurrency(activeSession.startingCash)}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-700/50">
                <div className="space-y-1 mb-4">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Hitung Kas Laci Saat Ini (Rp) *</label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 mb-2">Masukkan jumlah fisik uang tunai di laci untuk pencocokan sistem.</p>
                  <input 
                    type="number" 
                    value={endingCash}
                    onChange={(e) => setEndingCash(e.target.value)}
                    className="glass-input w-full font-bold text-lg text-right" 
                    placeholder="0" 
                  />
                </div>
                <button 
                  onClick={handleCloseShift}
                  className="w-full h-12 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-md transition-colors flex justify-center items-center gap-2"
                >
                  <Square size={18} fill="currentColor" /> Tutup Shift & Rekonsiliasi
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Info/Warning Panel */}
        <div className="glass-panel p-6 bg-slate-50 dark:bg-slate-900/50/50">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Petunjuk Shift Kasir</h2>
          <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
            <li className="flex gap-2"><AlertCircle size={16} className="text-blue-500 flex-shrink-0 mt-0.5"/> Buka shift dengan memasukkan uang modal awal (pecahan kecil) yang ada di laci kasir.</li>
            <li className="flex gap-2"><AlertCircle size={16} className="text-blue-500 flex-shrink-0 mt-0.5"/> Semua transaksi tunai akan menambah nilai 'Kas Diharapkan' dalam sistem.</li>
            <li className="flex gap-2"><AlertCircle size={16} className="text-blue-500 flex-shrink-0 mt-0.5"/> Saat menutup shift, hitung uang fisik di laci dan masukkan untuk melihat selisih (kurang/lebih).</li>
          </ul>
        </div>
      </div>

      <div className="glass-panel mt-4 p-5 flex-1 overflow-auto">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Riwayat Shift</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700/50">
                <th className="p-3 font-semibold text-slate-600 dark:text-slate-300">Kasir</th>
                <th className="p-3 font-semibold text-slate-600 dark:text-slate-300">Buka</th>
                <th className="p-3 font-semibold text-slate-600 dark:text-slate-300">Tutup</th>
                <th className="p-3 font-semibold text-slate-600 dark:text-slate-300 text-right">Sistem (Rp)</th>
                <th className="p-3 font-semibold text-slate-600 dark:text-slate-300 text-right">Fisik (Rp)</th>
                <th className="p-3 font-semibold text-slate-600 dark:text-slate-300 text-right">Selisih</th>
              </tr>
            </thead>
            <tbody>
              {pastSessions?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-500 dark:text-slate-400 dark:text-slate-500">Belum ada riwayat shift</td>
                </tr>
              ) : (
                pastSessions?.map((session) => (
                  <tr key={session.id} className="border-b border-slate-100 dark:border-slate-700/30 hover:bg-slate-50 dark:bg-slate-900/50/50">
                    <td className="p-3 font-medium">{session.cashierName}</td>
                    <td className="p-3 text-sm">{format(new Date(session.startTime), 'dd/MM HH:mm')}</td>
                    <td className="p-3 text-sm">{session.endTime ? format(new Date(session.endTime), 'dd/MM HH:mm') : '-'}</td>
                    <td className="p-3 text-right">{formatCurrency(session.expectedCash || 0)}</td>
                    <td className="p-3 text-right">{formatCurrency(session.endingCash || 0)}</td>
                    <td className="p-3 text-right">
                      <span className={`px-2 py-1 rounded-md font-bold text-xs ${
                        session.difference! > 0 ? 'bg-green-100 text-green-700' : 
                        session.difference! < 0 ? 'bg-red-100 text-red-700' : 
                        'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
                      }`}>
                        {session.difference! > 0 ? '+' : ''}{formatCurrency(session.difference || 0)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

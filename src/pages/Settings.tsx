import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { StoreSettings } from '../types';
import { Save, Download, Upload, Store } from 'lucide-react';
import { exportDB, importDB } from 'dexie-export-import';
import download from 'downloadjs';

export function Settings() {
  const [settings, setSettings] = useState<StoreSettings>({
    storeName: '',
    address: '',
    phone: '',
    taxRate: 0,
    receiptFooter: 'Terima kasih telah berbelanja!'
  });

  const savedSettings = useLiveQuery(() => db.settings.toArray());

  useEffect(() => {
    if (savedSettings && savedSettings.length > 0) {
      setSettings(savedSettings[0]);
    }
  }, [savedSettings]);

  const handleSave = async () => {
    try {
      if (settings.id) {
        await db.settings.update(settings.id, settings);
      } else {
        await db.settings.add(settings);
      }
      alert('Pengaturan berhasil disimpan!');
    } catch (error) {
      console.error(error);
      alert('Gagal menyimpan pengaturan.');
    }
  };

  const handleExport = async () => {
    try {
      const blob = await exportDB(db, { prettyJson: true });
      download(blob, `backup-kasirku-${new Date().toISOString().split('T')[0]}.json`, 'application/json');
    } catch (error) {
      console.error(error);
      alert('Gagal melakukan backup data.');
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (confirm('PERINGATAN: Mengimpor data akan menimpa data yang ada saat ini. Anda yakin?')) {
      try {
        await db.delete(); // clear existing db first
        await db.open();
        await importDB(file, { clearTablesBeforeImport: true });
        alert('Data berhasil dipulihkan!');
        window.location.reload();
      } catch (error) {
        console.error(error);
        alert('Gagal memulihkan data. Pastikan format file benar.');
      }
    }
    // reset input
    event.target.value = '';
  };

  return (
    <div className="h-full flex flex-col gap-4 overflow-y-auto">
      <div className="flex justify-between items-center mb-2 px-1">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Pengaturan Toko</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-6 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-700/50 pb-4">
            <Store className="text-blue-600" size={24} />
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Profil Toko</h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Nama Toko</label>
              <input 
                type="text" 
                value={settings.storeName}
                onChange={(e) => setSettings({...settings, storeName: e.target.value})}
                className="glass-input w-full" 
                placeholder="Cth: KasirKu Mart" 
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Alamat</label>
              <textarea 
                value={settings.address}
                onChange={(e) => setSettings({...settings, address: e.target.value})}
                className="glass-input w-full min-h-[80px] resize-none" 
                placeholder="Cth: Jl. Raya No. 123" 
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Nomor Telepon</label>
              <input 
                type="text" 
                value={settings.phone}
                onChange={(e) => setSettings({...settings, phone: e.target.value})}
                className="glass-input w-full" 
                placeholder="Cth: 08123456789" 
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Pajak / PPN (%)</label>
              <input 
                type="number" 
                value={settings.taxRate}
                onChange={(e) => setSettings({...settings, taxRate: Number(e.target.value)})}
                className="glass-input w-full" 
                placeholder="0" 
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Pesan Footer Struk</label>
              <input 
                type="text" 
                value={settings.receiptFooter}
                onChange={(e) => setSettings({...settings, receiptFooter: e.target.value})}
                className="glass-input w-full" 
                placeholder="Terima kasih!" 
              />
            </div>

            <button 
              onClick={handleSave}
              className="glass-button-primary flex items-center justify-center gap-2 w-full mt-4"
            >
              <Save size={18} /> Simpan Pengaturan
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-panel p-6">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Backup & Restore Data</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500 mb-6">
              Aplikasi ini berjalan secara offline (local-first). Data Anda disimpan di browser perangkat ini.
              Sangat disarankan untuk melakukan backup secara rutin untuk menghindari kehilangan data jika cache browser terhapus.
            </p>

            <div className="space-y-4">
              <button 
                onClick={handleExport}
                className="w-full flex items-center justify-center gap-3 glass-button py-4 text-blue-700 border-blue-200 hover:bg-blue-50"
              >
                <Download size={20} />
                <div className="text-left">
                  <div className="font-bold">Backup Data (Export)</div>
                  <div className="text-xs font-normal opacity-80">Simpan seluruh data ke file JSON</div>
                </div>
              </button>

              <label className="w-full flex items-center justify-center gap-3 glass-button py-4 text-orange-700 border-orange-200 hover:bg-orange-50 cursor-pointer">
                <Upload size={20} />
                <div className="text-left">
                  <div className="font-bold">Pulihkan Data (Import)</div>
                  <div className="text-xs font-normal opacity-80">Kembalikan data dari file JSON</div>
                </div>
                <input 
                  type="file" 
                  accept=".json" 
                  className="hidden" 
                  onChange={handleImport}
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

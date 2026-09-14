import { Outlet, NavLink } from 'react-router-dom';
import { ShoppingCart, Package, ReceiptText, LogOut, LayoutDashboard, Clock, Settings, Sun, Moon } from 'lucide-react';
import { clsx } from 'clsx';
import { useEffect } from 'react';
import { useThemeStore } from '../store/useThemeStore';

export function Layout() {
  const { isDarkMode, toggleTheme } = useThemeStore();

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const navItems = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Beranda" },
    { to: "/pos", icon: ShoppingCart, label: "Kasir" },
    { to: "/products", icon: Package, label: "Produk" },
    { to: "/transactions", icon: ReceiptText, label: "Transaksi" },
    { to: "/shift", icon: Clock, label: "Shift" },
    { to: "/settings", icon: Settings, label: "Pengaturan" },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900 transition-colors">
      {/* Background Decorative Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-blue-300/40 dark:bg-blue-900/30 blur-[100px] mix-blend-multiply dark:mix-blend-screen transition-colors duration-1000" />
        <div className="absolute top-[20%] right-[-5%] w-[35vw] h-[35vw] rounded-full bg-purple-300/40 dark:bg-purple-900/30 blur-[100px] mix-blend-multiply dark:mix-blend-screen transition-colors duration-1000" />
        <div className="absolute bottom-[-10%] left-[20%] w-[45vw] h-[45vw] rounded-full bg-pink-300/40 dark:bg-pink-900/30 blur-[100px] mix-blend-multiply dark:mix-blend-screen transition-colors duration-1000" />
      </div>

      {/* Sidebar - Desktop Only */}
      <aside className="hidden md:flex w-64 flex-shrink-0 p-4 flex-col gap-4 z-10">
        <div className="glass-panel flex-1 flex flex-col py-6 px-3">
          <div className="flex items-center justify-start px-4 mb-8">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg flex-shrink-0">
              K
            </div>
            <span className="ml-3 font-bold text-xl text-slate-800 dark:text-slate-100">KasirKu</span>
          </div>

          <nav className="flex-1 flex flex-col gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => clsx(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                  isActive 
                    ? "bg-blue-600/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 font-semibold shadow-sm" 
                    : "text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200"
                )}
              >
                <item.icon size={22} strokeWidth={2.5} className="flex-shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto pt-4 border-t border-white/20 dark:border-slate-700/50 flex flex-col gap-2">
            <button 
              onClick={toggleTheme}
              className="w-full flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200 transition-all font-medium"
            >
              {isDarkMode ? <Sun size={22} className="flex-shrink-0" /> : <Moon size={22} className="flex-shrink-0" />}
              <span>{isDarkMode ? 'Mode Terang' : 'Mode Gelap'}</span>
            </button>
            <button className="w-full flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all font-medium">
              <LogOut size={22} className="flex-shrink-0" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:pl-0 pb-24 md:pb-4 overflow-hidden flex flex-col z-10">
        <div className="flex-1 rounded-2xl overflow-hidden flex flex-col relative">
          <Outlet />
        </div>
      </main>

      {/* Bottom Navigation - Mobile Only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass-panel !rounded-none !rounded-t-2xl border-t border-white/40 dark:border-slate-700/50 flex justify-around items-center p-2 pb-safe z-40">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => clsx(
              "flex flex-col items-center gap-1 p-2 min-w-[64px] rounded-xl transition-all",
              isActive 
                ? "text-blue-700 dark:text-blue-400" 
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            )}
          >
            {({ isActive }) => (
              <>
                <item.icon size={24} strokeWidth={2.5} className={isActive ? "drop-shadow-md" : ""} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Theme Toggle FAB - Mobile Only */}
      <button 
        onClick={toggleTheme}
        className="md:hidden fixed top-4 right-4 z-50 p-3 rounded-full glass-panel shadow-lg text-slate-800 dark:text-slate-200"
      >
        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
      </button>
    </div>
  );
}


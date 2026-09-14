import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { formatCurrency } from '../utils/currency';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Package, ReceiptText, Wallet } from 'lucide-react';
import { format, subDays, isAfter, startOfDay } from 'date-fns';
import { id } from 'date-fns/locale';

export function Dashboard() {
  const transactions = useLiveQuery(() => db.transactions.toArray());
  const products = useLiveQuery(() => db.products.toArray());

  if (!transactions || !products) return <div className="p-4">Loading...</div>;

  const today = startOfDay(new Date());
  const last7Days = startOfDay(subDays(today, 6));

  const recentTransactions = transactions.filter(t => 
    t.status === 'completed' && isAfter(new Date(t.date), last7Days)
  );

  const totalRevenue = recentTransactions.reduce((sum, t) => sum + t.total, 0);
  
  // Calculate Profit
  let totalProfit = 0;
  recentTransactions.forEach(t => {
    t.items.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      const cost = product?.cost || 0;
      totalProfit += (item.price - cost) * item.quantity;
    });
  });

  const totalItemsSold = recentTransactions.reduce((sum, t) => 
    sum + t.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
  );

  // Group by date for chart
  const salesByDate = recentTransactions.reduce((acc, t) => {
    const dateStr = format(new Date(t.date), 'dd MMM', { locale: id });
    if (!acc[dateStr]) acc[dateStr] = 0;
    acc[dateStr] += t.total;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(salesByDate).map(([date, total]) => ({
    date,
    total
  }));

  // Top products
  const productSales = recentTransactions.reduce((acc, t) => {
    t.items.forEach(item => {
      if (!acc[item.productId]) acc[item.productId] = { name: item.name, qty: 0, revenue: 0 };
      acc[item.productId].qty += item.quantity;
      acc[item.productId].revenue += item.subtotal;
    });
    return acc;
  }, {} as Record<number, { name: string, qty: number, revenue: number }>);

  const topProducts = Object.values(productSales)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  const statCards = [
    { title: "Pendapatan (7 Hari)", value: formatCurrency(totalRevenue), icon: Wallet, color: "text-blue-600", bg: "bg-blue-100" },
    { title: "Keuntungan (7 Hari)", value: formatCurrency(totalProfit), icon: TrendingUp, color: "text-green-600", bg: "bg-green-100" },
    { title: "Total Transaksi", value: recentTransactions.length.toString(), icon: ReceiptText, color: "text-purple-600", bg: "bg-purple-100" },
    { title: "Produk Terjual", value: totalItemsSold.toString(), icon: Package, color: "text-orange-600", bg: "bg-orange-100" },
  ];

  return (
    <div className="h-full flex flex-col gap-4 overflow-y-auto">
      <div className="flex justify-between items-center mb-2 px-1">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Ringkasan Hari Ini</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => (
          <div key={idx} className="glass-panel p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 dark:text-slate-500">{stat.title}</p>
              <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-[400px]">
        <div className="lg:col-span-2 glass-panel p-5 flex flex-col">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Tren Penjualan (7 Hari Terakhir)</h2>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} tickFormatter={(val) => `Rp${val/1000}k`} />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel p-5 flex flex-col">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Produk Terlaris</h2>
          <div className="flex-1 overflow-y-auto">
            {topProducts.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-500">
                Belum ada data penjualan
              </div>
            ) : (
              <div className="space-y-4">
                {topProducts.map((product, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800/40 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 text-sm">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-100">{product.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500">{product.qty} terjual</p>
                      </div>
                    </div>
                    <div className="font-bold text-blue-600">
                      {formatCurrency(product.revenue)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

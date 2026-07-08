import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Package, DollarSign, TrendingUp, ArrowRightLeft } from 'lucide-react';

const mockChartData = [
  { name: 'Jan', stock: 4000, value: 2400 },
  { name: 'Feb', stock: 3000, value: 1398 },
  { name: 'Mar', stock: 2000, value: 9800 },
  { name: 'Apr', stock: 2780, value: 3908 },
  { name: 'May', stock: 1890, value: 4800 },
  { name: 'Jun', stock: 2390, value: 3800 },
  { name: 'Jul', stock: 3490, value: 4300 },
];

const topProducts = [
  { id: 1, name: 'Premium Wireless Headphones', stock: 145, value: 28999 },
  { id: 2, name: 'Mechanical Keyboard Pro', stock: 98, value: 14600 },
  { id: 3, name: '4K Ultra Monitor', stock: 45, value: 18000 },
  { id: 4, name: 'Ergonomic Mouse', stock: 230, value: 11500 },
  { id: 5, name: 'USB-C Docking Station', stock: 85, value: 6800 },
];

const recentTransactions = [
  { id: 'TRX-001', type: 'IN', product: 'Premium Wireless Headphones', qty: 50, date: '2026-07-08' },
  { id: 'TRX-002', type: 'OUT', product: '4K Ultra Monitor', qty: 2, date: '2026-07-07' },
  { id: 'TRX-003', type: 'OUT', product: 'Mechanical Keyboard Pro', qty: 5, date: '2026-07-07' },
  { id: 'TRX-004', type: 'IN', product: 'Ergonomic Mouse', qty: 100, date: '2026-07-06' },
];

const StatCard = ({ title, value, icon: Icon, trend, trendUp }) => (
  <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{value}</h3>
      </div>
      <div className={`p-3 rounded-xl ${trendUp ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'}`}>
        <Icon size={24} />
      </div>
    </div>
    <div className="mt-4 flex items-center text-sm">
      <span className={trendUp ? 'text-emerald-500 font-medium' : 'text-rose-500 font-medium'}>
        {trend}
      </span>
      <span className="text-slate-500 dark:text-slate-400 ml-2">vs last month</span>
    </div>
  </div>
);

export default function Dashboard() {
  return (
    <div className="space-y-8 pb-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Dashboard Overview</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Welcome back. Here's what's happening with your inventory today.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Products" value="1,248" icon={Package} trend="+12%" trendUp={true} />
        <StatCard title="Total Stock Value" value="$845,230" icon={DollarSign} trend="+5.4%" trendUp={true} />
        <StatCard title="Low Stock Items" value="12" icon={TrendingUp} trend="-2" trendUp={false} />
        <StatCard title="Transactions Today" value="48" icon={ArrowRightLeft} trend="+8%" trendUp={true} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-1 lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Stock Movement Trends</h3>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorStock" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dx={-10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Area type="monotone" dataKey="stock" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorStock)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Top Products by Stock</h3>
          <div className="space-y-6">
            {topProducts.map((product, i) => (
              <div key={product.id} className="flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-500 dark:text-slate-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/20 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{product.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{product.stock} units</p>
                  </div>
                </div>
                <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  ${(product.value).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Transactions</h3>
          <button className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700">View All →</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-700/50 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4 rounded-l-xl">Transaction ID</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Quantity</th>
                <th className="px-6 py-4 rounded-r-xl">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.map((tx) => (
                <tr key={tx.id} className="border-b border-slate-100 dark:border-slate-700/50 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{tx.id}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${tx.type === 'IN' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'}`}>
                      {tx.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-medium">{tx.product}</td>
                  <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{tx.qty}</td>
                  <td className="px-6 py-4 text-slate-500">{tx.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

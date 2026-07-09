import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Package, DollarSign, TrendingUp, ArrowRightLeft, Loader2 } from 'lucide-react';
import client from '../api/client';

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
      <span className="text-slate-500 dark:text-slate-400 ml-2">Status</span>
    </div>
  </div>
);

export default function Dashboard() {
  const [data, setData] = useState({
    total_products: 0,
    total_stock: 0,
    low_stock_count: 0,
    transactions_today: 0,
    top_products_by_stock: [],
    recent_transactions: [],
    chart_data: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await client.get('/products/dashboard/');
        setData(res.data);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <Loader2 className="animate-spin text-indigo-500" size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Dashboard Overview</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Real-time inventory levels, stock valuation and transactions.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Products" 
          value={data.total_products.toLocaleString()} 
          icon={Package} 
          trend="Live active products" 
          trendUp={true} 
        />
        <StatCard 
          title="Total Stock Units" 
          value={data.total_stock.toLocaleString()} 
          icon={Package} 
          trend="Available in variants" 
          trendUp={true} 
        />
        <StatCard 
          title="Low Stock Items" 
          value={data.low_stock_count} 
          icon={TrendingUp} 
          trend={data.low_stock_count > 0 ? "Needs attention" : "All variants safe"} 
          trendUp={data.low_stock_count === 0} 
        />
        <StatCard 
          title="Transactions Today" 
          value={data.transactions_today} 
          icon={ArrowRightLeft} 
          trend="Total in/out logs" 
          trendUp={true} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-1 lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Stock Level Trends (Last 7 Days)</h3>
          {data.chart_data.length === 0 ? (
            <div className="h-[320px] flex items-center justify-center text-slate-400 dark:text-slate-500">
              No historical data available. Perform transactions to generate stock trends.
            </div>
          ) : (
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.chart_data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Top Products by Stock</h3>
          {data.top_products_by_stock.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-400 dark:text-slate-500">
              No active products in stock.
            </div>
          ) : (
            <div className="space-y-6">
              {data.top_products_by_stock.map((product, i) => (
                <div key={product.id} className="flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-500 dark:text-slate-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/20 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{product.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{product.stock.toLocaleString()} units</p>
                    </div>
                  </div>
                  <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    ₹{product.value.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Transactions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-700/50 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4 rounded-l-xl">Transaction ID</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Product Variant</th>
                <th className="px-6 py-4">Quantity</th>
                <th className="px-6 py-4 rounded-r-xl">Date</th>
              </tr>
            </thead>
            <tbody>
              {data.recent_transactions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-400">
                    No transactions found. Go to Stock Movement to record purchases and sales.
                  </td>
                </tr>
              ) : (
                data.recent_transactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-slate-100 dark:border-slate-700/50 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{tx.id}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${tx.type === 'IN' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'}`}>
                        {tx.type === 'IN' ? 'Stock In (Purchase)' : 'Stock Out (Sale)'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-medium">{tx.product}</td>
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{tx.qty.toLocaleString()}</td>
                    <td className="px-6 py-4 text-slate-500">{tx.date}</td>
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

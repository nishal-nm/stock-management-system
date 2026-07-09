import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Package, TrendingUp, ArrowRightLeft, Loader2 } from 'lucide-react';
import client from '../api/client';

const StatCard = ({ title, value, icon: Icon, trend, trendUp }) => (
  <div className="bg-white rounded-lg p-5 border border-slate-200 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</p>
        <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{value}</h3>
      </div>
      <div className="p-2.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
        <Icon size={20} />
      </div>
    </div>
    <div className="mt-3 flex items-center text-xs">
      <span className={trendUp ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
        {trend}
      </span>
      <span className="text-slate-400 ml-2">• Status</span>
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
        <Loader2 className="animate-spin text-slate-900" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-0.5">Real-time inventory levels, stock valuation and transactions.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="col-span-1 lg:col-span-2 bg-white rounded-lg p-5 border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-6">Stock Level Trends (Last 7 Days)</h3>
          {data.chart_data.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-slate-400">
              No historical data available. Perform transactions to generate stock trends.
            </div>
          ) : (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.chart_data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorStock" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#475569" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#475569" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} dx={-10} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: 12, color: '#0f172a' }}
                    itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="stock" stroke="#0f172a" strokeWidth={2} fillOpacity={1} fill="url(#colorStock)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg p-5 border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-6">Top Products by Stock</h3>
          {data.top_products_by_stock.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-400">
              No active products in stock.
            </div>
          ) : (
            <div className="space-y-4">
              {data.top_products_by_stock.map((product, i) => (
                <div key={product.id} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-700">
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 line-clamp-1">{product.name}</p>
                      <p className="text-xs text-slate-500">{product.stock.toLocaleString()} units</p>
                    </div>
                  </div>
                  <div className="text-xs font-bold text-slate-900 bg-slate-100 border border-slate-200 px-2 py-1 rounded">
                    ₹{product.value.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg p-5 border border-slate-200 shadow-sm">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-4">Recent Transactions</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-bold">Transaction ID</th>
                <th className="px-4 py-3 font-bold">Type</th>
                <th className="px-4 py-3 font-bold">Product Variant</th>
                <th className="px-4 py-3 font-bold">Quantity</th>
                <th className="px-4 py-3 font-bold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.recent_transactions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-slate-400">
                    No transactions found. Go to Stock Movement to record purchases and sales.
                  </td>
                </tr>
              ) : (
                data.recent_transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900">{tx.id}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold border ${tx.type === 'IN' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
                        {tx.type === 'IN' ? 'Stock In' : 'Stock Out'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700 font-medium">{tx.product}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{tx.qty.toLocaleString()}</td>
                    <td className="px-4 py-3 text-slate-500">{tx.date}</td>
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

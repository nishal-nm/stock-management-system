import React, { useState, useEffect, useCallback } from 'react';
import { Download, Calendar, Search, Loader2 } from 'lucide-react';
import client from '../api/client';

export default function StockReport() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [transactionType, setTransactionType] = useState('');
  const [productId, setProductId] = useState(''); // We'll keep this as a simple text input for product UUID for now
  
  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      if (transactionType) params.append('transaction_type', transactionType);
      if (productId) params.append('product_id', productId);
      params.append('page', page);
      params.append('page_size', pageSize);

      const response = await client.get(`/stock/report/?${params.toString()}`);
      
      // DRF PageNumberPagination returns { count, next, previous, results }
      const data = response.data.results || response.data;
      setTransactions(data);
      setTotalCount(response.data.count || data.length);
    } catch (err) {
      console.error("Failed to fetch report:", err);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, transactionType, productId, page, pageSize]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleExportCSV = () => {
    // Generate CSV from current transactions on screen
    if (!transactions.length) return;
    
    const headers = ['Date & Time', 'Transaction ID', 'Type', 'Product', 'Variant', 'Quantity', 'Notes'];
    const rows = transactions.map(tx => [
      new Date(tx.created_at).toLocaleString(),
      tx.id,
      tx.transaction_type === 'IN' ? 'PURCHASE' : 'SALE',
      `"${tx.product_name}"`,
      `"${tx.sub_variant_name}"`,
      tx.quantity,
      `"${tx.notes || ''}"`
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `stock_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Stock Report</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">View transaction history and export reports.</p>
        </div>
        <button 
          onClick={handleExportCSV}
          disabled={loading || transactions.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl font-medium transition-all shadow-sm hover:shadow disabled:opacity-50"
        >
          <Download size={18} />
          Export CSV
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Filters */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex flex-col lg:flex-row gap-4 justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex flex-wrap gap-3 w-full lg:w-auto">
            <div className="relative group flex-1 sm:flex-none">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="date" 
                value={startDate}
                onChange={e => { setStartDate(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm" 
              />
            </div>
            <span className="self-center text-slate-400 font-medium">to</span>
            <div className="relative group flex-1 sm:flex-none">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="date" 
                value={endDate}
                onChange={e => { setEndDate(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm" 
              />
            </div>
            <select 
              value={transactionType}
              onChange={e => { setTransactionType(e.target.value); setPage(1); }}
              className="px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 flex-1 sm:flex-none shadow-sm"
            >
              <option value="">All Types</option>
              <option value="PURCHASE">Purchase (In)</option>
              <option value="SALE">Sale (Out)</option>
            </select>
            
            <select 
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 flex-1 sm:flex-none shadow-sm"
            >
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
            </select>
          </div>
          
          <div className="relative w-full lg:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Filter by product UUID..." 
              value={productId}
              onChange={e => { setProductId(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm shadow-sm"
            />
          </div>
        </div>
        
        {/* Table */}
        <div className="overflow-x-auto min-h-[400px] relative">
          {loading && (
            <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 flex items-center justify-center z-10 backdrop-blur-[2px]">
              <Loader2 className="animate-spin text-indigo-500" size={32} />
            </div>
          )}
          
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-800/80 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-4 font-semibold tracking-wider">Date & Time</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Transaction ID</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Type</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Product</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Variant</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Quantity</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {transactions.length === 0 && !loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    No stock transactions found for the selected filters.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors group">
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 whitespace-nowrap font-medium">
                      {new Date(tx.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white whitespace-nowrap font-mono text-xs">
                      {tx.id.split('-')[0]}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1.5 rounded-full text-xs font-bold border ${tx.transaction_type === 'IN' ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400' : 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400'}`}>
                        {tx.transaction_type === 'IN' ? 'PURCHASE ↓' : 'SALE ↑'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{tx.product_name}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-medium">{tx.sub_variant_name}</td>
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white text-base">
                      {parseInt(tx.quantity)}
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs max-w-[200px] truncate" title={tx.notes}>
                      {tx.notes || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-5 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/50">
          <span className="text-sm text-slate-500 dark:text-slate-400">
            Showing {transactions.length > 0 ? (page - 1) * pageSize + 1 : 0} to {Math.min(page * pageSize, totalCount)} of {totalCount} entries
          </span>
          <div className="flex gap-1.5">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm disabled:opacity-50 hover:bg-white dark:hover:bg-slate-700 transition-colors shadow-sm"
            >
              Prev
            </button>
            <div className="flex items-center px-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              Page {page} of {totalPages}
            </div>
            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
              className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm disabled:opacity-50 hover:bg-white dark:hover:bg-slate-700 transition-colors shadow-sm"
            >
              Next
            </button>
          </div>
        </div>
        
      </div>
    </div>
  );
}

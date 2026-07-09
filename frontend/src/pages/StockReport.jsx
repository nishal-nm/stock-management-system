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
  const [productId, setProductId] = useState('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const handleStartDateChange = (e) => {
    const val = e.target.value;
    if (endDate && val > endDate) return;
    setStartDate(val);
    setPage(1);
  };

  const handleEndDateChange = (e) => {
    const val = e.target.value;
    if (startDate && val < startDate) return;
    setEndDate(val);
    setPage(1);
  };

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
    if (!transactions.length) return;
    
    const headers = ['Date & Time', 'Transaction ID', 'Type', 'Product', 'Variant', 'Quantity', 'Notes'];
    const rows = transactions.map(tx => [
      new Date(tx.created_at).toLocaleString(),
      `TX-${tx.id.split('-')[0].toUpperCase()}`,
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
    <div className="space-y-6 pb-12 font-sans antialiased text-slate-800">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Stock Report</h1>
          <p className="text-slate-500 text-sm mt-0.5">View transaction history and export reports.</p>
        </div>
        <button 
          onClick={handleExportCSV}
          disabled={loading || transactions.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-950 hover:bg-slate-800 text-white rounded-lg font-bold text-xs uppercase tracking-wider shadow-sm transition-colors disabled:opacity-50"
        >
          <Download size={14} />
          Export CSV
        </button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-slate-200 flex flex-col lg:flex-row gap-4 justify-between items-center bg-slate-50">
          <div className="flex flex-wrap gap-3 w-full lg:w-auto">
             <div className="relative flex-1 sm:flex-none">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="date" 
                value={startDate}
                max={endDate}
                onChange={handleStartDateChange}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400 shadow-sm" 
              />
            </div>
            <span className="self-center text-slate-400 font-bold text-xs uppercase">to</span>
            <div className="relative flex-1 sm:flex-none">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="date" 
                value={endDate}
                min={startDate}
                onChange={handleEndDateChange}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400 shadow-sm" 
              />
            </div>
            <select 
              value={transactionType}
              onChange={e => { setTransactionType(e.target.value); setPage(1); }}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold focus:outline-none focus:border-slate-400 flex-1 sm:flex-none shadow-sm text-slate-700"
            >
              <option value="">All Types</option>
              <option value="PURCHASE">Purchase (In)</option>
              <option value="SALE">Sale (Out)</option>
            </select>
            
            <select 
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold focus:outline-none focus:border-slate-400 flex-1 sm:flex-none shadow-sm text-slate-700"
            >
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
            </select>
          </div>
          
          <div className="relative w-full lg:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Filter by product UUID..." 
              value={productId}
              onChange={e => { setProductId(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 text-sm shadow-sm"
            />
          </div>
        </div>
        
        {/* Table */}
        <div className="overflow-x-auto min-h-[400px] relative">
          {loading && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10 backdrop-blur-[1px]">
              <Loader2 className="animate-spin text-slate-900" size={32} />
            </div>
          )}
          
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3 font-bold tracking-wider">Date & Time</th>
                <th className="px-5 py-3 font-bold tracking-wider">Transaction ID</th>
                <th className="px-5 py-3 font-bold tracking-wider">Type</th>
                <th className="px-5 py-3 font-bold tracking-wider">Product</th>
                <th className="px-5 py-3 font-bold tracking-wider">Variant</th>
                <th className="px-5 py-3 font-bold tracking-wider">Quantity</th>
                <th className="px-5 py-3 font-bold tracking-wider">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.length === 0 && !loading ? (
                <tr>
                  <td colSpan="7" className="px-5 py-12 text-center text-slate-400 font-medium">
                    No stock transactions found for the selected filters.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 text-slate-500 whitespace-nowrap font-medium">
                      {new Date(tx.created_at).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 font-bold text-slate-900 whitespace-nowrap font-mono text-xs">
                      TX-{tx.id.split('-')[0].toUpperCase()}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${tx.transaction_type === 'IN' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
                        {tx.transaction_type === 'IN' ? 'PURCHASE' : 'SALE'}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-semibold text-slate-900">{tx.product_name}</td>
                    <td className="px-5 py-3 text-slate-600 font-medium">{tx.sub_variant_name}</td>
                    <td className="px-5 py-3 font-bold text-slate-900 text-sm">
                      {parseInt(tx.quantity)} units
                    </td>
                    <td className="px-5 py-3 text-slate-500 text-xs max-w-[200px] truncate" title={tx.notes}>
                      {tx.notes || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50">
          <span className="text-xs font-bold text-slate-500">
            Showing {transactions.length > 0 ? (page - 1) * pageSize + 1 : 0} to {Math.min(page * pageSize, totalCount)} of {totalCount} entries
          </span>
          <div className="flex gap-2">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold disabled:opacity-50 hover:bg-slate-50 transition-colors shadow-sm"
            >
              Prev
            </button>
            <div className="flex items-center px-2 text-xs font-bold text-slate-550">
              Page {page} of {totalPages}
            </div>
            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold disabled:opacity-50 hover:bg-slate-50 transition-colors shadow-sm"
            >
              Next
            </button>
          </div>
        </div>
        
      </div>
    </div>
  );
}

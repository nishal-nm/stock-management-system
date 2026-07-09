import React, { useState } from 'react';
import { Download, Calendar, Search, Loader2, List, ClipboardList } from 'lucide-react';
import client from '../api/client';
import { useStockReport, useStockLevels } from '../hooks/useStock';

export default function StockReport() {
  const [activeTab, setActiveTab] = useState('history'); // 'history' or 'balance'

  const {
    transactions,
    loading: loadingHistory,
    totalCount: totalCountHistory,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    transactionType,
    setTransactionType,
    productId,
    setProductId,
    page: pageHistory,
    setPage: setPageHistory,
    pageSize: pageSizeHistory,
    setPageSize: setPageSizeHistory
  } = useStockReport();

  const {
    stockLevels,
    loading: loadingBalance,
    totalCount: totalCountBalance,
    page: pageBalance,
    setPage: setPageBalance,
    pageSize: pageSizeBalance,
    setPageSize: setPageSizeBalance
  } = useStockLevels();

  const getSubVariantLabelText = (sv) => {
    if (!sv || !sv.options) return '';
    return sv.options.map(o => o.variant_name ? `${o.variant_name}: ${o.value}` : o.value).join(' • ');
  };

  const handleStartDateChange = (e) => {
    const val = e.target.value;
    if (endDate && val > endDate) return;
    setStartDate(val);
    setPageHistory(1);
  };

  const handleEndDateChange = (e) => {
    const val = e.target.value;
    if (startDate && val < startDate) return;
    setEndDate(val);
    setPageHistory(1);
  };

  const handleExportCSV = () => {
    if (activeTab === 'history') {
      if (!transactions.length) return;
      const headers = ['Product', 'Variant', 'Type', 'Quantity', 'Running Balance', 'Transaction ID', 'Date & Time', 'Notes'];
      const rows = transactions.map(tx => [
        `"${tx.product_name}"`,
        `"${tx.sub_variant_name}"`,
        tx.transaction_type === 'IN' ? 'PURCHASE' : 'SALE',
        tx.quantity,
        tx.running_balance || 0,
        `TX-${tx.id.split('-')[0].toUpperCase()}`,
        new Date(tx.created_at).toLocaleString(),
        `"${tx.notes || ''}"`
      ]);
      const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      downloadCSV(csvContent, 'transaction_history_report');
    } else {
      if (!stockLevels.length) return;
      const headers = ['Product Name', 'Variant', 'Product Code', 'Current Stock', 'Low Stock Threshold', 'Status'];
      const rows = stockLevels.map(sv => {
        const opts = getSubVariantLabelText(sv);
        return [
          `"${sv.product_name || 'Product'}"`,
          `"${opts || sv.name}"`,
          `"${sv.product_code || 'N/A'}"`,
          sv.stock,
          sv.low_stock_threshold,
          sv.is_low_stock ? 'LOW STOCK' : 'OK'
        ];
      });
      const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      downloadCSV(csvContent, 'current_stock_levels_report');
    }
  };

  const downloadCSV = (content, filenamePrefix) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filenamePrefix}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const loading = activeTab === 'history' ? loadingHistory : loadingBalance;
  const page = activeTab === 'history' ? pageHistory : pageBalance;
  const setPage = activeTab === 'history' ? setPageHistory : setPageBalance;
  const pageSize = activeTab === 'history' ? pageSizeHistory : pageSizeBalance;
  const setPageSize = activeTab === 'history' ? setPageSizeHistory : setPageSizeBalance;
  const totalCount = activeTab === 'history' ? totalCountHistory : totalCountBalance;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return (
    <div className="space-y-6 pb-12 font-sans antialiased text-slate-800">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Stock Report</h1>
          <p className="text-slate-500 text-sm mt-0.5">View transaction history and current inventory balances.</p>
        </div>
        <button 
          onClick={handleExportCSV}
          disabled={loading || (activeTab === 'history' ? transactions.length === 0 : stockLevels.length === 0)}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-950 hover:bg-slate-800 text-white rounded-lg font-bold text-xs uppercase tracking-wider shadow-sm transition-colors disabled:opacity-50"
        >
          <Download size={14} />
          Export CSV
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 font-bold text-xs uppercase tracking-wider transition-colors ${activeTab === 'history' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          <ClipboardList size={14} />
          Transaction History
        </button>
        <button
          onClick={() => setActiveTab('balance')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 font-bold text-xs uppercase tracking-wider transition-colors ${activeTab === 'balance' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          <List size={14} />
          Current Stock Balance
        </button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {/* Filters (only for history) */}
        {activeTab === 'history' && (
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
                onChange={e => { setTransactionType(e.target.value); setPageHistory(1); }}
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
                onChange={e => { setProductId(e.target.value); setPageHistory(1); }}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 text-sm shadow-sm"
              />
            </div>
          </div>
        )}

        {/* Filters (only for balance) */}
        {activeTab === 'balance' && (
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50">
            <select 
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold focus:outline-none focus:border-slate-400 w-full sm:w-auto shadow-sm text-slate-700"
            >
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
            </select>
            <span className="text-xs text-slate-500 font-medium">Real-time balances generated by server transactions.</span>
          </div>
        )}
        
        {/* Table */}
        <div className="overflow-x-auto min-h-[400px] relative">
          {loading && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10 backdrop-blur-[1px]">
              <Loader2 className="animate-spin text-slate-900" size={32} />
            </div>
          )}
          
          {activeTab === 'history' ? (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3 font-bold tracking-wider">Product Name</th>
                  <th className="px-5 py-3 font-bold tracking-wider">Variant</th>
                  <th className="px-5 py-3 font-bold tracking-wider">Type</th>
                  <th className="px-5 py-3 font-bold tracking-wider">Quantity</th>
                  <th className="px-5 py-3 font-bold tracking-wider">Running Balance</th>
                  <th className="px-5 py-3 font-bold tracking-wider">Transaction ID</th>
                  <th className="px-5 py-3 font-bold tracking-wider">Date & Time</th>
                  <th className="px-5 py-3 font-bold tracking-wider">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.length === 0 && !loading ? (
                  <tr>
                    <td colSpan="8" className="px-5 py-12 text-center text-slate-400 font-medium">
                      No stock transactions found for the selected filters.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3 font-bold text-slate-900">{tx.product_name}</td>
                      <td className="px-5 py-3 text-slate-650 font-medium">{tx.sub_variant_name}</td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${tx.transaction_type === 'IN' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
                          {tx.transaction_type === 'IN' ? 'PURCHASE' : 'SALE'}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-extrabold text-slate-900 text-sm">
                        {parseInt(tx.quantity)} units
                      </td>
                      <td className="px-5 py-3 font-extrabold text-slate-900 text-sm">
                        {parseFloat(tx.running_balance || 0).toFixed(0)} units
                      </td>
                      <td className="px-5 py-3 font-bold text-slate-955 whitespace-nowrap font-mono text-xs">
                        TX-{tx.id.split('-')[0].toUpperCase()}
                      </td>
                      <td className="px-5 py-3 text-slate-550 whitespace-nowrap font-medium text-xs">
                        {new Date(tx.created_at).toLocaleString()}
                      </td>
                      <td className="px-5 py-3 text-slate-500 text-xs max-w-[200px] truncate" title={tx.notes}>
                        {tx.notes || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3 font-bold tracking-wider">Product Name</th>
                  <th className="px-5 py-3 font-bold tracking-wider">Variant</th>
                  <th className="px-5 py-3 font-bold tracking-wider">Product Code</th>
                  <th className="px-5 py-3 font-bold tracking-wider">Current Stock</th>
                  <th className="px-5 py-3 font-bold tracking-wider">Low Stock Threshold</th>
                  <th className="px-5 py-3 font-bold tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stockLevels.length === 0 && !loading ? (
                  <tr>
                    <td colSpan="6" className="px-5 py-12 text-center text-slate-400 font-medium">
                      No variant stock balances found.
                    </td>
                  </tr>
                ) : (
                  stockLevels.map((sv) => (
                    <tr key={sv.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3 font-semibold text-slate-900">{sv.product_name || 'Product'}</td>
                      <td className="px-5 py-3 text-slate-650 font-medium">
                        {getSubVariantLabelText(sv) || sv.name}
                      </td>
                      <td className="px-5 py-3 font-bold text-slate-900 whitespace-nowrap font-mono text-xs">
                        {sv.product_code}
                      </td>
                      <td className="px-5 py-3 font-extrabold text-slate-900 text-sm">
                        {parseFloat(sv.stock).toFixed(0)} units
                      </td>
                      <td className="px-5 py-3 text-slate-500 font-bold text-xs">
                        {parseFloat(sv.low_stock_threshold).toFixed(0)} units
                      </td>
                      <td className="px-5 py-3">
                        {sv.is_low_stock ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold border bg-rose-50 border-rose-200 text-rose-800">
                            LOW STOCK
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold border bg-emerald-50 border-emerald-200 text-emerald-800">
                            OK
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Pagination */}
        <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50">
          <span className="text-xs font-bold text-slate-500">
            Showing {totalCount > 0 ? (page - 1) * pageSize + 1 : 0} to {Math.min(page * pageSize, totalCount)} of {totalCount} entries
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

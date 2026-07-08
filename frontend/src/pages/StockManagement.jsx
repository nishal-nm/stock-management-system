import React, { useState, useEffect } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, Search, AlertCircle, Save, Loader2 } from 'lucide-react';
import client from '../api/client';
import AlertModal from '../components/AlertModal';

export default function StockManagement() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [subVariants, setSubVariants] = useState([]);
  const [selectedSubVariant, setSelectedSubVariant] = useState(null);
  
  const [transactionType, setTransactionType] = useState('IN');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [loadingSubVariants, setLoadingSubVariants] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '', type: 'info' });
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Fetch all products (limit handled by standard pagination, we might need a non-paginated endpoint for dropdowns, but for now we'll fetch page 1 with large page size or rely on search)
        const response = await client.get('/products/?page_size=100');
        const data = response.data.results || response.data;
        setProducts(data);
        setFilteredProducts(data);
      } catch (err) {
        console.error("Failed to fetch products:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      setFilteredProducts(products.filter(p => p.ProductName.toLowerCase().includes(searchTerm.toLowerCase()) || p.ProductCode.toLowerCase().includes(searchTerm.toLowerCase())));
    } else {
      setFilteredProducts(products);
    }
  }, [searchTerm, products]);

  const fetchSubVariants = async (productId) => {
    setLoadingSubVariants(true);
    try {
      const response = await client.get(`/products/${productId}/subvariants/`);
      const svs = response.data.results || response.data;
      setSubVariants(svs);
      setSelectedSubVariant(svs.length > 0 ? svs[0] : null);
    } catch (err) {
      console.error("Failed to fetch subvariants:", err);
    } finally {
      setLoadingSubVariants(false);
    }
  };

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setError('');
    fetchSubVariants(product.id);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!selectedSubVariant) {
      setError('Please select a sub-variant.');
      return;
    }

    const qty = parseInt(quantity);
    if (!qty || qty <= 0) {
      setError('Quantity must be greater than zero.');
      return;
    }
    
    const currentStock = parseFloat(selectedSubVariant.stock);
    if (transactionType === 'OUT' && qty > currentStock) {
      setError(`Cannot remove ${qty} items. Only ${currentStock} in stock.`);
      return;
    }
    
    setSubmitting(true);
    try {
      const endpoint = transactionType === 'IN' ? '/stock/purchase/' : '/stock/sale/';
      await client.post(endpoint, {
        sub_variant_id: selectedSubVariant.id,
        quantity: qty,
        notes: notes
      });
      
      setSuccessMessage('Stock updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      setQuantity('');
      setNotes('');
      // Refresh sub-variants to get updated stock
      fetchSubVariants(selectedProduct.id);
      
      // Update local product total stock so it reflects immediately
      const updateStock = (list) => list.map(p => {
        if (p.id === selectedProduct.id) {
          const newStock = transactionType === 'IN' ? parseFloat(p.TotalStock) + qty : parseFloat(p.TotalStock) - qty;
          return { ...p, TotalStock: newStock.toString() };
        }
        return p;
      });
      setProducts(prev => updateStock(prev));
      setFilteredProducts(prev => updateStock(prev));
      setSelectedProduct(prev => ({
        ...prev,
        TotalStock: (transactionType === 'IN' ? parseFloat(prev.TotalStock) + qty : parseFloat(prev.TotalStock) - qty).toString()
      }));

    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.quantity?.[0] || 'Failed to update stock');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Stock Movement</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Record purchases (Stock In) or sales/adjustments (Stock Out).</p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row">
        {/* Left side: Product Selection */}
        <div className="w-full md:w-1/3 border-r border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20 p-6 flex flex-col">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search product..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm shadow-sm"
            />
          </div>
          
          <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-2">
            {loading ? (
              <div className="flex justify-center py-10"><Loader2 className="animate-spin text-indigo-500" /></div>
            ) : filteredProducts.map((p) => (
              <button 
                key={p.id}
                onClick={() => handleProductSelect(p)}
                className={`w-full text-left p-4 rounded-2xl transition-all ${selectedProduct?.id === p.id ? 'bg-indigo-50 border-indigo-200 shadow-sm dark:bg-indigo-500/20 dark:border-indigo-500/30 border' : 'hover:bg-white dark:hover:bg-slate-800 border border-transparent'}`}
              >
                <div className="font-semibold text-slate-900 dark:text-white text-sm">{p.ProductName}</div>
                <div className="flex justify-between mt-2 text-xs text-slate-500">
                  <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{p.ProductCode}</span>
                  <span className={`font-bold ${parseFloat(p.TotalStock) <= 0 ? 'text-rose-500' : 'text-emerald-500'}`}>{parseFloat(p.TotalStock).toFixed(0)} total</span>
                </div>
              </button>
            ))}
          </div>
        </div>
        
        {/* Right side: Movement Form */}
        <div className="w-full md:w-2/3 p-6 md:p-10 bg-white dark:bg-slate-800">
          {selectedProduct ? (
            <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="pb-6 border-b border-slate-100 dark:border-slate-700/50">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{selectedProduct.ProductName}</h3>
                
                {/* Sub-Variant Selection */}
                <div className="mt-4">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Select Sub-Variant</label>
                  {loadingSubVariants ? (
                    <div className="flex items-center gap-2 text-indigo-500 text-sm"><Loader2 className="animate-spin" size={16} /> Loading variants...</div>
                  ) : subVariants.length === 0 ? (
                    <div className="text-rose-500 text-sm">This product has no sub-variants. Add variants first.</div>
                  ) : (
                    <select
                      value={selectedSubVariant ? selectedSubVariant.id : ''}
                      onChange={(e) => setSelectedSubVariant(subVariants.find(sv => sv.id === e.target.value))}
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm shadow-sm"
                    >
                      {subVariants.map(sv => (
                        <option key={sv.id} value={sv.id}>
                          {sv.options.map(opt => opt.value).join(' - ')} 
                          (Current Stock: {parseFloat(sv.stock).toFixed(0)})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => { setTransactionType('IN'); setError(''); }}
                  disabled={subVariants.length === 0}
                  className={`flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 transition-all disabled:opacity-50 ${transactionType === 'IN' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 shadow-sm' : 'border-slate-200 dark:border-slate-700 hover:border-emerald-200 text-slate-500'}`}
                >
                  <ArrowDownToLine size={28} />
                  <span className="font-bold text-lg">Stock IN</span>
                  <span className="text-xs font-medium opacity-70">Purchase / Return</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setTransactionType('OUT'); setError(''); }}
                  disabled={subVariants.length === 0}
                  className={`flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 transition-all disabled:opacity-50 ${transactionType === 'OUT' ? 'border-rose-500 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 shadow-sm' : 'border-slate-200 dark:border-slate-700 hover:border-rose-200 text-slate-500'}`}
                >
                  <ArrowUpFromLine size={28} />
                  <span className="font-bold text-lg">Stock OUT</span>
                  <span className="text-xs font-medium opacity-70">Sale / Damage</span>
                </button>
              </div>
              
              {error && (
                <div className="flex items-center gap-2 p-4 bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400 rounded-xl text-sm font-medium animate-in shake">
                  <AlertCircle size={18} />
                  {error}
                </div>
              )}
              
              {successMessage && (
                <div className="flex items-center gap-2 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400 rounded-xl text-sm font-medium animate-in fade-in">
                  <AlertCircle size={18} />
                  {successMessage}
                </div>
              )}
              
              <div className="space-y-6 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Quantity</label>
                  <input 
                    type="number" 
                    min="1"
                    required
                    disabled={subVariants.length === 0}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-xl font-bold shadow-sm disabled:opacity-50"
                    placeholder="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Remarks / Reference</label>
                  <textarea 
                    rows={3}
                    disabled={subVariants.length === 0}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none text-sm shadow-sm disabled:opacity-50"
                    placeholder="e.g. PO-20234 or Invoice #4092"
                  />
                </div>
              </div>
              
              <button 
                type="submit" 
                disabled={submitting || subVariants.length === 0}
                className={`w-full flex items-center justify-center gap-2 px-4 py-4 rounded-xl font-bold text-lg text-white transition-all shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 ${transactionType === 'IN' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/30' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/30'}`}
              >
                {submitting ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                Confirm {transactionType === 'IN' ? 'Stock In' : 'Stock Out'}
              </button>
            </form>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
              <Search size={48} className="opacity-20" />
              <p>Select a product to update stock</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

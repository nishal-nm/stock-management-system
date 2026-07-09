import React, { useState, useEffect } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, Search, AlertCircle, Save, Loader2 } from 'lucide-react';
import client from '../api/client';
import SubVariantLabel from '../components/SubVariantLabel';

export default function StockManagement() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [subVariants, setSubVariants] = useState([]);
  const [selectedSubVariant, setSelectedSubVariant] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  const [transactionType, setTransactionType] = useState('IN');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [loadingSubVariants, setLoadingSubVariants] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  
  const [successMessage, setSuccessMessage] = useState('');

  const getSubVariantLabelText = (sv) => {
    if (!sv || !sv.options) return '';
    return sv.options.map(o => o.variant_name ? `${o.variant_name}: ${o.value}` : o.value).join(' - ');
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
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

  const fetchSubVariants = async (productId, retainId = null) => {
    setLoadingSubVariants(true);
    try {
      const response = await client.get(`/products/${productId}/subvariants/`);
      const svs = response.data.results || response.data;
      
      const sorted = [...svs].sort((a, b) => {
        const labelA = a.options.map(o => o.variant_name ? `${o.variant_name}: ${o.value}` : o.value).join(' - ');
        const labelB = b.options.map(o => o.variant_name ? `${o.variant_name}: ${o.value}` : o.value).join(' - ');
        return labelA.localeCompare(labelB);
      });
      
      setSubVariants(sorted);
      if (retainId) {
        const found = sorted.find(s => s.id === retainId);
        setSelectedSubVariant(found || (sorted.length > 0 ? sorted[0] : null));
      } else {
        setSelectedSubVariant(sorted.length > 0 ? sorted[0] : null);
      }
    } catch (err) {
      console.error("Failed to fetch subvariants:", err);
    } finally {
      setLoadingSubVariants(false);
    }
  };

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setError('');
    setFieldErrors({});
    setDropdownOpen(false);
    fetchSubVariants(product.id);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    
    let hasError = false;
    const newFieldErrors = {};

    if (!selectedSubVariant) {
      newFieldErrors.subVariant = 'Please select a sub-variant.';
      hasError = true;
    }

    const qty = parseInt(quantity);
    if (!qty || qty <= 0) {
      newFieldErrors.quantity = 'Quantity must be greater than zero.';
      hasError = true;
    } else if (selectedSubVariant) {
      const currentStock = parseFloat(selectedSubVariant.stock);
      if (transactionType === 'OUT' && qty > currentStock) {
        newFieldErrors.quantity = `Cannot remove ${qty} items. Only ${currentStock} in stock.`;
        hasError = true;
      }
    }
    
    if (hasError) {
      setFieldErrors(newFieldErrors);
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
      fetchSubVariants(selectedProduct.id, selectedSubVariant.id);
      
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
      setError(err.friendlyMessage || err.response?.data?.message || err.response?.data?.quantity?.[0] || 'Failed to update stock');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 font-sans antialiased text-slate-800">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Stock Movement</h1>
        <p className="text-slate-500 text-sm mt-0.5">Record purchases (Stock In) or sales/adjustments (Stock Out).</p>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row overflow-hidden">
        {/* Left side: Product Selection */}
        <div className="w-full md:w-1/3 border-r border-slate-200 bg-slate-50 p-4 flex flex-col min-h-[450px]">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search product..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 text-sm shadow-sm"
            />
          </div>
          
          <div className="space-y-1.5 flex-1 overflow-y-auto custom-scrollbar pr-1.5">
            {loading ? (
              <div className="flex justify-center py-10"><Loader2 className="animate-spin text-slate-950" size={24} /></div>
            ) : filteredProducts.map((p) => (
              <button 
                key={p.id}
                onClick={() => handleProductSelect(p)}
                className={`w-full text-left p-3.5 rounded-lg border transition-colors ${selectedProduct?.id === p.id ? 'bg-slate-900 border-slate-900 text-white shadow-sm' : 'hover:bg-slate-200/60 bg-white border-slate-200'}`}
              >
                <div className="font-semibold text-sm line-clamp-1">{p.ProductName}</div>
                <div className="flex justify-between mt-2 text-xs">
                  <span className={`font-mono px-1 py-0.5 rounded text-[10px] ${selectedProduct?.id === p.id ? 'bg-slate-800 text-slate-350' : 'bg-slate-100 text-slate-500'}`}>{p.ProductCode}</span>
                  <span className={`font-bold ${parseFloat(p.TotalStock) <= 0 ? 'text-rose-500' : selectedProduct?.id === p.id ? 'text-emerald-450' : 'text-emerald-700'}`}>{parseFloat(p.TotalStock).toFixed(0)} units</span>
                </div>
              </button>
            ))}
          </div>
        </div>
        
        {/* Right side: Movement Form */}
        <div className="w-full md:w-2/3 p-6 md:p-8 bg-white">
          {selectedProduct ? (
            <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in duration-150">
              <div className="pb-4 border-b border-slate-200">
                <h3 className="text-xl font-bold text-slate-900">{selectedProduct.ProductName}</h3>
                
                {/* Sub-Variant Selection */}
                <div className="mt-4">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Select Sub-Variant</label>
                  {loadingSubVariants ? (
                    <div className="flex items-center gap-2 text-slate-500 text-xs"><Loader2 className="animate-spin" size={14} /> Loading variants...</div>
                  ) : subVariants.length === 0 ? (
                    <div className="text-rose-600 text-xs font-semibold">This product has no sub-variants. Add variants first.</div>
                  ) : (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="w-full flex items-center justify-between px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-900 font-semibold focus:outline-none focus:border-slate-400 shadow-sm"
                      >
                        <span>
                          {selectedSubVariant ? getSubVariantLabelText(selectedSubVariant) : 'Select a variant'}
                        </span>
                        <span className="flex items-center gap-2 text-xs text-slate-500">
                          {selectedSubVariant && `(Stock: ${parseFloat(selectedSubVariant.stock).toFixed(0)})`}
                          <span className="transform transition-transform duration-200 select-none">
                            {dropdownOpen ? '▲' : '▼'}
                          </span>
                        </span>
                      </button>

                      {dropdownOpen && (
                        <div className="absolute z-30 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto py-1 animate-in fade-in duration-100">
                          {subVariants.map((sv) => {
                            const isSelected = selectedSubVariant?.id === sv.id;
                            return (
                              <button
                                key={sv.id}
                                type="button"
                                onClick={() => {
                                  setSelectedSubVariant(sv);
                                  setDropdownOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-xs font-semibold flex justify-between items-center transition-colors border-b border-slate-50 last:border-0 ${
                                  isSelected 
                                    ? 'bg-slate-900 text-white' 
                                    : 'hover:bg-slate-50 bg-white text-slate-800'
                                }`}
                              >
                                <span>{getSubVariantLabelText(sv)}</span>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                                  isSelected 
                                    ? 'bg-slate-800 border-slate-700 text-slate-300' 
                                    : sv.is_low_stock 
                                      ? 'bg-rose-50 border-rose-200 text-rose-700' 
                                      : 'bg-slate-100 border-slate-200 text-slate-600'
                                }`}>
                                  {parseFloat(sv.stock).toFixed(0)} units
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                  {fieldErrors.subVariant && <p className="text-xs text-rose-600 mt-1 font-semibold">{fieldErrors.subVariant}</p>}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => { setTransactionType('IN'); setError(''); setFieldErrors({}); }}
                  disabled={subVariants.length === 0}
                  className={`flex flex-col items-center justify-center gap-2.5 p-5 rounded-lg border-2 transition-colors disabled:opacity-50 ${transactionType === 'IN' ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-slate-200 hover:border-slate-300 text-slate-500 bg-white'}`}
                >
                  <ArrowDownToLine size={24} />
                  <span className="font-bold text-sm uppercase tracking-wider">Stock IN</span>
                  <span className="text-[10px] font-semibold opacity-80">Purchase / Return</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setTransactionType('OUT'); setError(''); setFieldErrors({}); }}
                  disabled={subVariants.length === 0}
                  className={`flex flex-col items-center justify-center gap-2.5 p-5 rounded-lg border-2 transition-colors disabled:opacity-50 ${transactionType === 'OUT' ? 'border-rose-600 bg-rose-50 text-rose-800' : 'border-slate-200 hover:border-slate-300 text-slate-500 bg-white'}`}
                >
                  <ArrowUpFromLine size={24} />
                  <span className="font-bold text-sm uppercase tracking-wider">Stock OUT</span>
                  <span className="text-[10px] font-semibold opacity-80">Sale / Damage</span>
                </button>
              </div>
              
              {error && (
                <div className="flex items-center gap-2 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-semibold">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}
              
              {successMessage && (
                <div className="flex items-center gap-2 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-semibold">
                  <AlertCircle size={16} />
                  {successMessage}
                </div>
              )}
              
              <div className="space-y-4 bg-slate-50 p-5 rounded-lg border border-slate-200">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Quantity to Update</label>
                  <input 
                    type="number" 
                    min="1"
                    required
                    disabled={subVariants.length === 0}
                    value={quantity}
                    onChange={(e) => {
                      setQuantity(e.target.value);
                      if (fieldErrors.quantity) setFieldErrors({...fieldErrors, quantity: null});
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none text-base font-extrabold bg-white text-slate-900 ${fieldErrors.quantity ? 'border-rose-500 focus:border-rose-500' : 'border-slate-200 focus:border-slate-400'}`}
                    placeholder="0"
                  />
                  {fieldErrors.quantity && <p className="text-xs text-rose-600 mt-1 font-semibold">{fieldErrors.quantity}</p>}
                </div>
                
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Remarks / Reference</label>
                  <textarea 
                    rows={3}
                    disabled={subVariants.length === 0}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 text-sm bg-white text-slate-900 resize-none"
                    placeholder="e.g. PO-20234 or Invoice #4092"
                  />
                </div>
              </div>
              
              <button 
                type="submit" 
                disabled={submitting || subVariants.length === 0}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-bold text-xs uppercase tracking-wider text-white transition-colors shadow-sm disabled:opacity-50 ${transactionType === 'IN' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}
              >
                {submitting ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                Confirm {transactionType === 'IN' ? 'Stock In' : 'Stock Out'}
              </button>
            </form>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3 py-16">
              <Search size={40} className="opacity-30" />
              <p className="text-sm font-semibold">Select a product from the list to manage stock</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

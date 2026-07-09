import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, Plus, Eye, Edit, Trash2, Loader2 } from 'lucide-react';
import client from '../api/client';
import ConfirmModal from '../components/ConfirmModal';
import AlertModal from '../components/AlertModal';

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  // Category list and filter state
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');

  // View details modal
  const [productDetails, setProductDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Delete confirm state
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Alert config
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '', type: 'info' });

  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await client.get('/categories/?page_size=100');
        setCategories(res.data.results || res.data || []);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let url = `/products/?page=${page}&search=${searchTerm}`;
      if (selectedCategory) {
        url += `&Category=${selectedCategory}`;
      }
      const response = await client.get(url);
      setProducts(response.data.results || response.data || []);
      if (response.data.count !== undefined) {
        setTotalItems(response.data.count);
        setTotalPages(Math.ceil(response.data.count / pageSize));
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 300);
    return () => clearTimeout(timer);
  }, [page, searchTerm, selectedCategory]);

  const confirmDeleteAction = async () => {
    if (!confirmDelete) return;
    try {
      await client.delete(`/products/${confirmDelete}/`);
      fetchProducts();
    } catch (err) {
      setAlertConfig({ isOpen: true, title: 'Error', message: 'Failed to delete product. Only admins can delete products.', type: 'error' });
    }
    setConfirmDelete(null);
  };

  const handleView = async (product) => {
    setLoadingDetails(true);
    setProductDetails({ ...product, variants: [], subvariants: [] });
    try {
      const [variantsRes, subvariantsRes] = await Promise.all([
        client.get(`/products/${product.id}/variants/`),
        client.get(`/products/${product.id}/subvariants/`)
      ]);
      setProductDetails({
        ...product,
        variants: variantsRes.data.results || variantsRes.data || [],
        subvariants: subvariantsRes.data.results || subvariantsRes.data || []
      });
    } catch (err) {
      console.error('Failed to load variants details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleDelete = (id) => {
    setConfirmDelete(id);
  };

  return (
    <div className="space-y-6 pb-8 font-sans antialiased text-slate-800">
      <AlertModal 
        isOpen={alertConfig.isOpen}
        onClose={() => setAlertConfig({ ...alertConfig, isOpen: false })}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
      />
      <ConfirmModal 
        isOpen={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        onConfirm={confirmDeleteAction}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone and will permanently delete all its variants, options, and stock history."
        confirmText="Delete Product"
        isDestructive={true}
      />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Products</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage your product inventory and variants.</p>
        </div>
        <Link 
          to="/products/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-950 hover:bg-slate-800 text-white rounded-lg font-bold text-xs uppercase tracking-wider shadow-sm transition-colors"
        >
          <Plus size={16} />
          Add Product
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50">
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-80 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search products..." 
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 text-sm shadow-sm"
              />
            </div>
            
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold focus:outline-none focus:border-slate-400 shadow-sm text-slate-700 w-full sm:w-48"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="overflow-x-auto min-h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="animate-spin text-slate-950" size={32} />
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3 font-bold tracking-wider">Product</th>
                  <th className="px-5 py-3 font-bold tracking-wider">Code / HSN</th>
                  <th className="px-5 py-3 font-bold tracking-wider">Total Stock</th>
                  <th className="px-5 py-3 font-bold tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-5 py-8 text-center text-slate-400">
                      No products found. Add a new product or change filters to get started.
                    </td>
                  </tr>
                ) : products.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0 flex items-center justify-center text-slate-400">
                          {product.ProductImage ? (
                            <img src={product.ProductImage} alt={product.ProductName} className="w-full h-full object-cover" />
                          ) : (
                            <Search size={16} />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 text-sm">{product.ProductName}</div>
                          <div className="text-xs text-slate-500 mt-0.5">ID: {product.ProductID}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-600 font-medium">
                      <div>Code: {product.ProductCode}</div>
                      <div className="text-xs text-slate-400 mt-0.5">HSN: {product.HSNCode || 'N/A'}</div>
                    </td>
                    <td className="px-5 py-3 font-bold text-slate-900">
                      {parseFloat(product.TotalStock).toFixed(0)} units
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleView(product)} className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors" title="View Details">
                          <Eye size={16} />
                        </button>
                        <button onClick={() => navigate(`/products/edit/${product.id}`)} className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors" title="Edit">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => handleDelete(product.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 flex justify-between items-center bg-slate-50 text-xs font-bold text-slate-500">
            <span>Showing page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50 transition-colors shadow-sm"
              >
                Previous
              </button>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50 transition-colors shadow-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Product Detail Modal */}
      {productDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 animate-in fade-in duration-150">
          <div className="bg-white rounded-lg p-5 max-w-2xl w-full border border-slate-200 shadow-lg animate-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-start mb-4 border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-950">{productDetails.ProductName}</h3>
                <p className="text-xs text-slate-500 mt-1">Code: {productDetails.ProductCode} | HSN: {productDetails.HSNCode || 'N/A'}</p>
              </div>
              <button 
                onClick={() => setProductDetails(null)}
                className="text-slate-400 hover:text-slate-700 text-lg"
              >
                &times;
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-5 py-2 custom-scrollbar">
              {loadingDetails ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="animate-spin text-slate-950 mb-2" size={24} />
                  <span className="text-xs text-slate-500">Loading variants details...</span>
                </div>
              ) : (
                <>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Variants Configured</h4>
                    {productDetails.variants.length === 0 ? (
                      <p className="text-slate-400 text-xs">No variants configured (standard product).</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {productDetails.variants.map(v => (
                          <div key={v.id} className="bg-slate-100 border border-slate-200 px-2 py-1 rounded text-xs font-semibold">
                            {v.name}: <span className="text-slate-600">{v.options.map(o => o.value).join(', ')}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Sub-Variants & Stock Levels</h4>
                    {productDetails.subvariants.length > 0 ? (
                      <div className="border border-slate-200 rounded-lg overflow-hidden">
                        <table className="w-full text-xs text-left">
                          <thead className="text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                            <tr>
                              <th className="px-3 py-2.5 font-bold">Sub-Variant</th>
                              <th className="px-3 py-2.5 font-bold">Stock</th>
                              <th className="px-3 py-2.5 font-bold">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {productDetails.subvariants.map(sv => {
                              const lowStock = sv.low_stock_threshold && parseFloat(sv.stock) <= parseFloat(sv.low_stock_threshold);
                              return (
                                <tr key={sv.id} className="hover:bg-slate-50">
                                  <td className="px-3 py-2 flex flex-wrap gap-1">
                                    {sv.options.map(opt => (
                                      <span key={opt.id} className="bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded font-medium text-[10px]">
                                        {opt.value}
                                      </span>
                                    ))}
                                  </td>
                                  <td className="px-3 py-2 font-bold text-slate-900">
                                    {parseFloat(sv.stock).toFixed(0)}
                                  </td>
                                  <td className="px-3 py-2">
                                    {lowStock ? (
                                      <span className="text-[10px] text-rose-800 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded font-bold">Low Stock</span>
                                    ) : (
                                      <span className="text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded font-bold">OK</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-slate-400 text-xs">No sub-variants generated for this product.</p>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end mt-4 border-t border-slate-200 pt-3">
              <button
                onClick={() => setProductDetails(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

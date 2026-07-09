import React, { useState, useEffect } from 'react';
import { Search, Filter, Edit, Trash2, Eye, Plus, Loader2, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import client from '../api/client';
import ConfirmModal from '../components/ConfirmModal';
import AlertModal from '../components/AlertModal';

export default function ProductList() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  // Modal states
  const [viewProduct, setViewProduct] = useState(null);
  const [productDetails, setProductDetails] = useState({ variants: [], subvariants: [], loading: false });
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '', type: 'info' });

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await client.get(`/products/?page=${page}&search=${searchTerm}`);
      setProducts(response.data.results || response.data);
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
  }, [page, searchTerm]);

  const handleDelete = (id) => {
    setConfirmDelete(id);
  };

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
    setViewProduct(product);
    setProductDetails({ variants: [], subvariants: [], loading: true });
    try {
      const [variantsRes, subvariantsRes] = await Promise.all([
        client.get(`/products/${product.id}/variants/`),
        client.get(`/products/${product.id}/subvariants/`)
      ]);
      setProductDetails({
        variants: variantsRes.data.results || variantsRes.data,
        subvariants: subvariantsRes.data.results || subvariantsRes.data,
        loading: false
      });
    } catch (err) {
      console.error(err);
      setProductDetails(prev => ({ ...prev, loading: false }));
    }
  };

  return (
    <div className="space-y-6 pb-8">
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
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Products</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your product inventory and variants.</p>
        </div>
        <Link 
          to="/products/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transform hover:-translate-y-0.5"
        >
          <Plus size={20} />
          Add Product
        </Link>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
          <div className="relative w-full sm:w-96 group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Search products..." 
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm shadow-sm"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto min-h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="animate-spin text-indigo-500" size={32} />
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-800/80 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-4 font-semibold tracking-wider">Product</th>
                  <th className="px-6 py-4 font-semibold tracking-wider">Code / HSN</th>
                  <th className="px-6 py-4 font-semibold tracking-wider">Total Stock</th>
                  <th className="px-6 py-4 font-semibold tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-slate-500">
                      No products found. Add a new product to get started.
                    </td>
                  </tr>
                ) : products.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex-shrink-0 shadow-sm flex items-center justify-center text-slate-400">
                          {product.ProductImage ? (
                            <img src={product.ProductImage} alt={product.ProductName} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" />
                          ) : (
                            <Search size={20} />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors text-base">{product.ProductName}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">ID: {product.ProductID}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-medium">
                      <div>Code: {product.ProductCode}</div>
                      <div className="text-xs text-slate-500 mt-0.5">HSN: {product.HSNCode || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                      {parseFloat(product.TotalStock).toFixed(0)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleView(product)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 rounded-lg transition-all" title="View Details">
                          <Eye size={18} />
                        </button>
                        <button onClick={() => navigate(`/products/edit/${product.id}`)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/20 rounded-lg transition-all" title="Edit">
                          <Edit size={18} />
                        </button>
                        <button onClick={() => handleDelete(product.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/20 rounded-lg transition-all" title="Delete">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        {totalItems > 0 && (
          <div className="p-5 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/50">
            <span className="text-sm text-slate-500 dark:text-slate-400">
              Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalItems)} of {totalItems} entries
            </span>
            <div className="flex gap-1.5">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm disabled:opacity-50 hover:bg-white dark:hover:bg-slate-700 transition-colors shadow-sm"
              >
                Prev
              </button>
              <button className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium shadow-sm shadow-indigo-500/20">
                {page}
              </button>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm disabled:opacity-50 hover:bg-white dark:hover:bg-slate-700 transition-colors shadow-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Product Details Modal */}
      {viewProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200 dark:border-slate-700">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{viewProduct.ProductName}</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Code: {viewProduct.ProductCode}</p>
              </div>
              <button onClick={() => setViewProduct(null)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-700 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
              {productDetails.loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="animate-spin text-indigo-500" size={32} />
                </div>
              ) : (
                <>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-3 text-lg">Sub-Variants & Stock</h3>
                    {productDetails.subvariants.length > 0 ? (
                      <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                        <table className="w-full text-sm text-left">
                          <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900">
                            <tr>
                              <th className="px-4 py-3 font-semibold">Sub-Variant</th>
                              <th className="px-4 py-3 font-semibold">Stock</th>
                              <th className="px-4 py-3 font-semibold">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {productDetails.subvariants.map(sv => {
                              const lowStock = sv.low_stock_threshold && parseFloat(sv.stock) <= parseFloat(sv.low_stock_threshold);
                              return (
                                <tr key={sv.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/20">
                                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white flex flex-col gap-1">
                                    {sv.options.map(opt => (
                                      <span key={opt.id} className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md inline-block w-max">
                                        {opt.value}
                                      </span>
                                    ))}
                                  </td>
                                  <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                                    {parseFloat(sv.stock).toFixed(0)}
                                  </td>
                                  <td className="px-4 py-3">
                                    {lowStock ? (
                                      <span className="text-xs text-rose-600 bg-rose-50 px-2 py-1 rounded-md font-semibold">Low Stock</span>
                                    ) : (
                                      <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md font-semibold">OK</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-slate-500 text-sm">No sub-variants generated for this product.</p>
                    )}
                  </div>
                </>
              )}
            </div>
            
            <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
              <button onClick={() => setViewProduct(null)} className="px-5 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors shadow-sm">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Search, Plus, Eye, Edit, Trash2, Loader2 } from 'lucide-react';
import client from '../api/client';
import ConfirmModal from '../components/ConfirmModal';
import AlertModal from '../components/AlertModal';
import SubVariantLabel from '../components/SubVariantLabel';
import { useProducts } from '../hooks/useProducts';
import { useCategories } from '../hooks/useCategories';

export default function ProductList() {
  const isStaff = useSelector((state) => state.auth.isStaff);
  
  const {
    products,
    setProducts,
    loading,
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    page,
    setPage,
    totalItems,
    totalPages,
    fetchProducts
  } = useProducts();

  const { categories } = useCategories();

  // View details modal
  const [productDetails, setProductDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Delete confirm state
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Alert config
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '', type: 'info' });

  const navigate = useNavigate();

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
      const svs = subvariantsRes.data.results || subvariantsRes.data || [];
      const sorted = [...svs].sort((a, b) => {
        const labelA = a.options.map(o => o.variant_name ? `${o.variant_name}: ${o.value}` : o.value).join(' - ');
        const labelB = b.options.map(o => o.variant_name ? `${o.variant_name}: ${o.value}` : o.value).join(' - ');
        return labelA.localeCompare(labelB);
      });
      setProductDetails({
        ...product,
        variants: variantsRes.data.results || variantsRes.data || [],
        subvariants: sorted
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
                  <th className="px-5 py-3 font-bold tracking-wider">Product Name</th>
                  <th className="px-5 py-3 font-bold tracking-wider">Product Code</th>
                  <th className="px-5 py-3 font-bold tracking-wider">HSN Code</th>
                  <th className="px-5 py-3 font-bold tracking-wider">Total Stock</th>
                  <th className="px-5 py-3 font-bold tracking-wider">Created Date</th>
                  <th className="px-5 py-3 font-bold tracking-wider">Status</th>
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
                          {product.ProductImage?.thumbnail ? (
                            <img src={product.ProductImage.thumbnail} alt={product.ProductName} className="w-full h-full object-cover" />
                          ) : (
                            <Search size={16} />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 text-sm">{product.ProductName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-600 font-medium">
                      {product.ProductCode}
                    </td>
                    <td className="px-5 py-3 text-slate-600 font-medium">
                      {product.HSNCode || 'N/A'}
                    </td>
                    <td className="px-5 py-3 font-bold text-slate-900">
                      {parseFloat(product.TotalStock).toFixed(0)} units
                    </td>
                    <td className="px-5 py-3 text-slate-600 font-medium">
                      {new Date(product.CreatedDate).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3">
                      {product.Active ? (
                        <span className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded border border-emerald-200">Active</span>
                      ) : (
                        <span className="px-2 py-1 bg-rose-50 text-rose-700 text-xs font-bold rounded border border-rose-200">Inactive</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleView(product)} className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors" title="View Details">
                          <Eye size={16} />
                        </button>
                        <button onClick={() => navigate(`/products/edit/${product.id}`)} className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors" title="Edit">
                          <Edit size={16} />
                        </button>
                        {isStaff && (
                          <button onClick={() => handleDelete(product.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Delete">
                            <Trash2 size={16} />
                          </button>
                        )}
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
                              const lowStock = sv.is_low_stock;
                              return (
                                <tr key={sv.id} className="hover:bg-slate-50">
                                  <td className="px-3 py-2 align-middle">
                                    <SubVariantLabel
                                      options={sv.options}
                                      mode="pills"
                                      fallback={sv.name}
                                    />
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

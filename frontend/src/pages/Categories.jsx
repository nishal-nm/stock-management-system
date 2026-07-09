import React, { useState, useEffect } from 'react';
import { Search, Edit, Trash2, Plus, Loader2, Eye } from 'lucide-react';
import client from '../api/client';
import ConfirmModal from '../components/ConfirmModal';
import AlertModal from '../components/AlertModal';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  // Add/Edit modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryDesc, setCategoryDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Delete modal states
  const [confirmDelete, setConfirmDelete] = useState(null);

  // View Category Products states
  const [viewCategory, setViewCategory] = useState(null);
  const [viewProducts, setViewProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Alert state
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '', type: 'info' });

  const handleViewCategory = async (cat) => {
    setViewCategory(cat);
    setViewProducts([]);
    setLoadingProducts(true);
    try {
      const response = await client.get(`/products/?Category=${cat.id}&page_size=100`);
      setViewProducts(response.data.results || response.data || []);
    } catch (err) {
      console.error('Failed to fetch category products:', err);
    } finally {
      setViewProducts(response.data.results || response.data || []);
      setLoadingProducts(false);
    }
  };

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await client.get(`/categories/?page=${page}&search=${searchTerm}`);
      setCategories(response.data.results || response.data || []);
      if (response.data.count !== undefined) {
        setTotalItems(response.data.count);
        setTotalPages(Math.ceil(response.data.count / pageSize));
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCategories();
    }, 300);
    return () => clearTimeout(timer);
  }, [page, searchTerm]);

  const handleOpenAddModal = () => {
    setEditCategory(null);
    setCategoryName('');
    setCategoryDesc('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (category) => {
    setEditCategory(category);
    setCategoryName(category.name);
    setCategoryDesc(category.description || '');
    setIsModalOpen(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!categoryName.trim()) return;

    setSubmitting(true);
    try {
      const payload = {
        name: categoryName,
        description: categoryDesc,
      };

      if (editCategory) {
        await client.put(`/categories/${editCategory.id}/`, payload);
      } else {
        await client.post('/categories/', payload);
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (err) {
      console.error('Failed to save category:', err);
      setAlertConfig({ 
        isOpen: true, 
        title: 'Error', 
        message: err.response?.data?.detail || err.response?.data?.name?.[0] || 'Failed to save category.', 
        type: 'error' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id) => {
    setConfirmDelete(id);
  };

  const confirmDeleteAction = async () => {
    if (!confirmDelete) return;
    try {
      await client.delete(`/categories/${confirmDelete}/`);
      fetchCategories();
    } catch (err) {
      console.error('Failed to delete category:', err);
      setAlertConfig({ isOpen: true, title: 'Error', message: 'Failed to delete category.', type: 'error' });
    }
    setConfirmDelete(null);
  };

  return (
    <div className="space-y-6 pb-12 font-sans antialiased text-slate-800">
      <AlertModal 
        isOpen={alertConfig.isOpen}
        onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
      />
      <ConfirmModal 
        isOpen={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        onConfirm={confirmDeleteAction}
        title="Delete Category"
        message="Are you sure you want to delete this category? Any products associated with this category will have their category cleared."
        confirmText="Delete Category"
        isDestructive={true}
      />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Categories</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage categories for classifying your products.</p>
        </div>
        <button 
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-950 hover:bg-slate-800 text-white rounded-lg font-bold text-xs uppercase tracking-wider shadow-sm transition-colors"
        >
          <Plus size={16} />
          Add Category
        </button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50">
          <div className="relative w-full sm:w-80 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search categories..." 
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 text-sm shadow-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto min-h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="animate-spin text-slate-900" size={32} />
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3 font-bold tracking-wider">Category Name</th>
                  <th className="px-5 py-3 font-bold tracking-wider">Description</th>
                  <th className="px-5 py-3 font-bold tracking-wider text-center">Products Count</th>
                  <th className="px-5 py-3 font-bold tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-5 py-8 text-center text-slate-400">
                      No categories found. Click 'Add Category' to create one.
                    </td>
                  </tr>
                ) : categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 font-semibold text-slate-900">
                      {cat.name}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {cat.description || <span className="text-slate-400 italic text-xs">No description</span>}
                    </td>
                    <td className="px-5 py-3 text-center font-bold text-slate-900 bg-slate-50 border-l border-r border-slate-100 w-32">
                      {cat.products_count ?? 0}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleViewCategory(cat)} className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors" title="View Products">
                          <Eye size={16} />
                        </button>
                        <button onClick={() => handleOpenEditModal(cat)} className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors" title="Edit">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => handleDelete(cat.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Delete">
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
            <div>
              Showing page {page} of {totalPages}
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                Previous
              </button>
              <button 
                onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                disabled={page === totalPages}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Category Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 animate-in fade-in duration-150">
          <div className="bg-white rounded-lg border border-slate-200 shadow-lg max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-950 text-base">
                {editCategory ? 'Edit Category' : 'Create Category'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSaveCategory}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    Category Name
                  </label>
                  <input 
                    type="text" 
                    required
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 text-sm bg-white"
                    placeholder="e.g. Clothing, Accessories"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    Description
                  </label>
                  <textarea 
                    rows={4}
                    value={categoryDesc}
                    onChange={(e) => setCategoryDesc(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 text-sm bg-white resize-none"
                    placeholder="Optional details about this category..."
                  />
                </div>
              </div>
              
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg font-semibold text-xs shadow-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-slate-950 hover:bg-slate-800 text-white rounded-lg font-bold text-xs uppercase tracking-wider shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submitting && <Loader2 size={12} className="animate-spin" />}
                  {editCategory ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Category Products Modal */}
      {viewCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 animate-in fade-in duration-150">
          <div className="bg-white rounded-lg p-5 max-w-2xl w-full border border-slate-200 shadow-lg animate-in zoom-in-95 duration-150 flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center mb-4 border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-950">{viewCategory.name} Products</h3>
                <p className="text-xs text-slate-500 mt-1">{viewCategory.description || 'No description provided.'}</p>
              </div>
              <button 
                onClick={() => setViewCategory(null)}
                className="text-slate-400 hover:text-slate-700 text-lg"
              >
                &times;
              </button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-[200px] py-2 custom-scrollbar">
              {loadingProducts ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="animate-spin text-slate-900 mb-2" size={24} />
                  <span className="text-xs text-slate-500">Loading products...</span>
                </div>
              ) : viewProducts.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">
                  No active products found in this category.
                </div>
              ) : (
                <div className="space-y-3">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2 font-bold">Product Name</th>
                        <th className="px-3 py-2 font-bold">Code</th>
                        <th className="px-3 py-2 font-bold text-right">Stock</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {viewProducts.map(prod => (
                        <tr key={prod.id} className="hover:bg-slate-50">
                          <td className="px-3 py-2.5 font-semibold text-slate-900">
                            {prod.ProductName}
                          </td>
                          <td className="px-3 py-2.5 text-slate-500">
                            {prod.ProductCode}
                          </td>
                          <td className="px-3 py-2.5 text-right font-bold text-slate-900">
                            {parseFloat(prod.TotalStock).toFixed(0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-4 border-t border-slate-200 pt-3">
              <button
                onClick={() => setViewCategory(null)}
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

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
  const [editCategory, setEditCategory] = useState(null); // null means adding new category
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
        title="Delete Category"
        message="Are you sure you want to delete this category? Any products associated with this category will have their category cleared."
        confirmText="Delete Category"
        isDestructive={true}
      />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Categories</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage categories for classifying your products.</p>
        </div>
        <button 
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transform hover:-translate-y-0.5"
        >
          <Plus size={20} />
          Add Category
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
          <div className="relative w-full sm:w-96 group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Search categories..." 
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
                  <th className="px-6 py-4 font-semibold tracking-wider">Category Name</th>
                  <th className="px-6 py-4 font-semibold tracking-wider">Description</th>
                  <th className="px-6 py-4 font-semibold tracking-wider text-center">Products Count</th>
                  <th className="px-6 py-4 font-semibold tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-slate-500">
                      No categories found. Click 'Add Category' to create one.
                    </td>
                  </tr>
                ) : categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors group">
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                      {cat.name}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      {cat.description || <span className="text-slate-400 dark:text-slate-500 italic">No description</span>}
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-indigo-600 dark:text-indigo-400">
                      {cat.products_count ?? 0}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleViewCategory(cat)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 rounded-lg transition-all" title="View Products">
                          <Eye size={18} />
                        </button>
                        <button onClick={() => handleOpenEditModal(cat)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/20 rounded-lg transition-all" title="Edit">
                          <Edit size={18} />
                        </button>
                        <button onClick={() => handleDelete(cat.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/20 rounded-lg transition-all" title="Delete">
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

        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <div>
              Showing page {page} of {totalPages}
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                Previous
              </button>
              <button 
                onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                disabled={page === totalPages}
                className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden transform scale-100 transition-all">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {editCategory ? 'Edit Category' : 'Add New Category'}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {editCategory ? 'Modify the category details.' : 'Create a new category for organizing your products.'}
              </p>
            </div>
            
            <form onSubmit={handleSaveCategory}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Category Name
                  </label>
                  <input 
                    type="text" 
                    required
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm"
                    placeholder="e.g. Clothing, Accessories"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Description
                  </label>
                  <textarea 
                    rows={4}
                    value={categoryDesc}
                    onChange={(e) => setCategoryDesc(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm resize-none"
                    placeholder="Optional details about this category..."
                  />
                </div>
              </div>
              
              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-xl font-semibold text-sm transition-all shadow-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-all shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  {editCategory ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Category Products Modal */}
      {viewCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 max-w-2xl w-full border border-slate-200 dark:border-slate-700 shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center mb-4 border-b border-slate-100 dark:border-slate-700 pb-3">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{viewCategory.name} Products</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{viewCategory.description || 'No description provided.'}</p>
              </div>
              <button 
                onClick={() => setViewCategory(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                &times;
              </button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-[200px] py-2 custom-scrollbar">
              {loadingProducts ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="animate-spin text-indigo-500 mb-2" size={32} />
                  <span className="text-sm text-slate-500 dark:text-slate-400">Loading products...</span>
                </div>
              ) : viewProducts.length === 0 ? (
                <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                  No active products found in this category.
                </div>
              ) : (
                <div className="space-y-3 animate-in fade-in duration-350">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-700/50">
                      <tr>
                        <th className="px-4 py-2">Product Name</th>
                        <th className="px-4 py-2">Code</th>
                        <th className="px-4 py-2 text-right">Stock</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                      {viewProducts.map(prod => (
                        <tr key={prod.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/20">
                          <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                            {prod.ProductName}
                          </td>
                          <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                            {prod.ProductCode}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-white">
                            {parseFloat(prod.TotalStock).toFixed(0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6 border-t border-slate-100 dark:border-slate-700 pt-4">
              <button
                onClick={() => setViewCategory(null)}
                className="px-5 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold rounded-xl transition-all"
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

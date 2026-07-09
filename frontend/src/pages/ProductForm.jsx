import React, { useState, useEffect } from 'react';
import { Upload, Plus, Trash2, Save, X } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import client from '../api/client';
import AlertModal from '../components/AlertModal';
import SubVariantLabel from '../components/SubVariantLabel';

export default function ProductForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    description: '',
  });
  
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  const [variants, setVariants] = useState([
    { name: 'Color', options: ['Black', 'White'] }
  ]);
  
  const [subVariants, setSubVariants] = useState([]);
  const [categories, setCategories] = useState([]);
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '', type: 'info' });

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

  useEffect(() => {
    if (isEditMode) {
      const fetchProductDetails = async () => {
        try {
          const [productRes, variantsRes] = await Promise.all([
            client.get(`/products/${id}/`),
            client.get(`/products/${id}/variants/`)
          ]);
          const product = productRes.data;
          setFormData({
            name: product.ProductName,
            description: product.description || '',
            category: product.Category || '',
            price: product.price || '',
          });
          if (product.ProductImage) {
            setImagePreview(product.ProductImage);
          }
          
          const fetchedVariants = (variantsRes.data.results || variantsRes.data).map(v => ({
            id: v.id,
            name: v.name,
            options: v.options.map(opt => opt.value)
          }));
          
          if (fetchedVariants.length > 0) {
             setVariants(fetchedVariants);
          } else {
             setVariants([]);
          }
        } catch (err) {
          console.error(err);
          setAlertConfig({ isOpen: true, title: 'Error', message: 'Failed to load product details.', type: 'error' });
        }
      };
      fetchProductDetails();
    }
  }, [id, isEditMode]);

  useEffect(() => {
    if (variants.length === 0 || variants.every(v => v.options.length === 0)) {
      setSubVariants([]);
      return;
    }

    const generateCombinations = (variantIndex, currentCombo) => {
      if (variantIndex === variants.length) {
        return [currentCombo];
      }
      
      const currentVariant = variants[variantIndex];
      if (currentVariant.options.length === 0) {
        return generateCombinations(variantIndex + 1, currentCombo);
      }

      let combinations = [];
      for (const option of currentVariant.options) {
        combinations = [
          ...combinations,
          ...generateCombinations(variantIndex + 1, { ...currentCombo, [currentVariant.name]: option })
        ];
      }
      return combinations;
    };

    const combinations = generateCombinations(0, {});
    
    const newSubVariants = combinations.map((combo, index) => {
      const name = Object.values(combo).join(' - ');
      return {
        id: `temp-${index}`,
        name,
        options: combo,
        price_offset: 0,
        stock: 0,
        sku: `SKU-${Math.floor(Math.random() * 10000)}`
      };
    });
    
    setSubVariants(newSubVariants);
  }, [variants]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const addVariant = () => {
    setVariants([...variants, { name: '', options: [] }]);
  };

  const updateVariantName = (index, name) => {
    const newVariants = [...variants];
    newVariants[index].name = name;
    setVariants(newVariants);
  };

  const addVariantOption = (index, optionName) => {
    if (!optionName) return;
    const newVariants = [...variants];
    if (!newVariants[index].options.includes(optionName)) {
      newVariants[index].options.push(optionName);
      setVariants(newVariants);
    }
  };

  const removeVariantOption = (vIndex, optIndex) => {
    const newVariants = [...variants];
    newVariants[vIndex].options.splice(optIndex, 1);
    setVariants(newVariants);
  };

  const removeVariant = (index) => {
    const newVariants = [...variants];
    newVariants.splice(index, 1);
    setVariants(newVariants);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    const variantNames = variants.map(v => v.name.trim().toLowerCase()).filter(n => n);
    const uniqueNames = new Set(variantNames);
    if (uniqueNames.size !== variantNames.length) {
      setAlertConfig({ isOpen: true, title: 'Validation Error', message: 'You cannot add multiple variants with the same name. Please ensure all variant names are unique.', type: 'error' });
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('ProductName', formData.name);
      formDataToSend.append('Active', 'true');
      if (formData.category) {
        formDataToSend.append('Category', formData.category);
      }
      
      if (!isEditMode) {
        const pid = Math.floor(Math.random() * 1000000);
        formDataToSend.append('ProductID', pid);
        formDataToSend.append('ProductCode', `PRD-${pid}`);
      }
      
      if (image && typeof image !== 'string') {
        formDataToSend.append('ProductImage', image);
      }
      
      let productId;
      if (isEditMode) {
        await client.patch(`/products/${id}/`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        productId = id;
      } else {
        const productRes = await client.post('/products/', formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        productId = productRes.data.id;
      }

      for (const variant of variants) {
        if (variant.name && variant.options.length > 0) {
          const optionsPayload = variant.options.map(opt => ({ value: opt }));
          if (variant.id) {
            await client.put(`/variants/${variant.id}/`, {
              product: productId,
              name: variant.name,
              options: optionsPayload
            });
          } else {
            await client.post(`/products/${productId}/variants/`, {
              name: variant.name,
              options: optionsPayload
            });
          }
        }
      }
      navigate('/products');
    } catch (err) {
      console.error(err);
      setAlertConfig({ isOpen: true, title: 'Error', message: 'Failed to save product: ' + (err.response?.data ? JSON.stringify(err.response.data) : err.message), type: 'error' });
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 font-sans antialiased text-slate-800">
      <AlertModal 
        isOpen={alertConfig.isOpen}
        onClose={() => setAlertConfig({ ...alertConfig, isOpen: false })}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
      />
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          {isEditMode ? 'Edit Product' : 'Create Product'}
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">
          {isEditMode ? 'Update product information and variants.' : 'Add a new product with variants and options.'}
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="col-span-1 lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg p-5 border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-4">Basic Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Product Name</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 text-sm bg-white text-slate-900"
                    placeholder="e.g. Premium Wireless Headphones"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Category</label>
                    <select 
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 text-sm bg-white text-slate-900"
                    >
                      <option value="">Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Base Price (₹)</label>
                    <input 
                      type="number" 
                      required
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 text-sm bg-white text-slate-900"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Description</label>
                  <textarea 
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 text-sm bg-white text-slate-900 resize-none"
                    placeholder="Enter product description..."
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-5 border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">Variants Builder</h3>
                <button 
                  type="button"
                  onClick={addVariant}
                  className="text-xs font-bold text-slate-900 hover:underline flex items-center gap-1"
                >
                  <Plus size={14} /> Add Variant
                </button>
              </div>
              
              <div className="space-y-4">
                {variants.map((variant, vIndex) => (
                  <div key={vIndex} className="p-4 bg-slate-50 rounded-lg border border-slate-200 relative group">
                    <button 
                      type="button"
                      onClick={() => removeVariant(vIndex)}
                      className="absolute top-4 right-4 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Remove Variant"
                    >
                      <Trash2 size={16} />
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Option Name</label>
                        <input 
                          type="text" 
                          value={variant.name}
                          onChange={(e) => updateVariantName(vIndex, e.target.value)}
                          placeholder="e.g. Color, Size"
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400 bg-white"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Values (Press Enter)</label>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {variant.options.map((opt, optIndex) => (
                            <span key={optIndex} className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold bg-slate-250 border border-slate-300 text-slate-800">
                              {opt}
                              <button type="button" onClick={() => removeVariantOption(vIndex, optIndex)} className="text-slate-400 hover:text-slate-900">
                                <X size={12} />
                              </button>
                            </span>
                          ))}
                        </div>
                        <input 
                          type="text" 
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addVariantOption(vIndex, e.target.value);
                              e.target.value = '';
                            }
                          }}
                          placeholder="Add value and press enter"
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400 bg-white"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {subVariants.length > 0 && (
              <div className="bg-white rounded-lg p-5 border border-slate-200 shadow-sm">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-4">Generated Sub-variants</h3>
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-xs text-left">
                    <thead className="text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-2.5 font-bold">Variant Combination</th>
                        <th className="px-4 py-2.5 font-bold w-36">SKU</th>
                        <th className="px-4 py-2.5 font-bold w-28">Price Offset</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {subVariants.map((sv, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="px-4 py-3 align-middle">
                            <SubVariantLabel
                              options={Object.entries(sv.options).map(([vName, val], i) => ({
                                id: `${sv.id}-${i}`,
                                variant_name: vName,
                                value: val,
                              }))}
                              mode="pills"
                              fallback={sv.name}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input type="text" defaultValue={sv.sku} className="w-full px-2 py-1 bg-white border border-slate-200 rounded focus:outline-none focus:border-slate-400 text-xs font-semibold" />
                          </td>
                          <td className="px-4 py-3">
                            <input type="number" defaultValue={sv.price_offset} className="w-full px-2 py-1 bg-white border border-slate-200 rounded focus:outline-none focus:border-slate-400 text-xs font-semibold" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg p-5 border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-4">Product Image</h3>
              <div className="mt-2">
                {imagePreview ? (
                  <div className="relative rounded-lg overflow-hidden border border-slate-200 group">
                    <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover" />
                    <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button 
                        type="button" 
                        onClick={() => { setImage(null); setImagePreview(null); }}
                        className="p-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-all cursor-pointer bg-slate-50">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-slate-500">
                      <Upload className="w-6 h-6 mb-2 text-slate-400" />
                      <p className="text-xs font-bold uppercase tracking-wider">Upload Product Image</p>
                      <p className="text-[10px] text-slate-400 mt-1">PNG, JPG or WEBP</p>
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                  </label>
                )}
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-5 border border-slate-200">
              <div className="flex flex-col gap-2">
                <button type="submit" className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-950 hover:bg-slate-800 text-white rounded-lg font-bold text-xs uppercase tracking-wider shadow-sm transition-colors">
                  <Save size={14} />
                  Save Product
                </button>
                <button type="button" onClick={() => navigate('/products')} className="w-full px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg font-bold text-xs uppercase tracking-wider transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

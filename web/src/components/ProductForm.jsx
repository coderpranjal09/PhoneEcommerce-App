import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { productAPI } from '../services/api';
import toast from 'react-hot-toast';

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    phoneName: '',
    brand: '',
    lotName: '',
    specifications: '',
    channelPrice: '',
    ssPrice: '',
    floatedPrice: '',
    grade: 'A',
    key: '',
    isActive: true,
  });

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      const { data } = await productAPI.getProductById(id);
      setFormData({
        phoneName: data.phoneName,
        brand: data.brand,
        lotName: data.lotName,
        specifications: data.specifications || '',
        channelPrice: data.channelPrice,
        ssPrice: data.ssPrice,
        floatedPrice: data.floatedPrice,
        grade: data.grade,
        key: data.key,
        isActive: data.isActive,
      });
    } catch (error) {
      toast.error('Failed to fetch product');
      navigate('/');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        ...formData,
        channelPrice: parseFloat(formData.channelPrice),
        ssPrice: parseFloat(formData.ssPrice),
        floatedPrice: parseFloat(formData.floatedPrice),
      };

      if (id) {
        await productAPI.updateProduct(id, data);
        toast.success('Product updated successfully');
      } else {
        await productAPI.createProduct(data);
        toast.success('Product created successfully');
      }
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">
          {id ? 'Edit Product' : 'Add Product'}
        </h2>
        
        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg px-8 pt-6 pb-8 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Phone Name *
              </label>
              <input
                type="text"
                name="phoneName"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={formData.phoneName}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Brand *
              </label>
              <input
                type="text"
                name="brand"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={formData.brand}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Lot Name *
              </label>
              <input
                type="text"
                name="lotName"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={formData.lotName}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Key *
              </label>
              <input
                type="text"
                name="key"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={formData.key}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Channel Price *
              </label>
              <input
                type="number"
                name="channelPrice"
                required
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={formData.channelPrice}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                SS Price *
              </label>
              <input
                type="number"
                name="ssPrice"
                required
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={formData.ssPrice}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Floated Price *
              </label>
              <input
                type="number"
                name="floatedPrice"
                required
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={formData.floatedPrice}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Grade *
              </label>
              <select
                name="grade"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={formData.grade}
                onChange={handleChange}
              >
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="Refurbished">Refurbished</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Specifications
              </label>
              <textarea
                name="specifications"
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={formData.specifications}
                onChange={handleChange}
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="isActive"
                id="isActive"
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                checked={formData.isActive}
                onChange={handleChange}
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                Active
              </label>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Saving...' : (id ? 'Update Product' : 'Create Product')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;
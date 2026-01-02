import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productAPI } from '../services/api';
import toast from 'react-hot-toast';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const [totalProducts, setTotalProducts] = useState(0);

  const fetchProducts = async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await productAPI.getProducts({
        search,
        page,
        limit: 10,
      });
      setProducts(data.products);
      setTotalPages(data.totalPages);
      setCurrentPage(data.currentPage);
      setTotalProducts(data.total);
    } catch (error) {
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productAPI.deleteProduct(id);
        toast.success('Product deleted successfully');
        fetchProducts(currentPage);
      } catch (error) {
        toast.error('Failed to delete product');
      }
    }
  };

  const handleDeleteAll = async () => {
    if (totalProducts === 0) {
      toast.error('No products to delete');
      return;
    }

    if (!window.confirm(`Are you absolutely sure you want to delete ALL ${totalProducts} products? This action cannot be undone!`)) {
      return;
    }

    // Double confirmation for safety
    const confirmed = window.confirm('⚠️ WARNING: This will permanently delete ALL products. Type "DELETE ALL" to confirm:');
    
    if (!confirmed) {
      return;
    }

    const userInput = prompt('Please type "DELETE ALL" to confirm deletion of all products:');
    
    if (userInput !== 'DELETE ALL') {
      toast.error('Deletion cancelled. Incorrect confirmation text.');
      return;
    }

    setDeletingAll(true);
    try {
      await productAPI.deleteAllProducts();
      toast.success(`Successfully deleted ${totalProducts} products`);
      setProducts([]);
      setTotalProducts(0);
      setTotalPages(1);
      setCurrentPage(1);
    } catch (error) {
      toast.error('Failed to delete all products');
    } finally {
      setDeletingAll(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search products by name, brand, lot, or key..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {totalProducts > 0 && (
            <p className="text-sm text-gray-600 mt-1">
              Showing {products.length} of {totalProducts} products
            </p>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Link
            to="/add"
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition duration-200 text-center font-medium"
          >
            Add New Product
          </Link>
          
          <button
            onClick={handleDeleteAll}
            disabled={deletingAll || totalProducts === 0}
            className={`px-4 py-2 rounded-md transition duration-200 text-center font-medium ${
              deletingAll || totalProducts === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
          >
            {deletingAll ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Deleting All...
              </span>
            ) : (
              `Delete All Products (${totalProducts})`
            )}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-600">Loading products...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white shadow-md rounded-lg p-8 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No products</h3>
          <p className="mt-1 text-sm text-gray-500">
            {search ? 'No products match your search.' : 'Get started by creating a new product.'}
          </p>
          {!search && (
            <div className="mt-6">
              <Link
                to="/add"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Add Product
              </Link>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Brand
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lot Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Floated Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Grade
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Key
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product._id} className="hover:bg-gray-50 transition duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {product.phoneName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{product.brand}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{product.lotName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          Rs {product.floatedPrice?.toFixed(2) || '0.00'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          product.grade === 'A' ? 'bg-green-100 text-green-800 border border-green-200' :
                          product.grade === 'B' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                          product.grade === 'C' ? 'bg-red-100 text-red-800 border border-red-200' :
                          'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}>
                          {product.grade || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono text-gray-500 bg-gray-50 px-2 py-1 rounded border">
                          {product.key}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-3">
                          <Link
                            to={`/edit/${product._id}`}
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-1 rounded transition duration-150"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDelete(product._id)}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-1 rounded transition duration-150"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    if (currentPage > 1) {
                      setCurrentPage(currentPage - 1);
                      fetchProducts(currentPage - 1);
                    }
                  }}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded-md font-medium ${
                    currentPage === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => {
                      setCurrentPage(page);
                      fetchProducts(page);
                    }}
                    className={`px-4 py-2 rounded-md font-medium ${
                      currentPage === page
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => {
                    if (currentPage < totalPages) {
                      setCurrentPage(currentPage + 1);
                      fetchProducts(currentPage + 1);
                    }
                  }}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 rounded-md font-medium ${
                    currentPage === totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProductList;
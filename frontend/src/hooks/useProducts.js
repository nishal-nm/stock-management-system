import { useState, useEffect } from 'react';
import client from '../api/client';

export function useProducts(initialPage = 1, initialSearch = '', initialCategory = '') {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [page, setPage] = useState(initialPage);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

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

  return {
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
    fetchProducts,
  };
}

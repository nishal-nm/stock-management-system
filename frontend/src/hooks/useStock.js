import { useState, useEffect, useCallback } from 'react';
import client from '../api/client';

export function useStockReport() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [transactionType, setTransactionType] = useState('');
  const [productId, setProductId] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      if (transactionType) params.append('transaction_type', transactionType);
      if (productId) params.append('product_id', productId);
      params.append('page', page);
      params.append('page_size', pageSize);

      const response = await client.get(`/stock/report/?${params.toString()}`);
      const data = response.data.results || response.data;
      setTransactions(data);
      setTotalCount(response.data.count || data.length);
    } catch (err) {
      console.error("Failed to fetch report:", err);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, transactionType, productId, page, pageSize]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  return {
    transactions,
    loading,
    totalCount,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    transactionType,
    setTransactionType,
    productId,
    setProductId,
    page,
    setPage,
    pageSize,
    setPageSize,
    fetchReport,
  };
}

export function useStockLevels(initialPage = 1) {
  const [stockLevels, setStockLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(10);

  const fetchStockLevels = async () => {
    setLoading(true);
    try {
      const response = await client.get(`/stock/?page=${page}&page_size=${pageSize}`);
      const data = response.data.results || response.data;
      setStockLevels(data);
      setTotalCount(response.data.count || data.length);
    } catch (err) {
      console.error("Failed to fetch stock levels:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStockLevels();
  }, [page, pageSize]);

  return {
    stockLevels,
    loading,
    totalCount,
    page,
    setPage,
    pageSize,
    setPageSize,
    fetchStockLevels,
  };
}

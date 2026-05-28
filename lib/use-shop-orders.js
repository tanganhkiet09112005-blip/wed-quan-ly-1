'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';

/**
 * Hook dùng chung cho các trang customer — tự động filter theo shopId
 * @param {object} params - { status, channel, search }
 */
export function useShopOrders(params = {}) {
  const { user } = useAuth();
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 50, totalPages: 1, facets: {} });

  const fetchOrders = useCallback(async () => {
    if (!user?.shopId) { setLoading(false); return; }
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (params.status)  query.set('status',  params.status);
      if (params.codStatus) query.set('codStatus', params.codStatus);
      if (params.carrierCode) query.set('carrierCode', params.carrierCode);
      if (params.channel) query.set('channel', params.channel);
      if (params.search)  query.set('search',  params.search);
      if (params.dateFrom) query.set('dateFrom', params.dateFrom);
      if (params.dateTo) query.set('dateTo', params.dateTo);
      if (params.page) query.set('page', String(params.page));
      if (params.limit) query.set('limit', String(params.limit));

      const res  = await fetch(`/api/orders?${query}`);
      const json = await res.json();
      if (json.success) {
        setOrders(json.data);
        setMeta({
          total: json.total || 0,
          page: json.page || 1,
          limit: json.limit || params.limit || 50,
          totalPages: json.totalPages || 1,
          facets: json.facets || {},
        });
      }
    } catch (e) {
      console.error('useShopOrders:', e);
    } finally {
      setLoading(false);
    }
  }, [
    user?.shopId,
    params.status,
    params.codStatus,
    params.carrierCode,
    params.channel,
    params.search,
    params.dateFrom,
    params.dateTo,
    params.page,
    params.limit,
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchOrders]);

  return { orders, loading, refetch: fetchOrders, shopId: user?.shopId, meta };
}

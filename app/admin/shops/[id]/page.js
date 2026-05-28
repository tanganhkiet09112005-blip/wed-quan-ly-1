'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getCodStatusColor, getCodStatusLabel, getStatusColor, getStatusLabel } from '@/lib/order-constants';

const formatCurrency = (value) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value || 0);

const formatNumber = (value) => new Intl.NumberFormat('vi-VN').format(value || 0);

export default function AdminShopDetailPage() {
  const params = useParams();
  const shopId = params?.id;
  const [shop, setShop] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadShop = useCallback(async () => {
    if (!shopId) return;
    setLoading(true);
    try {
      const [dashboardRes, ordersRes] = await Promise.all([
        fetch('/api/dashboard'),
        fetch(`/api/orders?shopId=${shopId}&limit=8`),
      ]);
      const dashboardJson = await dashboardRes.json();
      const ordersJson = await ordersRes.json();

      if (!dashboardJson.success) throw new Error(dashboardJson.error || 'Không thể tải dashboard admin.');
      const foundShop = (dashboardJson.data.shopReports || []).find((item) => item.id === shopId);
      if (!foundShop) throw new Error('Không tìm thấy shop.');

      setShop(foundShop);
      setOrders(ordersJson.success ? ordersJson.data || [] : []);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadShop();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadShop]);

  const statusEntries = useMemo(() => Object.entries(shop?.byStatus || {}).sort((a, b) => b[1] - a[1]), [shop?.byStatus]);
  const carrierEntries = useMemo(() => Object.entries(shop?.byCarrier || {}).sort((a, b) => b[1] - a[1]), [shop?.byCarrier]);

  if (loading && !shop) {
    return (
      <div className="page-container" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text-muted)' }}>Đang tải chi tiết shop...</div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="page-container">
        <Link href="/admin/shops" className="btn btn-secondary btn-sm" style={{ marginBottom: 16 }}>Quay lại danh sách shop</Link>
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: 8, padding: '16px 20px' }}>
          {error || 'Không tìm thấy shop.'}
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: 22 }}>
        <div>
          <Link href="/admin/shops" className="btn btn-secondary btn-sm" style={{ marginBottom: 12 }}>Quay lại danh sách shop</Link>
          <div className="page-title">{shop.name}</div>
          <div className="page-subtitle">{shop.code} · {shop.ownerName} · {shop.email} · {shop.phone}</div>
        </div>
        <button type="button" className="btn btn-secondary" onClick={loadShop} disabled={loading}>Tải lại</button>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: 8, padding: '12px 16px', marginBottom: 20 }}>
          {error}
        </div>
      )}

      <div className="grid-kpi" style={{ marginBottom: 24 }}>
        <div className="kpi-card"><div className="kpi-icon kpi-icon-blue">O</div><div className="kpi-content"><div className="kpi-value">{formatNumber(shop.ordersCount)}</div><div className="kpi-label">Tổng đơn</div></div></div>
        <div className="kpi-card"><div className="kpi-icon kpi-icon-green">C</div><div className="kpi-content"><div className="kpi-value" style={{ fontSize: 19 }}>{formatCurrency(shop.codTotal)}</div><div className="kpi-label">COD đã thu</div></div></div>
        <div className="kpi-card"><div className="kpi-icon kpi-icon-yellow">P</div><div className="kpi-content"><div className="kpi-value" style={{ fontSize: 19 }}>{formatCurrency(shop.codPendingTotal)}</div><div className="kpi-label">COD chờ thu</div></div></div>
        <div className="kpi-card"><div className="kpi-icon kpi-icon-purple">F</div><div className="kpi-content"><div className="kpi-value" style={{ fontSize: 19 }}>{formatCurrency(shop.shippingFeeTotal)}</div><div className="kpi-label">Cước phí</div></div></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(320px, 0.8fr)', gap: 20, marginBottom: 24 }}>
        <div className="card">
          <div className="card-title">Tổng đơn theo trạng thái</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {statusEntries.length === 0 ? (
              <div style={{ color: 'var(--text-muted)' }}>Shop chưa có đơn.</div>
            ) : statusEntries.map(([status, count]) => (
              <div key={status} className="flex-between" style={{ padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 8 }}>
                <span className={`badge ${getStatusColor(status)}`}>{getStatusLabel(status)}</span>
                <strong>{formatNumber(count)} đơn</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-title">Carrier usage</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {carrierEntries.length === 0 ? (
              <div style={{ color: 'var(--text-muted)' }}>Chưa có carrier phát sinh.</div>
            ) : carrierEntries.map(([carrier, count]) => (
              <div key={carrier} className="flex-between" style={{ padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 8 }}>
                <strong>{carrier === 'NONE' ? 'Chưa chọn ĐVVC' : carrier}</strong>
                <span>{formatNumber(count)} đơn</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
          <div className="card-title" style={{ marginBottom: 0 }}>Đơn gần đây của shop</div>
        </div>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Khách hàng</th>
                <th>Carrier</th>
                <th style={{ textAlign: 'right' }}>COD</th>
                <th>COD status</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>Chưa có đơn gần đây.</td></tr>
              ) : orders.map((order) => (
                <tr key={order.id}>
                  <td><span style={{ fontFamily: 'monospace', color: 'var(--primary)', fontWeight: 800 }}>{order.code}</span></td>
                  <td>
                    <div style={{ fontWeight: 700 }}>{order.shippingName}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{order.shippingPhone}</div>
                  </td>
                  <td><span className="badge" style={{ background: 'var(--bg-input)', color: 'var(--text-secondary)' }}>{order.carrierName || order.shipperCode || '-'}</span></td>
                  <td style={{ textAlign: 'right', fontWeight: 800 }}>{formatCurrency(order.codAmount)}</td>
                  <td><span className={`badge ${getCodStatusColor(order.codStatus)}`}>{getCodStatusLabel(order.codStatus)}</span></td>
                  <td><span className={`badge ${getStatusColor(order.status)}`}>{getStatusLabel(order.status)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

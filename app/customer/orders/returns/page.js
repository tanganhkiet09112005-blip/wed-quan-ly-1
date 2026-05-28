'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye } from 'lucide-react';
import { useShopOrders } from '@/lib/use-shop-orders';
import { getCodStatusColor, getCodStatusLabel, getStatusColor, getStatusLabel } from '@/lib/order-constants';

const formatCurrency = (value) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value || 0);

const CARRIER_OPTIONS = ['all', 'GHN', 'GHTK', 'JT', 'SPX'];

export default function ReturnsPage() {
  const [search, setSearch] = useState('');
  const [carrierCode, setCarrierCode] = useState('all');
  const { orders, loading, meta } = useShopOrders({
    status: 'returned',
    search: search.trim(),
    carrierCode: carrierCode === 'all' ? '' : carrierCode,
    limit: 50,
  });

  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: 18 }}>
        <div>
          <div className="page-title">Đơn trả hàng / hoàn hàng</div>
          <div className="page-subtitle">{meta.total || orders.length} đơn status {getStatusLabel('returned')}, COD không được tính là đã thu.</div>
        </div>
      </div>

      <div className="filter-bar" style={{ marginBottom: 14, flexWrap: 'wrap' }}>
        <div className="search-wrapper" style={{ minWidth: 300 }}>
          <input
            className="search-input"
            placeholder="Tìm mã đơn, khách hàng, SĐT, mã vận đơn..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <select className="form-control" style={{ width: 160 }} value={carrierCode} onChange={(event) => setCarrierCode(event.target.value)}>
          {CARRIER_OPTIONS.map((carrier) => <option key={carrier} value={carrier}>{carrier === 'all' ? 'Tất cả ĐVVC' : carrier}</option>)}
        </select>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Khách hàng</th>
                <th>SĐT</th>
                <th>Carrier</th>
                <th>Tracking code</th>
                <th style={{ textAlign: 'right' }}>COD</th>
                <th>COD status</th>
                <th>Lý do / ghi chú</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Đang tải đơn hoàn hàng...</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Không có đơn hoàn hàng phù hợp.</td></tr>
              ) : orders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <Link href={`/customer/orders/${order.id}`} style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--primary)' }}>
                      {order.code}
                    </Link>
                    <div style={{ marginTop: 4 }}><span className={`badge ${getStatusColor(order.status)}`}>{getStatusLabel(order.status)}</span></div>
                  </td>
                  <td style={{ fontWeight: 700 }}>{order.shippingName}</td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{order.shippingPhone}</td>
                  <td><span className="badge" style={{ background: 'var(--bg-input)', color: 'var(--text-secondary)' }}>{order.carrierName || order.shipperCode || '-'}</span></td>
                  <td><span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>{order.trackingCode || '-'}</span></td>
                  <td style={{ textAlign: 'right', fontWeight: 800, color: '#b91c1c' }}>{formatCurrency(order.codAmount)}</td>
                  <td><span className={`badge ${getCodStatusColor(order.codStatus)}`}>{getCodStatusLabel(order.codStatus)}</span></td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 240 }}>{order.note || '-'}</td>
                  <td>
                    <Link href={`/customer/orders/${order.id}`} className="btn btn-secondary btn-sm" style={{ gap: 6, justifyContent: 'center' }}>
                      <Eye size={14} /> Xem chi tiết
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

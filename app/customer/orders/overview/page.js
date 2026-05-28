'use client';

import Link from 'next/link';
import { useShopOrders } from '@/lib/use-shop-orders';
import { getStatusColor, getStatusLabel } from '@/lib/order-constants';

const formatCurrency = (value) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value || 0);

export default function OverviewPage() {
  const { orders, loading } = useShopOrders();

  if (loading) {
    return (
      <div className="page-container" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text-muted)' }}>Đang tải tổng quan giao hàng...</div>
      </div>
    );
  }

  const totalOrders = orders.length;
  const pendingOrders = orders.filter((order) => ['pending', 'ready_to_ship'].includes(order.status)).length;
  const shippingOrders = orders.filter((order) => ['pushed_to_carrier', 'shipping'].includes(order.status)).length;
  const deliveredOrders = orders.filter((order) => order.status === 'delivered').length;
  const returnedOrders = orders.filter((order) => ['returned', 'failed', 'cancelled'].includes(order.status)).length;
  const totalCOD = orders
    .filter((order) => !['returned', 'failed', 'cancelled'].includes(order.status))
    .reduce((sum, order) => sum + (order.codAmount || 0), 0);
  const totalFee = orders
    .filter((order) => !['failed', 'cancelled'].includes(order.status))
    .reduce((sum, order) => sum + (order.shippingFee || 0), 0);
  const recentOrders = orders.slice(0, 10);

  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: 22 }}>
        <div>
          <div className="page-title">Tổng quan giao hàng</div>
          <div className="page-subtitle">Shop theo dõi vận đơn mock, COD và trạng thái giao hàng ở mức tổng quan.</div>
        </div>
        <Link href="/customer/orders/create" className="btn btn-primary">Tạo đơn mới</Link>
      </div>

      <div className="grid-kpi" style={{ marginBottom: 24 }}>
        <div className="kpi-card"><div className="kpi-icon kpi-icon-blue">Đ</div><div className="kpi-content"><div className="kpi-value">{totalOrders}</div><div className="kpi-label">Tổng đơn</div></div></div>
        <div className="kpi-card"><div className="kpi-icon kpi-icon-yellow">C</div><div className="kpi-content"><div className="kpi-value">{pendingOrders}</div><div className="kpi-label">Chờ xử lý</div></div></div>
        <div className="kpi-card"><div className="kpi-icon kpi-icon-blue">G</div><div className="kpi-content"><div className="kpi-value">{shippingOrders}</div><div className="kpi-label">Đang giao</div></div></div>
        <div className="kpi-card"><div className="kpi-icon kpi-icon-green">T</div><div className="kpi-content"><div className="kpi-value">{deliveredOrders}</div><div className="kpi-label">Đã giao</div></div></div>
        <div className="kpi-card"><div className="kpi-icon kpi-icon-purple">H</div><div className="kpi-content"><div className="kpi-value">{returnedOrders}</div><div className="kpi-label">Hoàn/hủy/lỗi</div></div></div>
        <div className="kpi-card"><div className="kpi-icon kpi-icon-green">C</div><div className="kpi-content"><div className="kpi-value" style={{ fontSize: 19 }}>{formatCurrency(totalCOD)}</div><div className="kpi-label">COD còn hiệu lực</div></div></div>
        <div className="kpi-card"><div className="kpi-icon kpi-icon-blue">P</div><div className="kpi-content"><div className="kpi-value" style={{ fontSize: 19 }}>{formatCurrency(totalFee)}</div><div className="kpi-label">Cước phí</div></div></div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="flex-between" style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
          <div>
            <div className="card-title" style={{ marginBottom: 0 }}>Đơn hàng gần đây</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Dữ liệu lấy từ API đơn hàng đã scope theo shop.</div>
          </div>
          <Link href="/customer/orders/manage" className="btn btn-secondary btn-sm">Xem tất cả</Link>
        </div>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Khách hàng</th>
                <th>Sản phẩm</th>
                <th>ĐVVC</th>
                <th style={{ textAlign: 'right' }}>COD</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Chưa có đơn hàng.</td></tr>
              ) : recentOrders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <Link href={`/customer/orders/${order.id}`} style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--primary)' }}>{order.code}</Link>
                    {order.trackingCode && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{order.trackingCode}</div>}
                  </td>
                  <td>
                    <div style={{ fontWeight: 700 }}>{order.shippingName}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{order.shippingPhone}</div>
                  </td>
                  <td style={{ maxWidth: 220 }}>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {order.items?.length ? order.items.map((item) => `${item.name} x${item.quantity}`).join(', ') : '-'}
                    </div>
                  </td>
                  <td><span className="badge" style={{ background: 'var(--bg-input)', color: 'var(--text-secondary)' }}>{order.carrierName || order.shipperCode || '-'}</span></td>
                  <td style={{ textAlign: 'right', fontWeight: 800 }}>{formatCurrency(order.codAmount)}</td>
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

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Building2, CreditCard, ExternalLink, Globe,
  Package, ShoppingBag, Truck, Users, AlertCircle,
  CheckCircle, XCircle, ToggleLeft, ToggleRight, RefreshCw,
} from 'lucide-react';
import { getCodStatusColor, getCodStatusLabel, getStatusColor, getStatusLabel } from '@/lib/order-constants';

const fmt = (v) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(v || 0);
const fmtN = (v) => new Intl.NumberFormat('vi-VN').format(v || 0);

const CHANNEL_LABEL = { direct: 'Web', fanpage: 'Fanpage', livestream: 'Livestream', pos: 'POS', ecommerce: 'Sàn TMĐT' };
const PLATFORM_LABEL = { shopee: 'Shopee', lazada: 'Lazada', tiktok: 'TikTok Shop' };

export default function AdminShopDetailPage() {
  const params = useParams();
  const shopId = params?.id;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toggling, setToggling] = useState(false);

  const loadShop = useCallback(async () => {
    if (!shopId) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/shops/${shopId}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error || 'Không thể tải chi tiết shop.');
      }
    } catch {
      setError('Không thể kết nối máy chủ.');
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  useEffect(() => { loadShop(); }, [loadShop]);

  const toggleStatus = async () => {
    if (!data?.shop) return;
    const newStatus = data.shop.status === 'active' ? 'suspended' : 'active';
    const label = newStatus === 'active' ? 'kích hoạt' : 'tạm khóa';
    if (!window.confirm(`Bạn có chắc muốn ${label} shop "${data.shop.name}"?`)) return;

    setToggling(true);
    try {
      const res = await fetch(`/api/shops/${shopId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        setData((prev) => ({ ...prev, shop: { ...prev.shop, status: newStatus } }));
      } else {
        alert(json.error || 'Không thể đổi trạng thái shop.');
      }
    } catch {
      alert('Lỗi kết nối.');
    } finally {
      setToggling(false);
    }
  };

  const { shop, summary, recentOrders, products, ecommerceConnections, config } = data || {};
  const statusEntries = useMemo(() => Object.entries(summary?.byStatus || {}).sort((a, b) => b[1] - a[1]), [summary]);
  const carrierEntries = useMemo(() => Object.entries(summary?.byCarrier || {}).filter(([k]) => k !== 'NONE').sort((a, b) => b[1] - a[1]), [summary]);
  const channelEntries = useMemo(() => Object.entries(summary?.byChannel || {}).sort((a, b) => b[1] - a[1]), [summary]);

  if (loading && !data) {
    return (
      <div className="page-container" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> Đang tải chi tiết shop...
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="page-container">
        <Link href="/admin/shops" className="btn btn-secondary btn-sm" style={{ marginBottom: 16 }}>← Quay lại</Link>
        <div className="alert alert-danger">{error || 'Không tìm thấy shop.'}</div>
      </div>
    );
  }

  const isActive = shop.status === 'active';

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <Link href="/admin/shops" className="btn btn-secondary btn-sm" style={{ marginBottom: 10 }}>← Danh sách shop</Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="page-title">{shop.name}</div>
            <span className={`badge ${isActive ? 'status-delivered' : 'status-cancelled'}`}>
              {isActive ? 'Hoạt động' : shop.status === 'suspended' ? 'Đã khóa' : 'Không hoạt động'}
            </span>
          </div>
          <div className="page-subtitle">{shop.code} · {shop.ownerName} · {shop.email} · {shop.phone}</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={loadShop} disabled={loading}>
            <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Tải lại
          </button>
          <button
            type="button"
            className={`btn btn-sm ${isActive ? 'btn-danger' : 'btn-primary'}`}
            onClick={toggleStatus}
            disabled={toggling}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {isActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
            {toggling ? 'Đang xử lý...' : (isActive ? 'Tạm khóa shop' : 'Kích hoạt shop')}
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger mb-16">{error}</div>}

      {/* KPIs */}
      <div className="grid-kpi" style={{ marginBottom: 24 }}>
        {[
          { label: 'Tổng đơn hàng', value: fmtN(summary?.totalOrders), icon: Package, cls: 'kpi-icon-blue' },
          { label: 'COD đã thu', value: fmt(summary?.codCollected), icon: CreditCard, cls: 'kpi-icon-green' },
          { label: 'COD chờ thu', value: fmt(summary?.codPending), icon: CreditCard, cls: 'kpi-icon-yellow' },
          { label: 'Cước phí', value: fmt(summary?.shippingFeeTotal), icon: Truck, cls: 'kpi-icon-purple' },
          { label: 'Sản phẩm', value: fmtN(shop._count?.products), icon: ShoppingBag, cls: 'kpi-icon-cyan' },
          { label: 'Tỉ lệ giao', value: summary?.totalOrders > 0 ? `${Math.round(((summary?.byStatus?.delivered || 0) / summary.totalOrders) * 100)}%` : '—', icon: Globe, cls: 'kpi-icon-green' },
        ].map(({ label, value, icon: Icon, cls }) => (
          <div key={label} className="kpi-card">
            <div className={`kpi-icon ${cls}`}><Icon size={18} /></div>
            <div className="kpi-content">
              <div className="kpi-value" style={{ fontSize: 19 }}>{value ?? '0'}</div>
              <div className="kpi-label">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.6fr', gap: 20, marginBottom: 20 }}>
        {/* Left: Status breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div className="card-title" style={{ marginBottom: 14 }}>Đơn theo trạng thái</div>
            {statusEntries.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Chưa có đơn hàng.</div>
            ) : statusEntries.map(([status, count]) => {
              const pct = summary.totalOrders > 0 ? Math.round((count / summary.totalOrders) * 100) : 0;
              return (
                <div key={status} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span className={`badge ${getStatusColor(status)}`}>{getStatusLabel(status)}</span>
                    <span style={{ fontWeight: 700 }}>{fmtN(count)} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({pct}%)</span></span>
                  </div>
                  <div className="progress-bar-wrapper" style={{ height: 6 }}>
                    <div className="progress-bar progress-blue" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="card">
            <div className="card-title" style={{ marginBottom: 14 }}>Đơn theo kênh bán</div>
            {channelEntries.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Chưa có dữ liệu.</div>
            ) : channelEntries.map(([ch, count]) => (
              <div key={ch} className="flex-between" style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, marginBottom: 8, fontSize: 13 }}>
                <span style={{ fontWeight: 700 }}>{CHANNEL_LABEL[ch] || ch}</span>
                <span style={{ fontWeight: 800 }}>{fmtN(count)} đơn</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Config & connections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Carrier */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: 12 }}>Carrier sử dụng</div>
            {carrierEntries.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Chưa có carrier phát sinh.</div>
            ) : carrierEntries.map(([carrier, count]) => (
              <div key={carrier} className="flex-between" style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                <span style={{ fontWeight: 700 }}>{carrier}</span>
                <span>{fmtN(count)} đơn</span>
              </div>
            ))}
          </div>

          {/* Integrations */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: 12 }}>Tích hợp</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
              <div className="flex-between">
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {config?.hasFbPageId ? <CheckCircle size={14} color="#16a34a" /> : <XCircle size={14} color="#94a3b8" />}
                  Facebook
                </span>
                <span className={`badge ${config?.fbStatus === 'active' ? 'status-delivered' : 'status-cancelled'}`}>
                  {config?.fbStatus || 'inactive'}
                </span>
              </div>
              <div className="flex-between">
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {config?.hasMisaAppId ? <CheckCircle size={14} color="#16a34a" /> : <XCircle size={14} color="#94a3b8" />}
                  MISA Invoice
                </span>
                <span className={`badge ${config?.misaStatus === 'active' ? 'status-delivered' : 'status-cancelled'}`}>
                  {config?.misaStatus || 'inactive'}
                </span>
              </div>
            </div>
          </div>

          {/* Ecommerce */}
          {ecommerceConnections?.length > 0 && (
            <div className="card">
              <div className="card-title" style={{ marginBottom: 12 }}>Sàn TMĐT</div>
              {ecommerceConnections.map((conn) => (
                <div key={conn.id} className="flex-between" style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                  <span style={{ fontWeight: 700 }}>{PLATFORM_LABEL[conn.platform] || conn.platform}</span>
                  <span className={`badge ${conn.status === 'active' ? 'status-delivered' : 'status-pending'}`}>{conn.status}</span>
                </div>
              ))}
            </div>
          )}

          {/* Info */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: 12 }}>Thông tin shop</div>
            {[
              { label: 'Mã shop', value: shop.code },
              { label: 'Chủ shop', value: shop.ownerName },
              { label: 'Email', value: shop.email },
              { label: 'SĐT', value: shop.phone },
              { label: 'Users', value: `${shop._count?.users || 0} tài khoản` },
              { label: 'Ngày tạo', value: new Date(shop.createdAt).toLocaleDateString('vi-VN') },
            ].map(({ label, value }) => (
              <div key={label} className="flex-between" style={{ padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                <span style={{ fontWeight: 600 }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent orders table */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="card-title" style={{ marginBottom: 0 }}>Đơn hàng gần đây</div>
          <Link href={`/admin/shops?search=${shop.code}`} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <ExternalLink size={12} /> Xem tất cả đơn
          </Link>
        </div>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Khách hàng</th>
                <th>Kênh</th>
                <th>Carrier</th>
                <th style={{ textAlign: 'right' }}>COD</th>
                <th>COD status</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {!recentOrders || recentOrders.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>Chưa có đơn hàng.</td></tr>
              ) : recentOrders.map((order) => (
                <tr key={order.id}>
                  <td><span style={{ fontFamily: 'monospace', color: 'var(--primary)', fontWeight: 800 }}>{order.code}</span></td>
                  <td>
                    <div style={{ fontWeight: 700 }}>{order.shippingName}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{order.shippingPhone}</div>
                  </td>
                  <td><span className="badge" style={{ background: 'var(--bg-input)' }}>{CHANNEL_LABEL[order.channel] || order.channel || '—'}</span></td>
                  <td><span className="badge" style={{ background: 'var(--bg-input)' }}>{order.carrierName || order.shipperCode || '—'}</span></td>
                  <td style={{ textAlign: 'right', fontWeight: 800 }}>{fmt(order.codAmount)}</td>
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

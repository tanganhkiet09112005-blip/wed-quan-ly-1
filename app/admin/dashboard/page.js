'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  CheckCircle,
  Package,
  RefreshCw,
  ShoppingBag,
  Store,
  Truck,
  XCircle,
} from 'lucide-react';
import { getStatusColor, getStatusLabel } from '@/lib/order-constants';

/* ─── Formatters ─────────────────────────────── */
const formatCurrency = (v) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(v || 0);
const formatNumber = (v) => new Intl.NumberFormat('vi-VN').format(v || 0);
const formatDate = (v) =>
  v ? new Date(v).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';

const CARRIER_NAMES = {
  GHN: 'Giao Hàng Nhanh', GHTK: 'Giao Hàng Tiết Kiệm',
  JT: 'J&T Express', SPX: 'Shopee Express', NONE: 'Chưa chọn ĐVVC',
};

const STATUS_BAR_COLORS = {
  delivered: '#16a34a', shipping: '#2563eb', pending: '#d97706',
  pushed_to_carrier: '#0891b2', ready_to_ship: '#7c3aed',
  partial_delivered: '#0d9488', returned: '#dc2626', failed: '#ef4444',
  cancelled: '#94a3b8', draft: '#cbd5e1',
};

/* ─── KPI Card ───────────────────────────────── */
function KpiCard({ label, value, icon: Icon, iconCls, sub }) {
  return (
    <div className="kpi-card">
      <div className={`kpi-icon ${iconCls}`}>
        <Icon size={20} />
      </div>
      <div className="kpi-content">
        <div className="kpi-value" style={{ fontSize: 20 }}>{value}</div>
        <div className="kpi-label">{label}</div>
        {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{sub}</div>}
      </div>
    </div>
  );
}

/* ─── Main component ─────────────────────────── */
export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/dashboard');
      const json = await res.json();
      if (json.success) setData(json.data);
      else setError(json.error || 'Không thể tải dữ liệu dashboard.');
    } catch {
      setError('Không thể kết nối máy chủ. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { const t = setTimeout(load, 0); return () => clearTimeout(t); }, [load]);

  const summary = data?.summary || {};
  const shops = useMemo(() => data?.shopReports || [], [data]);
  const recentOrders = data?.recentOrders || [];
  const statusEntries = Object.entries(summary.byStatus || {}).sort((a, b) => b[1] - a[1]);
  const carrierEntries = Object.entries(summary.byCarrier || {})
    .filter(([c]) => c !== 'NONE')
    .sort((a, b) => b[1] - a[1]);
  const topShops = useMemo(() => [...shops].sort((a, b) => (b.ordersCount || 0) - (a.ordersCount || 0)).slice(0, 6), [shops]);

  return (
    <div className="page-container">

      {/* ─── Header ─── */}
      <div className="page-header" style={{ marginBottom: 22 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              color: 'white', padding: '3px 10px', borderRadius: 6,
              fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px',
            }}>
              Admin Portal
            </div>
          </div>
          <div className="page-title">Quản trị nền tảng</div>
          <div className="page-subtitle">
            Theo dõi hoạt động toàn hệ thống, số đơn, COD và cước phí của các shop
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" className="btn btn-secondary" onClick={load} disabled={loading}>
            <RefreshCw size={14} style={{ animation: loading ? 'spin 0.8s linear infinite' : 'none' }} /> Tải lại
          </button>
          <Link href="/admin/shops" className="btn btn-primary">
            <Store size={14} /> Quản lý shop
          </Link>
        </div>
      </div>

      {/* ─── Error state ─── */}
      {error && (
        <div className="alert alert-danger mb-16" style={{ alignItems: 'flex-start', gap: 8 }}>
          <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>{error}</span>
          <button type="button" className="btn btn-secondary btn-sm" onClick={load} style={{ marginLeft: 'auto', flexShrink: 0 }}>
            <RefreshCw size={12} /> Thử lại
          </button>
        </div>
      )}

      {/* ─── KPI Cards ─── */}
      {loading ? (
        <div className="grid-kpi" style={{ marginBottom: 24 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="kpi-card">
              <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 10, flexShrink: 0 }} />
              <div className="kpi-content">
                <div className="skeleton" style={{ height: 22, width: '65%', marginBottom: 6 }} />
                <div className="skeleton" style={{ height: 13, width: '85%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid-kpi" style={{ marginBottom: 24 }}>
          <KpiCard label="Tổng số shop" value={formatNumber(summary.totalShops)} icon={Store} iconCls="kpi-icon-blue"
            sub={`${summary.activeShops || 0} shop đang hoạt động`} />
          <KpiCard label="Shop hoạt động" value={formatNumber(summary.activeShops)} icon={CheckCircle} iconCls="kpi-icon-green"
            sub={`/ ${summary.totalShops || 0} tổng shop`} />
          <KpiCard label="Tổng đơn toàn hệ thống" value={formatNumber(summary.totalOrders)} icon={Package} iconCls="kpi-icon-cyan"
            sub="Tất cả trạng thái" />
          <KpiCard label="COD chờ thu" value={formatCurrency(summary.codPending)} icon={ShoppingBag} iconCls="kpi-icon-yellow"
            sub="Không tính đơn hoàn/hủy" />
          <KpiCard label="COD đã thu" value={formatCurrency(summary.codCollected)} icon={CheckCircle} iconCls="kpi-icon-green"
            sub="collected + reconciled" />
          <KpiCard label="Tổng cước phí vận chuyển" value={formatCurrency(summary.shippingFeeTotal)} icon={Truck} iconCls="kpi-icon-purple"
            sub="Không tính đơn hủy/giao lỗi" />
          <KpiCard label="Đơn hoàn/hủy" value={formatNumber(summary.returnedCancelledCount)} icon={XCircle} iconCls="kpi-icon-red"
            sub="returned + cancelled + failed" />
          <KpiCard label="Tỉ lệ giao thành công"
            value={summary.deliveryRate !== undefined ? `${summary.deliveryRate}%` : '—'}
            icon={BarChart3}
            iconCls={summary.deliveryRate >= 80 ? 'kpi-icon-green' : 'kpi-icon-yellow'}
            sub={`${formatNumber(summary.deliveredCount)} đơn delivered`} />
        </div>
      )}

      {/* ─── Charts row ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(280px, 0.8fr)', gap: 16, marginBottom: 20 }}>

        {/* Order by status */}
        <div className="card">
          <div style={{ marginBottom: 16 }}>
            <div className="card-title">Đơn hàng theo trạng thái</div>
            <div className="card-subtitle">Phân bổ toàn hệ thống theo trạng thái vận hành</div>
          </div>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ marginBottom: 12 }}>
                <div className="skeleton" style={{ height: 14, width: '80%', marginBottom: 6 }} />
                <div className="skeleton" style={{ height: 8, borderRadius: 4 }} />
              </div>
            ))
          ) : statusEntries.length === 0 ? (
            <div className="empty-state" style={{ padding: '24px' }}>
              <div className="empty-state-icon" style={{ width: 44, height: 44 }}><Package size={20} /></div>
              <p style={{ fontSize: 13 }}>Chưa có đơn hàng để thống kê</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {statusEntries.map(([status, count]) => {
                const pct = summary.totalOrders ? Math.round((count / summary.totalOrders) * 100) : 0;
                const barColor = STATUS_BAR_COLORS[status] || '#94a3b8';
                return (
                  <div key={status}>
                    <div className="flex-between" style={{ marginBottom: 5 }}>
                      <span className={`badge ${getStatusColor(status)}`} style={{ fontSize: '10.5px' }}>
                        {getStatusLabel(status)}
                      </span>
                      <span style={{ fontSize: 12.5, fontWeight: 700 }}>
                        {formatNumber(count)} đơn
                        <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: 6 }}>({pct}%)</span>
                      </span>
                    </div>
                    <div className="progress-bar-wrapper" style={{ height: 7 }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: barColor, borderRadius: 3, transition: 'width 0.8s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Carrier breakdown */}
        <div className="card">
          <div style={{ marginBottom: 16 }}>
            <div className="card-title">Đơn theo carrier</div>
            <div className="card-subtitle">Tỷ trọng theo đơn vị vận chuyển</div>
          </div>
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 52, borderRadius: 8, marginBottom: 10 }} />
            ))
          ) : carrierEntries.length === 0 ? (
            <div className="empty-state" style={{ padding: '24px' }}>
              <div className="empty-state-icon" style={{ width: 44, height: 44 }}><Truck size={20} /></div>
              <p style={{ fontSize: 13 }}>Chưa có đơn đẩy carrier</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {carrierEntries.map(([carrier, count]) => {
                const total = carrierEntries.reduce((s, [, c]) => s + c, 0);
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={carrier} style={{ padding: '11px 13px', border: '1px solid var(--border)', borderRadius: 8 }}>
                    <div className="flex-between" style={{ marginBottom: 6 }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 13, fontFamily: 'monospace', color: 'var(--primary)' }}>{carrier}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{CARRIER_NAMES[carrier] || carrier}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 800, fontSize: 13 }}>{formatNumber(count)}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{pct}%</div>
                      </div>
                    </div>
                    <div className="progress-bar-wrapper" style={{ height: 5 }}>
                      <div className="progress-bar progress-blue" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ─── Shop activity + Recent orders (2-col) ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.3fr) minmax(280px, 0.7fr)', gap: 16, marginBottom: 20 }}>

        {/* Top shops table */}
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="card-title" style={{ marginBottom: 2 }}>Shop hoạt động nổi bật</div>
              <div className="card-subtitle" style={{ marginBottom: 0 }}>
                Xếp hạng theo số đơn hàng phát sinh
              </div>
            </div>
            <Link href="/admin/shops" className="btn btn-secondary btn-sm">
              Xem tất cả <ArrowRight size={12} />
            </Link>
          </div>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Mã shop</th>
                  <th>Tên shop</th>
                  <th>Chủ shop</th>
                  <th style={{ textAlign: 'right' }}>Số đơn</th>
                  <th style={{ textAlign: 'right' }}>COD đã thu</th>
                  <th style={{ textAlign: 'right' }}>Cước phí</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 7 }).map((__, j) => (
                        <td key={j}><div className="skeleton" style={{ height: 16, borderRadius: 4 }} /></td>
                      ))}
                    </tr>
                  ))
                ) : topShops.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
                      Chưa có shop nào trong hệ thống.
                    </td>
                  </tr>
                ) : topShops.map((shop, idx) => (
                  <tr key={shop.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {idx < 3 && (
                          <span style={{
                            width: 18, height: 18, borderRadius: '50%', display: 'inline-flex',
                            alignItems: 'center', justifyContent: 'center',
                            background: idx === 0 ? '#f59e0b' : idx === 1 ? '#94a3b8' : '#b45309',
                            color: 'white', fontSize: 9, fontWeight: 800, flexShrink: 0,
                          }}>{idx + 1}</span>
                        )}
                        <span style={{ fontFamily: 'monospace', color: 'var(--primary)', fontWeight: 800 }}>{shop.code}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700 }}>{shop.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {shop.carriers?.length ? shop.carriers.join(', ') : 'Chưa dùng carrier'}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{shop.ownerName}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{shop.email}</div>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 800 }}>{formatNumber(shop.ordersCount)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--success)' }}>{formatCurrency(shop.codTotal)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatCurrency(shop.shippingFeeTotal)}</td>
                    <td>
                      <span className={`badge ${shop.status === 'active' ? 'status-delivered' : 'status-cancelled'}`}>
                        {shop.status === 'active' ? 'Hoạt động' : 'Tạm khóa'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent orders feed */}
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <div className="card-title" style={{ marginBottom: 2 }}>Đơn mới gần đây</div>
            <div className="card-subtitle" style={{ marginBottom: 0 }}>10 đơn hàng mới nhất toàn hệ thống</div>
          </div>
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-light)' }}>
                  <div className="skeleton" style={{ height: 14, width: '60%', marginBottom: 6 }} />
                  <div className="skeleton" style={{ height: 11, width: '80%' }} />
                </div>
              ))
            ) : recentOrders.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                Chưa có đơn hàng nào.
              </div>
            ) : recentOrders.map((order) => (
              <div key={order.id} style={{ padding: '11px 16px', borderBottom: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 3 }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 800, color: 'var(--primary)' }}>
                    {order.code}
                  </span>
                  <span className={`badge ${getStatusColor(order.status)}`} style={{ fontSize: '10px' }}>
                    {getStatusLabel(order.status)}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 2 }}>
                  {order.shippingName || '—'} · <span style={{ color: 'var(--primary)' }}>{order.shopCode}</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatDate(order.createdAt)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── COD by shop section ─── */}
      {!loading && shops.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-title">COD theo shop</div>
          <div className="card-subtitle">Tổng hợp tiền thu hộ và tiền chờ thu của từng shop</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12, marginTop: 14 }}>
            {shops.slice(0, 8).map((shop) => {
              const totalCod = shop.codTotal + shop.codPendingTotal;
              const collectedPct = totalCod > 0 ? Math.round((shop.codTotal / totalCod) * 100) : 0;
              return (
                <div key={shop.id} style={{ padding: '13px 15px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg-input)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 13, color: 'var(--primary)' }}>{shop.code}</div>
                    <span className={`badge ${shop.status === 'active' ? 'status-delivered' : 'status-cancelled'}`} style={{ fontSize: '10px' }}>
                      {shop.status === 'active' ? 'Active' : 'Tạm khóa'}
                    </span>
                  </div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 2 }}>{shop.name}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 10 }}>{shop.ordersCount} đơn</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12 }}>
                    <div className="flex-between">
                      <span style={{ color: 'var(--text-muted)' }}>Đã thu</span>
                      <strong style={{ color: 'var(--success)' }}>{formatCurrency(shop.codTotal)}</strong>
                    </div>
                    <div className="flex-between">
                      <span style={{ color: 'var(--text-muted)' }}>Chờ thu</span>
                      <strong style={{ color: '#d97706' }}>{formatCurrency(shop.codPendingTotal)}</strong>
                    </div>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <div className="progress-bar-wrapper" style={{ height: 5 }}>
                      <div className="progress-bar progress-green" style={{ width: `${collectedPct}%` }} />
                    </div>
                    <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 3, textAlign: 'right' }}>
                      Thu được {collectedPct}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

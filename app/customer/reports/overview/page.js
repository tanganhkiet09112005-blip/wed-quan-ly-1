'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle, BarChart2, Package, RefreshCw,
  ShoppingCart, TrendingDown, TrendingUp, Truck,
} from 'lucide-react';

const fmt = (v) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(v || 0);
const fmtN = (v) => new Intl.NumberFormat('vi-VN').format(v || 0);

const CHANNEL_LABEL = { direct: 'Web', fanpage: 'Fanpage', livestream: 'Livestream', pos: 'Quầy (POS)', ecommerce: 'Sàn TMĐT' };
const STATUS_COLORS = {
  delivered: '#16a34a', shipping: '#2563eb', pushed_to_carrier: '#0891b2',
  pending: '#d97706', ready_to_ship: '#7c3aed', returned: '#dc2626',
  cancelled: '#94a3b8', draft: '#cbd5e1', failed: '#ef4444', partial_delivered: '#0d9488',
};

const PERIOD_OPTIONS = [
  { label: '7 ngày', days: 7 },
  { label: '30 ngày', days: 30 },
  { label: '90 ngày', days: 90 },
];

export default function ReportsOverviewPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState(30);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const dateFrom = new Date(Date.now() - period * 86400000).toISOString().slice(0, 10);
      const res = await fetch(`/api/reports/overview?dateFrom=${dateFrom}`);
      const json = await res.json();
      if (json.success) setData(json.data);
      else setError(json.error || 'Không thể tải báo cáo.');
    } catch {
      setError('Không thể kết nối máy chủ.');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { const t = setTimeout(load, 0); return () => clearTimeout(t); }, [load]);

  const kpis = data?.kpis || {};
  const byStatus = data?.byStatus || {};
  const byChannel = data?.byChannel || {};
  const byCarrier = data?.byCarrier || {};
  const totalOrders = Object.values(byStatus).reduce((s, v) => s + v, 0);

  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <div className="page-title">Báo cáo tổng quan</div>
          <div className="page-subtitle">Thống kê đơn hàng, doanh thu, COD và kênh bán hàng theo thời gian</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {PERIOD_OPTIONS.map(({ label, days }) => (
            <button key={days} type="button"
              className={`btn ${period === days ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              onClick={() => setPeriod(days)}>{label}</button>
          ))}
          <button type="button" className="btn btn-secondary btn-sm" onClick={load} disabled={loading}>
            <RefreshCw size={13} style={{ animation: loading ? 'spin 0.8s linear infinite' : 'none' }} />
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger mb-16" style={{ gap: 8 }}>
          <AlertCircle size={14} style={{ flexShrink: 0 }} /><span>{error}</span>
          <button type="button" className="btn btn-secondary btn-sm" onClick={load} style={{ marginLeft: 'auto' }}>Thử lại</button>
        </div>
      )}

      {/* KPI */}
      <div className="grid-kpi" style={{ marginBottom: 20 }}>
        {[
          { label: 'Tổng đơn hàng', value: loading ? '...' : fmtN(kpis.totalOrders), icon: Package, cls: 'kpi-icon-blue' },
          { label: 'Đơn giao thành công', value: loading ? '...' : fmtN(kpis.deliveredOrders), icon: TrendingUp, cls: 'kpi-icon-green' },
          { label: 'Đơn hoàn/hủy', value: loading ? '...' : fmtN(kpis.returnedOrders), icon: TrendingDown, cls: 'kpi-icon-red' },
          { label: 'Tổng COD đã thu', value: loading ? '...' : fmt(kpis.codCollected), icon: BarChart2, cls: 'kpi-icon-purple' },
          { label: 'Tổng cước phí', value: loading ? '...' : fmt(kpis.shippingFeeTotal), icon: Truck, cls: 'kpi-icon-cyan' },
          { label: 'Tỉ lệ giao thành công', value: loading ? '...' : (kpis.deliveryRate !== undefined ? `${kpis.deliveryRate}%` : '—'), icon: BarChart2, cls: kpis.deliveryRate >= 80 ? 'kpi-icon-green' : 'kpi-icon-yellow' },
        ].map(({ label, value, icon: Icon, cls }) => (
          <div key={label} className="kpi-card">
            <div className={`kpi-icon ${cls}`}><Icon size={18} /></div>
            <div className="kpi-content">
              <div className="kpi-value" style={{ fontSize: 18 }}>{value}</div>
              <div className="kpi-label">{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 16, marginBottom: 16 }}>
        {/* By status */}
        <div className="card">
          <div className="card-title" style={{ marginBottom: 14 }}>Đơn hàng theo trạng thái</div>
          {loading ? Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div className="skeleton" style={{ height: 13, width: '70%', marginBottom: 5 }} />
              <div className="skeleton" style={{ height: 7, borderRadius: 4 }} />
            </div>
          )) : Object.keys(byStatus).length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '16px 0', textAlign: 'center' }}>Chưa có đơn hàng trong kỳ này</div>
          ) : Object.entries(byStatus).sort((a, b) => b[1] - a[1]).map(([status, count]) => {
            const pct = totalOrders > 0 ? Math.round((count / totalOrders) * 100) : 0;
            return (
              <div key={status} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 13 }}>
                  <span style={{ fontWeight: 600 }}>{status}</span>
                  <span style={{ fontWeight: 700 }}>{fmtN(count)} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({pct}%)</span></span>
                </div>
                <div className="progress-bar-wrapper" style={{ height: 7 }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: STATUS_COLORS[status] || '#94a3b8', borderRadius: 3, transition: 'width 0.8s ease' }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* By channel */}
        <div className="card">
          <div className="card-title" style={{ marginBottom: 14 }}>Đơn theo kênh bán hàng</div>
          {loading ? Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 48, borderRadius: 8, marginBottom: 10 }} />
          )) : Object.keys(byChannel).length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '16px 0' }}>Chưa có dữ liệu</div>
          ) : Object.entries(byChannel).sort((a, b) => b[1] - a[1]).map(([channel, count]) => {
            const total = Object.values(byChannel).reduce((s, v) => s + v, 0);
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div key={channel} style={{ padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 8, marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontWeight: 700, fontSize: 13 }}>{CHANNEL_LABEL[channel] || channel}</span>
                  <span style={{ fontWeight: 800, fontSize: 13 }}>{fmtN(count)} <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: 12 }}>({pct}%)</span></span>
                </div>
                <div className="progress-bar-wrapper" style={{ height: 5 }}>
                  <div className="progress-bar progress-blue" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick links */}
      <div className="card">
        <div className="card-title" style={{ marginBottom: 14 }}>Báo cáo chi tiết</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12 }}>
          {[
            { href: '/customer/reports/cod', label: 'Báo cáo COD', icon: BarChart2, desc: 'Thu hộ, carrier, đối soát' },
            { href: '/customer/orders/manage', label: 'Quản lý đơn hàng', icon: Package, desc: 'Filter, tìm kiếm, xuất CSV' },
            { href: '/customer/accounting/invoices', label: 'Hóa đơn điện tử', icon: ShoppingCart, desc: 'Danh sách hóa đơn' },
          ].map(({ href, label, icon: Icon, desc }) => (
            <Link key={href} href={href} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '13px 15px',
              border: '1px solid var(--border)', borderRadius: 10, textDecoration: 'none',
              color: 'var(--text-primary)', background: 'var(--bg-input)', transition: 'all 0.15s',
            }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={17} color="var(--primary)" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{label}</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

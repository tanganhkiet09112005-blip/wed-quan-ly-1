'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowUpRight,
  Ban,
  CheckCircle,
  Clock,
  Download,
  Eye,
  RefreshCw,
  Search,
  Truck,
  X,
} from 'lucide-react';
import {
  getCodStatusColor,
  getCodStatusLabel,
  getStatusColor,
  getStatusLabel,
} from '@/lib/order-constants';

/* ─── Formatters ─────────────────────────────── */
const formatCurrency = (v) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(v || 0);

const formatDate = (v) =>
  v ? new Date(v).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

const formatDateTime = (v) =>
  v ? new Date(v).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

/* ─── Date range presets ─────────────────────── */
function getDatePreset(days) {
  if (!days) return { dateFrom: '', dateTo: '' };
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days + 1);
  const fmt = (d) => d.toISOString().split('T')[0];
  return { dateFrom: fmt(from), dateTo: fmt(to) };
}

const DATE_PRESETS = [
  { label: '7 ngày', days: 7 },
  { label: '15 ngày', days: 15 },
  { label: '30 ngày', days: 30 },
  { label: 'Tất cả', days: 0 },
];

const CARRIER_OPTIONS = ['GHN', 'GHTK', 'JT', 'SPX'];
const COD_STATUS_OPTIONS = ['pending', 'collecting', 'collected', 'reconciled', 'returned', 'cancelled'];
const ORDER_STATUS_OPTIONS = ['draft', 'pending', 'ready_to_ship', 'pushed_to_carrier', 'shipping', 'delivered', 'partial_delivered', 'returned', 'failed', 'cancelled'];

const COD_STATUS_VI = {
  pending: 'Chờ thu', collecting: 'Đang thu', collected: 'Đã thu',
  reconciled: 'Đã đối soát', returned: 'Hoàn COD', cancelled: 'Đã hủy',
};
const ORDER_STATUS_VI = {
  draft: 'Nháp', pending: 'Chờ xử lý', ready_to_ship: 'Sẵn sàng giao',
  pushed_to_carrier: 'Đã đẩy ĐVVC', shipping: 'Đang giao', delivered: 'Đã giao',
  partial_delivered: 'Giao một phần', returned: 'Hoàn hàng', failed: 'Giao thất bại', cancelled: 'Đã hủy',
};

/* ─── KPI Card ───────────────────────────────── */
function KpiCard({ label, value, icon: Icon, iconCls, trend }) {
  return (
    <div className="kpi-card">
      <div className={`kpi-icon ${iconCls}`}>
        <Icon size={20} />
      </div>
      <div className="kpi-content">
        <div className="kpi-value" style={{ fontSize: 18 }}>{typeof value === 'number' ? formatCurrency(value) : value}</div>
        <div className="kpi-label">{label}</div>
        {trend && <div className={`kpi-trend ${trend.dir}`}>{trend.text}</div>}
      </div>
    </div>
  );
}

/* ─── Carrier summary card ───────────────────── */
function CarrierCard({ item, onFilter }) {
  const total = item.codCollected + item.codCollecting + item.codPending + item.codReturned;
  const collectedPct = total > 0 ? Math.round(((item.codCollected) / total) * 100) : 0;

  return (
    <div
      className="card"
      style={{ padding: 18, cursor: onFilter ? 'pointer' : 'default', transition: 'var(--transition-slow)' }}
      onClick={onFilter}
      role={onFilter ? 'button' : undefined}
      tabIndex={onFilter ? 0 : undefined}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ fontWeight: 900, fontSize: 17, color: 'var(--primary)', fontFamily: 'monospace' }}>
            {item.carrier}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
            {item.orderCount} đơn · Giao thành công: {item.deliveryRate}%
          </div>
        </div>
        {onFilter && <ArrowUpRight size={14} color="var(--text-muted)" />}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 7, fontSize: 12.5 }}>
        <div className="flex-between">
          <span style={{ color: 'var(--text-muted)' }}>COD đã thu</span>
          <strong style={{ color: 'var(--success)' }}>{formatCurrency(item.codCollected)}</strong>
        </div>
        <div className="flex-between">
          <span style={{ color: 'var(--text-muted)' }}>Đang thu / Chờ thu</span>
          <strong style={{ color: '#d97706' }}>{formatCurrency(item.codCollecting + item.codPending)}</strong>
        </div>
        <div className="flex-between">
          <span style={{ color: 'var(--text-muted)' }}>Hoàn / Hủy COD</span>
          <strong style={{ color: 'var(--danger)' }}>{formatCurrency(item.codReturned)}</strong>
        </div>
        <div className="flex-between">
          <span style={{ color: 'var(--text-muted)' }}>Phí ship</span>
          <strong>{formatCurrency(item.totalShippingFee)}</strong>
        </div>
      </div>

      {/* Collection rate bar */}
      <div style={{ marginTop: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
          <span style={{ color: 'var(--text-muted)' }}>Tỉ lệ thu COD</span>
          <span style={{ fontWeight: 700, color: collectedPct >= 70 ? 'var(--success)' : '#d97706' }}>
            {collectedPct}%
          </span>
        </div>
        <div className="progress-bar-wrapper">
          <div
            className={`progress-bar ${collectedPct >= 70 ? 'progress-green' : 'progress-yellow'}`}
            style={{ width: `${collectedPct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

/* ─── Main component ─────────────────────────── */
export default function CODReportPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [activePreset, setActivePreset] = useState(0); // index into DATE_PRESETS (0 = all)
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Filters (client-side on the orders array from API)
  const [search, setSearch] = useState('');
  const [carrierFilter, setCarrierFilter] = useState('all');
  const [codStatusFilter, setCodStatusFilter] = useState('all');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');

  /* ── Fetch data ── */
  const fetchData = useCallback(async (from = '', to = '') => {
    setLoading(true);
    setLoadError('');
    try {
      const params = new URLSearchParams();
      if (from) params.set('dateFrom', from);
      if (to) params.set('dateTo', to);
      const res = await fetch(`/api/reports/cod?${params}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setLoadError(json.error || 'Không thể tải báo cáo COD.');
      }
    } catch {
      setLoadError('Không thể kết nối máy chủ. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchData(dateFrom, dateTo), 0);
    return () => clearTimeout(t);
  }, [fetchData, dateFrom, dateTo]);

  /* ── Date preset handler ── */
  const applyPreset = (idx) => {
    setActivePreset(idx);
    const preset = DATE_PRESETS[idx];
    const range = getDatePreset(preset.days);
    setDateFrom(range.dateFrom);
    setDateTo(range.dateTo);
    setSearch('');
    setCarrierFilter('all');
    setCodStatusFilter('all');
    setOrderStatusFilter('all');
  };

  /* ── Client-side filtered orders ── */
  const filteredOrders = useMemo(() => {
    if (!data?.orders) return [];
    return data.orders.filter((order) => {
      if (carrierFilter !== 'all' && order.shipperCode !== carrierFilter) return false;
      if (codStatusFilter !== 'all' && order.codStatus !== codStatusFilter) return false;
      if (orderStatusFilter !== 'all' && order.status !== orderStatusFilter) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        return (
          order.code?.toLowerCase().includes(q) ||
          order.shippingName?.toLowerCase().includes(q) ||
          order.shippingPhone?.includes(q) ||
          order.trackingCode?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [data, search, carrierFilter, codStatusFilter, orderStatusFilter]);

  const resetFilters = () => {
    setSearch('');
    setCarrierFilter('all');
    setCodStatusFilter('all');
    setOrderStatusFilter('all');
  };

  /* ── CSV Export (simple, no library needed) ── */
  const handleExport = () => {
    if (!filteredOrders.length) return;
    const headers = 'Mã đơn,Khách hàng,SĐT,Carrier,Tracking,COD Amount,Phí Ship,Trạng thái đơn,Trạng thái COD,Ngày tạo,Ngày thu COD\n';
    const rows = filteredOrders.map((o) =>
      [
        o.code, o.shippingName, o.shippingPhone,
        o.shipperCode || '', o.trackingCode || '',
        o.codAmount, o.shippingFee,
        ORDER_STATUS_VI[o.status] || o.status,
        COD_STATUS_VI[o.codStatus] || o.codStatus,
        formatDate(o.createdAt),
        formatDate(o.codCollectedAt),
      ].join(',')
    ).join('\n');
    const csvContent = `data:text/csv;charset=utf-8,\uFEFF${encodeURIComponent(headers + rows)}`;
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `COD_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const summary = data?.summary;
  const byCarrier = data?.byCarrier || [];

  /* ─── Render ─── */
  return (
    <div className="page-container">

      {/* ─── Header ─── */}
      <div className="page-header" style={{ marginBottom: 18 }}>
        <div>
          <div className="page-title">Quản lý COD</div>
          <div className="page-subtitle">
            Theo dõi tiền thu hộ, phí vận chuyển và trạng thái đối soát theo từng đơn vị vận chuyển
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary"
            type="button"
            onClick={() => fetchData(dateFrom, dateTo)}
            disabled={loading}
          >
            <RefreshCw size={14} style={{ animation: loading ? 'spin 0.8s linear infinite' : 'none' }} />
            Tải lại
          </button>
          <button
            className="btn btn-secondary"
            type="button"
            onClick={handleExport}
            disabled={!filteredOrders.length}
            title={filteredOrders.length ? 'Xuất CSV' : 'Chưa có dữ liệu để xuất'}
          >
            <Download size={14} /> Xuất CSV
          </button>
        </div>
      </div>

      {/* ─── Date preset tabs ─── */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {DATE_PRESETS.map((preset, idx) => (
          <button
            key={preset.label}
            type="button"
            className={`status-pill ${activePreset === idx ? 'active' : ''}`}
            onClick={() => applyPreset(idx)}
          >
            {preset.label}
          </button>
        ))}
        <div style={{ display: 'flex', gap: 6, marginLeft: 'auto', flexWrap: 'wrap' }}>
          <input
            className="form-control"
            type="date"
            value={dateFrom}
            style={{ width: 150, height: 36 }}
            onChange={(e) => { setDateFrom(e.target.value); setActivePreset(-1); }}
          />
          <input
            className="form-control"
            type="date"
            value={dateTo}
            style={{ width: 150, height: 36 }}
            onChange={(e) => { setDateTo(e.target.value); setActivePreset(-1); }}
          />
        </div>
      </div>

      {/* ─── Error state ─── */}
      {loadError && !loading && (
        <div className="card mb-16">
          <div className="empty-state" style={{ padding: '24px' }}>
            <div className="empty-state-icon" style={{ background: 'var(--danger-light)', color: 'var(--danger)' }}>
              <AlertCircle size={28} />
            </div>
            <h3>Không thể tải báo cáo COD</h3>
            <p>{loadError}</p>
            <button type="button" className="btn btn-primary" onClick={() => fetchData(dateFrom, dateTo)}>
              <RefreshCw size={14} /> Thử lại
            </button>
          </div>
        </div>
      )}

      {/* ─── KPI Cards ─── */}
      {loading ? (
        <div className="grid-kpi" style={{ marginBottom: 24 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="kpi-card">
              <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 10, flexShrink: 0 }} />
              <div className="kpi-content">
                <div className="skeleton" style={{ height: 24, width: '70%', marginBottom: 6 }} />
                <div className="skeleton" style={{ height: 13, width: '90%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : summary && (
        <div className="grid-kpi" style={{ marginBottom: 24 }}>
          <KpiCard
            label="COD chờ thu"
            value={summary.codPending}
            icon={Clock}
            iconCls="kpi-icon-yellow"
          />
          <KpiCard
            label="COD đang thu"
            value={summary.codCollecting}
            icon={Truck}
            iconCls="kpi-icon-cyan"
          />
          <KpiCard
            label="COD đã thu"
            value={summary.codCollected}
            icon={CheckCircle}
            iconCls="kpi-icon-green"
          />
          <KpiCard
            label="COD đã đối soát"
            value={summary.codReconciled}
            icon={CheckCircle}
            iconCls="kpi-icon-blue"
          />
          <KpiCard
            label="Hoàn COD / Đã hủy"
            value={summary.codReturned + summary.codCancelled}
            icon={Ban}
            iconCls="kpi-icon-red"
          />
          <KpiCard
            label="Tổng phí vận chuyển"
            value={summary.totalShippingFee}
            icon={Truck}
            iconCls="kpi-icon-purple"
          />
        </div>
      )}

      {/* ─── COD by Carrier ─── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>COD theo đơn vị vận chuyển</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>
              Bấm vào card để lọc bảng chi tiết theo carrier
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid-4" style={{ gap: 14 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card" style={{ padding: 18 }}>
                <div className="skeleton" style={{ height: 20, width: '50%', marginBottom: 10 }} />
                <div className="skeleton" style={{ height: 14, width: '80%', marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 14, width: '70%', marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 14, width: '60%', marginBottom: 12 }} />
                <div className="skeleton" style={{ height: 8, borderRadius: 4 }} />
              </div>
            ))}
          </div>
        ) : byCarrier.length === 0 ? (
          <div className="card">
            <div className="empty-state" style={{ padding: '32px' }}>
              <div className="empty-state-icon"><Truck size={26} /></div>
              <h3>Chưa có dữ liệu COD theo ĐVVC</h3>
              <p>Tạo đơn và đẩy vận chuyển để xem báo cáo theo carrier</p>
            </div>
          </div>
        ) : (
          <div className="grid-4" style={{ gap: 14 }}>
            {byCarrier.map((item) => (
              <CarrierCard
                key={item.carrier}
                item={item}
                onFilter={() => {
                  setCarrierFilter(item.carrier === 'Khác' ? 'all' : item.carrier);
                  setSearch('');
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* ─── Detail Table ─── */}
      <div className="card" style={{ padding: 0 }}>
        {/* Filter bar */}
        <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14.5 }}>Chi tiết COD theo đơn hàng</div>
              {!loading && (
                <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>
                  {filteredOrders.length} / {data?.orders?.length || 0} đơn hiển thị
                </div>
              )}
            </div>
            {(search || carrierFilter !== 'all' || codStatusFilter !== 'all' || orderStatusFilter !== 'all') && (
              <button type="button" className="btn btn-secondary btn-sm" onClick={resetFilters}>
                <X size={12} /> Xóa bộ lọc
              </button>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10 }}>
            <div className="search-wrapper" style={{ maxWidth: 'none' }}>
              <Search size={15} className="search-icon" />
              <input
                className="search-input"
                placeholder="Mã đơn, SĐT, tên khách, tracking..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select className="form-control" value={carrierFilter} onChange={(e) => setCarrierFilter(e.target.value)}>
              <option value="all">Tất cả ĐVVC</option>
              {CARRIER_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="form-control" value={codStatusFilter} onChange={(e) => setCodStatusFilter(e.target.value)}>
              <option value="all">Tất cả trạng thái COD</option>
              {COD_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{COD_STATUS_VI[s]}</option>)}
            </select>
            <select className="form-control" value={orderStatusFilter} onChange={(e) => setOrderStatusFilter(e.target.value)}>
              <option value="all">Tất cả trạng thái đơn</option>
              {ORDER_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{ORDER_STATUS_VI[s]}</option>)}
            </select>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Khách hàng</th>
                <th>SĐT</th>
                <th>Carrier</th>
                <th>Tracking</th>
                <th style={{ textAlign: 'right' }}>COD</th>
                <th style={{ textAlign: 'right' }}>Phí ship</th>
                <th style={{ textAlign: 'center' }}>Trạng thái đơn</th>
                <th style={{ textAlign: 'center' }}>Trạng thái COD</th>
                <th>Ngày tạo</th>
                <th>Ngày thu COD</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 12 }).map((__, j) => (
                      <td key={j}><div className="skeleton" style={{ height: 16, borderRadius: 4 }} /></td>
                    ))}
                  </tr>
                ))
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={12} style={{ padding: 0 }}>
                    <div className="empty-state" style={{ padding: '44px 20px' }}>
                      <div className="empty-state-icon">
                        <Search size={26} />
                      </div>
                      <h3>Chưa có dữ liệu COD phù hợp</h3>
                      <p style={{ maxWidth: 300, margin: '0 auto 12px' }}>
                        {data?.orders?.length === 0
                          ? 'Chưa có đơn hàng nào có COD trong khoảng thời gian này.'
                          : 'Không tìm thấy đơn hàng nào khớp với bộ lọc hiện tại.'}
                      </p>
                      {(search || carrierFilter !== 'all' || codStatusFilter !== 'all' || orderStatusFilter !== 'all') && (
                        <button type="button" className="btn btn-secondary btn-sm" onClick={resetFilters}>
                          <RefreshCw size={12} /> Xóa bộ lọc
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id}>
                    {/* Order code */}
                    <td>
                      <Link
                        href={`/customer/orders/${order.id}`}
                        style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--primary)', fontSize: 13 }}
                      >
                        {order.code}
                      </Link>
                    </td>

                    {/* Customer name */}
                    <td style={{ fontWeight: 600, fontSize: 13 }}>{order.shippingName || '—'}</td>

                    {/* Phone */}
                    <td style={{ fontFamily: 'monospace', fontSize: 12.5, color: 'var(--text-secondary)' }}>
                      {order.shippingPhone || '—'}
                    </td>

                    {/* Carrier */}
                    <td>
                      {order.shipperCode ? (
                        <span className="badge mode-mock" style={{ textTransform: 'uppercase', fontSize: 10.5 }}>
                          {order.carrierName || order.shipperCode}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>

                    {/* Tracking code */}
                    <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-secondary)' }}>
                      {order.trackingCode || '—'}
                    </td>

                    {/* COD amount */}
                    <td style={{ textAlign: 'right', fontWeight: 800, fontSize: 13 }}>
                      {formatCurrency(order.codAmount)}
                    </td>

                    {/* Shipping fee */}
                    <td style={{ textAlign: 'right', fontSize: 12.5, color: 'var(--text-secondary)' }}>
                      {order.shippingFee ? formatCurrency(order.shippingFee) : '—'}
                    </td>

                    {/* Order status badge */}
                    <td style={{ textAlign: 'center' }}>
                      <span className={`badge ${getStatusColor(order.status)}`} style={{ fontSize: '10.5px' }}>
                        {ORDER_STATUS_VI[order.status] || getStatusLabel(order.status)}
                      </span>
                    </td>

                    {/* COD status badge */}
                    <td style={{ textAlign: 'center' }}>
                      <span className={`badge ${getCodStatusColor(order.codStatus)}`} style={{ fontSize: '10.5px' }}>
                        {COD_STATUS_VI[order.codStatus] || getCodStatusLabel(order.codStatus)}
                      </span>
                    </td>

                    {/* Created date */}
                    <td style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {formatDate(order.createdAt)}
                    </td>

                    {/* COD collected date */}
                    <td style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {order.codCollectedAt ? formatDateTime(order.codCollectedAt) : '—'}
                    </td>

                    {/* Action */}
                    <td>
                      <Link
                        href={`/customer/orders/${order.id}`}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '4px 8px', fontSize: '11.5px', height: '28px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        <Eye size={12} /> Xem đơn
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination summary footer */}
        {!loading && filteredOrders.length > 0 && (
          <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border)', fontSize: 12.5, color: 'var(--text-muted)' }}>
            Tổng COD lọc được: <strong style={{ color: 'var(--text-primary)' }}>
              {formatCurrency(filteredOrders.reduce((s, o) => s + Number(o.codAmount || 0), 0))}
            </strong>
            {' '}· Tổng phí ship: <strong style={{ color: 'var(--text-primary)' }}>
              {formatCurrency(filteredOrders.reduce((s, o) => s + Number(o.shippingFee || 0), 0))}
            </strong>
          </div>
        )}
      </div>

      {/* ─── COD Rules note ─── */}
      <div className="card" style={{ marginTop: 16, padding: '14px 18px', background: 'var(--bg-input)', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <AlertCircle size={14} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            <strong>Quy tắc tính COD:</strong>{' '}
            KPI tính theo <code style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: 4 }}>codStatus</code> (nguồn dữ liệu chính xác nhất).
            Đơn <em>delivered → collected</em>, <em>returned/failed → returned</em>, <em>cancelled → cancelled</em>.
            COD đơn hoàn/hủy/giao thất bại <strong>không</strong> được tính vào COD đã thu.
            Tỉ lệ thu COD = COD collected / (tổng COD có vận đơn).
          </div>
        </div>
      </div>

    </div>
  );
}

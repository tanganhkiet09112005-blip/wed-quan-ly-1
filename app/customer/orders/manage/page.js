'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Ban, 
  CheckCircle, 
  Eye, 
  RefreshCw, 
  Truck, 
  Copy, 
  Search, 
  X, 
  AlertCircle, 
  PlusCircle, 
  Filter 
} from 'lucide-react';
import { useShopOrders } from '@/lib/use-shop-orders';
import {
  COD_STATUSES,
  ORDER_STATUSES,
  getCodStatusColor,
  getCodStatusLabel,
  getOrderSourceLabel,
  getStatusColor,
  getStatusLabel,
} from '@/lib/order-constants';

const formatCurrency = (value) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value || 0);

const formatDate = (value) => value
  ? new Date(value).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  : '—';

const ALL_STATUSES = ['all', ...ORDER_STATUSES];
const ALL_COD_STATUSES = ['all', ...COD_STATUSES];
const MOCK_EVENT_STATUSES = ['shipping', 'delivered', 'partial_delivered', 'returned', 'failed', 'cancelled'];
const CARRIER_OPTIONS = ['GHN', 'GHTK', 'JT', 'SPX'];

const CHANNEL_LABELS = {
  all: 'Tất cả kênh',
  direct: 'Tạo trực tiếp',
  fanpage: 'Fanpage',
  livestream: 'Livestream',
};

// Override status labels for UPOS operational UI requirement
const CUSTOM_ORDER_STATUS_LABELS = {
  all: 'Tất cả đơn',
  draft: 'Nháp',
  pending: 'Chờ xử lý',
  ready_to_ship: 'Sẵn sàng giao',
  pushed_to_carrier: 'Đã đẩy ĐVVC',
  shipping: 'Đang giao',
  delivered: 'Đã giao',
  partial_delivered: 'Giao một phần',
  returned: 'Hoàn hàng',
  failed: 'Giao thất bại',
  cancelled: 'Đã hủy',
};

const CUSTOM_COD_STATUS_LABELS = {
  all: 'Tất cả COD',
  pending: 'Chờ thu',
  collecting: 'Đang thu',
  collected: 'Đã thu',
  reconciled: 'Đã đối soát',
  returned: 'Hoàn COD',
  cancelled: 'Đã hủy',
};

export default function ManageOrdersPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [codFilter, setCodFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');
  const [carrierFilter, setCarrierFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [updatingId, setUpdatingId] = useState('');
  const [copiedId, setCopiedId] = useState('');
  const [mockEventByOrder, setMockEventByOrder] = useState({});
  const [mockCarrierByOrder, setMockCarrierByOrder] = useState({});
  const [message, setMessage] = useState('');
  const [errorState, setErrorState] = useState(false);

  const { orders, loading, refetch, meta } = useShopOrders({
    status: statusFilter === 'all' ? '' : statusFilter,
    codStatus: codFilter === 'all' ? '' : codFilter,
    channel: channelFilter === 'all' ? '' : channelFilter,
    carrierCode: carrierFilter === 'all' ? '' : carrierFilter,
    search: search.trim(),
    dateFrom,
    dateTo,
    page,
    limit: 15,
  });

  const byStatus = meta.facets?.byStatus || {};
  const allCount = Object.values(byStatus).reduce((sum, count) => sum + count, 0) || meta.total || orders.length;
  const statusCounts = { all: allCount, ...byStatus };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setCodFilter('all');
    setCarrierFilter('all');
    setChannelFilter('all');
    setDateFrom('');
    setDateTo('');
    setPage(1);
    setMessage('');
    setErrorState(false);
  };

  const handleCopyText = (text, orderId) => {
    navigator.clipboard.writeText(text);
    setCopiedId(orderId);
    setTimeout(() => setCopiedId(''), 2000);
  };

  const handleConfirmDraft = async (orderId) => {
    setUpdatingId(orderId);
    setMessage('');
    try {
      const res = await fetch(`/api/orders/${orderId}/confirm-draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'pending' }),
      });
      const json = await res.json();
      if (json.success) {
        setMessage('Đã xác nhận đơn nháp thành đơn chờ xử lý.');
        await refetch();
      } else {
        setMessage(json.error || 'Không thể xác nhận đơn nháp.');
      }
    } catch {
      setMessage('Không thể kết nối máy chủ.');
      setErrorState(true);
    } finally {
      setUpdatingId('');
    }
  };

  const handlePushCarrier = async (order) => {
    const carrierCode = mockCarrierByOrder[order.id] || order.shipperCode || 'GHN';
    setUpdatingId(order.id);
    setMessage('');
    try {
      const res = await fetch(`/api/orders/${order.id}/push-carrier`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carrierCode }),
      });
      const json = await res.json();
      if (json.success) {
        setMessage(`Đã đẩy đơn ${order.code} qua ${carrierCode} mock thành công.`);
        await refetch();
      } else {
        setMessage(json.error || 'Không thể đẩy đơn qua carrier mock.');
      }
    } catch {
      setMessage('Không thể kết nối carrier mock.');
      setErrorState(true);
    } finally {
      setUpdatingId('');
    }
  };

  const handleMockCarrierEvent = async (order) => {
    const eventStatus = mockEventByOrder[order.id] || 'shipping';
    setUpdatingId(order.id);
    setMessage('');
    try {
      const res = await fetch('/api/carriers/mock-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          carrierCode: order.shipperCode || 'GHN',
          trackingCode: order.trackingCode,
          eventStatus,
          note: `Mock ${CUSTOM_ORDER_STATUS_LABELS[eventStatus] || getStatusLabel(eventStatus)} từ trang quản lý đơn`,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setMessage(`Đã cập nhật trạng thái ${CUSTOM_ORDER_STATUS_LABELS[eventStatus] || getStatusLabel(eventStatus)} cho đơn ${order.code}.`);
        await refetch();
      } else {
        setMessage(json.error || 'Không thể cập nhật trạng thái carrier mock.');
      }
    } catch {
      setMessage('Không thể kết nối carrier mock event.');
      setErrorState(true);
    } finally {
      setUpdatingId('');
    }
  };

  const handleCancelOrder = async (order) => {
    if (!window.confirm(`Hủy đơn ${order.code}? COD sẽ chuyển sang Đã hủy và không tính đã thu.`)) return;
    setUpdatingId(order.id);
    setMessage('');
    try {
      const res = await fetch(`/api/orders/${order.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setMessage(`Đã hủy đơn ${order.code} thành công.`);
        await refetch();
      } else {
        setMessage(json.error || 'Không thể hủy đơn.');
      }
    } catch {
      setMessage('Không thể kết nối máy chủ để hủy đơn.');
      setErrorState(true);
    } finally {
      setUpdatingId('');
    }
  };

  return (
    <div className="page-container">
      {/* Header Section */}
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <div className="page-title">Quản lý đơn hàng</div>
          <div className="page-subtitle">
            Theo dõi, xử lý và cập nhật trạng thái đơn giao hàng của shop
          </div>
        </div>
        <Link href="/customer/orders/create" className="btn btn-primary">
          <PlusCircle size={16} /> Tạo đơn mới
        </Link>
      </div>

      {/* Quick Status Pills */}
      <div className="status-pills" style={{ marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
        {ALL_STATUSES.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => {
              setStatusFilter(status);
              setPage(1);
            }}
            className={`status-pill ${statusFilter === status ? 'active' : ''}`}
          >
            {CUSTOM_ORDER_STATUS_LABELS[status] || status}
            <span style={{ 
              marginLeft: 6, 
              fontSize: '11px', 
              background: statusFilter === status ? 'var(--primary)' : 'rgba(148, 163, 184, 0.15)', 
              color: statusFilter === status ? 'white' : 'var(--text-secondary)',
              padding: '1px 6px', 
              borderRadius: '10px',
              fontWeight: 700 
            }}>
              {statusCounts[status] || 0}
            </span>
          </button>
        ))}
      </div>

      {/* Filter Options Bar */}
      <div className="card mb-16" style={{ padding: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', alignItems: 'center' }}>
          
          {/* Search field */}
          <div className="search-wrapper" style={{ maxWidth: 'none' }}>
            <Search size={16} className="search-icon" />
            <input
              className="search-input"
              placeholder="Mã đơn, SĐT, tên khách..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </div>

          {/* Status Dropdown */}
          <div className="form-group">
            <select
              className="form-control"
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setPage(1);
              }}
            >
              <option value="all">Tất cả trạng thái</option>
              {ORDER_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {CUSTOM_ORDER_STATUS_LABELS[status] || getStatusLabel(status)}
                </option>
              ))}
            </select>
          </div>

          {/* COD Status Dropdown */}
          <div className="form-group">
            <select
              className="form-control"
              value={codFilter}
              onChange={(event) => {
                setCodFilter(event.target.value);
                setPage(1);
              }}
            >
              <option value="all">Tất cả trạng thái COD</option>
              {COD_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {CUSTOM_COD_STATUS_LABELS[status] || getCodStatusLabel(status)}
                </option>
              ))}
            </select>
          </div>

          {/* Carrier Dropdown */}
          <div className="form-group">
            <select
              className="form-control"
              value={carrierFilter}
              onChange={(event) => {
                setCarrierFilter(event.target.value);
                setPage(1);
              }}
            >
              <option value="all">Tất cả ĐVVC</option>
              {CARRIER_OPTIONS.map((carrier) => (
                <option key={carrier} value={carrier}>{carrier}</option>
              ))}
            </select>
          </div>

          {/* Channel Dropdown */}
          <div className="form-group">
            <select
              className="form-control"
              value={channelFilter}
              onChange={(event) => {
                setChannelFilter(event.target.value);
                setPage(1);
              }}
            >
              {Object.entries(CHANNEL_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {/* Date Range Filters */}
          <div className="form-group">
            <input
              className="form-control"
              type="date"
              value={dateFrom}
              onChange={(event) => {
                setDateFrom(event.target.value);
                setPage(1);
              }}
              title="Từ ngày tạo"
            />
          </div>

          <div className="form-group">
            <input
              className="form-control"
              type="date"
              value={dateTo}
              onChange={(event) => {
                setDateTo(event.target.value);
                setPage(1);
              }}
              title="Đến ngày tạo"
            />
          </div>

          {/* Reset Filter Button */}
          <div>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleResetFilters}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <RefreshCw size={14} /> Xóa bộ lọc
            </button>
          </div>

        </div>
      </div>

      {/* User Alerts/Notifications */}
      {message && (
        <div className="alert alert-info mb-12 animate-fade" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={16} />
            <span style={{ fontSize: '13.5px', fontWeight: 500 }}>{message}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setMessage('')} 
            style={{ color: 'inherit', opacity: 0.7, padding: '2px', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Main Table Card */}
      <div className="card" style={{ padding: 0 }}>
        {errorState ? (
          /* Error State UI */
          <div className="empty-state" style={{ padding: '60px 20px' }}>
            <div className="empty-state-icon" style={{ background: 'var(--danger-light)', color: 'var(--danger)' }}>
              <AlertCircle size={32} />
            </div>
            <h3>Không thể tải danh sách đơn, vui lòng thử lại</h3>
            <p style={{ maxWidth: '360px', margin: '0 auto 16px' }}>
              Đã xảy ra lỗi khi đồng bộ dữ liệu đơn hàng. Vui lòng kiểm tra kết nối mạng hoặc thử tải lại trang.
            </p>
            <button type="button" className="btn btn-primary" onClick={() => { setErrorState(false); refetch(); }}>
              <RefreshCw size={14} /> Tải lại ngay
            </button>
          </div>
        ) : (
          /* Scrollable table wrapper */
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '110px' }}>Mã đơn</th>
                  <th>Khách hàng</th>
                  <th>SĐT</th>
                  <th>Đơn vị vận chuyển</th>
                  <th>Tracking code</th>
                  <th style={{ textAlign: 'right' }}>COD</th>
                  <th style={{ textAlign: 'right' }}>Phí ship</th>
                  <th style={{ textAlign: 'center' }}>Trạng thái đơn</th>
                  <th style={{ textAlign: 'center' }}>Trạng thái COD</th>
                  <th>Ngày tạo</th>
                  <th style={{ width: '230px', textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  /* Shimmer Loading Skeletons */
                  Array.from({ length: 8 }).map((_, idx) => (
                    <tr key={idx}>
                      <td><div className="skeleton" style={{ height: '18px', width: '70px' }}></div></td>
                      <td><div className="skeleton" style={{ height: '18px', width: '110px' }}></div></td>
                      <td><div className="skeleton" style={{ height: '18px', width: '90px' }}></div></td>
                      <td><div className="skeleton" style={{ height: '22px', width: '60px', borderRadius: '4px' }}></div></td>
                      <td><div className="skeleton" style={{ height: '18px', width: '100px' }}></div></td>
                      <td style={{ textAlign: 'right' }}><div className="skeleton" style={{ height: '18px', width: '70px', marginLeft: 'auto' }}></div></td>
                      <td style={{ textAlign: 'right' }}><div className="skeleton" style={{ height: '18px', width: '60px', marginLeft: 'auto' }}></div></td>
                      <td><div className="skeleton" style={{ height: '22px', width: '80px', borderRadius: '4px', margin: '0 auto' }}></div></td>
                      <td><div className="skeleton" style={{ height: '22px', width: '80px', borderRadius: '4px', margin: '0 auto' }}></div></td>
                      <td><div className="skeleton" style={{ height: '18px', width: '85px' }}></div></td>
                      <td style={{ textAlign: 'right' }}><div className="skeleton" style={{ height: '26px', width: '150px', borderRadius: '4px', marginLeft: 'auto' }}></div></td>
                    </tr>
                  ))
                ) : orders.length === 0 ? (
                  /* Professional Empty State */
                  <tr>
                    <td colSpan={11} style={{ padding: 0 }}>
                      <div className="empty-state" style={{ padding: '50px 20px' }}>
                        <div className="empty-state-icon">
                          <Filter size={28} />
                        </div>
                        <h3>Chưa có đơn hàng phù hợp</h3>
                        <p style={{ maxWidth: '320px', margin: '0 auto 16px' }}>
                          Không tìm thấy đơn hàng nào khớp với điều kiện lọc hiện tại của bạn.
                        </p>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={handleResetFilters}>
                          <RefreshCw size={12} /> Xóa bộ lọc để thử lại
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => {
                    const canPushCarrier = !order.trackingCode && !['draft', 'delivered', 'returned', 'failed', 'cancelled'].includes(order.status);
                    const canMockEvent = Boolean(order.trackingCode) && !['draft', 'pending', 'ready_to_ship', 'cancelled'].includes(order.status);
                    const canCancel = !['delivered', 'cancelled', 'returned'].includes(order.status);

                    return (
                      <tr key={order.id} className="animate-fade">
                        {/* Order Code */}
                        <td>
                          <Link 
                            href={`/customer/orders/${order.id}`} 
                            className="font-bold text-primary-c" 
                            style={{ fontFamily: 'monospace', fontSize: '13.5px' }}
                          >
                            {order.code || '—'}
                          </Link>
                          {order.chatSession && (
                            <div style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 600, marginTop: 2 }}>
                              Từ chatbot
                            </div>
                          )}
                        </td>

                        {/* Customer Info */}
                        <td className="font-semibold" style={{ fontSize: '13px' }}>
                          {order.shippingName || '—'}
                        </td>

                        {/* Phone Number */}
                        <td className="mono" style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                          {order.shippingPhone || '—'}
                        </td>

                        {/* Carrier Name */}
                        <td>
                          {order.carrierName || order.shipperCode ? (
                            <span className="badge mode-mock" style={{ textTransform: 'uppercase', fontSize: '10.5px' }}>
                              {order.carrierName || order.shipperCode}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>—</span>
                          )}
                        </td>

                        {/* Tracking Code */}
                        <td>
                          {order.trackingCode ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span className="mono" style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                                {order.trackingCode}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyText(order.trackingCode, order.id)}
                                className="btn-icon"
                                title="Copy mã vận đơn"
                                style={{ 
                                  padding: '4px', 
                                  borderRadius: '4px', 
                                  cursor: 'pointer', 
                                  color: copiedId === order.id ? 'var(--success)' : 'var(--text-muted)',
                                  background: 'var(--bg-input)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                {copiedId === order.id ? <CheckCircle size={12} /> : <Copy size={12} />}
                              </button>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>—</span>
                          )}
                        </td>

                        {/* COD Amount */}
                        <td style={{ textAlign: 'right', fontWeight: '700', fontSize: '13px' }}>
                          {order.codAmount ? formatCurrency(order.codAmount) : '—'}
                        </td>

                        {/* Shipping Fee */}
                        <td style={{ textAlign: 'right', fontWeight: '500', color: 'var(--text-secondary)', fontSize: '13px' }}>
                          {order.shippingFee ? formatCurrency(order.shippingFee) : '—'}
                        </td>

                        {/* Order Status Badge */}
                        <td style={{ textAlign: 'center' }}>
                          <span className={`badge ${getStatusColor(order.status)}`} style={{ fontSize: '10.5px' }}>
                            {CUSTOM_ORDER_STATUS_LABELS[order.status] || getStatusLabel(order.status)}
                          </span>
                        </td>

                        {/* COD Status Badge */}
                        <td style={{ textAlign: 'center' }}>
                          <span className={`badge ${getCodStatusColor(order.codStatus)}`} style={{ fontSize: '10.5px' }}>
                            {CUSTOM_COD_STATUS_LABELS[order.codStatus] || getCodStatusLabel(order.codStatus)}
                          </span>
                        </td>

                        {/* Created Date */}
                        <td style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {formatDate(order.createdAt)}
                        </td>

                        {/* Action buttons */}
                        <td>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                            
                            {/* View Detail */}
                            <Link 
                              href={`/customer/orders/${order.id}`} 
                              className="btn btn-secondary btn-sm" 
                              style={{ padding: '5px 8px', fontSize: '11.5px', height: '28px', display: 'flex', alignItems: 'center' }}
                            >
                              <Eye size={12} /> Chi tiết
                            </Link>

                            {/* Confirm Draft Order */}
                            {order.status === 'draft' && (
                              <button
                                type="button"
                                disabled={updatingId === order.id}
                                onClick={() => handleConfirmDraft(order.id)}
                                className="btn btn-primary btn-sm"
                                style={{ padding: '5px 8px', fontSize: '11.5px', height: '28px' }}
                              >
                                <CheckCircle size={12} /> Xác nhận
                              </button>
                            )}

                            {/* Push Mock Carrier */}
                            {canPushCarrier && (
                              <div style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
                                <select
                                  className="form-control"
                                  style={{ height: 28, padding: '2px 4px', fontSize: 11, width: 70, background: 'var(--bg-input)' }}
                                  value={mockCarrierByOrder[order.id] || order.shipperCode || 'GHN'}
                                  onChange={(event) => setMockCarrierByOrder((prev) => ({ ...prev, [order.id]: event.target.value }))}
                                  disabled={updatingId === order.id}
                                >
                                  {CARRIER_OPTIONS.map((carrierCode) => (
                                    <option key={carrierCode} value={carrierCode}>{carrierCode}</option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  className="btn btn-primary btn-sm"
                                  onClick={() => handlePushCarrier(order)}
                                  disabled={updatingId === order.id}
                                  style={{ padding: '4px 8px', fontSize: '11.5px', height: '28px', background: 'var(--secondary)', boxShadow: 'none' }}
                                >
                                  <Truck size={12} /> Đẩy ĐVVC
                                </button>
                              </div>
                            )}

                            {/* Mock carrier updates */}
                            {canMockEvent && (
                              <div style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
                                <select
                                  className="form-control"
                                  style={{ height: 28, padding: '2px 4px', fontSize: 11, width: 105, background: 'var(--bg-input)' }}
                                  value={mockEventByOrder[order.id] || 'shipping'}
                                  onChange={(event) => setMockEventByOrder((prev) => ({ ...prev, [order.id]: event.target.value }))}
                                  disabled={updatingId === order.id}
                                >
                                  {MOCK_EVENT_STATUSES.map((nextStatus) => (
                                    <option key={nextStatus} value={nextStatus}>
                                      {CUSTOM_ORDER_STATUS_LABELS[nextStatus] || getStatusLabel(nextStatus)}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => handleMockCarrierEvent(order)}
                                  disabled={updatingId === order.id}
                                  style={{ padding: '4px 8px', fontSize: '11.5px', height: '28px' }}
                                >
                                  <RefreshCw size={12} /> Mock
                                </button>
                              </div>
                            )}

                            {/* Cancel Order */}
                            {canCancel && (
                              <button
                                type="button"
                                className="btn btn-danger btn-sm"
                                onClick={() => handleCancelOrder(order)}
                                disabled={updatingId === order.id}
                                style={{ padding: '5px 8px', fontSize: '11.5px', height: '28px', display: 'flex', alignItems: 'center' }}
                              >
                                <Ban size={12} /> Hủy đơn
                              </button>
                            )}

                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Polished Pagination Controls */}
        {!errorState && orders.length > 0 && (
          <div className="flex-between" style={{ padding: '14px 18px', borderTop: '1px solid var(--border)', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 500 }}>
              Hiển thị {orders.length} / {meta.total || 0} đơn · Trang {meta.page || page}/{meta.totalPages || 1}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button 
                type="button" 
                className="btn btn-secondary btn-sm" 
                onClick={() => setPage((current) => Math.max(current - 1, 1))} 
                disabled={loading || page <= 1}
              >
                Trước
              </button>
              <button 
                type="button" 
                className="btn btn-secondary btn-sm" 
                onClick={() => setPage((current) => Math.min(current + 1, meta.totalPages || current + 1))} 
                disabled={loading || page >= (meta.totalPages || 1)}
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

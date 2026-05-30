'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/mock-data';
import { getStatusLabel, getStatusColor, getCodStatusLabel, getCodStatusColor } from '@/lib/order-constants';
import { useAuth } from '@/lib/auth-context';

const ALL_STATUSES = ['all', 'draft', 'pending', 'ready_to_ship', 'pushed_to_carrier', 'shipping', 'delivered', 'partial_delivered', 'returned', 'failed', 'cancelled'];
const STATUS_LABELS = { all: 'Tất cả trạng thái', draft: 'Đơn nháp', pending: 'Chờ xử lý', ready_to_ship: 'Sẵn sàng giao', pushed_to_carrier: 'Gửi đơn giao hàng', shipping: 'Đang vận chuyển', delivered: 'Giao hàng thành công', partial_delivered: 'Lấy hàng thành công', returned: 'Chuyển hoàn', failed: 'Hủy giao hàng', cancelled: 'Hủy đơn hàng' };

const ALL_COD_STATUSES = ['all', 'pending', 'collecting', 'collected', 'reconciled', 'returned', 'cancelled'];
const COD_STATUS_LABELS = { all: 'Tất cả trạng thái COD', pending: 'Chưa thu', collecting: 'Đang thu', collected: 'Đã thu', reconciled: 'Đã đối soát', returned: 'Hoàn COD', cancelled: 'Hủy/Không thu' };

export default function ManageOrdersPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isSuperAdmin = isAdmin && !user?.parentAdminId;

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [codStatusFilter, setCodStatusFilter] = useState('all');
  const [carrierFilter, setCarrierFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  const [reconciliationFilter, setReconciliationFilter] = useState({ pending: false, reconciled: false });
  const [showRecDropdown, setShowRecDropdown] = useState(false);

  const [actionLoading, setActionLoading] = useState(null);
  const [selectedOrders, setSelectedOrders] = useState([]);

  const fetchOrders = () => {
    setLoading(true);
    fetch('/api/orders?limit=1000') // fetch a large batch or implement pagination
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setOrders(data.data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrders();
  }, []);

  const handleStatusUpdate = async (id, currentStatus) => {
    let nextStatus = currentStatus;
    if (currentStatus === 'pending') nextStatus = 'shipping';
    else if (currentStatus === 'shipping') nextStatus = 'delivered';
    else return;
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        setOrders(orders.map(o => o.id === id ? { ...o, status: nextStatus } : o));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleApproveFlow = async (id) => {
    if (!confirm('Duyệt luồng xử lý đơn hàng này?')) return;
    setActionLoading(id);
    try {
      const res = await fetch(`/api/orders/${id}/flow/approve`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setOrders(orders.map(o => o.id === id ? { ...o, flowStatus: 'READY_TO_PUSH' } : o));
      } else {
        alert(data.error || 'Lỗi khi duyệt đơn.');
      }
    } catch {
      alert('Lỗi kết nối.');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePushCarrier = async (id) => {
    if (!confirm('Đẩy đơn hàng qua đơn vị vận chuyển?')) return;
    setActionLoading(id);
    try {
      const res = await fetch(`/api/orders/${id}/flow/push-carrier`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert(data.message || 'Đẩy vận chuyển thành công!');
        fetchOrders();
      } else {
        alert(data.error || 'Lỗi khi đẩy vận chuyển.');
        fetchOrders();
      }
    } catch {
      alert('Lỗi kết nối.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReconcileSelected = async () => {
    if (selectedOrders.length === 0) return alert('Vui lòng chọn ít nhất 1 đơn hàng để đối soát.');
    if (!confirm(`Đánh dấu ${selectedOrders.length} đơn hàng đã đối soát?`)) return;
    
    setActionLoading('reconcile');
    try {
      const res = await fetch('/api/orders/reconcile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds: selectedOrders })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setOrders(orders.map(o => selectedOrders.includes(o.id) ? { ...o, reconciliationStatus: 'RECONCILED' } : o));
        setSelectedOrders([]);
      } else {
        alert(data.error || 'Lỗi đối soát.');
      }
    } catch {
      alert('Lỗi kết nối.');
    } finally {
      setActionLoading(null);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setCodStatusFilter('all');
    setCarrierFilter('all');
    setDateFrom('');
    setDateTo('');
    setReconciliationFilter({ pending: false, reconciled: false });
  };

  const filtered = useMemo(() => {
    return orders.filter(o => {
      const matchSearch = !search || o.code?.includes(search) || o.trackingCode?.includes(search) || o.shippingName?.toLowerCase().includes(search.toLowerCase()) || o.shippingPhone?.includes(search);
      const matchStatus = statusFilter === 'all' || o.status === statusFilter;
      const matchCodStatus = codStatusFilter === 'all' || o.codStatus === codStatusFilter;
      const matchCarrier = carrierFilter === 'all' || (o.carrierCode || o.shipperCode) === carrierFilter;
      
      let matchDate = true;
      if (dateFrom || dateTo) {
        const d = new Date(o.createdAt);
        if (dateFrom && d < new Date(dateFrom)) matchDate = false;
        if (dateTo) {
          const dt = new Date(dateTo);
          dt.setHours(23, 59, 59, 999);
          if (d > dt) matchDate = false;
        }
      }

      let matchReconciliation = true;
      const r = reconciliationFilter;
      if (r.pending !== r.reconciled) {
        const orderRec = o.reconciliationStatus || 'PENDING';
        if (r.pending && orderRec !== 'PENDING') matchReconciliation = false;
        if (r.reconciled && orderRec !== 'RECONCILED') matchReconciliation = false;
      }

      return matchSearch && matchStatus && matchCodStatus && matchCarrier && matchDate && matchReconciliation;
    });
  }, [orders, search, statusFilter, codStatusFilter, carrierFilter, dateFrom, dateTo, reconciliationFilter]);

  const summary = useMemo(() => {
    let qty = 0, goods = 0, cod = 0, fee = 0;
    filtered.forEach(o => {
      qty += 1;
      goods += o.totalValue || 0;
      cod += o.codAmount || 0;
      fee += o.shippingFee || 0;
    });
    return { qty, goods, cod, fee };
  }, [filtered]);

  const exportExcel = () => {
    const headers = ['Mã vận đơn', 'Mã đơn hàng', 'Tên cửa hàng', 'Khách hàng', 'SĐT', 'Nội dung hàng hoá', 'Đơn vị vận chuyển', 'Tiền hàng', 'Phí dịch vụ', 'Giá trị đơn hàng', 'Tiền thu hộ', 'Trạng thái đơn', 'Trạng thái COD', 'Trạng thái đối soát', 'Admin quản lý', 'Ngày tạo'];
    const rows = filtered.map(o => [
      o.trackingCode || '-',
      o.code,
      o.shop?.name || '-',
      o.shippingName,
      o.shippingPhone,
      o.goodsContent || '-',
      o.carrierName || o.shipperCode || '-',
      o.totalValue || 0,
      o.shippingFee || 0,
      o.totalValue || 0,
      o.codAmount || 0,
      getStatusLabel(o.status),
      getCodStatusLabel(o.codStatus),
      o.reconciliationStatus === 'RECONCILED' ? 'Đã đối soát' : 'Chờ đối soát',
      o.shop?.admin?.name || '-',
      new Date(o.createdAt).toLocaleString('vi-VN')
    ]);

    const csvContent = "\uFEFF" + [headers.join(',')]
      .concat(rows.map(e => e.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Danh_sach_don_hang_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const getFlowBadge = (flowStatus, flowMessage) => {
    switch (flowStatus) {
      case 'READY_TO_PUSH': return <span className="badge status-delivered" title={flowMessage}>Sẵn sàng đẩy</span>;
      case 'WAITING_APPROVAL': return <span className="badge status-pending" title={flowMessage}>Chờ duyệt</span>;
      case 'MANUAL_PROCESSING': return <span className="badge" style={{ background: '#fef3c7', color: '#b45309' }} title={flowMessage}>Xử lý thủ công</span>;
      case 'MISSING_CREDENTIALS': return <span className="badge status-cancelled" title={flowMessage}>Thiếu API</span>;
      case 'PRICING_MISSING': return <span className="badge status-cancelled" title={flowMessage}>Thiếu Bảng giá</span>;
      case 'BLOCKED': return <span className="badge" style={{ background: '#111827', color: '#f3f4f6' }} title={flowMessage}>Chặn</span>;
      case 'PUSHED_TO_CARRIER': return <span className="badge status-delivered" title={flowMessage}>Đã đẩy Vận chuyển</span>;
      case 'PUSH_FAILED': return <span className="badge status-cancelled" title={flowMessage}>Lỗi đẩy Vận chuyển</span>;
      default: return <span className="badge" style={{ background: '#f3f4f6', color: '#6b7280' }}>Chưa phân luồng</span>;
    }
  };

  if (loading) return <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}><div style={{ fontSize: 18, color: 'var(--text-muted)' }}>Đang tải dữ liệu...</div></div>;

  return (
    <div className="page-container" style={{ maxWidth: '100%' }}>
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div>
          <div className="page-title">Danh sách đơn hàng</div>
        </div>
        <button onClick={exportExcel} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>Xuất Excel</span>
        </button>
      </div>

      {/* Filter rows */}
      <div className="card" style={{ marginBottom: 16, padding: '16px 20px' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
          <div className="search-wrapper" style={{ flex: '1 1 300px' }}>
            <span className="search-icon"></span>
            <input className="search-input" placeholder="Mã vận đơn, Mã đơn, Tên cửa hàng, SĐT..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          
          <select className="form-control" style={{ width: 180 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>

          <select className="form-control" style={{ width: 180 }} value={codStatusFilter} onChange={e => setCodStatusFilter(e.target.value)}>
            {ALL_COD_STATUSES.map(s => <option key={s} value={s}>{COD_STATUS_LABELS[s]}</option>)}
          </select>

          <select className="form-control" style={{ width: 140 }} value={carrierFilter} onChange={e => setCarrierFilter(e.target.value)}>
            <option value="all">Tất cả ĐVVC</option>
            <option value="GHN">GHN</option>
            <option value="SPX">SPX</option>
            <option value="JT">J&T</option>
            <option value="GHTK">GHTK</option>
            <option value="VNPost">VNPost</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Từ:</span>
            <input type="date" className="form-control" style={{ width: 140 }} value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Đến:</span>
            <input type="date" className="form-control" style={{ width: 140 }} value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>

          <div style={{ position: 'relative' }}>
            <button className="form-control" style={{ width: 160, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white' }} onClick={() => setShowRecDropdown(!showRecDropdown)}>
              <span>Đối soát ({[reconciliationFilter.pending, reconciliationFilter.reconciled].filter(Boolean).length})</span>
              <span style={{ fontSize: 10 }}>▼</span>
            </button>
            {showRecDropdown && (
              <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, background: 'white', border: '1px solid var(--border)', borderRadius: 8, padding: 12, boxShadow: 'var(--shadow-md)', zIndex: 10, width: 180, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={reconciliationFilter.pending} onChange={e => setReconciliationFilter(prev => ({ ...prev, pending: e.target.checked }))} />
                  Chờ đối soát
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={reconciliationFilter.reconciled} onChange={e => setReconciliationFilter(prev => ({ ...prev, reconciled: e.target.checked }))} />
                  Đã đối soát
                </label>
              </div>
            )}
          </div>

          <button onClick={clearFilters} className="btn btn-secondary" style={{ marginLeft: 'auto' }}>
            Đặt lại mặc định
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 16 }}>
        <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>Tổng số lượng đơn</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{summary.qty.toLocaleString()}</div>
        </div>
        <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>Tổng giá trị đơn hàng</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{formatCurrency(summary.goods)}</div>
        </div>
        <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>Tổng tiền thu hộ</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#047857' }}>{formatCurrency(summary.cod)}</div>
        </div>
        <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>Tổng phí dịch vụ giao hàng</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#b91c1c' }}>{formatCurrency(summary.fee)}</div>
        </div>
      </div>

      {/* Actions */}
      {isAdmin && (
        <div style={{ marginBottom: 16 }}>
          <button onClick={handleReconcileSelected} disabled={actionLoading === 'reconcile'} className="btn btn-primary">
            Đánh dấu Đã đối soát ({selectedOrders.length})
          </button>
        </div>
      )}

      {/* Grid */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper" style={{ overflowX: 'auto' }}>
          <table className="table" style={{ minWidth: 1400 }}>
            <thead>
              <tr>
                {isAdmin && <th style={{ width: 40 }}><input type="checkbox" onChange={e => setSelectedOrders(e.target.checked ? filtered.map(o => o.id) : [])} checked={filtered.length > 0 && selectedOrders.length === filtered.length} /></th>}
                <th>Mã vận đơn</th>
                <th>Mã đơn hàng</th>
                {isAdmin && <th>Tên cửa hàng</th>}
                <th>Khách hàng</th>
                <th>Nội dung hàng hoá</th>
                <th>Đơn vị VC</th>
                <th>Tiền hàng</th>
                <th>Phí dịch vụ</th>
                <th>Tiền thu hộ</th>
                <th>Trạng thái đơn</th>
                <th>Đối soát</th>
                {isSuperAdmin && <th>Admin</th>}
                <th>Ngày tạo</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? (isSuperAdmin ? 15 : 14) : 12}>
                    <div className="empty-state">
                      <div className="empty-state-icon"></div>
                      <h3>Danh sách trống</h3>
                      <p>Rất tiếc, không tìm thấy dữ liệu phù hợp để hiển thị.</p>
                    </div>
                  </td>
                </tr>
              ) : filtered.map(order => (
                <tr key={order.id}>
                  {isAdmin && (
                    <td><input type="checkbox" checked={selectedOrders.includes(order.id)} onChange={e => setSelectedOrders(prev => e.target.checked ? [...prev, order.id] : prev.filter(id => id !== order.id))} /></td>
                  )}
                  <td>
                    <span style={{ fontWeight: 600 }}>{order.trackingCode || '-'}</span>
                  </td>
                  <td>
                    <span style={{ color: 'var(--primary-light)', fontWeight: 700 }}>{order.code}</span>
                  </td>
                  {isAdmin && (
                    <td>{order.shop?.name || '-'}</td>
                  )}
                  <td>
                    <div style={{ fontWeight: 600 }}>{order.shippingName}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{order.shippingPhone}</div>
                  </td>
                  <td style={{ maxWidth: 180 }}>
                    <div style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={order.goodsContent || order.items?.map(p => `${p.name} x${p.quantity}`).join(', ')}>
                      {order.goodsContent || '-'}
                    </div>
                  </td>
                  <td>
                    {order.carrierName || order.shipperCode || '-'}
                  </td>
                  <td>{formatCurrency(order.totalValue)}</td>
                  <td>{formatCurrency(order.shippingFee)}</td>
                  <td><span style={{ fontWeight: 700 }}>{formatCurrency(order.codAmount)}</span></td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span className={`badge ${getStatusColor(order.status)}`}>{getStatusLabel(order.status)}</span>
                      {getFlowBadge(order.flowStatus, order.flowMessage)}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${order.reconciliationStatus === 'RECONCILED' ? 'status-delivered' : 'status-pending'}`}>
                      {order.reconciliationStatus === 'RECONCILED' ? 'Đã đối soát' : 'Chờ đối soát'}
                    </span>
                  </td>
                  {isSuperAdmin && (
                    <td>{order.shop?.admin?.name || '-'}</td>
                  )}
                  <td>
                    <span style={{ fontSize: 12 }}>{new Date(order.createdAt).toLocaleString('vi-VN')}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {isAdmin && order.flowStatus === 'WAITING_APPROVAL' && (
                        <button onClick={() => handleApproveFlow(order.id)} disabled={actionLoading === order.id} className="btn btn-secondary btn-sm" style={{ padding: '4px 10px', fontSize: 11, color: '#047857', borderColor: '#34d399', background: '#ecfdf5' }}>
                          Duyệt đơn
                        </button>
                      )}
                      {isAdmin && (order.flowStatus === 'READY_TO_PUSH' || order.flowStatus === 'PUSH_FAILED') && (
                        <button onClick={() => handlePushCarrier(order.id)} disabled={actionLoading === order.id} className="btn btn-primary btn-sm" style={{ padding: '4px 10px', fontSize: 11 }}>
                          Đẩy vận chuyển
                        </button>
                      )}
                    </div>
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

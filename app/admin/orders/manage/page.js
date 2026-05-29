'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatCurrency, getStatusLabel, getStatusColor } from '@/lib/mock-data'; 

const ALL_STATUSES = ['all', 'pending', 'shipping', 'delivered', 'returned', 'cancelled', 'issue', 'partial'];
const STATUS_LABELS = { all: 'Tất cả', pending: 'Chờ xử lý', shipping: 'Đang giao', delivered: 'Đã giao', returned: 'Trả hàng', cancelled: 'Đã hủy', issue: 'Kiện vấn đề', partial: 'Nhận 1 phần' }; 

export default function ManageOrdersPage() { 
  const [orders, setOrders] = useState([]); 
  const [loading, setLoading] = useState(true); 
  const [search, setSearch] = useState(''); 
  const [statusFilter, setStatusFilter] = useState('all'); 
  const [channelFilter, setChannelFilter] = useState('all'); 
  const [shipperFilter, setShipperFilter] = useState('all'); 
  const [actionLoading, setActionLoading] = useState(null);

  const fetchOrders = () => {
    setLoading(true);
    fetch('/api/orders') 
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
    // eslint-disable-next-line
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
        fetchOrders(); // Refresh to get tracking code and new statuses
      } else {
        alert(data.error || 'Lỗi khi đẩy vận chuyển.');
        fetchOrders(); // Refresh to see error status if changed
      }
    } catch {
      alert('Lỗi kết nối.');
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = orders.filter(o => { 
    const matchSearch = !search || o.code?.includes(search) || o.shippingName?.toLowerCase().includes(search.toLowerCase()) || o.shippingPhone?.includes(search); 
    const matchStatus = statusFilter === 'all' || o.status === statusFilter; 
    const matchChannel = channelFilter === 'all' || o.channel === channelFilter; 
    const matchShipper = shipperFilter === 'all' || o.shipperCode === shipperFilter; 
    return matchSearch && matchStatus && matchChannel && matchShipper; 
  }); 

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

  if (loading) { 
    return ( 
      <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}> 
        <div style={{ fontSize: 18, color: 'var(--text-muted)' }}>Đang tải dữ liệu...</div> 
      </div> 
    ); 
  } 

  return ( 
    <div className="page-container"> 
      <div className="page-header"> 
        <div> 
          <div className="page-title"> Quản lý đơn hàng</div> 
          <div className="page-subtitle">{filtered.length} đơn hàng từ CSDL</div> 
        </div> 
        <Link href="/admin/orders/create" className="btn btn-primary"> Tạo đơn mới</Link> 
      </div> 

      {/* Status tabs */} 
      <div style={{ display: 'flex', gap: 4, overflowX: 'auto', marginBottom: 16, paddingBottom: 4 }}> 
        {ALL_STATUSES.map(s => ( 
          <button key={s} onClick={() => setStatusFilter(s)} style={{ padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'var(--transition)', background: statusFilter === s ? 'var(--primary)' : 'var(--bg-card)', color: statusFilter === s ? 'white' : 'var(--text-secondary)', boxShadow: statusFilter === s ? '0 4px 12px rgba(99,102,241,0.3)' : 'none', }}> 
            {STATUS_LABELS[s]} 
            <span style={{ marginLeft: 6, opacity: 0.7, fontSize: 11 }}> 
              {s === 'all' ? orders.length : orders.filter(o => o.status === s).length} 
            </span> 
          </button> 
        ))} 
      </div> 

      {/* Filter bar */} 
      <div className="filter-bar"> 
        <div className="search-wrapper"> 
          <span className="search-icon"></span> 
          <input className="search-input" placeholder="Tìm mã đơn, khách hàng, SĐT..." value={search} onChange={e => setSearch(e.target.value)} /> 
        </div> 
        <select className="form-control" style={{ width: 160 }} value={channelFilter} onChange={e => setChannelFilter(e.target.value)}> 
          <option value="all">Tất cả kênh</option> 
          <option value="direct">Trực tiếp</option> 
          <option value="fanpage">Fanpage</option> 
          <option value="livestream">Livestream</option> 
        </select> 
        <select className="form-control" style={{ width: 140 }} value={shipperFilter} onChange={e => setShipperFilter(e.target.value)}> 
          <option value="all">Tất cả ĐVVC</option> 
          <option value="GHN">GHN</option> 
          <option value="SPX">SPX</option> 
          <option value="JT">J&T</option> 
        </select> 
      </div> 

      <div className="card" style={{ padding: 0 }}> 
        <div className="table-wrapper"> 
          <table className="table"> 
            <thead> 
              <tr> 
                <th>Mã đơn</th> 
                <th>Khách hàng</th> 
                <th>Sản phẩm</th> 
                <th>Giá trị COD</th> 
                <th>Luồng xử lý</th>
                <th>Kênh</th> 
                <th>Trạng thái</th> 
                <th>Thao tác</th> 
              </tr> 
            </thead> 
            <tbody> 
              {filtered.length === 0 ? ( 
                <tr> 
                  <td colSpan={8}> 
                    <div className="empty-state"> 
                      <div className="empty-state-icon"></div> 
                      <h3>Không có đơn hàng</h3> 
                      <p>Thử thay đổi bộ lọc hoặc tạo đơn mới</p> 
                    </div> 
                  </td> 
                </tr> 
              ) : filtered.map(order => ( 
                <tr key={order.id}> 
                  <td> 
                    <span style={{ color: 'var(--primary-light)', fontWeight: 700, fontSize: 13 }}>{order.code}</span> 
                    {order.note && <div style={{ fontSize: 11, color: 'var(--text-muted)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={order.note}> {order.note}</div>} 
                  </td> 
                  <td> 
                    <div style={{ fontWeight: 600 }}>{order.shippingName}</div> 
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{order.shippingPhone}</div> 
                  </td> 
                  <td style={{ maxWidth: 180 }}> 
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}> 
                      {order.items?.map(p => `${p.name} x${p.quantity}`).join(', ')} 
                    </div> 
                  </td> 
                  <td>
                    <span style={{ fontWeight: 700 }}>{formatCurrency(order.codAmount)}</span>
                  </td> 
                  <td>
                    {getFlowBadge(order.flowStatus, order.flowMessage)}
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                      {order.carrierCode || order.shipperCode ? `Carrier: ${order.carrierCode || order.shipperCode}` : 'Chưa chọn ĐVVC'}
                    </div>
                  </td> 
                  <td> 
                    <span style={{ fontSize: 12 }}> 
                      {order.channel === 'fanpage' ? ' Fanpage' : order.channel === 'livestream' ? ' Livestream' : ' Trực tiếp'} 
                    </span> 
                  </td> 
                  <td><span className={`badge ${getStatusColor(order.status)}`}>{getStatusLabel(order.status)}</span></td> 
                  <td> 
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}> 
                      {order.flowStatus === 'WAITING_APPROVAL' && (
                        <button onClick={() => handleApproveFlow(order.id)} disabled={actionLoading === order.id} className="btn btn-secondary btn-sm" style={{ padding: '4px 10px', fontSize: 11, color: '#047857', borderColor: '#34d399', background: '#ecfdf5' }}>
                          Duyệt đơn
                        </button>
                      )}
                      {(order.flowStatus === 'READY_TO_PUSH' || order.flowStatus === 'PUSH_FAILED') && (
                        <button onClick={() => handlePushCarrier(order.id)} disabled={actionLoading === order.id} className="btn btn-primary btn-sm" style={{ padding: '4px 10px', fontSize: 11 }}>
                          Đẩy vận chuyển
                        </button>
                      )}
                      {order.status === 'pending' && (
                        <button onClick={() => handleStatusUpdate(order.id, order.status)} className="btn btn-secondary btn-sm" style={{ padding: '4px 10px', fontSize: 11 }}> 
                          Xác nhận giao
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

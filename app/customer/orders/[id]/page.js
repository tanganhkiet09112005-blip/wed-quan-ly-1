'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AlertTriangle, ArrowLeft, Ban, CheckCircle, RefreshCw, RotateCcw, Truck, FileText } from 'lucide-react';
import {
  getCodStatusColor,
  getCodStatusLabel,
  getOrderSourceLabel,
  getStatusColor,
  getStatusLabel,
} from '@/lib/order-constants';

const CARRIER_OPTIONS = ['GHN', 'GHTK', 'JT', 'SPX'];
const MOCK_EVENT_STATUSES = ['shipping', 'delivered', 'partial_delivered', 'returned', 'failed', 'cancelled'];

const formatCurrency = (value) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value || 0);

const formatDateTime = (value) => value
  ? new Date(value).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
  : '-';

function DetailField({ label, value, strong = false, mono = false }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontWeight: strong ? 800 : 600, fontFamily: mono ? 'monospace' : undefined, color: 'var(--text-primary)' }}>
        {value || '-'}
      </div>
    </div>
  );
}

function ActionButton({ icon: Icon, children, tone = 'secondary', ...props }) {
  return (
    <button type="button" className={`btn btn-${tone} btn-sm`} style={{ justifyContent: 'center', gap: 6 }} {...props}>
      {Icon && <Icon size={15} />}
      {children}
    </button>
  );
}

function inferVariant(item, order) {
  const match = String(item?.name || '').match(/(?:size|sz)\s*([a-z0-9]+)/i);
  if (match?.[1]) return match[1].toUpperCase();
  if (order?.items?.length === 1 && order?.chatSession?.size) return order.chatSession.size;
  return '-';
}

async function readJson(res, fallbackMessage) {
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) {
    throw new Error(json.error || json.message || fallbackMessage);
  }
  return json;
}

export default function CustomerOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [selectedCarrier, setSelectedCarrier] = useState('GHN');
  const [selectedMockStatus, setSelectedMockStatus] = useState('shipping');

  const loadOrder = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      const json = await readJson(res, 'Không thể tải chi tiết đơn.');
      setOrder(json.data);
      setSelectedCarrier(json.data?.shipperCode || 'GHN');
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadOrder();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadOrder]);

  const status = order?.status;
  const canConfirmDraft = status === 'draft';
  const canPushCarrier = order && !order.trackingCode && !['draft', 'delivered', 'returned', 'failed', 'cancelled'].includes(status);
  const canMockEvent = order?.trackingCode && !['draft', 'pending', 'ready_to_ship', 'cancelled'].includes(status);
  const canCancel = order && !['delivered', 'cancelled'].includes(status);
  const canMarkReturned = order && !['draft', 'returned', 'cancelled'].includes(status);
  const canMarkFailed = order && !['draft', 'failed', 'cancelled'].includes(status);

  const carrierLabel = useMemo(() => {
    if (!order) return '-';
    return order.carrierName || order.shipper?.name || order.shipperCode || 'Chưa chọn';
  }, [order]);

  const runAction = async (key, successMessage, action) => {
    setActionLoading(key);
    setMessage('');
    setError('');
    try {
      const nextOrder = await action();
      if (nextOrder) setOrder(nextOrder);
      else await loadOrder();
      setMessage(successMessage);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading('');
    }
  };

  const confirmDraft = () => runAction('confirm', 'Đã xác nhận đơn nháp.', async () => {
    const res = await fetch(`/api/orders/${order.id}/confirm-draft`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'pending' }),
    });
    await readJson(res, 'Không thể xác nhận đơn nháp.');
    return null;
  });

  const pushCarrier = () => runAction('push', `Đã đẩy đơn qua ${selectedCarrier} mock.`, async () => {
    const res = await fetch(`/api/orders/${order.id}/push-carrier`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ carrierCode: selectedCarrier }),
    });
    await readJson(res, 'Không thể đẩy đơn qua carrier mock.');
    return null;
  });

  const mockCarrierEvent = () => runAction('mock', `Đã mock trạng thái ${getStatusLabel(selectedMockStatus)}.`, async () => {
    const res = await fetch('/api/carriers/mock-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: order.id,
        carrierCode: order.shipperCode || selectedCarrier,
        trackingCode: order.trackingCode,
        eventStatus: selectedMockStatus,
        note: `Mock ${getStatusLabel(selectedMockStatus)} từ chi tiết đơn`,
      }),
    });
    await readJson(res, 'Không thể cập nhật carrier mock.');
    return null;
  });

  const updateStatus = (nextStatus, successMessage) => runAction(`status-${nextStatus}`, successMessage, async () => {
    const res = await fetch(`/api/orders/${order.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    });
    const json = await readJson(res, 'Không thể cập nhật trạng thái đơn.');
    return json.data;
  });

  const cancelOrder = () => {
    if (!window.confirm('Hủy đơn này? COD sẽ chuyển sang Đã hủy và không tính đã thu.')) return;
    runAction('cancel', 'Đã hủy đơn hàng.', async () => {
      const res = await fetch(`/api/orders/${order.id}`, { method: 'DELETE' });
      const json = await readJson(res, 'Không thể hủy đơn hàng.');
      return json.data;
    });
  };

  const createInvoice = () => runAction('createInvoice', 'Đã tạo hóa đơn nháp.', async () => {
    const res = await fetch(`/api/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: order.id }),
    });
    const json = await readJson(res, 'Không thể tạo hóa đơn.');
    router.push(`/customer/invoices/${json.data.id}`);
    return null;
  });

  if (loading && !order) {
    return (
      <div className="page-container" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text-muted)' }}>Đang tải chi tiết đơn...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="page-container">
        <Link href="/customer/orders/manage" className="btn btn-secondary btn-sm" style={{ width: 'fit-content', marginBottom: 16 }}>
          <ArrowLeft size={15} /> Quay lại
        </Link>
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: 8, padding: '16px 20px' }}>
          {error || 'Không tìm thấy đơn hàng.'}
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => router.back()} style={{ marginBottom: 12, gap: 6 }}>
            <ArrowLeft size={15} /> Quay lại
          </button>
          <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            Chi tiết đơn {order.code}
            <span className={`badge ${getStatusColor(order.status)}`}>{getStatusLabel(order.status)}</span>
            <span className={`badge ${getCodStatusColor(order.codStatus)}`}>COD: {getCodStatusLabel(order.codStatus)}</span>
          </div>
          <div className="page-subtitle">
            Nguồn đơn: {getOrderSourceLabel(order.channel, Boolean(order.chatSession))} · Tạo lúc {formatDateTime(order.createdAt)}
          </div>
        </div>
        <Link href="/customer/orders/manage" className="btn btn-secondary">Danh sách đơn</Link>
      </div>

      {message && (
        <div style={{ padding: '10px 12px', borderRadius: 8, background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', marginBottom: 12 }}>
          {message}
        </div>
      )}
      {error && (
        <div style={{ padding: '10px 12px', borderRadius: 8, background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', marginBottom: 12 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.25fr) minmax(320px, 0.75fr)', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card">
            <div className="card-title">Thông tin vận hành</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16 }}>
              <DetailField label="Mã đơn" value={order.code} strong mono />
              <DetailField label="Trạng thái đơn" value={getStatusLabel(order.status)} strong />
              <DetailField label="COD status" value={getCodStatusLabel(order.codStatus)} strong />
              <DetailField label="COD amount" value={formatCurrency(order.codAmount)} strong />
              <DetailField label="Shipping fee" value={formatCurrency(order.shippingFee)} />
              <DetailField label="Carrier" value={carrierLabel} />
              <DetailField label="Tracking code" value={order.trackingCode || '-'} mono />
              <DetailField label="Nguồn đơn" value={getOrderSourceLabel(order.channel, Boolean(order.chatSession))} />
            </div>
          </div>

          <div className="card">
            <div className="card-title">Người nhận</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              <DetailField label="Họ tên" value={order.shippingName} strong />
              <DetailField label="SĐT" value={order.shippingPhone} strong />
              <DetailField label="Địa chỉ" value={order.shippingAddress} />
              <DetailField label="Khách hàng DB" value={order.customer?.code || order.customer?.name || '-'} />
            </div>
          </div>

          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
              <div className="card-title" style={{ marginBottom: 0 }}>Sản phẩm / item</div>
            </div>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Sản phẩm</th>
                    <th>Size/variant</th>
                    <th style={{ textAlign: 'right' }}>Số lượng</th>
                    <th style={{ textAlign: 'right' }}>Đơn giá</th>
                    <th style={{ textAlign: 'right' }}>Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items?.map((item) => {
                    const linkedSku = Boolean(item.variantId || item.sku);
                    const fallbackPrice = Number(item.price || 0);
                    const unitPrice = Number(item.unitPrice || 0) > 0 || fallbackPrice === 0
                      ? Number(item.unitPrice || 0)
                      : fallbackPrice;
                    const lineTotal = Number(item.lineTotal || 0) > 0
                      ? Number(item.lineTotal || 0)
                      : unitPrice * Number(item.quantity || 0);
                    const productLabel = item.productCode || item.product?.code
                      ? `${item.productCode || item.product?.code} · ${item.productName || item.product?.name || item.name}`
                      : (item.productName || item.name);
                    const variantLabel = [item.size || item.variant?.size, item.color || item.variant?.color, item.variantName || item.variant?.name]
                      .filter(Boolean)
                      .join(' / ');

                    return (
                      <tr key={item.id}>
                        <td>
                          <div style={{ fontWeight: 800 }}>{productLabel}</div>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                            {linkedSku ? (
                              <span className="badge" style={{ background: '#ecfdf5', color: '#047857' }}>SKU {item.sku || item.variant?.sku}</span>
                            ) : (
                              <span className="badge" style={{ background: 'var(--bg-input)', color: 'var(--text-secondary)' }}>Item tự do</span>
                            )}
                          </div>
                        </td>
                        <td><span className="badge" style={{ background: 'var(--bg-input)', color: 'var(--text-secondary)' }}>{variantLabel || inferVariant(item, order)}</span></td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>{item.quantity}</td>
                        <td style={{ textAlign: 'right' }}>{formatCurrency(unitPrice)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 800 }}>{formatCurrency(lineTotal)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <div className="card-title">Ghi chú</div>
            <div style={{ color: order.note ? 'var(--text-primary)' : 'var(--text-muted)', whiteSpace: 'pre-wrap' }}>
              {order.note || 'Chưa có ghi chú.'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card">
            <div className="card-title">Thao tác đơn</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {canConfirmDraft && (
                <ActionButton icon={CheckCircle} tone="primary" disabled={Boolean(actionLoading)} onClick={confirmDraft}>
                  Xác nhận đơn nháp
                </ActionButton>
              )}

              {canPushCarrier && (
                <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: 8 }}>
                  <select className="form-control" value={selectedCarrier} onChange={(event) => setSelectedCarrier(event.target.value)} disabled={Boolean(actionLoading)}>
                    {CARRIER_OPTIONS.map((carrier) => <option key={carrier} value={carrier}>{carrier}</option>)}
                  </select>
                  <ActionButton icon={Truck} disabled={Boolean(actionLoading)} onClick={pushCarrier}>
                    Đẩy vận chuyển mock
                  </ActionButton>
                </div>
              )}

              {canMockEvent && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 92px', gap: 8 }}>
                  <select className="form-control" value={selectedMockStatus} onChange={(event) => setSelectedMockStatus(event.target.value)} disabled={Boolean(actionLoading)}>
                    {MOCK_EVENT_STATUSES.map((nextStatus) => <option key={nextStatus} value={nextStatus}>{getStatusLabel(nextStatus)}</option>)}
                  </select>
                  <ActionButton icon={RefreshCw} disabled={Boolean(actionLoading)} onClick={mockCarrierEvent}>
                    Mock
                  </ActionButton>
                </div>
              )}

              {canMarkReturned && (
                <ActionButton icon={RotateCcw} disabled={Boolean(actionLoading)} onClick={() => updateStatus('returned', 'Đã đánh dấu đơn hoàn/trả.')}>
                  Đánh dấu hoàn/trả
                </ActionButton>
              )}

              {canMarkFailed && (
                <ActionButton icon={AlertTriangle} disabled={Boolean(actionLoading)} onClick={() => updateStatus('failed', 'Đã đánh dấu kiện vấn đề/giao thất bại.')}>
                  Đánh dấu kiện vấn đề
                </ActionButton>
              )}

              {canCancel && (
                <ActionButton icon={Ban} tone="danger" disabled={Boolean(actionLoading)} onClick={cancelOrder}>
                  Hủy đơn
                </ActionButton>
              )}

              <div style={{ height: 1, background: 'var(--border)', margin: '8px 0' }} />
              
              {order.invoice ? (
                <ActionButton icon={FileText} onClick={() => router.push(`/customer/invoices/${order.invoice.id}`)}>
                  Xem hóa đơn điện tử
                </ActionButton>
              ) : (
                <ActionButton icon={FileText} onClick={createInvoice} disabled={Boolean(actionLoading)}>
                  Tạo hóa đơn điện tử
                </ActionButton>
              )}

              {!canConfirmDraft && !canPushCarrier && !canMockEvent && !canMarkReturned && !canMarkFailed && !canCancel && !order.invoice && (
                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Đơn không còn thao tác nghiệp vụ phù hợp.</div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-title">Timeline vận đơn</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {(order.timeline || []).length === 0 ? (
                <div style={{ color: 'var(--text-muted)' }}>Chưa có lịch sử trạng thái.</div>
              ) : order.timeline.map((event, index) => (
                <div key={event.id || `${event.type}-${index}`} style={{ display: 'grid', gridTemplateColumns: '18px 1fr', gap: 10 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span className={`badge ${event.status ? getStatusColor(event.status) : 'status-pending'}`} style={{ width: 12, height: 12, padding: 0, borderRadius: 999 }} />
                    {index < order.timeline.length - 1 && <span style={{ width: 1, flex: 1, minHeight: 28, background: 'var(--border)', marginTop: 4 }} />}
                  </div>
                  <div>
                    <div className="flex-between" style={{ gap: 8 }}>
                      <div style={{ fontWeight: 800 }}>{event.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatDateTime(event.occurredAt)}</div>
                    </div>
                    {event.description && (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.5 }}>{event.description}</div>
                    )}
                    {event.trackingCode && (
                      <div style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                        {event.carrierCode || 'Carrier'} · {event.trackingCode}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

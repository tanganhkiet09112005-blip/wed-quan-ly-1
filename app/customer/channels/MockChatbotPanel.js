'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, CheckCircle, MessageSquare, PlusCircle, RefreshCw, Send, Zap } from 'lucide-react';

/* ─── Constants ─────────────────────────────────── */
const SAMPLE_COMMENTS = [
  { label: 'Đơn đủ thông tin 1', value: 'Chốt áo đỏ size M x2 0901234567 dc 12 Nguyễn Huệ Q1' },
  { label: 'Đơn đủ thông tin 2', value: 'Lấy váy đen size L 1 cái sdt 0911222333 địa chỉ 25 Lê Lợi' },
  { label: 'Hỏi giá', value: 'Ib giá' },
  { label: 'Thiếu SĐT', value: 'Mua 2 cái áo đỏ size M' },
];

const FIELD_LABELS = {
  phone: 'SĐT',
  address: 'Địa chỉ',
  product: 'Sản phẩm',
  size: 'Size',
  quantity: 'Số lượng',
};

const SESSION_STATUS = {
  collecting: { label: 'Thiếu thông tin', cls: 'status-pending' },
  ready: { label: 'Đủ thông tin', cls: 'status-delivered' },
  draft_created: { label: 'Đã tạo nháp', cls: 'status-shipping' },
  confirmed: { label: 'Đã xác nhận', cls: 'status-delivered' },
};

/* ─── Helpers ────────────────────────────────────── */
function safeMissingFields(raw) {
  try {
    const p = JSON.parse(raw || '[]');
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}

function formatTime(value) {
  if (!value) return '';
  return new Date(value).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

/* ─── Sub-components ─────────────────────────────── */
function SessionBadge({ status }) {
  const s = SESSION_STATUS[status] || { label: status, cls: 'status-pending' };
  return <span className={`badge ${s.cls}`} style={{ fontSize: '10px' }}>{s.label}</span>;
}

function InfoField({ label, value, missing = false }) {
  return (
    <div style={{
      padding: '10px 12px',
      background: missing ? '#fff5f5' : 'var(--bg-input)',
      border: `1px solid ${missing ? '#fecaca' : 'var(--border)'}`,
      borderRadius: 8,
      position: 'relative',
    }}>
      <div style={{ fontSize: 10.5, color: missing ? 'var(--danger)' : 'var(--text-muted)', marginBottom: 3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
        {label} {missing && '⚠'}
      </div>
      <div style={{ fontWeight: 700, fontSize: 13, minHeight: 18, color: value ? 'var(--text-primary)' : 'var(--text-muted)' }}>
        {value || (missing ? 'Còn thiếu' : '—')}
      </div>
    </div>
  );
}

function ChatBubble({ item }) {
  const isCustomer = item.sender === 'customer';
  const isBot = item.sender === 'bot';
  const isShop = item.sender === 'shop';

  const bg = isCustomer ? '#ffffff' : isBot ? '#eff6ff' : '#f0fdf4';
  const borderColor = isCustomer ? 'var(--border)' : isBot ? '#bfdbfe' : '#bbf7d0';
  const senderLabel = isCustomer ? '👤 Khách' : isBot ? '🤖 Bot' : '🏪 Shop';

  return (
    <div style={{
      display: 'flex',
      justifyContent: isCustomer ? 'flex-start' : 'flex-end',
      marginBottom: 10,
      animation: 'fadeIn 0.2s ease',
    }}>
      <div style={{
        maxWidth: '78%',
        padding: '10px 13px',
        borderRadius: isCustomer ? '4px 14px 14px 14px' : '14px 4px 14px 14px',
        background: bg,
        border: `1px solid ${borderColor}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}>
        <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600 }}>
          {senderLabel} · {formatTime(item.createdAt)}
        </div>
        <div style={{ fontSize: 13.5, lineHeight: 1.5, wordBreak: 'break-word' }}>{item.content}</div>
      </div>
    </div>
  );
}

/* ─── Main component ────────────────────────────── */
export default function MockChatbotPanel({ channel }) {
  const [comment, setComment]           = useState('');
  const [reply, setReply]               = useState('');
  const [unitPrice, setUnitPrice]       = useState('199000');
  const [sessions, setSessions]         = useState([]);
  const [selectedId, setSelectedId]     = useState('');
  const [loading, setLoading]           = useState(true);
  const [actionLoading, setActionLoading] = useState(''); // 'comment' | 'reply' | 'draft' | 'confirm'
  const [error, setError]               = useState('');
  const [toast, setToast]               = useState('');
  const chatRef = useRef(null);

  /* ── Data loading ── */
  const loadSessions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res  = await fetch(`/api/chatbot/sessions?channel=${channel}`);
      const json = await res.json();
      if (json.success) {
        const list = json.data || [];
        setSessions(list);
        setSelectedId((cur) => cur || list[0]?.id || '');
      } else {
        setError(json.error || 'Không thể tải hội thoại.');
      }
    } catch {
      setError('Không thể kết nối chatbot mock. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [channel]);

  useEffect(() => {
    const t = setTimeout(loadSessions, 0);
    return () => clearTimeout(t);
  }, [loadSessions]);

  /* Auto-scroll chat to bottom */
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [selectedId, sessions]);

  /* ── Derived state ── */
  const selected = useMemo(
    () => sessions.find((s) => s.id === selectedId) || sessions[0],
    [sessions, selectedId]
  );
  const selectedDraftOrderId = selected?.draftOrderId || selected?.draftOrder?.id || '';
  const selectedDraftOrderStatus = selected?.draftOrder?.status;
  const missing = safeMissingFields(selected?.missingFields);
  const isReady = selected && missing.length === 0;
  const canCreateDraft = isReady && !selected?.draftOrderId;
  const canConfirmDraft = Boolean(selectedDraftOrderId)
    && selected?.status !== 'confirmed'
    && (!selectedDraftOrderStatus || selectedDraftOrderStatus === 'draft');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  /* ── Actions ── */
  const submitComment = async (e) => {
    e?.preventDefault();
    if (!comment.trim()) return;
    setActionLoading('comment');
    setError('');
    try {
      const res  = await fetch('/api/chatbot/mock-comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel,
          platform: 'facebook',
          sourceType: channel,
          liveId: channel === 'livestream' ? 'mock-live-001' : undefined,
          customerName: 'Khách Facebook',
          message: comment,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSessions((prev) => [json.data, ...prev]);
        setSelectedId(json.data.id);
        setComment('');
        showToast('Đã tạo comment mock thành công.');
      } else {
        setError(json.error || 'Không thể tạo comment mock.');
      }
    } catch {
      setError('Không thể kết nối máy chủ.');
    } finally {
      setActionLoading('');
    }
  };

  const sendReply = async () => {
    if (!selected || !reply.trim()) return;
    setActionLoading('reply');
    setError('');
    try {
      const res  = await fetch(`/api/chatbot/sessions/${selected.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: reply }),
      });
      const json = await res.json();
      if (json.success) {
        setSessions((prev) => prev.map((s) => s.id === selected.id ? json.data : s));
        setReply('');
      } else {
        setError(json.error || 'Không gửi được phản hồi.');
      }
    } catch {
      setError('Không thể kết nối máy chủ.');
    } finally {
      setActionLoading('');
    }
  };

  const createDraft = async () => {
    if (!selected) return;
    setActionLoading('draft');
    setError('');
    try {
      const res  = await fetch(`/api/chatbot/sessions/${selected.id}/create-draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: Number(unitPrice || 0) }),
      });
      const json = await res.json();
      if (json.success) {
        setSessions((prev) => prev.map((s) => s.id === selected.id ? json.data : s));
        showToast('Đã tạo đơn nháp từ hội thoại thành công.');
      } else {
        setError(json.error || 'Không thể tạo đơn nháp.');
      }
    } catch {
      setError('Không thể kết nối máy chủ.');
    } finally {
      setActionLoading('');
    }
  };

  const confirmDraft = async () => {
    if (!selectedDraftOrderId) return;
    setActionLoading('confirm');
    setError('');
    try {
      const res  = await fetch(`/api/orders/${selectedDraftOrderId}/confirm-draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'pending' }),
      });
      const json = await res.json();
      if (json.success) {
        await loadSessions();
        showToast('Đã xác nhận đơn nháp thành đơn chờ xử lý.');
      } else {
        setError(json.error || 'Không thể xác nhận đơn.');
      }
    } catch {
      setError('Không thể kết nối máy chủ.');
    } finally {
      setActionLoading('');
    }
  };

  /* ─── Render ─── */
  return (
    <div style={{ position: 'relative' }}>

      {/* Toast notification */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24,
          background: 'var(--bg-topbar)', color: 'white',
          padding: '12px 18px', borderRadius: 10,
          fontSize: 13.5, fontWeight: 500,
          boxShadow: 'var(--shadow-lg)',
          zIndex: 9999,
          animation: 'slideUp 0.25s ease',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <CheckCircle size={15} color="#4ade80" /> {toast}
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="alert alert-danger mb-12 animate-fade" style={{ alignItems: 'center', gap: 8 }}>
          <AlertCircle size={15} />
          <span style={{ flex: 1 }}>{error}</span>
          <button type="button" onClick={() => setError('')} style={{ opacity: 0.6, cursor: 'pointer' }}>×</button>
        </div>
      )}

      {/* Comment input area */}
      <div className="card mb-16" style={{ padding: 16 }}>
        <form onSubmit={submitComment}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, marginBottom: 10 }}>
            <input
              className="form-control"
              placeholder={`Nhập comment ${channel === 'livestream' ? 'livestream' : 'fanpage'} giả lập...`}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <button
              className="btn btn-primary"
              type="submit"
              disabled={!comment.trim() || actionLoading === 'comment'}
              style={{ gap: 6, whiteSpace: 'nowrap' }}
            >
              {actionLoading === 'comment'
                ? <span className="animate-spin" style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }} />
                : <Zap size={15} />
              }
              Tạo comment
            </button>
          </div>
          {/* Quick comment templates */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 600, marginRight: 2 }}>Mẫu nhanh:</span>
            {SAMPLE_COMMENTS.map((s) => (
              <button
                key={s.value}
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setComment(s.value)}
                style={{ fontSize: 11.5 }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </form>
      </div>

      {/* 3-column panel */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '260px minmax(0, 1fr) 280px',
        gap: 14,
        minHeight: 560,
      }}>

        {/* ── COL 1: Session list ── */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{
            padding: '12px 14px',
            borderBottom: '1px solid var(--border)',
            background: 'var(--bg-input)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
              <MessageSquare size={14} color="var(--primary)" />
              Hội thoại
              <span style={{ background: 'var(--primary)', color: 'white', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 10 }}>
                {sessions.length}
              </span>
            </div>
            <button type="button" className="btn-icon" onClick={loadSessions} disabled={loading} title="Tải lại">
              <RefreshCw size={13} style={{ color: 'var(--text-muted)', animation: loading ? 'spin 0.8s linear infinite' : 'none' }} />
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-light)' }}>
                  <div className="skeleton" style={{ height: 14, width: '70%', marginBottom: 6 }} />
                  <div className="skeleton" style={{ height: 11, width: '90%' }} />
                </div>
              ))
            ) : sessions.length === 0 ? (
              <div className="empty-state" style={{ padding: '32px 16px' }}>
                <div className="empty-state-icon" style={{ width: 44, height: 44, fontSize: 20 }}>
                  <MessageSquare size={20} />
                </div>
                <h3 style={{ fontSize: 13 }}>Chưa có hội thoại nào</h3>
                <p style={{ fontSize: 11.5 }}>Tạo comment mock để bắt đầu</p>
              </div>
            ) : (
              sessions.map((session) => {
                const isActive = selected?.id === session.id;
                const statusInfo = SESSION_STATUS[session.status] || { label: session.status, cls: 'status-pending' };
                return (
                  <button
                    key={session.id}
                    type="button"
                    onClick={() => setSelectedId(session.id)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '11px 14px',
                      borderBottom: '1px solid var(--border-light)',
                      background: isActive ? '#eff6ff' : 'transparent',
                      borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent',
                      cursor: 'pointer',
                      transition: 'var(--transition)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4, gap: 4 }}>
                      <div style={{ fontWeight: 700, fontSize: 12.5, color: isActive ? 'var(--primary)' : 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {session.customerName || 'Khách Facebook'}
                      </div>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0 }}>
                        {formatDate(session.updatedAt)}
                      </span>
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 5 }}>
                      {session.productName || session.rawComment || 'Đang thu thập thông tin...'}
                    </div>
                    <SessionBadge status={session.status} />
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ── COL 2: Chat area ── */}
        <div className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Chat header */}
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--border)',
            background: 'var(--bg-input)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            {selected ? (
              <>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontWeight: 800, fontSize: 13, flexShrink: 0,
                }}>
                  {(selected.customerName || 'K')[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{selected.customerName || 'Khách Facebook'}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {selected.messages?.length || 0} tin nhắn · Kênh: {selected.channel === 'livestream' ? 'Livestream' : 'Fanpage'}
                  </div>
                </div>
                <SessionBadge status={selected.status} />
              </>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Chọn hội thoại để xem</div>
            )}
          </div>

          {/* Messages */}
          <div
            ref={chatRef}
            style={{ flex: 1, overflowY: 'auto', padding: '16px', minHeight: 0 }}
          >
            {!selected ? (
              <div className="empty-state" style={{ padding: '48px 16px' }}>
                <div className="empty-state-icon">
                  <MessageSquare size={26} />
                </div>
                <h3>Chọn một hội thoại</h3>
                <p>Bấm vào hội thoại bên trái để xem chi tiết tin nhắn và xử lý đơn</p>
              </div>
            ) : selected.messages?.length ? (
              selected.messages.map((item) => (
                <ChatBubble key={item.id} item={item} />
              ))
            ) : (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: 32, fontSize: 13 }}>
                Chưa có tin nhắn trong hội thoại này.
              </div>
            )}
          </div>

          {/* Reply input */}
          {selected && (
            <div style={{
              padding: '12px 14px',
              borderTop: '1px solid var(--border)',
              background: 'var(--bg-input)',
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }}>
                <input
                  className="form-control"
                  placeholder="Khách/shop bổ sung: sdt, địa chỉ, size, số lượng..."
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                />
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={sendReply}
                  disabled={!reply.trim() || actionLoading === 'reply'}
                  style={{ padding: '9px 14px', gap: 5 }}
                >
                  {actionLoading === 'reply'
                    ? <span className="animate-spin" style={{ display: 'inline-block', width: 13, height: 13, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }} />
                    : <Send size={14} />
                  }
                  Gửi
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── COL 3: Extraction panel ── */}
        <div className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{
            padding: '12px 14px',
            borderBottom: '1px solid var(--border)',
            background: 'var(--bg-input)',
          }}>
            <div style={{ fontWeight: 700, fontSize: 13 }}>Thông tin đơn hàng</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Dữ liệu bot trích xuất từ chat</div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
            {!selected ? (
              <div className="empty-state" style={{ padding: '32px 8px' }}>
                <div className="empty-state-icon" style={{ width: 44, height: 44, fontSize: 20 }}>📋</div>
                <h3 style={{ fontSize: 13 }}>Chọn hội thoại</h3>
                <p style={{ fontSize: 11.5 }}>Thông tin sẽ hiển thị ở đây</p>
              </div>
            ) : (
              <>
                {/* Status badge */}
                <div style={{ marginBottom: 14 }}>
                  {missing.length > 0 ? (
                    <div style={{
                      display: 'flex', alignItems: 'flex-start', gap: 8,
                      padding: '10px 12px',
                      background: '#fff5f5',
                      border: '1px solid #fecaca',
                      borderRadius: 8,
                    }}>
                      <AlertCircle size={14} color="var(--danger)" style={{ flexShrink: 0, marginTop: 1 }} />
                      <div>
                        <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--danger)', marginBottom: 2 }}>
                          Còn thiếu thông tin
                        </div>
                        <div style={{ fontSize: 11, color: '#b91c1c' }}>
                          {missing.map((f) => FIELD_LABELS[f] || f).join(' · ')}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '10px 12px',
                      background: '#dcfce7',
                      border: '1px solid #bbf7d0',
                      borderRadius: 8,
                    }}>
                      <CheckCircle size={14} color="var(--success)" />
                      <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--success)' }}>
                        Đủ thông tin tạo đơn hàng
                      </div>
                    </div>
                  )}
                </div>

                {/* Extracted fields */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                  <InfoField label="Sản phẩm" value={selected.productName} missing={missing.includes('product')} />
                  <InfoField label="Size" value={selected.size} missing={missing.includes('size')} />
                  <InfoField label="Số lượng" value={selected.quantity ? String(selected.quantity) : null} missing={missing.includes('quantity')} />
                  <InfoField label="SĐT" value={selected.customerPhone} missing={missing.includes('phone')} />
                  <InfoField label="Địa chỉ giao hàng" value={selected.shippingAddress} missing={missing.includes('address')} />
                </div>

                {/* Draft order info */}
                {selected.draftOrder?.code && (
                  <div style={{
                    padding: '10px 12px',
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: 8,
                    marginBottom: 14,
                  }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>Mã đơn nháp</div>
                    <div style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--primary)' }}>
                      {selected.draftOrder.code}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
                      Trạng thái: <span style={{ fontWeight: 600 }}>{selected.draftOrder.status || 'draft'}</span>
                    </div>
                  </div>
                )}

                {/* Unit price input */}
                {canCreateDraft && (
                  <div className="form-group" style={{ marginBottom: 12 }}>
                    <label className="form-label">Đơn giá mock (VND)</label>
                    <input
                      className="form-control"
                      type="number"
                      min="0"
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(e.target.value)}
                      placeholder="Nhập đơn giá..."
                    />
                  </div>
                )}

                {/* Action buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {canCreateDraft && (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={createDraft}
                      disabled={actionLoading === 'draft'}
                      style={{ justifyContent: 'center', gap: 6 }}
                    >
                      {actionLoading === 'draft'
                        ? <RefreshCw size={14} style={{ animation: 'spin 0.8s linear infinite' }} />
                        : <PlusCircle size={14} />
                      }
                      Tạo đơn nháp
                    </button>
                  )}

                  {canConfirmDraft && (
                    <button
                      type="button"
                      className="btn btn-success"
                      onClick={confirmDraft}
                      disabled={actionLoading === 'confirm'}
                      style={{ justifyContent: 'center', gap: 6 }}
                    >
                      {actionLoading === 'confirm'
                        ? <RefreshCw size={14} style={{ animation: 'spin 0.8s linear infinite' }} />
                        : <CheckCircle size={14} />
                      }
                      Xác nhận đơn
                    </button>
                  )}

                  {selectedDraftOrderId && (
                    <Link
                      href={`/customer/orders/${selectedDraftOrderId}`}
                      className="btn btn-secondary"
                      style={{ justifyContent: 'center', gap: 6, textDecoration: 'none' }}
                    >
                      Mở chi tiết đơn
                    </Link>
                  )}

                  {selected.status === 'confirmed' && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '10px 12px',
                      background: '#dcfce7',
                      border: '1px solid #bbf7d0',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--success)',
                    }}>
                      <CheckCircle size={14} /> Đơn đã được xác nhận thành công
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

      </div>

      {/* Responsive note for mobile */}
      <style>{`
        @media (max-width: 1024px) {
          .chatbot-3col {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 768px) {
          .chatbot-3col {
            overflow-x: auto;
          }
        }
      `}</style>
    </div>
  );
}

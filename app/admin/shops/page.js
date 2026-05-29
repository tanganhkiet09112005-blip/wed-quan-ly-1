'use client';

import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import {
  AlertCircle,
  Building2,
  CheckCircle,
  Eye,
  Lock,
  LockOpen,
  PlusCircle,
  RefreshCw,
  Search,
  Settings,
  Store,
  X,
  GitMerge,
} from 'lucide-react';

/* ─── Formatters ─────────────────────────────── */
const fmt = (v) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(v || 0);
const fmtN = (v) => new Intl.NumberFormat('vi-VN').format(v || 0);
const fmtDate = (v) =>
  v ? new Date(v).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

/* ─── Form initial state + reducer ──────────────── */
const FORM_INIT = { code: '', name: '', ownerName: '', email: '', phone: '', password: '', status: 'active', adminId: '' };
function formReducer(state, action) {
  if (action.type === 'reset') return { ...FORM_INIT, code: action.suggestedCode || '' };
  if (action.type === 'set') return { ...state, [action.field]: action.value };
  return state;
}

/* ─── Status helpers ─────────────────────────── */
const STATUS_LABEL = { active: 'Hoạt động', inactive: 'Tạm khóa' };
const STATUS_CLS = { active: 'status-delivered', inactive: 'status-cancelled' };

// helper: check if current user is super admin
function isSuperAdmin(user) {
  return user?.role === 'admin' && !user?.parentAdminId;
}

/* ─── Main component ─────────────────────────── */
export default function ShopsManagementPage() {
  const { user } = useAuth();
  const [shops, setShops] = useState([]);      // from /api/dashboard (has order aggregates)
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Sub-admins (for assignment dropdown, super_admin only)
  const [subAdmins, setSubAdmins] = useState([]);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [form, dispatch] = useReducer(formReducer, FORM_INIT);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  /* ── Load shops (via /api/dashboard for aggregated data) ── */
  const loadShops = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await fetch('/api/dashboard');
      const json = await res.json();
      if (json.success) {
        setShops(json.data.shopReports || []);
        setSummary(json.data.summary || {});
      } else {
        setLoadError(json.error || 'Không thể tải danh sách shop.');
      }
    } catch {
      setLoadError('Không thể kết nối máy chủ. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { const t = setTimeout(loadShops, 0); return () => clearTimeout(t); }, [loadShops]);

  // Load sub-admins for assignment dropdown (super_admin only)
  useEffect(() => {
    if (!isSuperAdmin(user)) return;
    fetch('/api/admin/accounts')
      .then(r => r.json())
      .then(json => { if (json.success) setSubAdmins(json.data || []); })
      .catch(() => {});
  }, [user]);

  /* ── Filtered shops ── */
  const filtered = useMemo(() => {
    let list = shops;
    if (statusFilter !== 'all') list = list.filter((s) => s.status === statusFilter);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((s) =>
        s.code?.toLowerCase().includes(q) ||
        s.name?.toLowerCase().includes(q) ||
        s.ownerName?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.phone?.includes(q)
      );
    }
    return list;
  }, [shops, search, statusFilter]);

  /* ── Open create modal ── */
  const openCreate = () => {
    const nextNum = shops.length + 1;
    dispatch({ type: 'reset', suggestedCode: `SHOP${String(nextNum).padStart(3, '0')}` });
    setFormError('');
    setFormSuccess('');
    setModalOpen(true);
  };

  /* ── Create shop ── */
  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    // Client-side validation
    const required = ['code', 'name', 'ownerName', 'email', 'phone'];
    for (const f of required) {
      if (!form[f]?.trim()) {
        setFormError(`Vui lòng nhập đầy đủ: Mã shop, Tên shop, Chủ sở hữu, Email, SĐT.`);
        return;
      }
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setFormError('Email không đúng định dạng. Ví dụ: shop@example.com');
      return;
    }
    if (!form.phone.match(/^[0-9]{9,11}$/)) {
      setFormError('Số điện thoại không hợp lệ (9–11 chữ số).');
      return;
    }
    if (!form.password || form.password.length < 6) {
      setFormError('Mật khẩu khởi tạo phải có ít nhất 6 ký tự.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        ownerName: form.ownerName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        password: form.password,
        status: form.status,
      };
      // Only super_admin can assign to sub-admin
      if (isSuperAdmin(user) && form.adminId) payload.adminId = form.adminId;

      const res = await fetch('/api/shops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setFormSuccess(`Đã tạo shop "${form.name}" thành công. Email đăng nhập: ${form.email}`);
        await loadShops();
        setTimeout(() => { setModalOpen(false); setFormSuccess(''); }, 1800);
      } else {
        setFormError(result.error || 'Không thể tạo tài khoản shop.');
      }
    } catch {
      setFormError('Không thể kết nối máy chủ, vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  /* ─── Render ─── */
  return (
    <div className="page-container">

      {/* ─── Header ─── */}
      <div className="page-header" style={{ marginBottom: 20 }}>
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
          <div className="page-title">Quản lý shop</div>
          <div className="page-subtitle">
            Tạo tài khoản shop, theo dõi lượng đơn, cước phí và COD của từng shop
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" className="btn btn-secondary" onClick={loadShops} disabled={loading}>
            <RefreshCw size={14} style={{ animation: loading ? 'spin 0.8s linear infinite' : 'none' }} /> Tải lại
          </button>
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            <PlusCircle size={14} /> Tạo shop mới
          </button>
        </div>
      </div>

      {/* ─── KPI mini row ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Tổng shop', value: fmtN(shops.length), icon: Store, cls: 'kpi-icon-blue' },
          { label: 'Shop hoạt động', value: fmtN(shops.filter((s) => s.status === 'active').length), icon: CheckCircle, cls: 'kpi-icon-green' },
          { label: 'Tổng đơn hàng', value: fmtN(summary.totalOrders), icon: Building2, cls: 'kpi-icon-cyan' },
          { label: 'COD đã thu', value: fmt(summary.codCollected), icon: CheckCircle, cls: 'kpi-icon-purple' },
        ].map(({ label, value, icon: Icon, cls }) => (
          <div key={label} className="kpi-card" style={{ padding: '14px 16px' }}>
            <div className={`kpi-icon ${cls}`} style={{ width: 36, height: 36 }}>
              <Icon size={16} />
            </div>
            <div className="kpi-content">
              <div className="kpi-value" style={{ fontSize: 18 }}>{loading ? <div className="skeleton" style={{ height: 22, width: 60 }} /> : value}</div>
              <div className="kpi-label" style={{ fontSize: 12 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Error state ─── */}
      {loadError && !loading && (
        <div className="card mb-16">
          <div className="empty-state" style={{ padding: '24px' }}>
            <div className="empty-state-icon" style={{ background: 'var(--danger-light)', color: 'var(--danger)' }}>
              <AlertCircle size={28} />
            </div>
            <h3>Không thể tải danh sách shop</h3>
            <p>{loadError}</p>
            <button type="button" className="btn btn-primary" onClick={loadShops}>
              <RefreshCw size={14} /> Thử lại
            </button>
          </div>
        </div>
      )}

      {/* ─── Main table card ─── */}
      <div className="card" style={{ padding: 0 }}>
        {/* Filter bar */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14.5 }}>Bảng tổng hợp shop</div>
              {!loading && (
                <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>
                  {filtered.length} / {shops.length} shop hiển thị
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <div className="search-wrapper" style={{ width: 280 }}>
                <Search size={15} className="search-icon" />
                <input
                  className="search-input"
                  placeholder="Tìm mã shop, tên, email, SĐT..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <select className="form-control" style={{ width: 160 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Hoạt động</option>
                <option value="inactive">Tạm khóa</option>
              </select>
              {(search || statusFilter !== 'all') && (
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setSearch(''); setStatusFilter('all'); }}>
                  <X size={12} /> Xóa lọc
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Mã shop</th>
                <th>Tên shop</th>
                <th>Chủ sở hữu</th>
                <th>Email / SĐT</th>
                <th>Admin quản lý</th>
                <th style={{ textAlign: 'right' }}>Số đơn</th>
                <th style={{ textAlign: 'right' }}>COD chờ thu</th>
                <th style={{ textAlign: 'right' }}>COD đã thu</th>
                <th style={{ textAlign: 'right' }}>Cước phí</th>
                <th>Carrier</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 13 }).map((__, j) => (
                      <td key={j}><div className="skeleton" style={{ height: 16, borderRadius: 4 }} /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={13} style={{ padding: 0 }}>
                    <div className="empty-state" style={{ padding: '44px 20px' }}>
                      <div className="empty-state-icon"><Store size={28} /></div>
                      <h3>{shops.length === 0 ? 'Chưa có shop nào trong hệ thống' : 'Không tìm thấy shop phù hợp'}</h3>
                      <p>{shops.length === 0
                        ? 'Bấm "Tạo shop mới" để thêm shop đầu tiên vào hệ thống.'
                        : 'Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc trạng thái.'}
                      </p>
                      {shops.length === 0 ? (
                        <button type="button" className="btn btn-primary" onClick={openCreate}>
                          <PlusCircle size={14} /> Tạo shop mới
                        </button>
                      ) : (
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setSearch(''); setStatusFilter('all'); }}>
                          <RefreshCw size={12} /> Xóa bộ lọc
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((shop) => (
                  <tr key={shop.id}>
                    {/* Shop code */}
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--primary)', fontSize: 13 }}>
                        {shop.code}
                      </span>
                    </td>

                    {/* Name */}
                    <td>
                      <div style={{ fontWeight: 700, fontSize: 13.5 }}>{shop.name}</div>
                    </td>

                    {/* Owner */}
                    <td style={{ fontWeight: 600 }}>{shop.ownerName}</td>

                    {/* Email / Phone */}
                    <td>
                      <div style={{ fontSize: 13 }}>{shop.email}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{shop.phone}</div>
                    </td>

                    {/* Admin */}
                    <td style={{ fontSize: 12 }}>
                      {shop.admin
                        ? <span style={{ fontWeight: 600 }}>{shop.admin.name}</span>
                        : <span style={{ color: 'var(--text-muted)' }}>Super Admin</span>}
                    </td>

                    {/* Order count */}
                    <td style={{ textAlign: 'right', fontWeight: 800, fontSize: 14 }}>
                      {fmtN(shop.ordersCount)}
                    </td>

                    {/* COD pending */}
                    <td style={{ textAlign: 'right' }}>
                      <span style={{ fontWeight: 700, color: '#d97706' }}>{fmt(shop.codPendingTotal)}</span>
                    </td>

                    {/* COD collected */}
                    <td style={{ textAlign: 'right' }}>
                      <span style={{ fontWeight: 700, color: 'var(--success)' }}>{fmt(shop.codTotal)}</span>
                    </td>

                    {/* Shipping fee */}
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>{fmt(shop.shippingFeeTotal)}</td>

                    {/* Carriers */}
                    <td>
                      {shop.carriers?.length ? (
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {shop.carriers.map((c) => (
                            <span key={c} className="badge mode-mock" style={{ fontSize: '10px', textTransform: 'uppercase' }}>{c}</span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Chưa phát sinh</span>
                      )}
                    </td>

                    {/* Status */}
                    <td>
                      <span className={`badge ${STATUS_CLS[shop.status] || 'status-pending'}`}>
                        {STATUS_LABEL[shop.status] || shop.status}
                      </span>
                    </td>

                    {/* Created date */}
                    <td style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {fmtDate(shop.createdAt)}
                    </td>

                    {/* Actions */}
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Link
                          href={`/admin/shops/${shop.id}`}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '11.5px', padding: '4px 8px', gap: 4, display: 'inline-flex', alignItems: 'center' }}
                        >
                          <Eye size={12} /> Chi tiết
                        </Link>
                        <Link
                          href={`/admin/shops/${shop.id}/pricing`}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '11.5px', padding: '4px 8px', gap: 4, display: 'inline-flex', alignItems: 'center' }}
                          title="Cấu hình bảng giá cước"
                        >
                          <Settings size={12} /> Bảng giá
                        </Link>
                        <Link
                          href={`/admin/shops/${shop.id}/flow-rules`}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '11.5px', padding: '4px 8px', gap: 4, display: 'inline-flex', alignItems: 'center' }}
                          title="Cấu hình phân luồng đơn hàng"
                        >
                          <GitMerge size={12} /> Phân luồng
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table footer */}
        {!loading && filtered.length > 0 && (
          <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', fontSize: 12.5, color: 'var(--text-muted)', display: 'flex', gap: 20 }}>
            <span>Tổng đơn hàng: <strong style={{ color: 'var(--text-primary)' }}>{fmtN(filtered.reduce((s, shop) => s + (shop.ordersCount || 0), 0))}</strong></span>
            <span>Tổng COD đã thu: <strong style={{ color: 'var(--success)' }}>{fmt(filtered.reduce((s, shop) => s + (shop.codTotal || 0), 0))}</strong></span>
            <span>Tổng cước phí: <strong style={{ color: 'var(--text-primary)' }}>{fmt(filtered.reduce((s, shop) => s + (shop.shippingFeeTotal || 0), 0))}</strong></span>
          </div>
        )}
      </div>

      {/* ─── Create Shop Modal ─── */}
      {modalOpen && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget && !submitting) setModalOpen(false); }}>
          <div className="modal" style={{ maxWidth: 620 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PlusCircle size={18} color="var(--primary)" />
                </div>
                <div>
                  <div className="modal-title">Tạo tài khoản shop mới</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Hệ thống tự tạo tài khoản đăng nhập cho chủ shop</div>
                </div>
              </div>
              <button type="button" className="modal-close" onClick={() => !submitting && setModalOpen(false)}>×</button>
            </div>

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {formError && (
                <div className="alert alert-danger" style={{ alignItems: 'flex-start', gap: 8, fontSize: 13 }}>
                  <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>{formError}</span>
                </div>
              )}
              {formSuccess && (
                <div className="alert alert-success" style={{ alignItems: 'flex-start', gap: 8, fontSize: 13 }}>
                  <CheckCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>{formSuccess}</span>
                </div>
              )}

              {/* Row 1: Code + Name */}
              <div className="form-grid form-grid-2">
                <div className="form-group">
                  <label className="form-label">Mã shop <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <input
                    className="form-control"
                    value={form.code}
                    onChange={(e) => dispatch({ type: 'set', field: 'code', value: e.target.value.toUpperCase() })}
                    placeholder="SHOP004"
                    required
                    disabled={submitting}
                    style={{ fontFamily: 'monospace', fontWeight: 700 }}
                  />
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>Mã viết hoa, không có khoảng trắng</div>
                </div>
                <div className="form-group">
                  <label className="form-label">Tên shop <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <input
                    className="form-control"
                    value={form.name}
                    onChange={(e) => dispatch({ type: 'set', field: 'name', value: e.target.value })}
                    placeholder="Tên shop kinh doanh"
                    required
                    disabled={submitting}
                  />
                </div>
              </div>

              {/* Row 2: Owner */}
              <div className="form-group">
                <label className="form-label">Chủ sở hữu <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input
                  className="form-control"
                  value={form.ownerName}
                  onChange={(e) => dispatch({ type: 'set', field: 'ownerName', value: e.target.value })}
                  placeholder="Họ và tên chủ shop"
                  required
                  disabled={submitting}
                />
              </div>

              {/* Row 3: Email + Phone */}
              <div className="form-grid form-grid-2">
                <div className="form-group">
                  <label className="form-label">Email đăng nhập <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <input
                    className="form-control"
                    type="email"
                    value={form.email}
                    onChange={(e) => dispatch({ type: 'set', field: 'email', value: e.target.value })}
                    placeholder="shop@example.com"
                    required
                    disabled={submitting}
                  />
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>Dùng để đăng nhập Shop Portal</div>
                </div>
                <div className="form-group">
                  <label className="form-label">Số điện thoại <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <input
                    className="form-control"
                    value={form.phone}
                    onChange={(e) => dispatch({ type: 'set', field: 'phone', value: e.target.value })}
                    placeholder="0901234567"
                    required
                    disabled={submitting}
                  />
                </div>
              </div>

              {/* Row 4: Password + Status */}
              <div className="form-grid form-grid-2">
                <div className="form-group">
                  <label className="form-label">
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      Mật khẩu khởi tạo <Lock size={11} color="var(--text-muted)" />
                    </span>
                  </label>
                  <input
                    className="form-control"
                    type="text"
                    value={form.password}
                    onChange={(e) => dispatch({ type: 'set', field: 'password', value: e.target.value })}
                    placeholder="Tối thiểu 6 ký tự"
                    required
                    disabled={submitting}
                    autoComplete="new-password"
                  />
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>Chủ shop nên đổi mật khẩu sau khi đăng nhập lần đầu</div>
                </div>
                <div className="form-group">
                  <label className="form-label">Trạng thái tài khoản</label>
                  <select
                    className="form-control"
                    value={form.status}
                    onChange={(e) => dispatch({ type: 'set', field: 'status', value: e.target.value })}
                    disabled={submitting}
                  >
                    <option value="active">Hoạt động — Shop có thể đăng nhập ngay</option>
                    <option value="inactive">Tạm khóa — Chưa cho phép đăng nhập</option>
                  </select>
                </div>
              </div>

              {/* Row 5: Admin assignment (SUPER_ADMIN only) */}
              {isSuperAdmin(user) && (
                <div className="form-group">
                  <label className="form-label">Giao cho Admin con <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>(bỏ trống = thuộc Super Admin)</span></label>
                  <select
                    className="form-control"
                    value={form.adminId}
                    onChange={(e) => dispatch({ type: 'set', field: 'adminId', value: e.target.value })}
                    disabled={submitting}
                  >
                    <option value="">-- Super Admin quản lý --</option>
                    {subAdmins.filter(a => a.status === 'active').map(a => (
                      <option key={a.id} value={a.id}>{a.name} ({a.email})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => !submitting && setModalOpen(false)} disabled={submitting}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting} style={{ gap: 6 }}>
                  {submitting
                    ? <><RefreshCw size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Đang tạo...</>
                    : <><PlusCircle size={14} /> Tạo shop</>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

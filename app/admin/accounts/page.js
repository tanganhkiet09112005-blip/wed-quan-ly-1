'use client';

import { useCallback, useEffect, useReducer, useState } from 'react';
import { AlertCircle, CheckCircle, Lock, PlusCircle, RefreshCw, Search, Shield, UserCheck, UserX, X } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

const fmtDate = (v) =>
  v ? new Date(v).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

const FORM_INIT = { name: '', email: '', password: '' };
function formReducer(state, action) {
  if (action.type === 'reset') return { ...FORM_INIT };
  if (action.type === 'set') return { ...state, [action.field]: action.value };
  return state;
}

export default function AdminAccountsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [form, dispatch] = useReducer(formReducer, FORM_INIT);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Guard: only super_admin (parentAdminId = null) can see this
  useEffect(() => {
    if (!authLoading && user) {
      if (user.role !== 'admin' || user.parentAdminId !== null && user.parentAdminId !== undefined) {
        router.replace('/admin/dashboard');
      }
    }
  }, [user, authLoading, router]);

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (search.trim()) params.set('search', search.trim());
      const res = await fetch(`/api/admin/accounts?${params}`);
      const json = await res.json();
      if (json.success) setAccounts(json.data || []);
      else setLoadError(json.error || 'Không thể tải danh sách Admin con.');
    } catch {
      setLoadError('Không thể kết nối máy chủ.');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => { const t = setTimeout(loadAccounts, 0); return () => clearTimeout(t); }, [loadAccounts]);

  const openCreate = () => {
    dispatch({ type: 'reset' });
    setFormError('');
    setFormSuccess('');
    setModalOpen(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!form.name.trim()) { setFormError('Vui lòng nhập tên Admin.'); return; }
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setFormError('Email không hợp lệ.'); return;
    }
    if (!form.password || form.password.length < 6) {
      setFormError('Mật khẩu phải có ít nhất 6 ký tự.'); return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setFormSuccess(`Đã tạo Admin con "${form.name}" thành công.`);
        await loadAccounts();
        setTimeout(() => { setModalOpen(false); setFormSuccess(''); }, 1800);
      } else {
        setFormError(result.error || 'Không thể tạo Admin con.');
      }
    } catch {
      setFormError('Không thể kết nối máy chủ.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (account) => {
    const newStatus = account.status === 'active' ? 'inactive' : 'active';
    const label = newStatus === 'active' ? 'mở khóa' : 'khóa';
    if (!confirm(`Bạn có chắc muốn ${label} tài khoản Admin "${account.name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/accounts/${account.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const result = await res.json();
      if (result.success) await loadAccounts();
      else alert(result.error || 'Không thể cập nhật trạng thái.');
    } catch {
      alert('Không thể kết nối máy chủ.');
    }
  };

  if (authLoading) return null;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              color: 'white', padding: '3px 10px', borderRadius: 6,
              fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px',
            }}>Super Admin</div>
          </div>
          <div className="page-title">Quản lý Admin con</div>
          <div className="page-subtitle">Tạo và quản lý tài khoản Admin con. Admin con có thể tạo và quản lý shop.</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" className="btn btn-secondary" onClick={loadAccounts} disabled={loading}>
            <RefreshCw size={14} style={{ animation: loading ? 'spin 0.8s linear infinite' : 'none' }} /> Tải lại
          </button>
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            <PlusCircle size={14} /> Thêm Admin con
          </button>
        </div>
      </div>

      {/* KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Tổng Admin con', value: accounts.length, icon: Shield, cls: 'kpi-icon-blue' },
          { label: 'Đang hoạt động', value: accounts.filter(a => a.status === 'active').length, icon: UserCheck, cls: 'kpi-icon-green' },
          { label: 'Tạm khóa', value: accounts.filter(a => a.status !== 'active').length, icon: UserX, cls: 'kpi-icon-red' },
        ].map(({ label, value, icon: Icon, cls }) => (
          <div key={label} className="kpi-card" style={{ padding: '14px 16px' }}>
            <div className={`kpi-icon ${cls}`} style={{ width: 36, height: 36 }}>
              <Icon size={16} />
            </div>
            <div className="kpi-content">
              <div className="kpi-value" style={{ fontSize: 18 }}>{loading ? <div className="skeleton" style={{ height: 22, width: 40 }} /> : value}</div>
              <div className="kpi-label" style={{ fontSize: 12 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {loadError && !loading && (
        <div className="card mb-16">
          <div className="empty-state" style={{ padding: 24 }}>
            <div className="empty-state-icon" style={{ background: 'var(--danger-light)', color: 'var(--danger)' }}>
              <AlertCircle size={28} />
            </div>
            <h3>Không thể tải danh sách</h3>
            <p>{loadError}</p>
            <button type="button" className="btn btn-primary" onClick={loadAccounts}><RefreshCw size={14} /> Thử lại</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14.5 }}>Danh sách Admin con</div>
              {!loading && <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>{accounts.length} tài khoản</div>}
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <div className="search-wrapper" style={{ width: 260 }}>
                <Search size={15} className="search-icon" />
                <input className="search-input" placeholder="Tìm tên, email..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <select className="form-control" style={{ width: 150 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="all">Tất cả</option>
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
                <th>Tên Admin con</th>
                <th>Email</th>
                <th style={{ textAlign: 'center' }}>Số shop quản lý</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 6 }).map((__, j) => (
                    <td key={j}><div className="skeleton" style={{ height: 16, borderRadius: 4 }} /></td>
                  ))}</tr>
                ))
              ) : accounts.length === 0 ? (
                <tr><td colSpan={6}>
                  <div className="empty-state" style={{ padding: '44px 20px' }}>
                    <div className="empty-state-icon"><Shield size={28} /></div>
                    <h3>Chưa có Admin con nào</h3>
                    <p>Bấm &quot;Thêm Admin con&quot; để tạo tài khoản quản lý trực tiếp các shop.</p>
                    <button type="button" className="btn btn-primary" onClick={openCreate}><PlusCircle size={14} /> Thêm Admin con</button>
                  </div>
                </td></tr>
              ) : (
                accounts.map((account) => (
                  <tr key={account.id}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{account.name}</div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{account.email}</td>
                    <td style={{ textAlign: 'center', fontWeight: 800, fontSize: 14 }}>
                      {account._count?.managedShops ?? 0}
                    </td>
                    <td>
                      <span className={`badge ${account.status === 'active' ? 'status-delivered' : 'status-cancelled'}`}>
                        {account.status === 'active' ? 'Hoạt động' : 'Tạm khóa'}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{fmtDate(account.createdAt)}</td>
                    <td>
                      <button
                        type="button"
                        className={`btn btn-sm ${account.status === 'active' ? 'btn-secondary' : 'btn-primary'}`}
                        style={{ fontSize: 11.5, padding: '4px 8px', gap: 4, display: 'inline-flex', alignItems: 'center' }}
                        onClick={() => handleToggleStatus(account)}
                      >
                        {account.status === 'active' ? <><Lock size={11} /> Khóa</> : <><UserCheck size={11} /> Mở khóa</>}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget && !submitting) setModalOpen(false); }}>
          <div className="modal" style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PlusCircle size={18} color="var(--primary)" />
                </div>
                <div>
                  <div className="modal-title">Tạo Admin con</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Admin con có thể tạo và quản lý shop</div>
                </div>
              </div>
              <button type="button" className="modal-close" onClick={() => !submitting && setModalOpen(false)}>×</button>
            </div>

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {formError && (
                <div className="alert alert-danger" style={{ alignItems: 'flex-start', gap: 8, fontSize: 13 }}>
                  <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} /><span>{formError}</span>
                </div>
              )}
              {formSuccess && (
                <div className="alert alert-success" style={{ alignItems: 'flex-start', gap: 8, fontSize: 13 }}>
                  <CheckCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} /><span>{formSuccess}</span>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Họ tên Admin <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input className="form-control" value={form.name} onChange={e => dispatch({ type: 'set', field: 'name', value: e.target.value })} placeholder="Nguyễn Văn Admin" disabled={submitting} />
              </div>
              <div className="form-group">
                <label className="form-label">Email đăng nhập <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input className="form-control" type="email" value={form.email} onChange={e => dispatch({ type: 'set', field: 'email', value: e.target.value })} placeholder="admin@example.com" disabled={submitting} />
              </div>
              <div className="form-group">
                <label className="form-label">Mật khẩu khởi tạo <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input className="form-control" type="text" value={form.password} onChange={e => dispatch({ type: 'set', field: 'password', value: e.target.value })} placeholder="Tối thiểu 6 ký tự" disabled={submitting} autoComplete="new-password" />
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>Admin nên đổi mật khẩu sau lần đăng nhập đầu tiên</div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => !submitting && setModalOpen(false)} disabled={submitting}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={submitting} style={{ gap: 6 }}>
                  {submitting
                    ? <><RefreshCw size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Đang tạo...</>
                    : <><PlusCircle size={14} /> Tạo Admin con</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';

const formatNumber = (value) => new Intl.NumberFormat('vi-VN').format(value || 0);

export default function CustomersPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', status: 'active', blacklistReason: '' });
  const [saving, setSaving] = useState(false);

  const fetchCustomers = useCallback(async () => {
    if (!user?.shopId) return;
    setLoading(true);
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();
      if (data.success) {
        setCustomers(data.data || []);
        setError('');
      } else {
        setError(data.error || 'Không thể tải khách hàng.');
      }
    } catch {
      setError('Không thể kết nối máy chủ.');
    } finally {
      setLoading(false);
    }
  }, [user?.shopId]);

  useEffect(() => {
    if (authLoading) return undefined;
    const timer = setTimeout(() => {
      fetchCustomers();
    }, 0);
    return () => clearTimeout(timer);
  }, [authLoading, fetchCustomers]);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return customers;
    return customers.filter((customer) =>
      customer.name?.toLowerCase().includes(keyword)
      || customer.phone?.includes(keyword)
      || customer.code?.toLowerCase().includes(keyword)
    );
  }, [customers, search]);

  const totalOrders = customers.reduce((sum, customer) => sum + (customer._count?.orders || 0), 0);
  const blacklistCount = customers.filter((customer) => customer.status === 'blacklist').length;
  const repeatCustomers = customers.filter((customer) => (customer._count?.orders || 0) >= 2).length;

  const openAddModal = () => {
    setForm({ name: '', phone: '', email: '', address: '', status: 'active', blacklistReason: '' });
    setShowAddModal(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      toast.warning('Vui lòng nhập tên khách và số điện thoại.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setCustomers((prev) => [data.data, ...prev.filter((customer) => customer.id !== data.data.id)]);
        setShowAddModal(false);
        toast.success('Đã lưu khách hàng.');
      } else {
        toast.error(data.error || 'Không thể lưu khách hàng.');
      }
    } catch {
      toast.error('Không thể kết nối máy chủ.');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="page-container" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text-muted)' }}>Đang tải danh sách khách hàng...</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: 22 }}>
        <div>
          <div className="page-title">Khách hàng của shop</div>
          <div className="page-subtitle">Danh sách khách hàng được scope theo shop hiện tại, liên kết với đơn hàng qua SĐT.</div>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>Thêm khách hàng</button>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: 8, padding: '12px 16px', marginBottom: 20 }}>
          {error}
        </div>
      )}

      <div className="grid-kpi" style={{ marginBottom: 24 }}>
        <div className="kpi-card"><div className="kpi-icon kpi-icon-blue">K</div><div className="kpi-content"><div className="kpi-value">{formatNumber(customers.length)}</div><div className="kpi-label">Tổng khách hàng</div></div></div>
        <div className="kpi-card"><div className="kpi-icon kpi-icon-green">M</div><div className="kpi-content"><div className="kpi-value">{formatNumber(repeatCustomers)}</div><div className="kpi-label">Khách mua lại</div></div></div>
        <div className="kpi-card"><div className="kpi-icon kpi-icon-yellow">Đ</div><div className="kpi-content"><div className="kpi-value">{formatNumber(totalOrders)}</div><div className="kpi-label">Tổng đơn liên kết</div></div></div>
        <div className="kpi-card"><div className="kpi-icon kpi-icon-purple">B</div><div className="kpi-content"><div className="kpi-value">{formatNumber(blacklistCount)}</div><div className="kpi-label">Khách bom hàng</div></div></div>
      </div>

      <div className="filter-bar">
        <div className="search-wrapper">
          <input className="search-input" placeholder="Tìm tên, SĐT, mã khách..." value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Mã KH</th>
                <th>Khách hàng</th>
                <th>Liên hệ</th>
                <th>Địa chỉ</th>
                <th style={{ textAlign: 'center' }}>Số đơn</th>
                <th>Ngày tham gia</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Chưa có khách hàng phù hợp bộ lọc.</td></tr>
              ) : filtered.map((customer) => (
                <tr key={customer.id}>
                  <td><span style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--primary)' }}>{customer.code}</span></td>
                  <td style={{ fontWeight: 700 }}>{customer.name}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{customer.phone || '-'}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{customer.email || '-'}</div>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{customer.address || '-'}</td>
                  <td style={{ textAlign: 'center', fontWeight: 800 }}>{customer._count?.orders || 0}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{customer.createdAt ? new Date(customer.createdAt).toLocaleDateString('vi-VN') : '-'}</td>
                  <td>
                    {customer.status === 'blacklist' ? (
                      <span className="badge status-issue">Khách bom hàng</span>
                    ) : customer.status === 'active' ? (
                      <span className="badge status-delivered">Hoạt động</span>
                    ) : (
                      <span className="badge status-cancelled">Ngừng hoạt động</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <div className="modal-title">Thêm khách hàng</div>
              <button type="button" className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Họ tên *</label>
                <input className="form-control" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} placeholder="Nguyễn Văn A" required />
              </div>
              <div className="form-group">
                <label className="form-label">Số điện thoại *</label>
                <input className="form-control" value={form.phone} onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))} placeholder="0901234567" required />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-control" type="email" value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} placeholder="customer@example.com" />
              </div>
              <div className="form-group">
                <label className="form-label">Địa chỉ</label>
                <input className="form-control" value={form.address} onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))} placeholder="Địa chỉ giao hàng" />
              </div>
              <div className="form-group">
                <label className="form-label">Trạng thái</label>
                <select className="form-control" value={form.status} onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}>
                  <option value="active">Hoạt động</option>
                  <option value="blacklist">Khách bom hàng</option>
                  <option value="inactive">Ngừng hoạt động</option>
                </select>
              </div>
              {form.status === 'blacklist' && (
                <div className="form-group">
                  <label className="form-label">Lý do blacklist</label>
                  <input className="form-control" value={form.blacklistReason} onChange={(event) => setForm((prev) => ({ ...prev, blacklistReason: event.target.value }))} placeholder="Ví dụ: bom hàng 2 lần" />
                </div>
              )}
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)} disabled={saving}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu khách hàng'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

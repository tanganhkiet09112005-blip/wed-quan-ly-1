'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';
import { AlertCircle, Edit, Plus, RefreshCw, Search, ShieldAlert, Trash2 } from 'lucide-react';

export default function BlacklistPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', address: '', blacklistReason: '' });
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const q = new URLSearchParams({ status: 'blacklist' });
      if (search.trim()) q.append('search', search.trim());

      const res = await fetch(`/api/customers?${q.toString()}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error || 'Lỗi tải danh sách blacklist');
      }
    } catch {
      setError('Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    if (user) fetchData();
  }, [user, fetchData]);

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingId(item.id);
      setForm({
        name: item.name || '',
        phone: item.phone || '',
        address: item.address || '',
        blacklistReason: item.blacklistReason || '',
      });
    } else {
      setEditingId(null);
      setForm({ name: '', phone: '', address: '', blacklistReason: '' });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.phone.trim()) {
      toast.error('Số điện thoại là bắt buộc');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, status: 'blacklist' };
      const url = editingId ? `/api/customers/${editingId}` : '/api/customers';
      const method = editingId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(editingId ? 'Cập nhật thành công' : 'Thêm vào blacklist thành công');
        setIsModalOpen(false);
        fetchData();
      } else {
        toast.error(json.error || 'Lỗi lưu thông tin');
      }
    } catch {
      toast.error('Lỗi kết nối máy chủ');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveBlacklist = async (id, name) => {
    if (!window.confirm(`Bạn có chắc muốn gỡ "${name}" khỏi danh sách đen?`)) return;
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active', blacklistReason: '' }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Đã gỡ khỏi blacklist');
        fetchData();
      } else {
        toast.error(json.error || 'Lỗi cập nhật');
      }
    } catch {
      toast.error('Lỗi kết nối');
    }
  };

  if (!user) return null;

  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <div className="page-title">Khách hàng rủi ro (Blacklist)</div>
          <div className="page-subtitle">Danh sách khách bom hàng, có rủi ro hoàn đơn cao</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" className="btn btn-secondary" onClick={fetchData} disabled={loading}>
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Tải lại
          </button>
          <button type="button" className="btn btn-primary" onClick={() => handleOpenModal()}>
            <Plus size={14} /> Thêm khách rủi ro
          </button>
        </div>
      </div>

      <div className="card mb-16" style={{ padding: '16px 20px', display: 'flex', gap: 12, alignItems: 'center' }}>
        <div className="form-group" style={{ flex: 1, marginBottom: 0, position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--text-muted)' }} />
          <input
            className="form-control"
            style={{ paddingLeft: 36 }}
            placeholder="Tìm theo tên, SĐT trong blacklist..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchData()}
          />
        </div>
      </div>

      {error && <div className="alert alert-danger mb-16"><AlertCircle size={14} /> {error}</div>}

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Khách hàng</th>
                <th>Liên hệ</th>
                <th>Lý do Blacklist</th>
                <th style={{ textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading && data.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}><RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> Đang tải...</td></tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: 60 }}>
                    <div style={{ display: 'inline-flex', padding: 20, background: 'var(--bg-input)', borderRadius: '50%', marginBottom: 16 }}>
                      <ShieldAlert size={32} color="var(--text-muted)" />
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Danh sách an toàn</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Chưa có khách hàng nào bị đánh dấu rủi ro.</div>
                  </td>
                </tr>
              ) : data.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{item.name || 'Khách vãng lai'}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.code}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{item.phone}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.address}</div>
                  </td>
                  <td>
                    <span style={{ fontSize: 13, color: 'var(--danger)' }}>{item.blacklistReason || 'Không rõ lý do'}</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleOpenModal(item)}>
                        <Edit size={13} /> Sửa
                      </button>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleRemoveBlacklist(item.id, item.name)} style={{ color: 'var(--success)', borderColor: 'var(--success)' }}>
                        <RefreshCw size={13} /> Gỡ
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h3 className="modal-title">{editingId ? 'Sửa thông tin' : 'Thêm khách rủi ro (Blacklist)'}</h3>
              <button type="button" className="modal-close" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Tên khách hàng</label>
                  <input
                    className="form-control"
                    placeholder="Nguyễn Văn A"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Số điện thoại *</label>
                  <input
                    className="form-control"
                    placeholder="09..."
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Lý do đưa vào danh sách đen</label>
                  <textarea
                    className="form-control"
                    placeholder="Bom hàng, không nghe máy, thái độ kém..."
                    value={form.blacklistReason}
                    onChange={(e) => setForm({ ...form, blacklistReason: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Địa chỉ (Tùy chọn)</label>
                  <input
                    className="form-control"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer" style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)} disabled={saving}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Đang lưu...' : 'Lưu lại'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

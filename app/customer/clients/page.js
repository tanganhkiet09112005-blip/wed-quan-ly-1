'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';
import { AlertCircle, RefreshCw, Search, ShieldAlert, User, Users } from 'lucide-react';

const fmt = (v) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(v || 0);

export default function ClientsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const q = new URLSearchParams();
      if (search.trim()) q.append('search', search.trim());
      if (filterStatus !== 'all') q.append('status', filterStatus);

      const res = await fetch(`/api/customers?${q.toString()}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error || 'Lỗi tải danh sách khách hàng');
      }
    } catch {
      setError('Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus]);

  useEffect(() => {
    if (user) fetchData();
  }, [user, fetchData]);

  if (!user) return null;

  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <div className="page-title">Khách hàng</div>
          <div className="page-subtitle">Quản lý danh sách khách hàng đã mua tại shop</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" className="btn btn-secondary" onClick={fetchData} disabled={loading}>
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Tải lại
          </button>
        </div>
      </div>

      <div className="card mb-16" style={{ padding: '16px 20px', display: 'flex', gap: 12, alignItems: 'center' }}>
        <div className="form-group" style={{ flex: 1, marginBottom: 0, position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--text-muted)' }} />
          <input
            className="form-control"
            style={{ paddingLeft: 36 }}
            placeholder="Tìm theo tên, SĐT, mã khách..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchData()}
          />
        </div>
        <div className="form-group" style={{ width: 200, marginBottom: 0 }}>
          <select className="form-control" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Bình thường</option>
            <option value="blacklist">Blacklist (Bom hàng)</option>
          </select>
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
                <th>Trạng thái</th>
                <th style={{ textAlign: 'right' }}>Số đơn</th>
                <th>Ngày tạo</th>
              </tr>
            </thead>
            <tbody>
              {loading && data.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}><RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> Đang tải...</td></tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: 60 }}>
                    <div style={{ display: 'inline-flex', padding: 20, background: 'var(--bg-input)', borderRadius: '50%', marginBottom: 16 }}>
                      <Users size={32} color="var(--text-muted)" />
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Chưa có khách hàng</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Danh sách khách hàng sẽ tự động cập nhật khi có đơn hàng mới.</div>
                  </td>
                </tr>
              ) : data.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{item.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.code}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{item.phone}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.address}</div>
                  </td>
                  <td>
                    {item.status === 'blacklist' ? (
                      <span className="badge status-cancelled" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><ShieldAlert size={12} /> Blacklist</span>
                    ) : item.status === 'active' ? (
                      <span className="badge status-delivered">Bình thường</span>
                    ) : (
                      <span className="badge status-pending">{item.status}</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{item._count?.orders || 0}</td>
                  <td>{new Date(item.createdAt).toLocaleDateString('vi-VN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

export default function BlacklistPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadBlacklist = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/customers?status=blacklist');
      const data = await res.json();
      if (data.success) {
        setCustomers(data.data || []);
        setError('');
      } else {
        setError(data.error || 'Không thể tải danh sách khách bom hàng.');
      }
    } catch {
      setError('Không thể kết nối máy chủ.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadBlacklist();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadBlacklist]);

  if (loading) {
    return (
      <div className="page-container" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text-muted)' }}>Đang tải danh sách khách bom hàng...</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: 22 }}>
        <div>
          <div className="page-title">Khách bom hàng</div>
          <div className="page-subtitle">Blacklist riêng theo shop, dùng để cảnh báo khi tạo đơn mới.</div>
        </div>
        <Link href="/customer/partners/customers" className="btn btn-primary">Thêm từ danh sách khách</Link>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: 8, padding: '12px 16px', marginBottom: 20 }}>
          {error}
        </div>
      )}

      <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '14px 18px', marginBottom: 24 }}>
        <div style={{ fontWeight: 800, color: '#b91c1c', marginBottom: 4 }}>Cảnh báo tự động khi tạo đơn</div>
        <div style={{ fontSize: 13, color: '#64748b' }}>
          Nếu SĐT người nhận trùng khách trong danh sách này, form tạo đơn sẽ hiển thị cảnh báo cho nhân viên shop.
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Khách hàng</th>
                <th>SĐT cảnh báo</th>
                <th>Địa chỉ</th>
                <th>Lý do / ghi chú</th>
                <th style={{ textAlign: 'center' }}>Số đơn</th>
                <th>Ngày thêm</th>
                <th>Mức độ</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Danh sách khách bom hàng đang trống.</td></tr>
              ) : customers.map((customer) => (
                <tr key={customer.id}>
                  <td style={{ fontWeight: 700 }}>{customer.name || 'Không rõ'}</td>
                  <td><span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#b91c1c', background: '#fef2f2', padding: '3px 8px', borderRadius: 4, border: '1px solid #fecaca' }}>{customer.phone}</span></td>
                  <td style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 240 }}>{customer.address || '-'}</td>
                  <td style={{ fontSize: 13, color: '#b91c1c', maxWidth: 220 }}>{customer.blacklistReason || 'Có lịch sử không nhận hàng'}</td>
                  <td style={{ textAlign: 'center', fontWeight: 800 }}>{customer._count?.orders || 0}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{customer.createdAt ? new Date(customer.createdAt).toLocaleDateString('vi-VN') : '-'}</td>
                  <td><span className="badge status-issue">Cảnh báo</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

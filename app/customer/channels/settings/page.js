'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';

export default function IntegrationsSettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [form, setForm] = useState({
    fbPageId: '',
    fbAccessToken: '',
    pancakeToken: '',
    fbStatus: 'inactive',
    misaAppId: '',
    misaApiKey: '',
    misaCompanyCode: '',
    misaStatus: 'inactive',
  });

  useEffect(() => {
    if (user?.shopId) {
      const t = setTimeout(() => {
        setLoading(true);
        fetch('/api/integrations')
          .then((res) => res.json())
          .then((data) => {
            if (data.success && data.data) {
              setForm({
                fbPageId: data.data.fbPageId || '',
                fbAccessToken: data.data.fbAccessToken || '',
                pancakeToken: data.data.pancakeToken || '',
                fbStatus: data.data.fbStatus || 'inactive',
                misaAppId: data.data.misaAppId || '',
                misaApiKey: data.data.misaApiKey || '',
                misaCompanyCode: data.data.misaCompanyCode || '',
                misaStatus: data.data.misaStatus || 'inactive',
              });
            }
            setLoading(false);
          })
          .catch(() => setLoading(false));
      }, 0);
      return () => clearTimeout(t);
    }
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user?.shopId) {
      setMessage({ type: 'error', text: 'Không tìm thấy shopId của bạn' });
      return;
    }

    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Lưu cấu hình tích hợp thành công!' });
      } else {
        setMessage({ type: 'error', text: 'Lỗi: ' + data.error });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Lỗi kết nối. Vui lòng thử lại.' });
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ fontSize: 18, color: 'var(--text-muted)' }}>Vui lòng đăng nhập để xem cấu hình tích hợp.</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ fontSize: 18, color: 'var(--text-muted)' }}>Đang tải cấu hình tích hợp...</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <div className="page-title">Cấu hình Tích hợp Hệ thống</div>
          <div className="page-subtitle">Tự quản lý API keys của Cửa hàng: Facebook và MISA Kế toán</div>
        </div>
      </div>

      {message.text && (
        <div style={{
          padding: '12px 16px',
          borderRadius: 8,
          marginBottom: 20,
          background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          color: message.type === 'success' ? '#34d399' : '#f87171',
          border: `1px solid ${message.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
          fontWeight: 600,
          fontSize: 14,
        }}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div className="grid-2">
          {/* Section: Facebook */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(24, 119, 242, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 'bold', color: '#1877f2' }}>
                  f
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>Kênh Facebook</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Livestream và Tự động chốt đơn trên Fanpage</div>
                </div>
              </div>
              {form.fbStatus === 'active' ? (
                <span className="badge" style={{ background: 'rgba(16,185,129,0.1)', color: '#34d399' }}>Đang kết nối</span>
              ) : (
                <span className="badge" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>Ngắt kết nối</span>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Facebook Page ID</label>
                <input
                  className="form-control"
                  placeholder="Nhập Facebook Page ID (ví dụ: 102948293028)"
                  value={form.fbPageId}
                  onChange={(e) => setForm(prev => ({ ...prev, fbPageId: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Facebook Page Access Token</label>
                <textarea
                  className="form-control"
                  style={{ minHeight: 80, resize: 'vertical' }}
                  placeholder="Nhập Access Token của Trang..."
                  value={form.fbAccessToken}
                  onChange={(e) => setForm(prev => ({ ...prev, fbAccessToken: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Trạng thái kết nối</label>
                <select
                  className="form-control"
                  value={form.fbStatus}
                  onChange={(e) => setForm(prev => ({ ...prev, fbStatus: e.target.value }))}
                  style={{ width: '100%', height: 42, background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 8, padding: '0 12px', color: 'var(--text-primary)' }}
                >
                  <option value="active">Kích hoạt Facebook</option>
                  <option value="inactive">Tạm dừng kết nối</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section: MISA SME */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 'bold', color: '#ef4444' }}>
                  M
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>Kế toán MISA SME</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Tự động đồng bộ hóa hóa đơn điện tử</div>
                </div>
              </div>
              {form.misaStatus === 'active' ? (
                <span className="badge" style={{ background: 'rgba(16,185,129,0.1)', color: '#34d399' }}>Đang kết nối</span>
              ) : (
                <span className="badge" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>Ngắt kết nối</span>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">MISA App ID</label>
                <input
                  className="form-control"
                  placeholder="Nhập MISA App ID..."
                  value={form.misaAppId}
                  onChange={(e) => setForm(prev => ({ ...prev, misaAppId: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">MISA API Key</label>
                <textarea
                  className="form-control"
                  style={{ minHeight: 80, resize: 'vertical' }}
                  placeholder="Nhập MISA API Key..."
                  value={form.misaApiKey}
                  onChange={(e) => setForm(prev => ({ ...prev, misaApiKey: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">MISA Company Code</label>
                <input
                  className="form-control"
                  placeholder="Nhập mã công ty MISA (Mã số thuế)..."
                  value={form.misaCompanyCode}
                  onChange={(e) => setForm(prev => ({ ...prev, misaCompanyCode: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Trạng thái kế toán</label>
                <select
                  className="form-control"
                  value={form.misaStatus}
                  onChange={(e) => setForm(prev => ({ ...prev, misaStatus: e.target.value }))}
                  style={{ width: '100%', height: 42, background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 8, padding: '0 12px', color: 'var(--text-primary)' }}
                >
                  <option value="active">Kích hoạt đồng bộ MISA</option>
                  <option value="inactive">Tạm dừng kết nối</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary"
            style={{ minWidth: 150, padding: '12px 24px', fontSize: 15, justifyContent: 'center' }}
          >
            {saving ? 'Đang lưu...' : 'Lưu tất cả cấu hình'}
          </button>
        </div>
      </form>
    </div>
  );
}

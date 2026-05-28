'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';

export default function ProfileSettingsPage() {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [form, setForm] = useState({
    name: '',
    email: '',
    shopName: '',
    ownerName: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Fetch full details of User and Shop on mount
  useEffect(() => {
    if (user?.id) {
      setLoading(true);
      fetch('/api/auth/profile')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            const u = data.data;
            setForm({
              name: u.name || '',
              email: u.email || '',
              shopName: u.shop?.name || '',
              ownerName: u.shop?.ownerName || '',
              phone: u.shop?.phone || '',
              currentPassword: '',
              newPassword: '',
              confirmPassword: ''
            });
          } else {
            setMessage({ type: 'error', text: 'Không thể tải thông tin tài khoản.' });
          }
          setLoading(false);
        })
        .catch(() => {
          setMessage({ type: 'error', text: 'Lỗi kết nối. Không thể tải thông tin.' });
          setLoading(false);
        });
    }
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!user?.id || !user?.shopId) {
      setMessage({ type: 'error', text: 'Không xác định được danh tính người dùng hoặc cửa hàng.' });
      return;
    }

    // Basic frontend validations
    if (!form.name.trim() || !form.shopName.trim() || !form.ownerName.trim() || !form.phone.trim()) {
      setMessage({ type: 'error', text: 'Vui lòng điền đầy đủ các thông tin bắt buộc.' });
      return;
    }

    if (!form.currentPassword) {
      setMessage({ type: 'error', text: 'Vui lòng nhập Mật khẩu hiện tại để lưu các thay đổi.' });
      return;
    }

    if (form.newPassword) {
      if (form.newPassword.length < 6) {
        setMessage({ type: 'error', text: 'Mật khẩu mới phải từ 6 ký tự trở lên.' });
        return;
      }
      if (form.newPassword !== form.confirmPassword) {
        setMessage({ type: 'error', text: 'Mật khẩu xác nhận không khớp với mật khẩu mới.' });
        return;
      }
    }

    setSaving(true);

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          shopName: form.shopName,
          ownerName: form.ownerName,
          phone: form.phone,
          currentPassword: form.currentPassword,
          newPassword: form.newPassword
        })
      });

      const data = await res.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Cập nhật tài khoản và cửa hàng thành công!' });
        
        // Expose updated data directly to standard context (keeps name & logo in sync)
        updateUser(data.data);

        // Reset password fields
        setForm(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
      } else {
        setMessage({ type: 'error', text: data.error || 'Đã xảy ra lỗi khi cập nhật thông tin.' });
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
        <div style={{ fontSize: 18, color: 'var(--text-muted)' }}>Vui lòng đăng nhập để xem thông tin hồ sơ.</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ fontSize: 18, color: 'var(--text-muted)' }}>Đang tải thông tin tài khoản...</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <div className="page-title">Cài đặt Tài khoản & Cửa hàng</div>
          <div className="page-subtitle">Quản lý hồ sơ cá nhân, tên shop hiển thị và cấu hình bảo mật tài khoản của bạn</div>
        </div>
      </div>

      {message.text && (
        <div style={{
          padding: '14px 18px',
          borderRadius: 10,
          marginBottom: 24,
          background: message.type === 'success' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
          color: message.type === 'success' ? '#10b981' : '#f87171',
          border: `1px solid ${message.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'}`,
          fontWeight: 600,
          fontSize: 14,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.02)',
          display: 'flex',
          alignItems: 'center',
          gap: 10
        }}>
          <span style={{ fontSize: 16 }}>{message.type === 'success' ? '✓' : '⚠️'}</span>
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div className="grid-2">
          {/* CỘT TRÁI: THÔNG TIN CỬA HÀNG & CÁ NHÂN */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Thẻ: Thông tin cửa hàng */}
            <div className="card" style={{ backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>Thông tin Cửa hàng</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Cấu hình nhận diện thương hiệu của bạn</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Tên Shop <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    className="form-control"
                    placeholder="Nhập tên shop hiển thị (ví dụ: Shop Thời Trang GenZ)"
                    value={form.shopName}
                    onChange={(e) => setForm(prev => ({ ...prev, shopName: e.target.value }))}
                    style={{ height: 42 }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Tên Chủ Shop <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    className="form-control"
                    placeholder="Nhập họ & tên chủ sở hữu shop"
                    value={form.ownerName}
                    onChange={(e) => setForm(prev => ({ ...prev, ownerName: e.target.value }))}
                    style={{ height: 42 }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Số Điện Thoại Shop <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    className="form-control"
                    placeholder="Nhập số điện thoại liên hệ của cửa hàng"
                    value={form.phone}
                    onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
                    style={{ height: 42 }}
                  />
                </div>
              </div>
            </div>

            {/* Thẻ: Thông tin cá nhân */}
            <div className="card" style={{ backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>Tài khoản Cá nhân</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Thông tin đăng nhập của thành viên</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Họ và Tên <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    className="form-control"
                    placeholder="Nhập họ và tên của bạn"
                    value={form.name}
                    onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                    style={{ height: 42 }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Địa chỉ Email (Đăng nhập)</label>
                  <input
                    className="form-control"
                    value={form.email}
                    disabled
                    style={{
                      height: 42,
                      background: 'rgba(255, 255, 255, 0.03)',
                      color: 'var(--text-muted)',
                      cursor: 'not-allowed',
                      border: '1px dashed var(--border)'
                    }}
                  />
                  <small style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 4, display: 'block' }}>
                    Email được dùng làm tên đăng nhập cố định và không thể tự thay đổi.
                  </small>
                </div>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: BẢO MẬT & ĐỔI MẬT KHẨU */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div className="card" style={{ height: '100%', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>Bảo mật & Đổi mật khẩu</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Cập nhật mật khẩu bảo vệ tài khoản</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {/* Đổi mật khẩu mới */}
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Mật khẩu mới (Để trống nếu không đổi)</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showNew ? 'text' : 'password'}
                      className="form-control"
                      placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                      value={form.newPassword}
                      onChange={(e) => setForm(prev => ({ ...prev, newPassword: e.target.value }))}
                      style={{ height: 42, paddingRight: 60 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      style={{
                        position: 'absolute',
                        right: 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: 6,
                        color: 'var(--text-primary)',
                        padding: '4px 8px',
                        cursor: 'pointer',
                        fontSize: 11,
                        fontWeight: 600,
                        transition: 'all 0.2s'
                      }}
                    >
                      {showNew ? 'Ẩn' : 'Hiện'}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Xác nhận mật khẩu mới</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      className="form-control"
                      placeholder="Nhập lại mật khẩu mới để xác nhận"
                      value={form.confirmPassword}
                      onChange={(e) => setForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      style={{ height: 42, paddingRight: 60 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      style={{
                        position: 'absolute',
                        right: 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: 6,
                        color: 'var(--text-primary)',
                        padding: '4px 8px',
                        cursor: 'pointer',
                        fontSize: 11,
                        fontWeight: 600,
                        transition: 'all 0.2s'
                      }}
                    >
                      {showConfirm ? 'Ẩn' : 'Hiện'}
                    </button>
                  </div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '12px 0' }} />

                {/* Mật khẩu hiện tại (Bắt buộc để lưu) */}
                <div className="form-group" style={{ background: 'rgba(239, 68, 68, 0.02)', padding: 14, borderRadius: 8, border: '1px dashed rgba(239, 68, 68, 0.15)' }}>
                  <label className="form-label" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                    Xác nhận Mật khẩu hiện tại <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ position: 'relative', marginTop: 6 }}>
                    <input
                      type={showCurrent ? 'text' : 'password'}
                      className="form-control"
                      placeholder="Nhập mật khẩu hiện tại để xác minh bảo mật"
                      value={form.currentPassword}
                      onChange={(e) => setForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                      style={{ height: 42, paddingRight: 60, borderColor: 'rgba(239, 68, 68, 0.3)' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent(!showCurrent)}
                      style={{
                        position: 'absolute',
                        right: 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: 6,
                        color: 'var(--text-primary)',
                        padding: '4px 8px',
                        cursor: 'pointer',
                        fontSize: 11,
                        fontWeight: 600,
                        transition: 'all 0.2s'
                      }}
                    >
                      {showCurrent ? 'Ẩn' : 'Hiện'}
                    </button>
                  </div>
                  <small style={{ color: '#f87171', fontSize: 11, marginTop: 6, display: 'block', fontWeight: 500 }}>
                    Bạn bắt buộc phải nhập đúng mật khẩu đang sử dụng hiện tại để xác nhận bất cứ thay đổi nào.
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Nút lưu */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary"
            style={{
              minWidth: 160,
              padding: '12px 24px',
              fontSize: 15,
              fontWeight: 700,
              borderRadius: 8,
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25)',
              transition: 'all 0.3s'
            }}
          >
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </form>
    </div>
  );
}

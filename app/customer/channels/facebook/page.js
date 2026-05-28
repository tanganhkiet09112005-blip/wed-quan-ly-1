'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';

export default function FacebookChannelPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingPage, setSavingPage] = useState(false);
  const [savingBot, setSavingBot] = useState(false);

  // Form kết nối page
  const [pageForm, setPageForm] = useState({
    pageId: '',
    pageName: '',
    accessToken: '',
  });

  // Cấu hình Bot
  const [botSettings, setBotSettings] = useState({
    botEnabled: true,
    autoReply: false,
    welcomeMessage: '',
    missingPhoneMessage: '',
    missingAddressMessage: '',
    orderConfirmMessage: '',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Tải các fanpage đã kết nối
      const pagesRes = await fetch('/api/facebook/pages');
      const pagesData = await pagesRes.json();
      if (pagesData.success) {
        setPages(pagesData.data || []);
      }

      // Tải cài đặt bot
      const botRes = await fetch('/api/facebook/settings');
      const botData = await botRes.json();
      if (botData.success && botData.data) {
        setBotSettings(botData.data);
      }
    } catch {
      toast.error('Lỗi kết nối máy chủ.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  const handleConnectPage = async (e) => {
    e.preventDefault();
    if (!pageForm.pageId.trim() || !pageForm.pageName.trim() || !pageForm.accessToken.trim()) {
      toast.error('Vui lòng nhập đầy đủ thông tin Fanpage.');
      return;
    }

    setSavingPage(true);
    try {
      const res = await fetch('/api/facebook/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pageForm),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Đã liên kết Fanpage thành công!');
        setPageForm({ pageId: '', pageName: '', accessToken: '' });
        fetchData();
      } else {
        toast.error(data.error || 'Liên kết thất bại.');
      }
    } catch {
      toast.error('Lỗi hệ thống.');
    } finally {
      setSavingPage(false);
    }
  };

  const handleDisconnectPage = async (id) => {
    if (!confirm('Bạn có chắc chắn muốn ngắt kết nối Fanpage này?')) return;

    try {
      const res = await fetch(`/api/facebook/pages/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Đã ngắt kết nối Fanpage.');
        fetchData();
      } else {
        toast.error(data.error || 'Thao tác thất bại.');
      }
    } catch {
      toast.error('Lỗi hệ thống.');
    }
  };

  const handleSaveBotSettings = async (e) => {
    e.preventDefault();
    setSavingBot(true);
    try {
      const res = await fetch('/api/facebook/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(botSettings),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Đã lưu cài đặt chatbot thành công.');
      } else {
        toast.error(data.error || 'Lưu cài đặt thất bại.');
      }
    } catch {
      toast.error('Lỗi kết nối máy chủ.');
    } finally {
      setSavingBot(false);
    }
  };

  // Tính toán URL Webhook và Verify Token hiển thị
  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://ship.yourdomain.com';
  const webhookUrl = `${appUrl}/api/facebook/webhook`;
  const verifyTokenShow = 'HSHIP_VERIFY_TOKEN_DEFAULT'; // Phù hợp với env

  if (!user || loading) {
    return (
      <div className="page-container" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text-muted)' }}>Đang tải cấu hình kết nối Facebook...</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: 22 }}>
        <div>
          <div className="page-title">Tích hợp Facebook & Livestream</div>
          <div className="page-subtitle">
            Kết nối Fanpage của bạn và thiết lập chatbot tự động bóc tách SĐT, địa chỉ để chốt đơn tự động.
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ gridTemplateColumns: '1.2fr 1fr', gap: 24, alignItems: 'start' }}>
        
        {/* CỘT TRÁI: Cấu hình Chatbot */}
        <div className="card">
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 18, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            💬 Kịch bản Chatbot Tự Động (Regex Rule-Based)
          </div>

          <form onSubmit={handleSaveBotSettings} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="flex-between" style={{ padding: '12px 14px', background: 'var(--bg-input)', borderRadius: 8 }}>
              <div>
                <strong style={{ display: 'block', fontSize: 14 }}>Kích hoạt Chatbot</strong>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Tự động quét bình luận và tin nhắn từ Fanpage.</span>
              </div>
              <input 
                type="checkbox" 
                style={{ width: 20, height: 20, cursor: 'pointer' }}
                checked={botSettings.botEnabled} 
                onChange={(e) => setBotSettings(prev => ({ ...prev, botEnabled: e.target.checked }))} 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Lời chào mừng khách hàng</label>
              <textarea 
                className="form-control" 
                rows="2" 
                value={botSettings.welcomeMessage || ''} 
                onChange={(e) => setBotSettings(prev => ({ ...prev, welcomeMessage: e.target.value }))}
                placeholder="Chào bạn! Shop có thể giúp gì cho bạn ạ..."
              />
            </div>

            <div className="form-group">
              <label className="form-label">Tin nhắn gom thông tin: Thiếu Số điện thoại</label>
              <textarea 
                className="form-control" 
                rows="2" 
                value={botSettings.missingPhoneMessage || ''} 
                onChange={(e) => setBotSettings(prev => ({ ...prev, missingPhoneMessage: e.target.value }))}
                placeholder="Bạn vui lòng cung cấp Số điện thoại nhé..."
              />
            </div>

            <div className="form-group">
              <label className="form-label">Tin nhắn gom thông tin: Thiếu Địa chỉ giao hàng</label>
              <textarea 
                className="form-control" 
                rows="2" 
                value={botSettings.missingAddressMessage || ''} 
                onChange={(e) => setBotSettings(prev => ({ ...prev, missingAddressMessage: e.target.value }))}
                placeholder="Cho shop xin địa chỉ cụ thể của bạn nha..."
              />
            </div>

            <div className="form-group">
              <label className="form-label">Tin nhắn xác nhận Đơn nháp (Draft Order)</label>
              <textarea 
                className="form-control" 
                rows="2" 
                value={botSettings.orderConfirmMessage || ''} 
                onChange={(e) => setBotSettings(prev => ({ ...prev, orderConfirmMessage: e.target.value }))}
                placeholder="Shop đã chốt đơn nháp thành công cho mình..."
              />
              <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                💡 Bot sẽ tự động đính kèm Mã đơn nháp, SĐT và địa chỉ của khách ở cuối tin nhắn này.
              </span>
            </div>

            <button type="submit" disabled={savingBot} className="btn btn-primary" style={{ justifyContent: 'center', marginTop: 10 }}>
              {savingBot ? 'Đang lưu cấu hình...' : 'Lưu cấu hình Chatbot'}
            </button>
          </form>
        </div>

        {/* CỘT PHẢI: Kết nối Fanpage & Thông tin Webhook */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Thông tin cấu hình Webhook trên Meta */}
          <div className="card" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 12, display: 'flex', gap: 6, alignItems: 'center' }}>
              ⚙️ Cấu hình Webhook trên Meta Developer Portal
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>Để nhận sự kiện thật, hãy cấu hình các thông số sau trong mục **Webhooks &rarr; Page** của ứng dụng Meta App của bạn:</div>
              <div>
                <strong style={{ display: 'block', color: 'var(--text-muted)' }}>Callback URL:</strong>
                <code style={{ background: '#e2e8f0', padding: '4px 6px', borderRadius: 4, display: 'block', fontSize: 11, marginTop: 4, fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  {webhookUrl}
                </code>
              </div>
              <div>
                <strong style={{ display: 'block', color: 'var(--text-muted)' }}>Verify Token:</strong>
                <code style={{ background: '#e2e8f0', padding: '4px 6px', borderRadius: 4, display: 'inline-block', fontSize: 11, marginTop: 4, fontFamily: 'monospace' }}>
                  {process.env.FACEBOOK_VERIFY_TOKEN || 'hship_verify_token_default'}
                </code>
              </div>
              <div style={{ color: '#0369a1', background: '#e0f2fe', padding: '8px 10px', borderRadius: 6, fontSize: 11 }}>
                ℹ️ Webhook chỉ hoạt động thực tế khi ứng dụng của bạn chạy trên tên miền HTTPS hợp lệ và đã cấu hình verify token trùng khớp ở cả 2 cổng.
              </div>
            </div>
          </div>

          {/* Form kết nối trang mới */}
          <div className="card">
            <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 14 }}>
              🔗 Liên kết Fanpage mới
            </div>
            <form onSubmit={handleConnectPage} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 12 }}>Page ID</label>
                <input 
                  className="form-control" 
                  style={{ padding: '8px 10px', fontSize: 13 }}
                  placeholder="Nhập Facebook Page ID..." 
                  value={pageForm.pageId} 
                  onChange={(e) => setPageForm(prev => ({ ...prev, pageId: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 12 }}>Tên Fanpage</label>
                <input 
                  className="form-control" 
                  style={{ padding: '8px 10px', fontSize: 13 }}
                  placeholder="Ví dụ: Shop Quần Áo GenZ..." 
                  value={pageForm.pageName} 
                  onChange={(e) => setPageForm(prev => ({ ...prev, pageName: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 12 }}>Page Access Token (Vĩnh viễn)</label>
                <input 
                  className="form-control" 
                  type="password"
                  style={{ padding: '8px 10px', fontSize: 13 }}
                  placeholder="Nhập Page Access Token bảo mật..." 
                  value={pageForm.accessToken} 
                  onChange={(e) => setPageForm(prev => ({ ...prev, accessToken: e.target.value }))}
                />
              </div>
              <button type="submit" disabled={savingPage} className="btn btn-primary" style={{ justifyContent: 'center', padding: '8px 14px', fontSize: 13, marginTop: 4 }}>
                {savingPage ? 'Đang liên kết...' : 'Liên kết Fanpage'}
              </button>
            </form>
          </div>

          {/* Danh sách Fanpage đã kết nối */}
          <div className="card">
            <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 14 }}>
              ✅ Các Fanpage đã liên kết ({pages.length})
            </div>
            
            {pages.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
                Chưa có Fanpage nào được liên kết.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {pages.map((page) => (
                  <div key={page.id} className="flex-between" style={{ padding: '10px 12px', background: 'var(--bg-input)', borderRadius: 8, border: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 13 }}>{page.pageName}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>ID: {page.pageId}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>Token: <code style={{ fontSize: 10 }}>{page.accessTokenMasked}</code></div>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => handleDisconnectPage(page.id)}
                      className="btn btn-secondary" 
                      style={{ padding: '4px 8px', fontSize: 11, color: '#dc2626', borderColor: '#fca5a5' }}
                    >
                      Hủy kết nối
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

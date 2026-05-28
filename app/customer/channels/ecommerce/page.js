'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  Clock,
  ExternalLink,
  Info,
  RefreshCw,
  Settings,
  ShoppingBag,
  Sliders,
  Sparkles,
  Wifi,
  X,
} from 'lucide-react';

const PLATFORM_INFOS = {
  shopee: {
    name: 'Shopee',
    color: '#ee4d2d',
    bg: '#fff5f3',
    docsUrl: 'https://open.shopee.com',
    description: 'Kết nối shop Shopee để chốt đơn tự động, đồng bộ sản phẩm và xử lý vận đơn liên thông.',
    features: ['Nhận đơn tự động từ Shopee', 'Đồng bộ sản phẩm hai chiều', 'In nhãn vận chuyển', 'Quản lý kho liên thông'],
  },
  lazada: {
    name: 'Lazada',
    color: '#0f146d',
    bg: '#f0f1ff',
    docsUrl: 'https://open.lazada.com',
    description: 'Kết nối Lazada Seller Center, quản lý đơn hàng tập trung và cập nhật trạng thái tự động.',
    features: ['Nhận đơn từ Lazada Seller API', 'Cập nhật trạng thái tự động', 'Quản lý kho đồng bộ'],
  },
  tiktok: {
    name: 'TikTok Shop',
    color: '#010101',
    bg: '#f5f5f5',
    docsUrl: 'https://partner.tiktokshop.com',
    description: 'Kết nối TikTok Shop giúp gom đơn từ video ngắn, giỏ hàng shop và các phiên livestream.',
    features: ['Nhận đơn TikTok Shop tự động', 'Sync đơn livestream TikTok', 'Theo dõi vận trình đơn hàng'],
  },
};

export default function EcommercePage() {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Modal configure state
  const [configModal, setConfigModal] = useState({
    show: false,
    connectionId: null, // null for create
    platform: 'shopee',
    mode: 'mock',
    status: 'active',
    externalShopId: '',
    accessToken: '',
    refreshToken: '',
  });

  const [saving, setSaving] = useState(false);
  const [testingId, setTestingId] = useState(null);
  const [syncingId, setSyncingId] = useState(null);

  // Load connections
  const loadConnections = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ecommerce/channels');
      const json = await res.json();
      if (json.success) {
        setConnections(json.data || []);
      } else {
        setError(json.message || 'Không thể tải cấu hình kết nối sàn.');
      }
    } catch {
      setError('Lỗi kết nối máy chủ khi tải danh sách kết nối.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  const handleOpenConfig = (platform, existing = null) => {
    if (existing) {
      setConfigModal({
        show: true,
        connectionId: existing.id,
        platform: existing.platform,
        mode: existing.mode,
        status: existing.status,
        externalShopId: existing.externalShopId,
        accessToken: existing.accessToken || '',
        refreshToken: existing.refreshToken || '',
      });
    } else {
      setConfigModal({
        show: true,
        connectionId: null,
        platform,
        mode: 'mock',
        status: 'active',
        externalShopId: '',
        accessToken: '',
        refreshToken: '',
      });
    }
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    if (!configModal.externalShopId.trim()) {
      showToast('Vui lòng điền mã gian hàng (External Shop ID).', 'error');
      return;
    }

    setSaving(true);
    try {
      const isEdit = !!configModal.connectionId;
      const url = isEdit
        ? `/api/ecommerce/channels/${configModal.connectionId}`
        : '/api/ecommerce/channels';
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: configModal.platform,
          mode: configModal.mode,
          status: configModal.status,
          externalShopId: configModal.externalShopId,
          accessToken: configModal.accessToken,
          refreshToken: configModal.refreshToken,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        showToast(isEdit ? 'Cập nhật cấu hình sàn thành công!' : 'Kết nối sàn mới thành công!', 'success');
        setConfigModal((v) => ({ ...v, show: false }));
        loadConnections();
      } else {
        showToast(json.error || 'Thao tác thất bại.', 'error');
      }
    } catch {
      showToast('Lỗi máy chủ khi lưu cấu hình.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async (id) => {
    setTestingId(id);
    try {
      const res = await fetch(`/api/ecommerce/channels/${id}/test`, { method: 'POST' });
      const json = await res.json();
      if (res.ok && json.success) {
        showToast(json.data?.message || 'Kiểm tra bắt tay API kết nối thành công!', 'success');
      } else {
        showToast(json.error || 'Lỗi kiểm tra kết nối sàn.', 'error');
      }
    } catch {
      showToast('Lỗi hệ thống khi kiểm tra kết nối.', 'error');
    } finally {
      setTestingId(null);
    }
  };

  const handleSyncMock = async (id) => {
    setSyncingId(id);
    try {
      const res = await fetch(`/api/ecommerce/channels/${id}/sync-mock`, { method: 'POST' });
      const json = await res.json();
      if (res.ok && json.success) {
        showToast(
          `Đã đồng bộ thành công ${json.data?.syncedCount} đơn hàng mock sàn. Vui lòng kiểm tra Quản lý đơn hàng!`,
          'success'
        );
        loadConnections(); // Reload sync count
      } else {
        showToast(json.error || 'Lỗi đồng bộ đơn hàng mock.', 'error');
      }
    } catch {
      showToast('Lỗi hệ thống khi đồng bộ đơn hàng mock.', 'error');
    } finally {
      setSyncingId(null);
    }
  };

  return (
    <div className="page-container">
      {/* Toast alert floating */}
      {toast.show && (
        <div
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            backgroundColor: toast.type === 'error' ? 'var(--danger)' : 'var(--success)',
            color: 'white',
            padding: '12px 20px',
            borderRadius: 8,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontWeight: 600,
            animation: 'fadeIn 0.2s ease',
          }}
        >
          {toast.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="page-header" style={{ marginBottom: 18 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <ShoppingBag size={20} color="var(--primary)" />
            <div className="page-title" style={{ marginBottom: 0 }}>Sàn thương mại điện tử</div>
          </div>
          <div className="page-subtitle">
            Cấu hình kết nối Shopee, Lazada, TikTok Shop và đồng bộ hóa đơn hàng đa kênh tập trung tại một nơi
          </div>
        </div>
        <button
          type="button"
          onClick={loadConnections}
          className="btn btn-secondary btn-sm"
          disabled={loading}
        >
          <RefreshCw size={13} style={{ marginRight: 6, animation: loading ? 'spin 0.8s linear infinite' : 'none' }} />
          Tải lại
        </button>
      </div>

      {/* Warning Sandbox info */}
      <div className="alert alert-warning mb-16" style={{ gap: 10, alignItems: 'flex-start' }}>
        <Info size={16} style={{ flexShrink: 0, marginTop: 1 }} />
        <div>
          <strong>Chế độ Sandbox/Mock:</strong> Dùng chế độ <strong>Mock Mode (Giả lập)</strong> để cấu hình thử nghiệm và đồng bộ đơn hàng demo liên kết SKU thực tế của shop ngay tức khắc. Môi trường <strong>Production</strong> bắt buộc phải có Access Token thật được cấp từ trung tâm đối tác của các sàn.
        </div>
      </div>

      {error && <div className="alert alert-danger mb-16">{error}</div>}

      {/* Grid Platform Cards */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: 16 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 260, borderRadius: 12 }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: 16 }}>
          {['shopee', 'lazada', 'tiktok'].map((platformKey) => {
            const pInfo = PLATFORM_INFOS[platformKey];
            const existing = connections.find((c) => c.platform === platformKey);
            const isConnected = !!existing;

            return (
              <div
                key={platformKey}
                className="card"
                style={{
                  borderTop: `4px solid ${pInfo.color}`,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: 280,
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                }}
              >
                <div>
                  {/* Card Title Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 10,
                          backgroundColor: pInfo.bg,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 18,
                          fontWeight: 900,
                          color: pInfo.color,
                        }}
                      >
                        {pInfo.name[0]}
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text)' }}>
                          {pInfo.name}
                        </div>
                        {isConnected ? (
                          existing.status === 'active' ? (
                            <span className="badge badge-success" style={{ fontSize: 9.5 }}>Đã kết nối</span>
                          ) : (
                            <span className="badge badge-danger" style={{ fontSize: 9.5 }}>Ngắt hoạt động</span>
                          )
                        ) : (
                          <span className="badge badge-secondary" style={{ fontSize: 9.5 }}>Chưa kết nối</span>
                        )}
                      </div>
                    </div>

                    {/* Mode badge when connected */}
                    {isConnected && (
                      <span
                        className={`badge ${
                          existing.mode === 'mock'
                            ? 'mode-mock'
                            : existing.mode === 'sandbox'
                            ? 'mode-sandbox'
                            : 'mode-production'
                        }`}
                        style={{ fontSize: 9.5, textTransform: 'uppercase' }}
                      >
                        {existing.mode}
                      </span>
                    )}
                  </div>

                  <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 12 }}>
                    {pInfo.description}
                  </p>

                  {/* Connected settings details */}
                  {isConnected ? (
                    <div
                      style={{
                        backgroundColor: 'var(--bg-input)',
                        borderRadius: 8,
                        padding: '8px 12px',
                        fontSize: 11.5,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                        marginBottom: 12,
                        border: '1px solid var(--border-light)',
                      }}
                    >
                      <div className="flex-between">
                        <span style={{ color: 'var(--text-muted)' }}>Mã Shop Sàn:</span>
                        <strong style={{ fontFamily: 'monospace' }}>{existing.externalShopId}</strong>
                      </div>
                      <div className="flex-between">
                        <span style={{ color: 'var(--text-muted)' }}>Access Token:</span>
                        <span style={{ color: 'var(--text-secondary)' }}>{existing.accessToken || '—'}</span>
                      </div>
                      <div className="flex-between">
                        <span style={{ color: 'var(--text-muted)' }}>Đơn đồng bộ:</span>
                        <strong style={{ color: 'var(--primary)' }}>{existing.syncedOrdersCount} đơn</strong>
                      </div>
                      <div className="flex-between">
                        <span style={{ color: 'var(--text-muted)' }}>Sync cuối:</span>
                        <span>{existing.lastSyncAt ? new Date(existing.lastSyncAt).toLocaleString('vi-VN') : 'Chưa sync'}</span>
                      </div>
                    </div>
                  ) : (
                    <ul style={{ paddingLeft: 16, margin: '0 0 16px 0', fontSize: 11.5, color: 'var(--text-muted)' }}>
                      {pInfo.features.map((f) => (
                        <li key={f} style={{ marginBottom: 4 }}>• {f}</li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Actions Footer */}
                <div style={{ display: 'flex', gap: 6, width: '100%' }}>
                  <button
                    type="button"
                    className={`btn btn-sm ${isConnected ? 'btn-secondary' : 'btn-primary'}`}
                    style={{ flex: 1.5, gap: 4 }}
                    onClick={() => handleOpenConfig(platformKey, existing)}
                  >
                    <Settings size={13} />
                    {isConnected ? 'Cấu hình' : 'Kết nối'}
                  </button>

                  {isConnected && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '0 8px' }}
                      title="Test Connection"
                      disabled={testingId === existing.id}
                      onClick={() => handleTestConnection(existing.id)}
                    >
                      {testingId === existing.id ? (
                        <RefreshCw size={12} className="spin" />
                      ) : (
                        <Wifi size={13} />
                      )}
                    </button>
                  )}

                  {isConnected && existing.mode === 'mock' && (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      style={{ gap: 4, padding: '0 10px', fontSize: 11.5 }}
                      disabled={syncingId === existing.id}
                      onClick={() => handleSyncMock(existing.id)}
                    >
                      {syncingId === existing.id ? (
                        <RefreshCw size={11} className="spin" />
                      ) : (
                        <Sparkles size={11} />
                      )}
                      Sync Mock
                    </button>
                  )}

                  <a
                    href={pInfo.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '0 8px' }}
                    title="Tài liệu API"
                  >
                    <ExternalLink size={13} />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal configuration dialog */}
      {configModal.show && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 16,
          }}
        >
          <div
            className="card animate-fade"
            style={{
              width: '100%',
              maxWidth: 480,
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            }}
          >
            {/* Modal Title */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sliders size={18} color="var(--primary)" />
                <h3 style={{ margin: 0, fontSize: 15.5, fontWeight: 800 }}>
                  {configModal.connectionId ? 'Cấu hình' : 'Kết nối mới'} sàn {PLATFORM_INFOS[configModal.platform].name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setConfigModal((v) => ({ ...v, show: false }))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveConfig} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Môi trường kết nối (Mode)</label>
                <select
                  className="form-control"
                  value={configModal.mode}
                  onChange={(e) => setConfigModal((v) => ({ ...v, mode: e.target.value }))}
                >
                  <option value="mock">Mock Mode (Giả lập đơn hàng)</option>
                  <option value="sandbox">Sandbox (Môi trường test của sàn)</option>
                  <option value="production">Production (Gian hàng thật - Phải có token)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Trạng thái kết nối</label>
                <select
                  className="form-control"
                  value={configModal.status}
                  onChange={(e) => setConfigModal((v) => ({ ...v, status: e.target.value }))}
                >
                  <option value="active">Active (Hoạt động)</option>
                  <option value="inactive">Inactive (Ngừng hoạt động)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Mã Shop trên Sàn (External Shop ID) <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input
                  className="form-control"
                  placeholder="Ví dụ: shopee_shop_12345"
                  value={configModal.externalShopId}
                  onChange={(e) => setConfigModal((v) => ({ ...v, externalShopId: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Access Token</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder={configModal.connectionId ? 'Nhập mật khẩu mới hoặc giữ nguyên token đã ẩn' : 'Nhập Access Token được cấp'}
                  value={configModal.accessToken}
                  onChange={(e) => setConfigModal((v) => ({ ...v, accessToken: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Refresh Token</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder={configModal.connectionId ? 'Nhập refresh token mới hoặc giữ nguyên' : 'Nhập Refresh Token'}
                  value={configModal.refreshToken}
                  onChange={(e) => setConfigModal((v) => ({ ...v, refreshToken: e.target.value }))}
                />
              </div>

              {/* Form Buttons */}
              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setConfigModal((v) => ({ ...v, show: false }))}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1, gap: 6 }}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <RefreshCw size={13} className="spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>Lưu cấu hình</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

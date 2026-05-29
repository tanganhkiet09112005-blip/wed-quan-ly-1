'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ExternalLink, Settings, Zap } from 'lucide-react';
import MockChatbotPanel from '../MockChatbotPanel';

export default function FanpagePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [config, setConfig] = useState(null);
  const [configLoading, setConfigLoading] = useState(true);

  const loadConfig = useCallback(() => {
    if (!user?.shopId) { setConfigLoading(false); return; }
    fetch('/api/integrations')
      .then((r) => r.json())
      .then((json) => { if (json?.success) setConfig(json.data); })
      .catch(() => {})
      .finally(() => setConfigLoading(false));
  }, [user?.shopId]);

  useEffect(() => {
    const t = setTimeout(loadConfig, 0);
    return () => clearTimeout(t);
  }, [loadConfig]);

  return (
    <div className="page-container">
      {/* ─── Header ─── */}
      <div className="page-header" style={{ marginBottom: 18 }}>
        <div>
          <div className="page-title">Fanpage bán hàng</div>
          <div className="page-subtitle">
            Mô phỏng comment Facebook, chatbot xử lý thông tin và tạo đơn nháp tự động
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary"
            type="button"
            onClick={() => router.push('/customer/orders/manage')}
          >
            <ExternalLink size={14} /> Xem đơn hàng
          </button>
          <button
            className="btn btn-secondary"
            type="button"
            onClick={() => router.push('/customer/channels/settings')}
          >
            <Settings size={14} /> Cấu hình kênh
          </button>
        </div>
      </div>

      <div className="alert alert-warning mb-16" style={{ gap: 10, alignItems: 'flex-start' }}>
        <Zap size={16} style={{ flexShrink: 0, marginTop: 1 }} />
        <div>
          <strong>Chế độ Sandbox/Mock:</strong> Dùng chế độ <strong>Mock Mode (Giả lập)</strong> để test tạo đơn nháp từ bình luận. Môi trường <strong>Production</strong> bắt buộc khách hàng phải cấp <code>Page Access Token</code> và cấu hình Webhook thật từ Meta App. 
        </div>
      </div>

      {/* ─── Status banner ─── */}
      <div
        className="card mb-16"
        style={{
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          borderLeft: '4px solid var(--primary)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: '#eff6ff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Zap size={18} color="var(--primary)" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13.5 }}>Kênh Fanpage — Môi trường Mock</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>
              {configLoading
                ? 'Đang tải cấu hình...'
                : config?.fbPageId
                  ? `Page ID mock: ${config.fbPageId} — Bot đang hoạt động`
                  : 'Chưa cấu hình Facebook production. Sử dụng chatbot regex mock nội bộ.'}
            </div>
          </div>
        </div>
        <span className={`badge ${config?.fbStatus === 'active' ? 'status-delivered' : 'mode-mock'}`}>
          {configLoading ? '...' : config?.fbStatus === 'active' ? 'Đã cấu hình mock' : 'Mock Mode'}
        </span>
      </div>

      {/* ─── 3-column chatbot panel ─── */}
      <MockChatbotPanel channel="fanpage" />
    </div>
  );
}

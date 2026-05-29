'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle, XCircle, AlertCircle, Settings,
  Shield, Truck, UserRound, Zap, ExternalLink,
} from 'lucide-react';

const PRODUCTION_CHECKLIST = [
  {
    key: 'database',
    label: 'Database Production',
    desc: 'DATABASE_URL đã trỏ vào Railway MySQL (không phải localhost)',
    group: 'infra',
  },
  {
    key: 'session',
    label: 'Session Secret',
    desc: 'SESSION_SECRET và ENCRYPTION_KEY đã được set trên Vercel',
    group: 'security',
  },
  {
    key: 'appUrl',
    label: 'App URL chính thức',
    desc: 'NEXT_PUBLIC_APP_URL đã đúng với domain/Vercel URL thật',
    group: 'infra',
  },
  {
    key: 'ghn',
    label: 'GHN Carrier',
    desc: 'API Token + Shop ID từ GHN Merchant → Cài đặt trong Đơn vị vận chuyển',
    group: 'carrier',
    link: '/customer/partners/shippers',
  },
  {
    key: 'ghtk',
    label: 'GHTK Carrier',
    desc: 'API Token từ GHTK Merchant → Cài đặt trong Đơn vị vận chuyển',
    group: 'carrier',
    link: '/customer/partners/shippers',
  },
  {
    key: 'jt',
    label: 'J&T Express',
    desc: 'API Key + Customer Code từ J&T Partner → Cài đặt trong Đơn vị vận chuyển',
    group: 'carrier',
    link: '/customer/partners/shippers',
  },
  {
    key: 'facebook',
    label: 'Facebook Chatbot',
    desc: 'App Secret, Verify Token, Page Access Token → Tích hợp Facebook',
    group: 'channel',
    link: '/customer/channels/settings',
  },
  {
    key: 'ecommerce',
    label: 'Sàn TMĐT (Shopee/Lazada/TikTok)',
    desc: 'App Key + App Secret từ từng nền tảng Open Platform',
    group: 'channel',
    link: '/customer/channels/ecommerce',
  },
  {
    key: 'invoice',
    label: 'Hóa đơn điện tử (MISA/VNPT)',
    desc: 'App ID + API Key được cấu hình per-shop (liên hệ Admin)',
    group: 'accounting',
    link: '/customer/invoices',
  },
];

const GROUP_LABELS = {
  infra: 'Hạ tầng & Môi trường',
  security: 'Bảo mật',
  carrier: 'Vận chuyển',
  channel: 'Kênh bán hàng',
  accounting: 'Kế toán',
};

const GROUP_COLORS = {
  infra: 'kpi-icon-blue',
  security: 'kpi-icon-yellow',
  carrier: 'kpi-icon-green',
  channel: 'kpi-icon-purple',
  accounting: 'kpi-icon-cyan',
};

export default function CustomerSettingsPage() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((d) => setHealth(d))
      .catch(() => setHealth({ status: 'error', database: 'error' }))
      .finally(() => setLoading(false));
  }, []);

  const byGroup = PRODUCTION_CHECKLIST.reduce((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {});

  const isOnline = health?.status === 'ok';

  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <div className="page-title">Cài đặt shop</div>
          <div className="page-subtitle">Thiết lập tài khoản, vận chuyển, kênh bán hàng và kiểm tra production readiness</div>
        </div>
      </div>

      {/* Quick nav cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 14, marginBottom: 28 }}>
        {[
          { href: '/customer/profile', icon: UserRound, cls: 'kpi-icon-blue', title: 'Tài khoản & Shop', desc: 'Thông tin shop, chủ shop và đổi mật khẩu.' },
          { href: '/customer/partners/shippers', icon: Truck, cls: 'kpi-icon-green', title: 'Đơn vị vận chuyển', desc: 'GHN, GHTK, J&T, SPX — mode và token.' },
          { href: '/customer/channels/settings', icon: Settings, cls: 'kpi-icon-purple', title: 'Tích hợp hệ thống', desc: 'Facebook, MISA và cấu hình kênh bán.' },
          { href: '/customer/tools/bot-settings', icon: Zap, cls: 'kpi-icon-cyan', title: 'Cài đặt Chatbot', desc: 'Bot parse SĐT, địa chỉ, sản phẩm, size.' },
        ].map(({ href, icon: Icon, cls, title, desc }) => (
          <Link key={href} href={href} className="card" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div className={`kpi-icon ${cls}`} style={{ flexShrink: 0 }}><Icon size={18} /></div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 4 }}>{title}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 12.5, lineHeight: 1.45 }}>{desc}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Health status */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div className={`kpi-icon ${isOnline ? 'kpi-icon-green' : 'kpi-icon-red'}`}>
            {isOnline ? <CheckCircle size={18} /> : <XCircle size={18} />}
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15 }}>Trạng thái hệ thống</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
              {loading ? 'Đang kiểm tra...' : isOnline ? `Database connected · ${health.env || ''} · v${health.version || ''}` : 'Lỗi kết nối database'}
            </div>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <span className={`badge ${isOnline ? 'status-delivered' : 'status-cancelled'}`}>
              {loading ? '...' : isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
        {health?.latencyMs && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
            Độ trễ DB: <strong>{health.latencyMs}ms</strong> · Thời gian: {health.time ? new Date(health.time).toLocaleString('vi-VN') : '—'}
          </div>
        )}
      </div>

      {/* Production Readiness Checklist */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div className="kpi-icon kpi-icon-yellow"><Shield size={18} /></div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15 }}>Production Readiness Checklist</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
              Các bước cần hoàn thành để bật chức năng thật thay cho mock/sandbox
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {Object.entries(byGroup).map(([group, items]) => (
            <div key={group}>
              <div style={{
                fontSize: 11, fontWeight: 700, color: 'var(--text-muted)',
                letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10,
              }}>
                {GROUP_LABELS[group] || group}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {items.map((item) => (
                  <div key={item.key} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                    padding: '12px 14px', border: '1px solid var(--border)',
                    borderRadius: 10, background: 'var(--bg-input)',
                  }}>
                    <div style={{ marginTop: 2 }}>
                      <AlertCircle size={15} color="#f59e0b" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{item.label}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{item.desc}</div>
                    </div>
                    {item.link && (
                      <Link href={item.link} style={{
                        flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4,
                        fontSize: 12, color: 'var(--primary)', fontWeight: 700, textDecoration: 'none',
                        padding: '4px 10px', border: '1px solid var(--primary)', borderRadius: 6,
                      }}>
                        Cấu hình <ExternalLink size={11} />
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{
          marginTop: 20, padding: '12px 16px', borderRadius: 8,
          background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)',
          fontSize: 13, color: 'var(--text-secondary)',
        }}>
          💡 Hệ thống đang chạy <strong>mock/sandbox</strong> cho các module chưa có credentials thật.
          Dữ liệu đơn hàng, tồn kho, COD và hóa đơn đều chạy thật qua DB.
          Chỉ phần <em>gửi vận đơn thật / bắt comment thật / sync sàn thật / xuất hóa đơn thật</em> cần credentials.
        </div>
      </div>
    </div>
  );
}

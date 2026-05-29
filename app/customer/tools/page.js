'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle, MessageCircle, RefreshCw,
  Wrench, Zap, AlertCircle,
} from 'lucide-react';

export default function ToolsPage() {
  const [health, setHealth] = useState(null);

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((d) => setHealth(d))
      .catch(() => setHealth({ status: 'error', database: 'error' }));
  }, []);

  const isOnline = health?.status === 'ok';

  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <div className="page-title">Công cụ bổ trợ</div>
          <div className="page-subtitle">Chatbot, tích hợp kênh bán và kiểm tra trạng thái hệ thống</div>
        </div>
      </div>

      {/* Tool links */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16, marginBottom: 24 }}>
        <Link href="/customer/tools/bot-settings" className="card" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div className="kpi-icon kpi-icon-blue" style={{ flexShrink: 0 }}><Wrench size={18} /></div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 4 }}>Cài đặt Chatbot</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 12.5, lineHeight: 1.45 }}>Cấu hình bot hỏi SĐT, địa chỉ, sản phẩm, size và xác nhận đơn nháp.</div>
          </div>
        </Link>
        <Link href="/customer/channels/settings" className="card" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div className="kpi-icon kpi-icon-cyan" style={{ flexShrink: 0 }}><MessageCircle size={18} /></div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 4 }}>Tích hợp Facebook</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 12.5, lineHeight: 1.45 }}>Quản lý Page ID, token và trạng thái kết nối Facebook/Pancake.</div>
          </div>
        </Link>
        <div className="card" style={{ display: 'flex', alignItems: 'flex-start', gap: 12, opacity: 0.7 }}>
          <div className="kpi-icon kpi-icon-yellow" style={{ flexShrink: 0 }}><Zap size={18} /></div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 4 }}>Tự động hóa vận hành</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 12.5, lineHeight: 1.45 }}>Nền tảng đã sẵn sàng mở rộng rule automation sau khi có webhook production.</div>
            <span className="badge" style={{ marginTop: 8, background: 'var(--bg-input)', color: 'var(--text-muted)', fontSize: 10 }}>Sắp ra mắt</span>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div className={`kpi-icon ${isOnline ? 'kpi-icon-green' : health ? 'kpi-icon-red' : 'kpi-icon-yellow'}`}>
            {!health ? <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} />
              : isOnline ? <CheckCircle size={18} />
              : <AlertCircle size={18} />}
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15 }}>Trạng thái hệ thống</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
              {!health ? 'Đang kiểm tra...'
                : isOnline ? `Online · DB ${health.database} · ${health.latencyMs}ms · v${health.version}`
                : `Lỗi: database ${health.database}`}
            </div>
          </div>
          <span className={`badge ${isOnline ? 'status-delivered' : health ? 'status-cancelled' : 'status-pending'}`} style={{ marginLeft: 'auto' }}>
            {!health ? '...' : isOnline ? 'Hoạt động bình thường' : 'Lỗi kết nối'}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 10 }}>
          {[
            { label: 'Orders & COD', status: 'live', desc: 'Chạy thật bằng DB' },
            { label: 'Product/SKU/Inventory', status: 'live', desc: 'Chạy thật bằng DB' },
            { label: 'POS bán tại quầy', status: 'live', desc: 'Chạy thật bằng DB' },
            { label: 'Hóa đơn (Invoice)', status: 'sandbox', desc: 'Sandbox — cần MISA/VNPT' },
            { label: 'GHN/GHTK/J&T/SPX', status: 'mock', desc: 'Mock — cần API token thật' },
            { label: 'Facebook Chatbot', status: 'mock', desc: 'Mock — cần App Secret + Token' },
            { label: 'Sàn TMĐT', status: 'mock', desc: 'Mock — cần Open Platform Key' },
          ].map(({ label, status, desc }) => (
            <div key={label} style={{
              padding: '10px 12px', border: '1px solid var(--border)',
              borderRadius: 10, background: 'var(--bg-input)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: status === 'live' ? '#22c55e' : status === 'sandbox' ? '#f59e0b' : '#94a3b8',
                }} />
                <span style={{ fontWeight: 700, fontSize: 12 }}>{label}</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

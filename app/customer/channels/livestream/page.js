'use client';

import { useRouter } from 'next/navigation';
import { ExternalLink, Radio } from 'lucide-react';
import MockChatbotPanel from '../MockChatbotPanel';

export default function LivestreamPage() {
  const router = useRouter();

  return (
    <div className="page-container">
      {/* ─── Header ─── */}
      <div className="page-header" style={{ marginBottom: 18 }}>
        <div>
          <div className="page-title">Livestream bán hàng</div>
          <div className="page-subtitle">
            Mô phỏng comment phiên live, bot hỏi SĐT/địa chỉ/size/số lượng và tạo đơn nháp tự động
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
        </div>
      </div>

      {/* ─── Live session status banner ─── */}
      <div
        className="card mb-16"
        style={{
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          borderLeft: '4px solid #dc2626',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: '#fee2e2',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Radio size={18} color="#dc2626" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13.5 }}>
              Phiên live: mock-live-001
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>
              Môi trường demo nội bộ — chưa kết nối Facebook thật hay webhook production.
              Bot xử lý comment bằng parser regex tự động.
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Chế độ</div>
            <span className="badge mode-mock" style={{ marginTop: 4 }}>Mock</span>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Đầu ra</div>
            <span className="badge status-shipping" style={{ marginTop: 4 }}>Đơn nháp</span>
          </div>
        </div>
      </div>

      {/* ─── 3-column chatbot panel ─── */}
      <MockChatbotPanel channel="livestream" />
    </div>
  );
}

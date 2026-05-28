import Link from 'next/link';
import { MessageCircle, Wrench, Zap } from 'lucide-react';

export default function ToolsPage() {
  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <div className="page-title">Công cụ bổ trợ</div>
          <div className="page-subtitle">Các công cụ hỗ trợ vận hành shop, chatbot và tích hợp kênh bán</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
        <Link href="/customer/tools/bot-settings" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="kpi-icon kpi-icon-blue" style={{ marginBottom: 12 }}><Wrench size={18} /></div>
          <div className="card-title">Cài đặt Chatbot</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.5 }}>Cấu hình bot hỏi SĐT, địa chỉ, sản phẩm, size và xác nhận đơn nháp.</div>
        </Link>
        <Link href="/customer/channels/settings" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="kpi-icon kpi-icon-cyan" style={{ marginBottom: 12 }}><MessageCircle size={18} /></div>
          <div className="card-title">Tích hợp Facebook</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.5 }}>Quản lý Page ID, token và trạng thái kết nối Facebook/Pancake.</div>
        </Link>
        <div className="card">
          <div className="kpi-icon kpi-icon-yellow" style={{ marginBottom: 12 }}><Zap size={18} /></div>
          <div className="card-title">Tự động hóa vận hành</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.5 }}>Nền tảng đã sẵn sàng mở rộng rule automation sau khi có webhook production.</div>
        </div>
      </div>
    </div>
  );
}

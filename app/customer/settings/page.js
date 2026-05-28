import Link from 'next/link';
import { Settings, Shield, Truck, UserRound } from 'lucide-react';

export default function CustomerSettingsPage() {
  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <div className="page-title">Cài đặt shop</div>
          <div className="page-subtitle">Thiết lập tài khoản, bảo mật, đối tác vận chuyển và tích hợp hệ thống</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 16 }}>
        <Link href="/customer/profile" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="kpi-icon kpi-icon-blue" style={{ marginBottom: 12 }}><UserRound size={18} /></div>
          <div className="card-title">Tài khoản shop</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.5 }}>Thông tin người dùng, shop code và hồ sơ vận hành.</div>
        </Link>
        <Link href="/customer/partners/shippers" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="kpi-icon kpi-icon-green" style={{ marginBottom: 12 }}><Truck size={18} /></div>
          <div className="card-title">Đơn vị vận chuyển</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.5 }}>Token carrier, mode mock/sandbox/production và test connection.</div>
        </Link>
        <Link href="/customer/channels/settings" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="kpi-icon kpi-icon-purple" style={{ marginBottom: 12 }}><Settings size={18} /></div>
          <div className="card-title">Tích hợp hệ thống</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.5 }}>Facebook, Pancake và cấu hình kế toán MISA ở cấp shop.</div>
        </Link>
        <div className="card">
          <div className="kpi-icon kpi-icon-yellow" style={{ marginBottom: 12 }}><Shield size={18} /></div>
          <div className="card-title">Bảo mật & phân quyền</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.5 }}>Đã có session, role shop/admin và isolation dữ liệu theo shop. Phân quyền nhân sự nằm ở phase sau.</div>
        </div>
      </div>
    </div>
  );
}

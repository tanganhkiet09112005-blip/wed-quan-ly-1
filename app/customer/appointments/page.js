import { Calendar, Clock, Package } from 'lucide-react';

export default function AppointmentsPage() {
  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <div className="page-title">Lịch hẹn</div>
          <div className="page-subtitle">Theo dõi lịch hẹn lấy hàng, đóng gói và bàn giao carrier</div>
        </div>
      </div>

      <div className="grid-kpi" style={{ marginBottom: 20 }}>
        <div className="kpi-card"><div className="kpi-icon kpi-icon-blue"><Calendar size={18} /></div><div className="kpi-content"><div className="kpi-value">0</div><div className="kpi-label">Lịch hẹn hôm nay</div></div></div>
        <div className="kpi-card"><div className="kpi-icon kpi-icon-yellow"><Clock size={18} /></div><div className="kpi-content"><div className="kpi-value">0</div><div className="kpi-label">Chờ xác nhận</div></div></div>
        <div className="kpi-card"><div className="kpi-icon kpi-icon-green"><Package size={18} /></div><div className="kpi-content"><div className="kpi-value">0</div><div className="kpi-label">Đã bàn giao</div></div></div>
      </div>

      <div className="card">
        <div className="empty-state" style={{ padding: 40 }}>
          <div className="empty-state-icon"><Calendar size={28} /></div>
          <h3>Chưa có lịch hẹn lấy hàng</h3>
          <p>Khi carrier production hoặc module điều phối pickup được bật, các lịch hẹn lấy hàng sẽ hiển thị tại đây.</p>
        </div>
      </div>
    </div>
  );
}

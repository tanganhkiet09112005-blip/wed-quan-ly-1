import Link from 'next/link';
import { BookOpen, CreditCard, FileText } from 'lucide-react';

export default function AccountingPage() {
  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <div className="page-title">Kế toán</div>
          <div className="page-subtitle">Theo dõi hóa đơn điện tử, COD và dữ liệu đối soát kế toán của shop</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
        <Link href="/customer/accounting/invoices" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="kpi-icon kpi-icon-blue" style={{ marginBottom: 12 }}><FileText size={18} /></div>
          <div className="card-title">Hóa đơn điện tử</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.5 }}>Quản lý danh sách hóa đơn, trạng thái đồng bộ và in chứng từ.</div>
        </Link>
        <Link href="/customer/reports/cod" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="kpi-icon kpi-icon-green" style={{ marginBottom: 12 }}><CreditCard size={18} /></div>
          <div className="card-title">Đối soát COD</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.5 }}>Kiểm tra COD đã thu, chờ thu và các đơn hoàn/hủy không tính đối soát.</div>
        </Link>
        <div className="card">
          <div className="kpi-icon kpi-icon-purple" style={{ marginBottom: 12 }}><BookOpen size={18} /></div>
          <div className="card-title">Sổ kế toán vận hành</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.5 }}>Sổ chi tiết doanh thu, phí vận chuyển và bút toán đối soát cần schema ledger ở phase X6.</div>
        </div>
      </div>
    </div>
  );
}

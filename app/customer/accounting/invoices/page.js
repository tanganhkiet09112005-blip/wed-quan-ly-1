import Link from 'next/link';
import { FileText } from 'lucide-react';

export default function CustomerAccountingInvoicesAliasPage() {
  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <div className="page-title">Kế toán - Hóa đơn</div>
          <div className="page-subtitle">Quản lý hóa đơn đã được chuyển về trang chính thức</div>
        </div>
        <Link href="/customer/invoices" className="btn btn-primary">
          <FileText size={14} /> Mở danh sách hóa đơn
        </Link>
      </div>

      <div className="card">
        <div className="empty-state" style={{ padding: 32 }}>
          <div className="empty-state-icon"><FileText size={26} /></div>
          <h3>Hóa đơn đã được di chuyển</h3>
          <p>Phân hệ hóa đơn điện tử hiện tại đang được quản lý trực tiếp tại /customer/invoices để đồng nhất workflow nghiệp vụ của UPOS.</p>
          <Link href="/customer/invoices" className="btn btn-primary">Đi tới hóa đơn</Link>
        </div>
      </div>
    </div>
  );
}

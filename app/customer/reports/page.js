import Link from 'next/link';
import { BarChart2, CreditCard, FileText, Package, Truck } from 'lucide-react';

const REPORTS = [
  {
    href: '/customer/reports/overview',
    title: 'Báo cáo tổng quan',
    desc: 'KPI đơn hàng, COD, cước phí và hiệu suất giao hàng theo thời gian.',
    icon: BarChart2,
  },
  {
    href: '/customer/reports/cod',
    title: 'Quản lý COD',
    desc: 'Theo dõi COD chờ thu, đã thu, hoàn/hủy và xuất CSV đối soát.',
    icon: CreditCard,
  },
  {
    href: '/customer/reports/orders',
    title: 'Báo cáo đơn hàng',
    desc: 'Phân tích trạng thái đơn, nguồn đơn và carrier từ dữ liệu vận hành.',
    icon: Package,
  },
  {
    href: '/customer/orders/delivery',
    title: 'Báo cáo vận chuyển',
    desc: 'Đi nhanh tới các đơn đang giao, kiện vấn đề và trạng thái carrier.',
    icon: Truck,
  },
  {
    href: '/customer/accounting/invoices',
    title: 'Hóa đơn điện tử',
    desc: 'Danh sách hóa đơn, đồng bộ kế toán và in chứng từ.',
    icon: FileText,
  },
];

export default function ReportsIndexPage() {
  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <div className="page-title">Báo cáo</div>
          <div className="page-subtitle">Trung tâm báo cáo vận hành, COD, vận chuyển và kế toán của shop</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 14 }}>
        {REPORTS.map(({ href, title, desc, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="card"
            style={{ display: 'flex', gap: 12, alignItems: 'flex-start', textDecoration: 'none', color: 'inherit' }}
          >
            <div className="kpi-icon kpi-icon-blue" style={{ width: 38, height: 38, flexShrink: 0 }}>
              <Icon size={17} />
            </div>
            <div>
              <div style={{ fontWeight: 800, marginBottom: 5 }}>{title}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.45 }}>{desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

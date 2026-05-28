'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useToast } from '@/lib/toast-context';
import { FileText, Search, Plus } from 'lucide-react';
import Link from 'next/link';

const formatCurrency = v => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0);

export default function CustomerInvoicesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchInvoices = async () => {
    if (!user?.shopId) return;
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);

      const res = await fetch(`/api/invoices?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setInvoices(data.data);
      }
    } catch (e) {
      console.error(e);
      toast.error('Lỗi khi tải danh sách hóa đơn');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.shopId, statusFilter]);

  const handleSearch = (e) => {
    if (e.key === 'Enter') fetchInvoices();
  };

  if (loading && invoices.length === 0) {
    return (
      <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ fontSize: 18, color: 'var(--text-muted)' }}>Đang tải dữ liệu hoá đơn...</div>
      </div>
    );
  }

  const totalInvoices = invoices.length;
  const draftCount = invoices.filter(i => i.status === 'draft').length;
  const issuedCount = invoices.filter(i => i.status === 'issued').length;
  const cancelledCount = invoices.filter(i => i.status === 'cancelled').length;
  const totalValue = invoices.reduce((acc, i) => i.status !== 'cancelled' ? acc + i.total : acc, 0);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <div className="page-title">Hóa đơn điện tử</div>
          <div className="page-subtitle">Tạo, phát hành và quản lý hóa đơn cho đơn hàng của shop</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={() => router.push('/customer/orders/manage')}>
            <Plus size={14} /> Tạo HĐ từ đơn hàng
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid-kpi" style={{ marginBottom: 24, gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <div className="kpi-card">
          <div className="kpi-icon kpi-icon-blue"><FileText size={16} /></div>
          <div className="kpi-content"><div className="kpi-value">{totalInvoices}</div><div className="kpi-label">Tổng hóa đơn</div></div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon kpi-icon-yellow"><FileText size={16} /></div>
          <div className="kpi-content"><div className="kpi-value">{draftCount}</div><div className="kpi-label">Hóa đơn nháp</div></div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon kpi-icon-green"><FileText size={16} /></div>
          <div className="kpi-content"><div className="kpi-value">{issuedCount}</div><div className="kpi-label">Đã phát hành</div></div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon kpi-icon-red"><FileText size={16} /></div>
          <div className="kpi-content"><div className="kpi-value">{cancelledCount}</div><div className="kpi-label">Đã hủy</div></div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon kpi-icon-purple"><FileText size={16} /></div>
          <div className="kpi-content"><div className="kpi-value">{formatCurrency(totalValue)}</div><div className="kpi-label">Tổng giá trị (hợp lệ)</div></div>
        </div>
      </div>

      {/* Invoice List */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div className="search-wrapper" style={{ minWidth: 250 }}>
              <Search className="search-icon" size={14} />
              <input 
                className="search-input" 
                placeholder="Tìm số HĐ, SĐT, mã đơn..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={handleSearch}
              />
            </div>
            <select className="input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '6px 12px', minWidth: 150 }}>
              <option value="">Tất cả trạng thái</option>
              <option value="draft">Nháp</option>
              <option value="issued">Đã phát hành</option>
              <option value="cancelled">Đã hủy</option>
            </select>
          </div>
        </div>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Số HĐ</th>
                <th>Mã đơn</th>
                <th>Khách hàng</th>
                <th>SĐT</th>
                <th style={{textAlign:'right'}}>Tổng tiền</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th style={{textAlign:'right'}}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Không tìm thấy hóa đơn nào</td></tr>
              ) : invoices.map(invoice => (
                <tr key={invoice.id}>
                  <td><span style={{ fontWeight: 700 }}>{invoice.code}</span></td>
                  <td>
                    {invoice.order ? (
                      <Link href={`/customer/orders/${invoice.order.id}`} style={{ fontFamily:'monospace', color:'var(--primary-light)', fontSize: 12 }}>
                        {invoice.order.code}
                      </Link>
                    ) : '-'}
                  </td>
                  <td style={{ fontWeight: 600 }}>{invoice.customerName}</td>
                  <td>{invoice.customerPhone || '-'}</td>
                  <td style={{ fontWeight: 700, textAlign:'right', color: invoice.status === 'cancelled' ? 'var(--text-muted)' : 'inherit' }}>
                    {formatCurrency(invoice.total)}
                  </td>
                  <td>
                    {invoice.status === 'cancelled' && <span className="badge" style={{background:'#fee2e2', color:'#ef4444', border:'1px solid #fecaca'}}>Đã hủy</span>}
                    {invoice.status === 'issued' && <span className="badge" style={{background:'#ecfdf5', color:'#10b981', border:'1px solid #a7f3d0'}}>Đã phát hành</span>}
                    {invoice.status === 'draft' && <span className="badge" style={{background:'#f3f4f6', color:'#4b5563', border:'1px solid #d1d5db'}}>Nháp</span>}
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(invoice.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td style={{textAlign:'right'}}>
                    <Link href={`/customer/invoices/${invoice.id}`} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: 12 }}>
                      Xem
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

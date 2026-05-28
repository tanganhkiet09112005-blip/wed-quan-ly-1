'use client';
import { useState, useEffect, use } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useToast } from '@/lib/toast-context';
import { ArrowLeft, Printer, Send, XCircle, FileText } from 'lucide-react';
import Link from 'next/link';

const formatCurrency = v => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0);

export default function InvoiceDetailPage({ params }) {
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;
  const { user } = useAuth();
  const { toast, confirm } = useToast();
  const router = useRouter();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchInvoice = async () => {
    try {
      const res = await fetch(`/api/invoices/${id}`);
      const data = await res.json();
      if (data.success) {
        setInvoice(data.data);
      } else {
        toast.error('Không tìm thấy hóa đơn');
        router.push('/customer/invoices');
      }
    } catch (e) {
      console.error(e);
      toast.error('Lỗi khi tải hóa đơn');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.shopId) {
      fetchInvoice();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.shopId]);

  const handleIssue = async () => {
    confirm(`Bạn có chắc chắn muốn phát hành hóa đơn ${invoice.code}?`, async () => {
      setActionLoading('issue');
      try {
        const res = await fetch(`/api/invoices/${id}/issue`, { method: 'POST' });
        const data = await res.json();
        if (data.success) {
          toast.success('Phát hành hóa đơn thành công (Sandbox)');
          fetchInvoice();
        } else {
          toast.error(data.error || 'Lỗi khi phát hành');
        }
      } catch (e) {
        toast.error('Lỗi kết nối');
      } finally {
        setActionLoading(null);
      }
    });
  };

  const handleCancel = async () => {
    confirm(`Bạn có chắc chắn muốn hủy hóa đơn ${invoice.code}? Hành động này không thể hoàn tác.`, async () => {
      setActionLoading('cancel');
      try {
        const res = await fetch(`/api/invoices/${id}/cancel`, { method: 'POST' });
        const data = await res.json();
        if (data.success) {
          toast.success('Hủy hóa đơn thành công');
          fetchInvoice();
        } else {
          toast.error(data.error || 'Lỗi khi hủy');
        }
      } catch (e) {
        toast.error('Lỗi kết nối');
      } finally {
        setActionLoading(null);
      }
    });
  };

  if (loading) {
    return (
      <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ fontSize: 18, color: 'var(--text-muted)' }}>Đang tải chi tiết hóa đơn...</div>
      </div>
    );
  }

  if (!invoice) return null;

  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-secondary" onClick={() => router.push('/customer/invoices')} style={{ padding: '8px' }}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              Chi tiết hóa đơn: {invoice.code}
              {invoice.status === 'draft' && <span className="badge" style={{background:'#f3f4f6', color:'#4b5563', border:'1px solid #d1d5db'}}>Nháp</span>}
              {invoice.status === 'issued' && <span className="badge" style={{background:'#ecfdf5', color:'#10b981', border:'1px solid #a7f3d0'}}>Đã phát hành</span>}
              {invoice.status === 'cancelled' && <span className="badge" style={{background:'#fee2e2', color:'#ef4444', border:'1px solid #fecaca'}}>Đã hủy</span>}
            </div>
            <div className="page-subtitle">Ngày tạo: {new Date(invoice.createdAt).toLocaleString('vi-VN')}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {invoice.status === 'issued' && (
            <button className="btn btn-secondary" onClick={() => window.open(`/customer/invoices/print/${invoice.id}`, '_blank')}>
              <Printer size={14} /> In hóa đơn
            </button>
          )}
          {invoice.status === 'draft' && (
            <>
              <button 
                className="btn btn-primary" 
                onClick={handleIssue} 
                disabled={actionLoading}
                style={{ background: 'linear-gradient(135deg, #2563eb, #1e40af)' }}
              >
                <Send size={14} /> {actionLoading === 'issue' ? 'Đang xử lý...' : 'Phát hành Hóa đơn'}
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={handleCancel} 
                disabled={actionLoading}
                style={{ color: '#ef4444', borderColor: '#fee2e2', background: '#fef2f2' }}
              >
                <XCircle size={14} /> Hủy bỏ
              </button>
            </>
          )}
          {invoice.status === 'issued' && (
            <button 
              className="btn btn-secondary" 
              onClick={handleCancel} 
              disabled={actionLoading}
              style={{ color: '#ef4444', borderColor: '#fee2e2', background: '#fef2f2' }}
            >
              <XCircle size={14} /> Hủy hóa đơn
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Items Table */}
          <div className="card" style={{ padding: 0 }}>
            <div className="card-title" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', margin: 0 }}>
              Chi tiết mặt hàng
            </div>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>STT</th>
                    <th>Tên sản phẩm</th>
                    <th>Mã SKU</th>
                    <th style={{textAlign:'right'}}>Số lượng</th>
                    <th style={{textAlign:'right'}}>Đơn giá</th>
                    <th style={{textAlign:'right'}}>Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items?.map((item, index) => (
                    <tr key={item.id}>
                      <td>{index + 1}</td>
                      <td style={{ fontWeight: 600 }}>{item.name}</td>
                      <td style={{ fontFamily:'monospace', fontSize: 12 }}>{item.sku || '-'}</td>
                      <td style={{textAlign:'right'}}>{item.quantity}</td>
                      <td style={{textAlign:'right'}}>{formatCurrency(item.unitPrice)}</td>
                      <td style={{textAlign:'right', fontWeight: 600}}>{formatCurrency(item.lineTotal)}</td>
                    </tr>
                  ))}
                  {(!invoice.items || invoice.items.length === 0) && (
                    <tr><td colSpan={6} style={{textAlign:'center', padding: 20}}>Không có mặt hàng nào</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '20px', background: 'var(--bg-card-hover)', borderTop: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: 'var(--text-muted)' }}>Cộng tiền hàng (Subtotal):</span>
                <span style={{ fontWeight: 600 }}>{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: 'var(--text-muted)' }}>Tiền thuế VAT:</span>
                <span style={{ fontWeight: 600 }}>{formatCurrency(invoice.tax)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border)', paddingTop: 12, marginTop: 4 }}>
                <span style={{ fontWeight: 700, fontSize: 16 }}>Tổng tiền thanh toán:</span>
                <span style={{ fontWeight: 800, fontSize: 18, color: '#10b981' }}>{formatCurrency(invoice.total)}</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Customer Info */}
          <div className="card">
            <div className="card-title">Thông tin khách hàng</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Tên khách hàng:</span>
                <span style={{ fontWeight: 600 }}>{invoice.customerName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Điện thoại:</span>
                <span>{invoice.customerPhone || '-'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Mã số thuế:</span>
                <span>{invoice.customerTaxCode || '-'}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ color: 'var(--text-muted)' }}>Địa chỉ:</span>
                <span>{invoice.customerAddress || '-'}</span>
              </div>
            </div>
          </div>

          {/* Reference Info */}
          <div className="card">
            <div className="card-title">Thông tin tham chiếu</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14 }}>
              {invoice.order && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Mã đơn hàng:</span>
                  <Link href={`/customer/orders/${invoice.order.id}`} style={{ fontWeight: 600, color: 'var(--primary)' }}>
                    {invoice.order.code}
                  </Link>
                </div>
              )}
              {invoice.provider && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Nhà cung cấp:</span>
                    <span>{invoice.provider}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Mã tra cứu:</span>
                    <span style={{ fontFamily: 'monospace' }}>{invoice.providerInvoiceId}</span>
                  </div>
                </>
              )}
              {invoice.issuedAt && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Ngày phát hành:</span>
                  <span>{new Date(invoice.issuedAt).toLocaleString('vi-VN')}</span>
                </div>
              )}
              {invoice.cancelledAt && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ef4444' }}>
                  <span style={{ color: '#ef4444' }}>Ngày hủy:</span>
                  <span>{new Date(invoice.cancelledAt).toLocaleString('vi-VN')}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

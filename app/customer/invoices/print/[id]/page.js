'use client';
import { useState, useEffect, use } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

const formatCurrency = v => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0);

export default function InvoicePrintPage({ params }) {
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;
  const { user } = useAuth();
  const router = useRouter();
  const [invoice, setInvoice] = useState(null);

  useEffect(() => {
    if (user?.shopId) {
      fetch(`/api/invoices/${id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setInvoice(data.data);
            setTimeout(() => {
              window.print();
            }, 500);
          } else {
            router.push('/customer/invoices');
          }
        });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.shopId]);

  if (!invoice) return <div style={{ padding: 40, textAlign: 'center' }}>Đang chuẩn bị bản in...</div>;

  return (
    <div style={{ background: '#fff', minHeight: '100vh', padding: '40px' }} className="print-only-container">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          .print-only-container, .print-only-container * { visibility: visible; }
          .print-only-container { position: absolute; left: 0; top: 0; width: 100%; padding: 0 !important; }
          .no-print { display: none !important; }
        }
        .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0, 0, 0, 0.15); font-size: 14px; line-height: 24px; font-family: 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif; color: #555; }
        .invoice-box table { width: 100%; line-height: inherit; text-align: left; }
        .invoice-box table td { padding: 5px; vertical-align: top; }
        .invoice-box table tr.top table td { padding-bottom: 20px; }
        .invoice-box table tr.top table td.title { font-size: 32px; line-height: 45px; color: #333; }
        .invoice-box table tr.information table td { padding-bottom: 40px; }
        .invoice-box table tr.heading td { background: #eee; border-bottom: 1px solid #ddd; font-weight: bold; }
        .invoice-box table tr.details td { padding-bottom: 20px; }
        .invoice-box table tr.item td{ border-bottom: 1px solid #eee; }
        .invoice-box table tr.item.last td { border-bottom: none; }
        .invoice-box table tr.total td:nth-child(5) { border-top: 2px solid #eee; font-weight: bold; }
      `}} />

      <div className="invoice-box">
        <table cellPadding="0" cellSpacing="0">
          <tr className="top">
            <td colSpan="5">
              <table>
                <tr>
                  <td className="title">
                    <h2 style={{margin:0, fontSize: 24, color: '#2563eb'}}>Hóa Đơn Bán Hàng</h2>
                  </td>
                  <td style={{textAlign: 'right'}}>
                    Mã HĐ #: <b>{invoice.code}</b><br />
                    Ngày lập: {new Date(invoice.createdAt).toLocaleDateString('vi-VN')}<br />
                    Trạng thái: {invoice.status === 'issued' ? 'Đã phát hành' : invoice.status === 'cancelled' ? 'Đã hủy' : 'Nháp'}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr className="information">
            <td colSpan="5">
              <table>
                <tr>
                  <td>
                    <b>Đơn vị bán hàng:</b><br />
                    Shop: {user?.shop?.name || 'Cửa hàng'}<br />
                    Mã đơn: {invoice.order?.code || '-'}
                  </td>
                  <td style={{textAlign: 'right'}}>
                    <b>Khách hàng:</b><br />
                    {invoice.customerName}<br />
                    {invoice.customerPhone || 'Không có SĐT'}<br />
                    {invoice.customerAddress || ''}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr className="heading">
            <td>STT</td>
            <td>Tên sản phẩm</td>
            <td style={{textAlign: 'right'}}>Số lượng</td>
            <td style={{textAlign: 'right'}}>Đơn giá</td>
            <td style={{textAlign: 'right'}}>Thành tiền</td>
          </tr>

          {invoice.items?.map((item, i) => (
            <tr className="item" key={item.id}>
              <td>{i + 1}</td>
              <td>{item.name} {item.sku ? `(${item.sku})` : ''}</td>
              <td style={{textAlign: 'right'}}>{item.quantity}</td>
              <td style={{textAlign: 'right'}}>{formatCurrency(item.unitPrice)}</td>
              <td style={{textAlign: 'right'}}>{formatCurrency(item.lineTotal)}</td>
            </tr>
          ))}

          <tr className="total">
            <td colSpan="3"></td>
            <td style={{textAlign: 'right', paddingTop: 20}}>Cộng tiền hàng:</td>
            <td style={{textAlign: 'right', paddingTop: 20}}>{formatCurrency(invoice.subtotal)}</td>
          </tr>
          <tr className="total">
            <td colSpan="3"></td>
            <td style={{textAlign: 'right'}}>Tiền thuế VAT:</td>
            <td style={{textAlign: 'right'}}>{formatCurrency(invoice.tax)}</td>
          </tr>
          <tr className="total">
            <td colSpan="3"></td>
            <td style={{textAlign: 'right'}}><b>Tổng thanh toán:</b></td>
            <td style={{textAlign: 'right'}}><b>{formatCurrency(invoice.total)}</b></td>
          </tr>
        </table>
        
        <div style={{ marginTop: 40, textAlign: 'center', fontSize: 12, color: '#888' }}>
          <p>Cảm ơn quý khách đã mua hàng!</p>
          {invoice.providerInvoiceId && <p>Mã tra cứu hóa đơn điện tử: {invoice.providerInvoiceId}</p>}
        </div>
      </div>
      
      <div className="no-print" style={{ textAlign: 'center', marginTop: 20 }}>
        <button className="btn btn-primary" onClick={() => window.print()}>In lại</button>
        <button className="btn btn-secondary" onClick={() => window.close()} style={{ marginLeft: 10 }}>Đóng</button>
      </div>
    </div>
  );
}

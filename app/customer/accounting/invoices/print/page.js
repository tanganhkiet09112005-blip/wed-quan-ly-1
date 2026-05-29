'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

const formatCurrency = v => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0);

export default function InvoicePrintPage() {
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get('invoiceId');
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!invoiceId) {
      const t = setTimeout(() => {
        setError('Thiếu thông tin ID hoá đơn');
        setLoading(false);
      }, 0);
      return () => clearTimeout(t);
    }

    const fetchInvoiceDetails = async () => {
      try {
        const res = await fetch(`/api/invoices/detail?invoiceId=${invoiceId}`);
        const data = await res.json();
        if (data.success) {
          setInvoice(data.data);
        } else {
          setError(data.error || 'Không thể lấy thông tin hoá đơn');
        }
      } catch (err) {
        setError('Lỗi kết nối máy chủ');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoiceDetails();
  }, [invoiceId]);

  useEffect(() => {
    if (invoice && !loading && !error) {
      // Trigger browser print dialog once data is loaded and rendered
      const timer = setTimeout(() => {
        window.print();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [invoice, loading, error]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'system-ui, sans-serif' }}>
        <div className="spinner" />
        <p style={{ marginTop: 16, color: '#6b7280', fontSize: 16 }}>Đang chuẩn bị bản in hoá đơn điện tử...</p>
        <style jsx>{`
          .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid rgba(59, 130, 246, 0.1);
            border-top-color: #2563eb;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div style={{ padding: 40, textAlign: 'center', fontFamily: 'system-ui, sans-serif' }}>
        <h2 style={{ color: '#ef4444' }}>Lỗi In Hoá Đơn</h2>
        <p>{error || 'Không tìm thấy hoá đơn yêu cầu.'}</p>
        <button onClick={() => window.close()} style={{ padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', marginTop: 16 }}>Đóng cửa sổ</button>
      </div>
    );
  }

  const order = invoice.order || {};
  const items = order.items || [];

  return (
    <div className="invoice-container">
      {/* Header */}
      <div className="invoice-header">
        <div className="company-logo-section">
          <h1 className="company-name">Hship.vn</h1>
          <p className="company-slogan">Hệ thống Quản lý Giao hàng & Kế toán tự động</p>
        </div>
        <div className="invoice-title-section">
          <h2 className="invoice-title">HOÁ ĐƠN GIÁ TRỊ GIA TĂNG</h2>
          <p className="invoice-sub-title">(Bản thể hiện của hoá đơn điện tử)</p>
          <div className="invoice-meta-grid">
            <div>Ký hiệu: <b>1C26TBB</b></div>
            <div>Số HĐ: <b style={{ color: '#2563eb' }}>{invoice.code}</b></div>
            <div>Ngày xuất: {new Date(invoice.createdAt).toLocaleDateString('vi-VN')}</div>
          </div>
        </div>
      </div>

      <hr className="divider" />

      {/* Info Columns */}
      <div className="info-section">
        <div className="info-block">
          <h3>ĐƠN VỊ BÁN HÀNG (SELLER)</h3>
          <p className="name">Hship.vn - Shop Thời Trang GenZ</p>
          <p><b>Địa chỉ:</b> Toà nhà WEN, 120 Điện Biên Phủ, Quận 1, TP. Hồ Chí Minh</p>
          <p><b>Điện thoại:</b> 1900 6789</p>
          <p><b>Email:</b> support@hship.vn</p>
          <p><b>Website:</b> https://hship.vn</p>
        </div>
        <div className="info-block">
          <h3>ĐƠN VỊ MUA HÀNG (BUYER)</h3>
          <p className="name">{order.shippingName || 'Khách hàng vãng lai'}</p>
          <p><b>Địa chỉ giao hàng:</b> {order.shippingAddress || 'Chưa cập nhật'}</p>
          <p><b>Điện thoại:</b> {order.shippingPhone || '—'}</p>
          <p><b>Mã đơn hàng gốc:</b> {order.code || '—'}</p>
          <p><b>Đơn vị vận chuyển:</b> {order.shipperCode || '—'} (Mã vận đơn: {order.trackingCode || '—'})</p>
        </div>
      </div>

      {/* Items Table */}
      <div className="table-section">
        <table className="items-table">
          <thead>
            <tr>
              <th style={{ width: '60px', textAlign: 'center' }}>STT</th>
              <th>Tên hàng hoá, dịch vụ</th>
              <th style={{ width: '80px', textAlign: 'center' }}>ĐVT</th>
              <th style={{ width: '80px', textAlign: 'center' }}>SL</th>
              <th style={{ width: '120px', textAlign: 'right' }}>Đơn giá</th>
              <th style={{ width: '150px', textAlign: 'right' }}>Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              // If there are no individual items, render one line for the total order value
              <tr>
                <td style={{ textAlign: 'center' }}>1</td>
                <td>Sản phẩm thời trang chốt từ kênh Facebook (Đơn {order.code})</td>
                <td style={{ textAlign: 'center' }}>Cái</td>
                <td style={{ textAlign: 'center' }}>1</td>
                <td style={{ textAlign: 'right' }}>{formatCurrency(invoice.amount)}</td>
                <td style={{ textAlign: 'right' }}>{formatCurrency(invoice.amount)}</td>
              </tr>
            ) : (
              items.map((item, idx) => {
                // Calculate amount excluding 10% VAT for individual item display
                const priceExcludingTax = item.price / 1.1;
                const totalExcludingTax = priceExcludingTax * item.quantity;
                return (
                  <tr key={item.id}>
                    <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                    <td>{item.productName}</td>
                    <td style={{ textAlign: 'center' }}>Cái</td>
                    <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(priceExcludingTax)}</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(totalExcludingTax)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Summary calculation */}
      <div className="summary-section">
        <div className="payment-method-block">
          <p><b>Hình thức thanh toán:</b> TM/CK (COD)</p>
          <p><b>Tỷ giá thuế VAT:</b> 10%</p>
          <p style={{ marginTop: 12, fontSize: 12, color: '#6b7280', fontStyle: 'italic' }}>
            * Hoá đơn này được ký điện tử bởi phần mềm quản lý Hship.vn và đồng bộ trực tiếp lên cơ sở dữ liệu cơ quan thuế qua tích hợp MISA SME.
          </p>
        </div>
        <div className="calculations-block">
          <div className="calc-row">
            <span>Cộng tiền hàng (chưa VAT):</span>
            <span>{formatCurrency(invoice.amount)}</span>
          </div>
          <div className="calc-row">
            <span>Tiền thuế VAT (10%):</span>
            <span>{formatCurrency(invoice.tax)}</span>
          </div>
          <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '8px 0' }} />
          <div className="calc-row grand-total">
            <span>TỔNG CỘNG THANH TOÁN:</span>
            <span style={{ color: '#10b981' }}>{formatCurrency(invoice.total)}</span>
          </div>
        </div>
      </div>

      <hr className="divider" style={{ marginTop: 30 }} />

      {/* Signatures */}
      <div className="signature-section">
        <div className="sig-block">
          <p className="sig-title">NGƯỜI MUA HÀNG</p>
          <p className="sig-subtitle">(Ký, ghi rõ họ tên)</p>
          <div style={{ height: 80 }} />
          <p className="signed-name">{order.shippingName || '—'}</p>
        </div>
        <div className="sig-block">
          <p className="sig-title">NGƯỜI BÁN HÀNG</p>
          <p className="sig-subtitle">(Ký điện tử, đóng dấu phát hành)</p>
          <div className="digital-stamp">
            <p className="stamp-title">ĐÃ KÝ SỐ</p>
            <p className="stamp-comp">Hship.vn (GenZ Shop)</p>
            <p className="stamp-date">{new Date(invoice.createdAt).toLocaleDateString('vi-VN')}</p>
          </div>
        </div>
      </div>

      {/* CSS Styling */}
      <style jsx global>{`
        body {
          background-color: #fff;
          color: #1f2937;
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        .invoice-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 30px;
          box-sizing: border-box;
        }

        .invoice-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .company-name {
          font-size: 32px;
          font-weight: 800;
          color: #2563eb;
          margin: 0 0 4px 0;
          letter-spacing: -1px;
        }

        .company-slogan {
          font-size: 12px;
          color: #6b7280;
          margin: 0;
        }

        .invoice-title-section {
          text-align: right;
        }

        .invoice-title {
          font-size: 20px;
          font-weight: 800;
          color: #111827;
          margin: 0 0 2px 0;
        }

        .invoice-sub-title {
          font-size: 11px;
          font-style: italic;
          color: #6b7280;
          margin: 0 0 12px 0;
        }

        .invoice-meta-grid {
          font-size: 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .divider {
          border: none;
          border-top: 2px solid #2563eb;
          margin: 20px 0;
        }

        .info-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          margin-bottom: 30px;
        }

        .info-block h3 {
          font-size: 13px;
          font-weight: 700;
          color: #2563eb;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 6px;
          margin: 0 0 10px 0;
        }

        .info-block p {
          font-size: 12px;
          margin: 0 0 6px 0;
          line-height: 1.4;
          color: #4b5563;
        }

        .info-block .name {
          font-size: 14px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 8px;
        }

        .table-section {
          margin-bottom: 30px;
        }

        .items-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }

        .items-table th {
          background-color: #f3f4f6;
          border: 1px solid #d1d5db;
          padding: 8px 10px;
          font-weight: 700;
          color: #374151;
        }

        .items-table td {
          border: 1px solid #d1d5db;
          padding: 10px;
          color: #4b5563;
          line-height: 1.4;
        }

        .summary-section {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 40px;
          margin-bottom: 30px;
        }

        .payment-method-block p {
          font-size: 12px;
          margin: 0 0 6px 0;
          color: #4b5563;
        }

        .calculations-block {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .calc-row {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #4b5563;
        }

        .calc-row.grand-total {
          font-size: 15px;
          font-weight: 800;
          color: #111827;
        }

        .signature-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          text-align: center;
          margin-top: 30px;
        }

        .sig-title {
          font-size: 13px;
          font-weight: 700;
          color: #111827;
          margin: 0 0 4px 0;
        }

        .sig-subtitle {
          font-size: 11px;
          color: #6b7280;
          margin: 0;
        }

        .signed-name {
          font-weight: 700;
          font-size: 13px;
          color: #374151;
          margin: 0;
        }

        .digital-stamp {
          display: inline-block;
          border: 2px dashed #ef4444;
          border-radius: 8px;
          padding: 10px 20px;
          margin-top: 15px;
          background-color: rgba(239, 68, 68, 0.02);
          transform: rotate(-3deg);
        }

        .stamp-title {
          font-size: 14px;
          font-weight: 800;
          color: #ef4444;
          margin: 0 0 2px 0;
          letter-spacing: 1px;
        }

        .stamp-comp {
          font-size: 11px;
          font-weight: 700;
          color: #ef4444;
          margin: 0 0 2px 0;
        }

        .stamp-date {
          font-size: 9px;
          color: #b91c1c;
          margin: 0;
        }

        @media print {
          body {
            background-color: #fff;
          }
          .invoice-container {
            padding: 0;
            max-width: 100%;
          }
          .divider {
            border-top: 2px solid #000;
          }
          .company-name {
            color: #000;
          }
          .info-block h3 {
            color: #000;
            border-bottom: 1px solid #000;
          }
          .digital-stamp {
            border: 2px dashed #000;
            color: #000;
          }
          .stamp-title, .stamp-comp, .stamp-date {
            color: #000;
          }
        }
      `}</style>
    </div>
  );
}

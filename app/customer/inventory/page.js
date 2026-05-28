'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, CheckCircle, Package, RefreshCw, Settings2, TrendingDown, Warehouse } from 'lucide-react';

const fmt = (value) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value || 0);
const fmtN = (value) => new Intl.NumberFormat('vi-VN').format(value || 0);

const MOVEMENT_LABEL = { import: 'Nhập kho', export: 'Xuất kho', adjustment: 'Điều chỉnh' };

export default function InventoryPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [adjusting, setAdjusting] = useState(null);
  const [movementForm, setMovementForm] = useState({ type: 'import', quantity: '', note: '' });
  const [savingMovement, setSavingMovement] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/inventory/overview');
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Không thể tải dữ liệu tồn kho.');
      setData(json.data);
    } catch (err) {
      setError(err.message || 'Không thể kết nối máy chủ.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const summary = data?.summary || {};
  const lowStockItems = data?.lowStockItems || [];

  const startAdjust = (item) => {
    setAdjusting(item);
    setMovementForm({ type: 'import', quantity: '', note: `Bổ sung tồn kho cho ${item.sku}` });
    setSuccess('');
    setError('');
  };

  const submitMovement = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (!adjusting) return;
    if (!movementForm.quantity || Number.isNaN(Number(movementForm.quantity)) || Number(movementForm.quantity) <= 0) {
      setError('Số lượng điều chỉnh phải lớn hơn 0.');
      return;
    }

    setSavingMovement(true);
    try {
      const res = await fetch('/api/inventory/movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variantId: adjusting.id,
          type: movementForm.type,
          quantity: Number(movementForm.quantity),
          note: movementForm.note.trim() || null,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Không thể điều chỉnh tồn kho.');
      setSuccess('Đã cập nhật tồn kho.');
      setAdjusting(null);
      await load();
    } catch (err) {
      setError(err.message || 'Không thể kết nối máy chủ.');
    } finally {
      setSavingMovement(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <div className="page-title">Kho</div>
          <div className="page-subtitle">Theo dõi tổng tồn SKU, cảnh báo dưới định mức và điều chỉnh nhập/xuất kho</div>
        </div>
        <button type="button" className="btn btn-secondary" onClick={load} disabled={loading}>
          <RefreshCw size={14} style={{ animation: loading ? 'spin 0.8s linear infinite' : 'none' }} /> Tải lại
        </button>
      </div>

      {error && (
        <div className="alert alert-danger mb-16" style={{ alignItems: 'flex-start', gap: 8 }}>
          <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} /><span>{error}</span>
        </div>
      )}
      {success && (
        <div className="alert alert-success mb-16" style={{ alignItems: 'flex-start', gap: 8 }}>
          <CheckCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} /><span>{success}</span>
        </div>
      )}

      <div className="grid-kpi" style={{ marginBottom: 20 }}>
        {[
          { label: 'Tổng sản phẩm', value: loading ? '...' : fmtN(summary.totalProducts), cls: 'kpi-icon-blue', icon: Package },
          { label: 'Tổng SKU', value: loading ? '...' : fmtN(summary.totalVariants), cls: 'kpi-icon-purple', icon: Warehouse },
          { label: 'Tổng tồn kho', value: loading ? '...' : fmtN(summary.totalStockQuantity), cls: 'kpi-icon-green', icon: Warehouse },
          { label: 'SKU dưới định mức', value: loading ? '...' : fmtN(summary.lowStockSkuCount), cls: (summary.lowStockSkuCount || 0) > 0 ? 'kpi-icon-red' : 'kpi-icon-green', icon: TrendingDown },
        ].map(({ label, value, cls, icon: Icon }) => (
          <div key={label} className="kpi-card">
            <div className={`kpi-icon ${cls}`}><Icon size={17} /></div>
            <div className="kpi-content">
              <div className="kpi-value" style={{ fontSize: 18 }}>{value}</div>
              <div className="kpi-label">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {adjusting && (
        <form onSubmit={submitMovement} className="card" style={{ marginBottom: 16 }}>
          <div className="card-title" style={{ marginBottom: 12 }}>Điều chỉnh tồn kho: {adjusting.sku}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '180px 160px minmax(0,1fr) auto auto', gap: 10, alignItems: 'end' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Loại</label>
              <select className="form-control" value={movementForm.type} onChange={(e) => setMovementForm((current) => ({ ...current, type: e.target.value }))}>
                <option value="import">Nhập kho</option>
                <option value="export">Xuất kho</option>
                <option value="adjustment">Điều chỉnh tăng</option>
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Số lượng</label>
              <input className="form-control" type="number" min="1" value={movementForm.quantity} onChange={(e) => setMovementForm((current) => ({ ...current, quantity: e.target.value }))} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Ghi chú</label>
              <input className="form-control" value={movementForm.note} onChange={(e) => setMovementForm((current) => ({ ...current, note: e.target.value }))} />
            </div>
            <button type="button" className="btn btn-secondary" onClick={() => setAdjusting(null)} disabled={savingMovement}>Hủy</button>
            <button type="submit" className="btn btn-primary" disabled={savingMovement}>
              {savingMovement ? <RefreshCw size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Settings2 size={14} />} Lưu
            </button>
          </div>
        </form>
      )}

      <div className="card" style={{ padding: 0, marginBottom: 16 }}>
        <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="card-title" style={{ marginBottom: 2 }}>SKU dưới định mức</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Các SKU có tồn kho nhỏ hơn hoặc bằng ngưỡng cảnh báo.</div>
          </div>
          <Link href="/customer/products" className="btn btn-secondary btn-sm">Quản lý sản phẩm</Link>
        </div>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Sản phẩm</th>
                <th>Size/Màu</th>
                <th style={{ textAlign: 'right' }}>Tồn hiện tại</th>
                <th style={{ textAlign: 'right' }}>Ngưỡng cảnh báo</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 7 }).map((__, j) => (
                    <td key={j}><div className="skeleton" style={{ height: 16, borderRadius: 4 }} /></td>
                  ))}</tr>
                ))
              ) : lowStockItems.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: 0 }}>
                  <div className="empty-state" style={{ padding: 44 }}>
                    <div className="empty-state-icon"><CheckCircle size={26} /></div>
                    <h3>Không có sản phẩm dưới định mức</h3>
                    <p>Tất cả SKU đang cao hơn ngưỡng cảnh báo tồn kho.</p>
                  </div>
                </td></tr>
              ) : lowStockItems.map((item) => (
                <tr key={item.id}>
                  <td><span style={{ fontFamily: 'monospace', color: 'var(--primary)', fontWeight: 800 }}>{item.sku}</span></td>
                  <td>
                    <div style={{ fontWeight: 800 }}>{item.productName}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{item.productCode}</div>
                  </td>
                  <td>{item.label}</td>
                  <td style={{ textAlign: 'right', fontWeight: 900, color: item.stockQuantity === 0 ? 'var(--danger)' : '#d97706' }}>{fmtN(item.stockQuantity)}</td>
                  <td style={{ textAlign: 'right' }}>{fmtN(item.lowStockThreshold)}</td>
                  <td>{item.stockQuantity === 0 ? <span className="badge status-cancelled">Hết hàng</span> : <span className="badge status-pending">Dưới định mức</span>}</td>
                  <td><button type="button" className="btn btn-secondary btn-sm" onClick={() => startAdjust(item)}><Settings2 size={12} /> Điều chỉnh</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)' }}>
          <div className="card-title" style={{ marginBottom: 2 }}>Tổng quan SKU</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Giá trị tồn kho hiện tại: {fmt(summary.totalInventoryValue)}</div>
        </div>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Sản phẩm</th>
                <th style={{ textAlign: 'right' }}>Giá bán</th>
                <th style={{ textAlign: 'right' }}>Tồn</th>
                <th style={{ textAlign: 'right' }}>Giá trị kho</th>
              </tr>
            </thead>
            <tbody>
              {(data?.variants || []).slice(0, 80).map((item) => (
                <tr key={item.id}>
                  <td><span style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--primary)' }}>{item.sku}</span></td>
                  <td>{item.productName}</td>
                  <td style={{ textAlign: 'right' }}>{fmt(item.price)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 800 }}>{fmtN(item.stockQuantity)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 800 }}>{fmt(Number(item.price || 0) * Number(item.stockQuantity || 0))}</td>
                </tr>
              ))}
              {!loading && (data?.variants || []).length === 0 && (
                <tr><td colSpan={5} style={{ padding: 0 }}>
                  <div className="empty-state" style={{ padding: 36 }}>
                    <div className="empty-state-icon"><Package size={24} /></div>
                    <h3>Chưa có SKU nào</h3>
                    <p>Thêm sản phẩm để bắt đầu quản lý tồn kho.</p>
                    <Link href="/customer/products/create" className="btn btn-primary">Thêm sản phẩm</Link>
                  </div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

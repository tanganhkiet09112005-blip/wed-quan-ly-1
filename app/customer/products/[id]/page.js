'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft, CheckCircle, PackagePlus, RefreshCw, Save, Trash2 } from 'lucide-react';

const fmt = (value) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value || 0);
const fmtN = (value) => new Intl.NumberFormat('vi-VN').format(value || 0);

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params?.id;
  const [product, setProduct] = useState(null);
  const [form, setForm] = useState({ code: '', name: '', category: '', description: '', status: 'active' });
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/products/${productId}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Không thể tải sản phẩm.');
      const data = json.data;
      setProduct(data);
      setForm({
        code: data.code || '',
        name: data.name || '',
        category: data.category || '',
        description: data.description || '',
        status: data.status || 'active',
      });
      setVariants((data.variants || []).map((variant) => ({
        id: variant.id,
        sku: variant.sku || '',
        name: variant.name || '',
        size: variant.size || '',
        color: variant.color || '',
        price: String(variant.price ?? 0),
        stockQuantity: String(variant.stockQuantity ?? 0),
        lowStockThreshold: String(variant.lowStockThreshold ?? 5),
        status: variant.status || 'active',
      })));
    } catch (err) {
      setError(err.message || 'Không thể kết nối máy chủ.');
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    load();
  }, [load]);

  const setVariantField = (index, field, value) => {
    setVariants((current) => current.map((variant, i) => i === index ? { ...variant, [field]: value } : variant));
  };

  const addVariant = () => {
    setVariants((current) => [...current, {
      id: null,
      sku: '',
      name: '',
      size: '',
      color: '',
      price: '0',
      stockQuantity: '0',
      lowStockThreshold: '5',
      status: 'active',
    }]);
  };

  const validate = () => {
    if (!form.code.trim()) return 'Mã sản phẩm là bắt buộc.';
    if (!form.name.trim()) return 'Tên sản phẩm là bắt buộc.';
    for (const variant of variants) {
      if (variant.id && !variant.sku.trim()) return 'SKU hiện có không được để trống.';
      if (Number.isNaN(Number(variant.price)) || Number(variant.price) < 0) return 'Giá SKU phải lớn hơn hoặc bằng 0.';
      if (Number.isNaN(Number(variant.stockQuantity)) || Number(variant.stockQuantity) < 0) return 'Tồn kho SKU phải lớn hơn hoặc bằng 0.';
      if (Number.isNaN(Number(variant.lowStockThreshold)) || Number(variant.lowStockThreshold) < 0) return 'Ngưỡng tồn thấp phải lớn hơn hoặc bằng 0.';
    }
    return '';
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          variants: variants.map((variant) => ({
            id: variant.id || undefined,
            sku: variant.sku.trim() || undefined,
            name: variant.name.trim() || null,
            size: variant.size.trim() || null,
            color: variant.color.trim() || null,
            price: Number(variant.price || 0),
            stockQuantity: Number(variant.stockQuantity || 0),
            lowStockThreshold: Number(variant.lowStockThreshold || 5),
            status: variant.status,
          })),
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Không thể cập nhật sản phẩm.');
      setSuccess('Đã cập nhật sản phẩm.');
      await load();
    } catch (err) {
      setError(err.message || 'Không thể kết nối máy chủ.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!confirm('Ngừng bán sản phẩm này? Sản phẩm sẽ không bị xóa khỏi dữ liệu.')) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/products/${productId}`, { method: 'DELETE' });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Không thể ngừng bán sản phẩm.');
      router.push('/customer/products');
    } catch (err) {
      setError(err.message || 'Không thể kết nối máy chủ.');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !product) {
    return (
      <div className="page-container" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text-muted)' }}>Đang tải sản phẩm...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="page-container">
        <Link href="/customer/products" className="btn btn-secondary btn-sm" style={{ marginBottom: 16 }}><ArrowLeft size={13} /> Quay lại sản phẩm</Link>
        <div className="alert alert-danger">{error || 'Không tìm thấy sản phẩm.'}</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <Link href="/customer/products" className="btn btn-secondary btn-sm" style={{ marginBottom: 10, gap: 6, display: 'inline-flex', alignItems: 'center' }}>
            <ArrowLeft size={13} /> Quay lại sản phẩm
          </Link>
          <div className="page-title">{product.name}</div>
          <div className="page-subtitle">{product.code} · {fmtN(product.variantCount)} SKU · Tổng tồn {fmtN(product.totalStock)}</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" className="btn btn-secondary" onClick={load} disabled={loading || saving}>
            <RefreshCw size={14} style={{ animation: loading ? 'spin 0.8s linear infinite' : 'none' }} /> Tải lại
          </button>
          <button type="button" className="btn btn-secondary" onClick={handleDeactivate} disabled={saving}>
            <Trash2 size={14} /> Ngừng bán
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <RefreshCw size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Save size={14} />} Lưu
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger mb-16" style={{ gap: 8 }}><AlertCircle size={14} /> {error}</div>}
      {success && <div className="alert alert-success mb-16" style={{ gap: 8 }}><CheckCircle size={14} /> {success}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 360px', gap: 16, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div className="card-title" style={{ marginBottom: 16 }}>Thông tin sản phẩm</div>
            <div className="form-grid form-grid-2">
              <Field label="Mã sản phẩm" value={form.code} onChange={(value) => setForm((current) => ({ ...current, code: value }))} />
              <Field label="Tên sản phẩm" value={form.name} onChange={(value) => setForm((current) => ({ ...current, name: value }))} />
            </div>
            <div className="form-grid form-grid-2">
              <Field label="Danh mục" value={form.category} onChange={(value) => setForm((current) => ({ ...current, category: value }))} />
              <div className="form-group">
                <label className="form-label">Trạng thái</label>
                <select className="form-control" value={form.status} onChange={(e) => setForm((current) => ({ ...current, status: e.target.value }))}>
                  <option value="active">Đang bán</option>
                  <option value="inactive">Ngừng bán</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Mô tả</label>
              <textarea className="form-control" rows={4} value={form.description} onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))} />
            </div>
          </div>

          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div className="card-title" style={{ marginBottom: 2 }}>SKU / biến thể</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Có thể sửa giá, tồn kho và ngưỡng cảnh báo theo từng SKU.</div>
              </div>
              <button type="button" className="btn btn-secondary btn-sm" onClick={addVariant}><PackagePlus size={13} /> Thêm SKU</button>
            </div>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Size</th>
                    <th>Màu</th>
                    <th style={{ textAlign: 'right' }}>Giá</th>
                    <th style={{ textAlign: 'right' }}>Tồn</th>
                    <th style={{ textAlign: 'right' }}>Ngưỡng</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {variants.map((variant, index) => (
                    <tr key={variant.id || `new-${index}`}>
                      <td><input className="form-control" value={variant.sku} placeholder="Tự sinh nếu để trống" onChange={(e) => setVariantField(index, 'sku', e.target.value)} /></td>
                      <td><input className="form-control" value={variant.size} onChange={(e) => setVariantField(index, 'size', e.target.value)} /></td>
                      <td><input className="form-control" value={variant.color} onChange={(e) => setVariantField(index, 'color', e.target.value)} /></td>
                      <td><input className="form-control" type="number" value={variant.price} onChange={(e) => setVariantField(index, 'price', e.target.value)} style={{ textAlign: 'right' }} /></td>
                      <td><input className="form-control" type="number" value={variant.stockQuantity} onChange={(e) => setVariantField(index, 'stockQuantity', e.target.value)} style={{ textAlign: 'right' }} /></td>
                      <td><input className="form-control" type="number" value={variant.lowStockThreshold} onChange={(e) => setVariantField(index, 'lowStockThreshold', e.target.value)} style={{ textAlign: 'right' }} /></td>
                      <td>
                        <select className="form-control" value={variant.status} onChange={(e) => setVariantField(index, 'status', e.target.value)}>
                          <option value="active">Đang bán</option>
                          <option value="inactive">Ngừng bán</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div className="card-title" style={{ marginBottom: 12 }}>Tổng quan tồn kho</div>
            <div style={{ display: 'grid', gap: 10, fontSize: 13 }}>
              <div className="flex-between"><span style={{ color: 'var(--text-muted)' }}>Giá thấp nhất</span><strong>{fmt(product.priceMin)}</strong></div>
              <div className="flex-between"><span style={{ color: 'var(--text-muted)' }}>Giá cao nhất</span><strong>{fmt(product.priceMax)}</strong></div>
              <div className="flex-between"><span style={{ color: 'var(--text-muted)' }}>Tổng tồn</span><strong>{fmtN(product.totalStock)}</strong></div>
              <div className="flex-between"><span style={{ color: 'var(--text-muted)' }}>SKU dưới định mức</span><strong style={{ color: product.lowStockCount > 0 ? 'var(--danger)' : 'var(--success)' }}>{fmtN(product.lowStockCount)}</strong></div>
            </div>
          </div>

          <div className="card">
            <div className="card-title" style={{ marginBottom: 12 }}>Lịch sử tồn kho gần đây</div>
            {(product.inventoryMovements || []).length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Chưa có biến động tồn kho.</div>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                {product.inventoryMovements.slice(0, 8).map((movement) => (
                  <div key={movement.id} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px' }}>
                    <div className="flex-between" style={{ marginBottom: 4 }}>
                      <strong style={{ fontSize: 13 }}>{movement.type}</strong>
                      <span style={{ color: movement.quantity >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 800 }}>{movement.quantity > 0 ? '+' : ''}{movement.quantity}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{movement.variant?.sku || 'SKU'} · {new Date(movement.createdAt).toLocaleString('vi-VN')}</div>
                    {movement.note && <div style={{ fontSize: 12, marginTop: 4 }}>{movement.note}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <input className="form-control" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

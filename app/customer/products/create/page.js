'use client';

import { useReducer, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft, Box, CheckCircle, RefreshCw } from 'lucide-react';

const INIT = {
  code: '',
  name: '',
  description: '',
  category: '',
  status: 'active',
  sku: '',
  variantName: '',
  size: '',
  color: '',
  price: '',
  stockQuantity: '',
  lowStockThreshold: '5',
};

function reducer(state, action) {
  if (action.type === 'set') return { ...state, [action.field]: action.value };
  if (action.type === 'reset') return INIT;
  return state;
}

function toNumber(value) {
  if (value === '') return 0;
  return Number(value);
}

const Field = ({ label, field, type = 'text', placeholder, required, hint, form, dispatch, submitting }) => (
  <div className="form-group">
    <label className="form-label">{label} {required && <span style={{ color: 'var(--danger)' }}>*</span>}</label>
    <input
      className="form-control"
      type={type}
      placeholder={placeholder}
      value={form[field]}
      onChange={(e) => dispatch({ type: 'set', field, value: e.target.value })}
      disabled={submitting}
      required={required}
    />
    {hint && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{hint}</div>}
  </div>
);

export default function ProductCreatePage() {
  const router = useRouter();
  const [form, dispatch] = useReducer(reducer, INIT);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const validate = () => {
    if (!form.name.trim()) return 'Vui lòng nhập tên sản phẩm.';
    if (form.price === '' || Number.isNaN(Number(form.price)) || Number(form.price) < 0) return 'Giá bán phải lớn hơn hoặc bằng 0.';
    if (form.stockQuantity !== '' && (Number.isNaN(Number(form.stockQuantity)) || Number(form.stockQuantity) < 0)) return 'Tồn kho phải lớn hơn hoặc bằng 0.';
    if (form.lowStockThreshold !== '' && (Number.isNaN(Number(form.lowStockThreshold)) || Number(form.lowStockThreshold) < 0)) return 'Ngưỡng tồn thấp phải lớn hơn hoặc bằng 0.';
    return '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: form.code.trim() || null,
          name: form.name.trim(),
          description: form.description.trim() || null,
          category: form.category.trim() || null,
          status: form.status,
          variants: [
            {
              sku: form.sku.trim() || null,
              name: form.variantName.trim() || null,
              size: form.size.trim() || null,
              color: form.color.trim() || null,
              price: toNumber(form.price),
              stockQuantity: toNumber(form.stockQuantity),
              lowStockThreshold: toNumber(form.lowStockThreshold || 5),
              status: 'active',
            },
          ],
        }),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setSuccess('Đã tạo sản phẩm thành công.');
        setTimeout(() => router.push(result.data?.id ? `/customer/products/${result.data.id}` : '/customer/products'), 700);
      } else {
        setError(result.error || 'Không thể tạo sản phẩm.');
      }
    } catch {
      setError('Không thể kết nối máy chủ.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => router.back()} style={{ marginBottom: 10, gap: 6, display: 'inline-flex', alignItems: 'center' }}>
            <ArrowLeft size={13} /> Quay lại
          </button>
          <div className="page-title">Thêm sản phẩm</div>
          <div className="page-subtitle">Tạo sản phẩm, SKU đầu tiên và số lượng tồn kho ban đầu</div>
        </div>
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

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 360px', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card">
              <div className="card-title" style={{ marginBottom: 16 }}>Thông tin sản phẩm</div>
              <div className="form-grid form-grid-2">
                <Field label="Mã sản phẩm" field="code" placeholder="VD: AO-POLO-001" hint="Để trống nếu muốn hệ thống tự sinh mã." form={form} dispatch={dispatch} submitting={submitting} />
                <Field label="Tên sản phẩm" field="name" placeholder="VD: Áo polo nam basic" required form={form} dispatch={dispatch} submitting={submitting} />
              </div>
              <div className="form-grid form-grid-2">
                <Field label="Danh mục" field="category" placeholder="Áo, quần, phụ kiện..." form={form} dispatch={dispatch} submitting={submitting} />
                <div className="form-group">
                  <label className="form-label">Trạng thái</label>
                  <select className="form-control" value={form.status} onChange={(e) => dispatch({ type: 'set', field: 'status', value: e.target.value })} disabled={submitting}>
                    <option value="active">Đang bán</option>
                    <option value="inactive">Ngừng bán</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Mô tả</label>
                <textarea className="form-control" rows={4} placeholder="Mô tả ngắn, chất liệu, ghi chú vận hành..." value={form.description}
                  onChange={(e) => dispatch({ type: 'set', field: 'description', value: e.target.value })} disabled={submitting} />
              </div>
            </div>

            <div className="card">
              <div className="card-title" style={{ marginBottom: 16 }}>SKU / biến thể đầu tiên</div>
              <div className="form-grid form-grid-2">
                <Field label="SKU" field="sku" placeholder="VD: AO-POLO-M-DEN" hint="Để trống nếu muốn hệ thống tự sinh SKU." form={form} dispatch={dispatch} submitting={submitting} />
                <Field label="Tên biến thể" field="variantName" placeholder="VD: Size M màu đen" form={form} dispatch={dispatch} submitting={submitting} />
              </div>
              <div className="form-grid form-grid-2">
                <Field label="Size" field="size" placeholder="S, M, L..." form={form} dispatch={dispatch} submitting={submitting} />
                <Field label="Màu" field="color" placeholder="Đen, trắng, xanh..." form={form} dispatch={dispatch} submitting={submitting} />
              </div>
              <div className="form-grid form-grid-3">
                <Field label="Giá bán" field="price" type="number" placeholder="199000" required form={form} dispatch={dispatch} submitting={submitting} />
                <Field label="Tồn kho" field="stockQuantity" type="number" placeholder="0" form={form} dispatch={dispatch} submitting={submitting} />
                <Field label="Ngưỡng tồn thấp" field="lowStockThreshold" type="number" placeholder="5" form={form} dispatch={dispatch} submitting={submitting} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card">
              <div className="card-title" style={{ marginBottom: 10 }}>Kiểm tra trước khi lưu</div>
              <div style={{ display: 'grid', gap: 10, fontSize: 13 }}>
                <div className="flex-between"><span style={{ color: 'var(--text-muted)' }}>Sản phẩm</span><strong>{form.name || 'Chưa nhập'}</strong></div>
                <div className="flex-between"><span style={{ color: 'var(--text-muted)' }}>Mã</span><strong>{form.code || 'Tự sinh'}</strong></div>
                <div className="flex-between"><span style={{ color: 'var(--text-muted)' }}>SKU</span><strong>{form.sku || 'Tự sinh'}</strong></div>
                <div className="flex-between"><span style={{ color: 'var(--text-muted)' }}>Tồn đầu kỳ</span><strong>{form.stockQuantity || 0}</strong></div>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={submitting} style={{ justifyContent: 'center', height: 46 }}>
              {submitting
                ? <><RefreshCw size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Đang lưu...</>
                : <><Box size={14} /> Tạo sản phẩm</>}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => router.push('/customer/products')} disabled={submitting} style={{ justifyContent: 'center' }}>
              Hủy
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

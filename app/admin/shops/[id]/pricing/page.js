'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft, CheckCircle, DollarSign, PlusCircle, RefreshCw, Trash2, Weight } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

const fmt = (v) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(v || 0);

const TIER_INIT = { minWeight: '', maxWeight: '', price: '', note: '' };

function TierRow({ tier, onDelete, onEdit }) {
  return (
    <tr>
      <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{tier.minWeight}kg</td>
      <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{tier.maxWeight}kg</td>
      <td style={{ fontWeight: 800, color: 'var(--primary)', fontSize: 14 }}>{fmt(tier.price)}</td>
      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{tier.note || '—'}</td>
      <td>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ fontSize: 11, padding: '3px 8px', gap: 4, display: 'inline-flex', alignItems: 'center' }}
            onClick={() => onEdit(tier)}
          >
            Sửa
          </button>
          <button
            type="button"
            className="btn btn-sm"
            style={{ fontSize: 11, padding: '3px 8px', gap: 4, display: 'inline-flex', alignItems: 'center', background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}
            onClick={() => onDelete(tier.id)}
          >
            <Trash2 size={11} /> Xóa
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function ShopPricingPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const shopId = params?.id;

  const [shop, setShop] = useState(null);
  const [rate, setRate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [form, setForm] = useState(TIER_INIT);
  const [editingTier, setEditingTier] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Guard: only admin users
  useEffect(() => {
    if (!authLoading && user && user.role !== 'admin') {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  const loadPricing = useCallback(async () => {
    if (!shopId) return;
    setLoading(true);
    setLoadError('');
    try {
      const res = await fetch(`/api/shops/${shopId}/pricing`);
      const json = await res.json();
      if (json.success) {
        setShop(json.data.shop);
        setRate(json.data.rate);
      } else {
        setLoadError(json.error || 'Không thể tải bảng giá.');
      }
    } catch {
      setLoadError('Không thể kết nối máy chủ.');
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  useEffect(() => { const t = setTimeout(loadPricing, 0); return () => clearTimeout(t); }, [loadPricing]);

  const validateForm = () => {
    const min = parseFloat(form.minWeight);
    const max = parseFloat(form.maxWeight);
    const price = parseFloat(form.price);
    const errors = [];
    if (isNaN(min) || min < 0) errors.push('Từ kg phải >= 0.');
    if (isNaN(max) || max <= 0) errors.push('Đến kg phải > 0.');
    if (!isNaN(min) && !isNaN(max) && min >= max) errors.push('Đến kg phải lớn hơn Từ kg.');
    if (isNaN(price) || price <= 0) errors.push('Giá cước phải > 0.');
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    const errors = validateForm();
    if (errors.length > 0) { setFormError(errors.join(' ')); return; }

    setSaving(true);
    try {
      const payload = {
        minWeight: parseFloat(form.minWeight),
        maxWeight: parseFloat(form.maxWeight),
        price: parseFloat(form.price),
        note: form.note.trim() || null,
      };

      let res;
      if (editingTier) {
        res = await fetch(`/api/shops/${shopId}/pricing/${editingTier.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`/api/shops/${shopId}/pricing`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const result = await res.json();
      if (result.success) {
        setFormSuccess(editingTier ? 'Đã cập nhật mốc cân.' : 'Đã thêm mốc cân thành công.');
        setForm(TIER_INIT);
        setEditingTier(null);
        await loadPricing();
        setTimeout(() => setFormSuccess(''), 2000);
      } else {
        setFormError(result.error || 'Không thể lưu mốc cân.');
      }
    } catch {
      setFormError('Không thể kết nối máy chủ.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (tierId) => {
    if (!confirm('Bạn có chắc muốn xóa mốc cân này?')) return;
    try {
      const res = await fetch(`/api/shops/${shopId}/pricing/${tierId}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) await loadPricing();
      else alert(result.error || 'Không thể xóa mốc cân.');
    } catch {
      alert('Không thể kết nối máy chủ.');
    }
  };

  const handleEdit = (tier) => {
    setEditingTier(tier);
    setForm({ minWeight: String(tier.minWeight), maxWeight: String(tier.maxWeight), price: String(tier.price), note: tier.note || '' });
    setFormError('');
    setFormSuccess('');
    document.getElementById('pricing-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingTier(null);
    setForm(TIER_INIT);
    setFormError('');
  };

  if (authLoading) return null;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <button type="button" className="btn btn-secondary btn-sm" style={{ marginBottom: 8 }} onClick={() => router.push('/admin/shops')}>
            <ArrowLeft size={13} /> Quay lại danh sách shop
          </button>
          <div className="page-title">Cấu hình bảng giá cước</div>
          <div className="page-subtitle">Thiết lập bảng giá theo từng mốc cân cho shop này</div>
        </div>
        <button type="button" className="btn btn-secondary" onClick={loadPricing} disabled={loading}>
          <RefreshCw size={14} style={{ animation: loading ? 'spin 0.8s linear infinite' : 'none' }} /> Tải lại
        </button>
      </div>

      {loadError && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="empty-state" style={{ padding: 24 }}>
            <div className="empty-state-icon" style={{ background: 'var(--danger-light)', color: 'var(--danger)' }}><AlertCircle size={28} /></div>
            <h3>Lỗi tải dữ liệu</h3>
            <p>{loadError}</p>
            <button type="button" className="btn btn-primary" onClick={loadPricing}><RefreshCw size={14} /> Thử lại</button>
          </div>
        </div>
      )}

      {/* Shop Info */}
      {shop && (
        <div className="card" style={{ marginBottom: 16, padding: '16px 20px' }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, color: 'var(--text-muted)' }}>THÔNG TIN CỬA HÀNG</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Mã cửa hàng</div>
              <div style={{ fontWeight: 800, fontFamily: 'monospace', color: 'var(--primary)' }}>{shop.code}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Tên cửa hàng</div>
              <div style={{ fontWeight: 700 }}>{shop.name}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Người liên hệ</div>
              <div style={{ fontWeight: 600 }}>{shop.ownerName}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Số điện thoại</div>
              <div style={{ fontWeight: 600 }}>{shop.phone}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Admin quản lý</div>
              <div style={{ fontWeight: 600 }}>{shop.admin?.name || <span style={{ color: 'var(--text-muted)' }}>Super Admin</span>}</div>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 380px', gap: 16, alignItems: 'start' }}>
        {/* Tier table */}
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14.5 }}>Bảng mốc cân</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                {rate ? `${rate.tiers?.length || 0} mốc cân đã cấu hình` : 'Chưa có bảng giá'}
              </div>
            </div>
            {rate && (
              <span className={`badge ${rate.isActive ? 'status-delivered' : 'status-cancelled'}`}>
                {rate.isActive ? 'Đang kích hoạt' : 'Tắt'}
              </span>
            )}
          </div>

          {loading ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
              <RefreshCw size={20} style={{ animation: 'spin 0.8s linear infinite' }} />
              <div style={{ marginTop: 8 }}>Đang tải bảng giá...</div>
            </div>
          ) : !rate || rate.tiers?.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 20px' }}>
              <div className="empty-state-icon"><Weight size={28} /></div>
              <h3>Chưa có mốc cân nào</h3>
              <p>Sử dụng form bên phải để thêm mốc cân đầu tiên cho shop này.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Từ kg</th>
                    <th>Đến kg</th>
                    <th>Giá cước</th>
                    <th>Ghi chú</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {rate.tiers.map((tier) => (
                    <TierRow key={tier.id} tier={tier} onDelete={handleDelete} onEdit={handleEdit} />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Validation note */}
          {rate && rate.tiers?.length > 0 && (
            <div style={{ padding: '10px 20px', borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)' }}>
              <strong>Lưu ý:</strong> Mốc cân không được chồng nhau. Sau khi thêm mốc cân, phí tương ứng sẽ được tự động tính cho shop khi lên đơn.
            </div>
          )}
        </div>

        {/* Add/Edit tier form */}
        <div className="card" id="pricing-form">
          <div className="card-title" style={{ marginBottom: 4 }}>
            {editingTier ? 'Sửa mốc cân' : 'Thêm mốc cân'}
          </div>
          <div className="card-subtitle" style={{ marginBottom: 16 }}>
            {editingTier
              ? `Đang sửa: ${editingTier.minWeight}kg – ${editingTier.maxWeight}kg`
              : 'Mốc cân mới sẽ không được trùng với mốc đã có.'}
          </div>

          {formError && (
            <div className="alert alert-danger" style={{ alignItems: 'flex-start', gap: 8, fontSize: 13, marginBottom: 14 }}>
              <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} /><span>{formError}</span>
            </div>
          )}
          {formSuccess && (
            <div className="alert alert-success" style={{ alignItems: 'flex-start', gap: 8, fontSize: 13, marginBottom: 14 }}>
              <CheckCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} /><span>{formSuccess}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label"><Weight size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />Từ kg <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input
                  className="form-control"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  value={form.minWeight}
                  onChange={e => setForm(f => ({ ...f, minWeight: e.target.value }))}
                  disabled={saving}
                />
              </div>
              <div className="form-group">
                <label className="form-label"><Weight size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />Đến kg <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input
                  className="form-control"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="5"
                  value={form.maxWeight}
                  onChange={e => setForm(f => ({ ...f, maxWeight: e.target.value }))}
                  disabled={saving}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label"><DollarSign size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />Giá cước (VND) <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input
                className="form-control"
                type="number"
                min="1"
                step="1000"
                placeholder="22000"
                value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                disabled={saving}
              />
              {form.price && !isNaN(parseFloat(form.price)) && (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  = {fmt(parseFloat(form.price))}
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Ghi chú</label>
              <input
                className="form-control"
                placeholder="VD: Áp dụng nội thành"
                value={form.note}
                onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                disabled={saving}
              />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              {editingTier && (
                <button type="button" className="btn btn-secondary" onClick={cancelEdit} disabled={saving} style={{ flex: 1 }}>
                  Hủy sửa
                </button>
              )}
              <button type="submit" className="btn btn-primary" disabled={saving} style={{ flex: 1, gap: 6 }}>
                {saving
                  ? <><RefreshCw size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> Đang lưu...</>
                  : editingTier
                    ? <><CheckCircle size={13} /> Lưu thay đổi</>
                    : <><PlusCircle size={13} /> Thêm mốc cân</>
                }
              </button>
            </div>

            {/* Hint */}
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)', padding: '10px 12px', background: 'var(--bg-input)', borderRadius: 8 }}>
              <strong>Ví dụ hợp lệ:</strong><br />
              0kg → 5kg = 22.000đ<br />
              5.01kg → 10kg = 30.000đ<br />
              10.01kg → 20kg = 45.000đ
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft, CheckCircle, PlusCircle, RefreshCw, Trash2, GitMerge } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

const RULE_INIT = { name: '', priority: '0', conditionType: 'COD_GREATER_THAN', conditionValue: '', action: 'WAITING_APPROVAL', carrierCode: '', isActive: true };

const CONDITION_TYPES = {
  'COD_GREATER_THAN': 'COD lớn hơn (VND)',
  'WEIGHT_GREATER_THAN': 'Trọng lượng lớn hơn (kg)',
  'PROVINCE_EQUALS': 'Tỉnh/thành phố chứa từ',
  'CUSTOMER_BLACKLISTED': 'Khách hàng bị Blacklist',
  'MISSING_CREDENTIALS': 'Thiếu API vận chuyển',
  'PRICING_MISSING': 'Thiếu cấu hình giá cước',
};

const ACTIONS = {
  'READY_TO_PUSH': 'Cho phép đẩy đơn (Ready)',
  'WAITING_APPROVAL': 'Chờ Admin duyệt',
  'MANUAL_PROCESSING': 'Xử lý thủ công',
  'BLOCKED': 'Chặn đơn (Blocked)',
};

function RuleRow({ rule, onDelete, onEdit }) {
  return (
    <tr>
      <td style={{ fontWeight: 800, textAlign: 'center' }}>{rule.priority}</td>
      <td style={{ fontWeight: 600 }}>
        {rule.name}
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          ID: {rule.id.slice(-6)}
        </div>
      </td>
      <td>
        <span style={{ fontSize: 13, background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>
          {CONDITION_TYPES[rule.conditionType] || rule.conditionType}
        </span>
        {rule.conditionValue && <span style={{ fontWeight: 600, marginLeft: 6 }}>: {rule.conditionValue}</span>}
      </td>
      <td>
        <span className={`badge ${rule.action === 'READY_TO_PUSH' ? 'status-delivered' : rule.action === 'BLOCKED' ? 'status-cancelled' : 'status-pending'}`}>
          {ACTIONS[rule.action] || rule.action}
        </span>
        {rule.carrierCode && <div style={{ fontSize: 11, marginTop: 4, color: 'var(--primary)' }}>Carrier: {rule.carrierCode}</div>}
      </td>
      <td>
        <span className={`badge ${rule.isActive ? 'status-delivered' : 'status-cancelled'}`}>
          {rule.isActive ? 'Bật' : 'Tắt'}
        </span>
      </td>
      <td>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ fontSize: 11, padding: '3px 8px' }}
            onClick={() => onEdit(rule)}
          >
            Sửa
          </button>
          <button
            type="button"
            className="btn btn-sm"
            style={{ fontSize: 11, padding: '3px 8px', background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}
            onClick={() => onDelete(rule.id)}
          >
            <Trash2 size={11} style={{ marginRight: 4 }} /> Xóa
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function ShopFlowRulesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const shopId = params?.id;

  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [form, setForm] = useState(RULE_INIT);
  const [editingRule, setEditingRule] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  useEffect(() => {
    if (!authLoading && user && user.role !== 'admin') {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  const loadRules = useCallback(async () => {
    if (!shopId) return;
    setLoading(true);
    setLoadError('');
    try {
      const res = await fetch(`/api/shops/${shopId}/flow-rules`);
      const json = await res.json();
      if (json.success) {
        setRules(json.data);
      } else {
        setLoadError(json.error || 'Không thể tải quy tắc.');
      }
    } catch {
      setLoadError('Không thể kết nối máy chủ.');
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  useEffect(() => { const t = setTimeout(loadRules, 0); return () => clearTimeout(t); }, [loadRules]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!form.name.trim()) return setFormError('Vui lòng nhập tên quy tắc.');

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        priority: parseInt(form.priority) || 0,
        conditionType: form.conditionType,
        conditionValue: form.conditionValue,
        action: form.action,
        carrierCode: form.carrierCode,
        isActive: form.isActive,
      };

      const url = editingRule 
        ? `/api/shops/${shopId}/flow-rules/${editingRule.id}` 
        : `/api/shops/${shopId}/flow-rules`;

      const res = await fetch(url, {
        method: editingRule ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (result.success) {
        setFormSuccess(editingRule ? 'Đã cập nhật quy tắc.' : 'Đã thêm quy tắc thành công.');
        setForm(RULE_INIT);
        setEditingRule(null);
        await loadRules();
        setTimeout(() => setFormSuccess(''), 2000);
      } else {
        setFormError(result.error || 'Không thể lưu quy tắc.');
      }
    } catch {
      setFormError('Không thể kết nối máy chủ.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (ruleId) => {
    if (!confirm('Bạn có chắc muốn xóa quy tắc này?')) return;
    try {
      const res = await fetch(`/api/shops/${shopId}/flow-rules/${ruleId}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) await loadRules();
      else alert(result.error || 'Không thể xóa quy tắc.');
    } catch {
      alert('Không thể kết nối máy chủ.');
    }
  };

  const handleEdit = (rule) => {
    setEditingRule(rule);
    setForm({ 
      name: rule.name, 
      priority: String(rule.priority), 
      conditionType: rule.conditionType, 
      conditionValue: rule.conditionValue || '', 
      action: rule.action, 
      carrierCode: rule.carrierCode || '', 
      isActive: rule.isActive 
    });
    setFormError('');
    setFormSuccess('');
    document.getElementById('rule-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingRule(null);
    setForm(RULE_INIT);
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
          <div className="page-title">Cấu hình luồng đơn hàng</div>
          <div className="page-subtitle">Thiết lập quy tắc tự động phân luồng (Order Flow Routing)</div>
        </div>
        <button type="button" className="btn btn-secondary" onClick={loadRules} disabled={loading}>
          <RefreshCw size={14} style={{ animation: loading ? 'spin 0.8s linear infinite' : 'none' }} /> Tải lại
        </button>
      </div>

      {loadError && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="empty-state" style={{ padding: 24 }}>
            <div className="empty-state-icon" style={{ background: 'var(--danger-light)', color: 'var(--danger)' }}><AlertCircle size={28} /></div>
            <h3>Lỗi tải dữ liệu</h3>
            <p>{loadError}</p>
            <button type="button" className="btn btn-primary" onClick={loadRules}><RefreshCw size={14} /> Thử lại</button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 380px', gap: 16, alignItems: 'start' }}>
        {/* Rules table */}
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14.5 }}>Danh sách quy tắc</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                Quy tắc được đánh giá theo thứ tự Priority tăng dần (0 là cao nhất/đầu tiên).
              </div>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
              <RefreshCw size={20} style={{ animation: 'spin 0.8s linear infinite' }} />
              <div style={{ marginTop: 8 }}>Đang tải quy tắc...</div>
            </div>
          ) : rules.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 20px' }}>
              <div className="empty-state-icon"><GitMerge size={28} /></div>
              <h3>Chưa có quy tắc nào</h3>
              <p>Sử dụng form bên phải để thêm quy tắc phân luồng đầu tiên.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ textAlign: 'center', width: 60 }}>Ưu tiên</th>
                    <th>Tên quy tắc</th>
                    <th>Điều kiện</th>
                    <th>Hành động</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map((rule) => (
                    <RuleRow key={rule.id} rule={rule} onDelete={handleDelete} onEdit={handleEdit} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add/Edit rule form */}
        <div className="card" id="rule-form">
          <div className="card-title" style={{ marginBottom: 4 }}>
            {editingRule ? 'Sửa quy tắc' : 'Thêm quy tắc mới'}
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
            
            <div className="form-group">
              <label className="form-label">Tên quy tắc <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input
                className="form-control"
                placeholder="VD: Duyệt đơn trên 5 triệu"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                disabled={saving}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Mức ưu tiên (Priority - Nhỏ chạy trước)</label>
              <input
                className="form-control"
                type="number"
                min="0"
                value={form.priority}
                onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                disabled={saving}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Điều kiện bắt đơn</label>
              <select 
                className="form-control" 
                value={form.conditionType} 
                onChange={e => setForm(f => ({ ...f, conditionType: e.target.value }))}
                disabled={saving}
              >
                {Object.entries(CONDITION_TYPES).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>

            {!['CUSTOMER_BLACKLISTED', 'MISSING_CREDENTIALS', 'PRICING_MISSING'].includes(form.conditionType) && (
              <div className="form-group">
                <label className="form-label">Giá trị so sánh</label>
                <input
                  className="form-control"
                  placeholder="Nhập giá trị cần so sánh..."
                  value={form.conditionValue}
                  onChange={e => setForm(f => ({ ...f, conditionValue: e.target.value }))}
                  disabled={saving}
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Hành động khi thỏa mãn</label>
              <select 
                className="form-control" 
                value={form.action} 
                onChange={e => setForm(f => ({ ...f, action: e.target.value }))}
                disabled={saving}
              >
                {Object.entries(ACTIONS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>

            {form.action === 'READY_TO_PUSH' && (
               <div className="form-group">
                <label className="form-label">Gắn cố định đối tác (Carrier Code - Tùy chọn)</label>
                <input
                  className="form-control"
                  placeholder="VD: GHN, JNT..."
                  value={form.carrierCode}
                  onChange={e => setForm(f => ({ ...f, carrierCode: e.target.value.toUpperCase() }))}
                  disabled={saving}
                />
              </div>
            )}

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer', marginTop: 4 }}>
              <input 
                type="checkbox" 
                checked={form.isActive} 
                onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                disabled={saving}
                style={{ width: 16, height: 16, cursor: 'pointer' }}
              />
              Kích hoạt quy tắc
            </label>

            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              {editingRule && (
                <button type="button" className="btn btn-secondary" onClick={cancelEdit} disabled={saving} style={{ flex: 1 }}>
                  Hủy sửa
                </button>
              )}
              <button type="submit" className="btn btn-primary" disabled={saving} style={{ flex: 1, gap: 6 }}>
                {saving
                  ? <><RefreshCw size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> Đang lưu...</>
                  : editingRule
                    ? <><CheckCircle size={13} /> Lưu thay đổi</>
                    : <><PlusCircle size={13} /> Thêm quy tắc</>
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

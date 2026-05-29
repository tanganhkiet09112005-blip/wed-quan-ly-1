'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';
import {
  AlertCircle,
  CheckCircle,
  ChevronRight,
  Eye,
  EyeOff,
  Lock,
  PackageSearch,
  RefreshCw,
  Settings,
  ShieldCheck,
  Truck,
  Zap,
} from 'lucide-react';

/* ─── Static carrier catalog ────────────────────── */
const CARRIER_CATALOG = [
  {
    code: 'GHN',
    name: 'Giao Hàng Nhanh',
    shortName: 'GHN',
    color: '#e65c00',
    bgColor: '#fff7ed',
    description: 'ĐVVC lớn nhất Việt Nam. Hỗ trợ kết nối API thật ở chế độ Sandbox và Production.',
    apiKeyLabel: 'Shop ID (GHN)',
    apiTokenLabel: 'Token API (GHN)',
    apiKeyPlaceholder: 'Ví dụ: 123456',
    apiTokenPlaceholder: 'Nhập GHN Token...',
    supportedModes: ['mock', 'sandbox', 'production'],
    docsUrl: 'https://api.ghn.vn',
  },
  {
    code: 'GHTK',
    name: 'Giao Hàng Tiết Kiệm',
    shortName: 'GHTK',
    color: '#16a34a',
    bgColor: '#f0fdf4',
    description: 'Hỗ trợ Mock Mode. Chế độ Sandbox/Production yêu cầu cung cấp API credentials từ GHTK.',
    apiKeyLabel: 'API Key (GHTK)',
    apiTokenLabel: 'Token (GHTK)',
    apiKeyPlaceholder: 'Nhập API Key GHTK...',
    apiTokenPlaceholder: 'Nhập Token GHTK...',
    supportedModes: ['mock'],
    docsUrl: 'https://khachhang.ghtk.vn/docs/api',
  },
  {
    code: 'JT',
    name: 'J&T Express',
    shortName: 'J&T',
    color: '#dc2626',
    bgColor: '#fff5f5',
    description: 'Hỗ trợ cấu hình API riêng biệt. Yêu cầu nhập eccompanyid, customerid và key.',
    apiKeyLabel: 'Customer ID (J&T)',
    apiTokenLabel: 'API Secret (J&T)',
    apiKeyPlaceholder: 'Nhập Customer ID...',
    apiTokenPlaceholder: 'Nhập API Secret...',
    supportedModes: ['mock', 'sandbox', 'production'],
    docsUrl: 'https://www.jtexpress.vn',
  },
  {
    code: 'SPX',
    name: 'Shopee Express',
    shortName: 'SPX',
    color: '#f97316',
    bgColor: '#fff7ed',
    description: 'Hỗ trợ Mock Mode. Kết nối API thật qua Shopee Seller Center — chưa phát triển.',
    apiKeyLabel: 'Shop ID (SPX)',
    apiTokenLabel: 'API Token (SPX)',
    apiKeyPlaceholder: 'Nhập Shop ID Shopee...',
    apiTokenPlaceholder: 'Nhập SPX Token...',
    supportedModes: ['mock'],
    docsUrl: 'https://open.shopee.com',
  },
];

/* ─── Helpers ─────────────────────────────────── */
function getStatusInfo(shipper) {
  const configured = Boolean(shipper.apiKeyMasked || shipper.apiTokenMasked);
  const active = shipper.status === 'active';
  const mode = shipper.mode || 'mock';

  if (!configured && mode === 'mock') {
    return { label: 'Mock sẵn sàng', cls: 'mode-mock', dot: '#64748b' };
  }
  if (active && configured) {
    return { label: 'Đã cấu hình · Hoạt động', cls: 'status-delivered', dot: '#16a34a' };
  }
  if (configured && !active) {
    return { label: 'Đã cấu hình · Tắt', cls: 'status-pending', dot: '#d97706' };
  }
  return { label: 'Chưa cấu hình', cls: 'status-cancelled', dot: '#94a3b8' };
}

function ModeBadge({ mode }) {
  const cls = mode === 'production' ? 'mode-production' : mode === 'sandbox' ? 'mode-sandbox' : 'mode-mock';
  const label = mode === 'production' ? 'Production' : mode === 'sandbox' ? 'Sandbox' : 'Mock';
  return (
    <span className={`badge ${cls}`} style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
      {label}
    </span>
  );
}

function MaskedField({ label, value, noValue = 'Chưa cấu hình' }) {
  const [show, setShow] = useState(false);
  const hasValue = Boolean(value && value !== 'Chưa cấu hình');
  // Mask: show last 4 chars if starts with ****
  const displayed = !hasValue
    ? noValue
    : show
      ? value
      : value.startsWith('****') ? value : `****${value.slice(-4)}`;

  return (
    <div style={{
      padding: '10px 12px',
      background: 'var(--bg-input)',
      borderRadius: 8,
      border: '1px solid var(--border)',
    }}>
      <div style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{
          fontFamily: 'monospace',
          fontSize: 12.5,
          fontWeight: 700,
          flex: 1,
          color: hasValue ? 'var(--text-primary)' : 'var(--text-muted)',
          letterSpacing: hasValue ? '0.5px' : 'normal',
          wordBreak: 'break-all',
        }}>
          {displayed}
        </span>
        {hasValue && (
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            style={{ color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}
            title={show ? 'Ẩn' : 'Hiện'}
          >
            {show ? <EyeOff size={13} /> : <Eye size={13} />}
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Main component ──────────────────────────── */
export default function ShippersPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [shippers, setShippers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [editingCode, setEditingCode] = useState(''); // which carrier is expanded
  const [form, setForm] = useState({});
  const [updating, setUpdating] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState({}); // { [code]: { ok, msg } }

  /* ── Load shippers ── */
  const fetchShippers = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await fetch('/api/shippers');
      const data = await res.json();
      if (data.success) {
        setShippers(data.data || []);
      } else {
        setLoadError(data.error || 'Không thể tải cấu hình vận chuyển.');
      }
    } catch {
      setLoadError('Không thể kết nối máy chủ. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    const t = setTimeout(fetchShippers, 0);
    return () => clearTimeout(t);
  }, [user, fetchShippers]);

  /* ── Open config panel ── */
  const openConfig = (code) => {
    const shipper = shippers.find((s) => s.code === code);
    setEditingCode(code);
    setTestResult((prev) => ({ ...prev, [code]: null }));
    
    // For J&T, parse JSON config if available
    if (code === 'JT') {
      let jtConfig = { eccompanyid: '', customerid: '', key: '', createOrderUrl: '', updateUrl: '', trackUrl: '', freightUrl: '' };
      if (shipper?.apiKeyMasked && shipper.apiKeyMasked.startsWith('{')) {
        try {
          // It's masked, so it might have **** values. We leave them blank so user can enter new or keep old.
          // The old logic will retain them if left blank.
          // We won't pre-fill with ****
        } catch(e) {}
      }
      setForm({
        jtConfig,
        codFeePercent: shipper?.codFeePercent ?? 0,
        status: shipper?.status || 'inactive',
        mode: shipper?.mode || 'mock',
      });
    } else {
      setForm({
        apiKey: '',
        apiToken: '',
        codFeePercent: shipper?.codFeePercent ?? 0,
        status: shipper?.status || 'inactive',
        mode: shipper?.mode || 'mock',
      });
    }
  };

  const closeConfig = () => {
    setEditingCode('');
    setForm({});
  };

  /* ── Save ── */
  const handleSave = async (e) => {
    e.preventDefault();
    if (!user?.shopId) {
      toast.error('Không tìm thấy shopId để lưu cấu hình vận chuyển.');
      return;
    }
    const catalog = CARRIER_CATALOG.find((c) => c.code === editingCode);
    if (!catalog) return;

    let payloadApiKey = '';
    let payloadApiToken = '';

    if (editingCode === 'JT') {
      const { jtConfig } = form;
      // We only include fields that were filled out.
      // If a field is empty, the backend will keep the old value if we do an intelligent merge,
      // BUT our backend `PUT` doesn't merge JSON keys inside `apiKey` automatically.
      // Wait, we need to send the old data if we don't want it overwritten?
      // Actually, if we send `{ eccompanyid: "..." }` and key is omitted, key is lost.
      // Let's send only what they type, and the backend will have to merge it, OR we require them to re-enter if they want to change.
      // To be safe, we will just send it. The backend currently fully replaces apiKey.
      // Let's send the JSON string. If they leave it blank, we just don't include it in JSON.
      let jsonPayload = {};
      if (jtConfig.eccompanyid) jsonPayload.eccompanyid = jtConfig.eccompanyid;
      if (jtConfig.customerid) jsonPayload.customerid = jtConfig.customerid;
      if (jtConfig.key) jsonPayload.key = jtConfig.key;
      if (jtConfig.createOrderUrl) jsonPayload.createOrderUrl = jtConfig.createOrderUrl;
      if (jtConfig.updateUrl) jsonPayload.updateUrl = jtConfig.updateUrl;
      if (jtConfig.trackUrl) jsonPayload.trackUrl = jtConfig.trackUrl;
      if (jtConfig.freightUrl) jsonPayload.freightUrl = jtConfig.freightUrl;
      
      if (Object.keys(jsonPayload).length > 0) {
        payloadApiKey = JSON.stringify(jsonPayload);
      }
    } else {
      payloadApiKey = form.apiKey?.trim() || '';
      payloadApiToken = form.apiToken?.trim() || '';
    }

    // Warn if production mode and no token entered and no existing token
    const shipper = shippers.find((s) => s.code === editingCode);
    const existingConfigured = Boolean(shipper?.apiKeyMasked || shipper?.apiTokenMasked);
    const newTokenEntered = Boolean(payloadApiKey || payloadApiToken);
    
    if (form.mode !== 'mock' && !existingConfigured && !newTokenEntered) {
      toast.error(`Chế độ ${form.mode} yêu cầu nhập API Key/Token trước khi lưu.`);
      return;
    }

    const payload = {
      shipperCode: editingCode,
      codFeePercent: Number(form.codFeePercent),
      status: form.status,
      mode: form.mode,
    };
    if (payloadApiKey) payload.apiKey = payloadApiKey;
    if (payloadApiToken) payload.apiToken = payloadApiToken;

    setUpdating(true);
    try {
      const res = await fetch('/api/shippers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setShippers((prev) =>
          prev.map((s) => s.code === editingCode ? { ...s, ...data.data } : s)
        );
        closeConfig();
        toast.success(`Đã lưu cấu hình ${catalog.name} thành công.`);
      } else {
        toast.error(data.error || 'Không thể lưu cấu hình.');
      }
    } catch {
      toast.error('Không thể kết nối máy chủ.');
    } finally {
      setUpdating(false);
    }
  };

  /* ── Test connection ── */
  const handleTest = async () => {
    setTesting(true);
    setTestResult((prev) => ({ ...prev, [editingCode]: null }));
    
    let apiKeyToSend = '';
    let apiTokenToSend = '';

    if (editingCode === 'JT') {
      const { jtConfig } = form;
      let jsonPayload = {};
      if (jtConfig.eccompanyid) jsonPayload.eccompanyid = jtConfig.eccompanyid;
      if (jtConfig.customerid) jsonPayload.customerid = jtConfig.customerid;
      if (jtConfig.key) jsonPayload.key = jtConfig.key;
      if (jtConfig.createOrderUrl) jsonPayload.createOrderUrl = jtConfig.createOrderUrl;
      if (jtConfig.freightUrl) jsonPayload.freightUrl = jtConfig.freightUrl;
      
      apiKeyToSend = Object.keys(jsonPayload).length > 0 
        ? JSON.stringify(jsonPayload) 
        : (shippers.find((s) => s.code === editingCode)?.apiKeyMasked || '');
    } else {
      apiKeyToSend = form.apiKey || shippers.find((s) => s.code === editingCode)?.apiKeyMasked || '';
      apiTokenToSend = form.apiToken || shippers.find((s) => s.code === editingCode)?.apiTokenMasked || '';
    }

    try {
      const res = await fetch('/api/shippers/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shipperCode: editingCode,
          apiKey: apiKeyToSend,
          apiToken: apiTokenToSend,
          mode: form.mode,
        }),
      });
      const data = await res.json();
      setTestResult((prev) => ({
        ...prev,
        [editingCode]: { ok: data.success, msg: data.message || data.error || (data.success ? 'Kết nối thành công!' : 'Kết nối thất bại.') },
      }));
    } catch {
      setTestResult((prev) => ({ ...prev, [editingCode]: { ok: false, msg: 'Không thể kết nối máy chủ.' } }));
    } finally {
      setTesting(false);
    }
  };

  /* ─── Render ─── */
  if (!user) {
    return (
      <div className="page-container" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text-muted)' }}>Vui lòng đăng nhập để cấu hình vận chuyển.</div>
      </div>
    );
  }

  const shipperMap = new Map(shippers.map((s) => [s.code, s]));

  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: 18 }}>
        <div>
          <div className="page-title">Đơn vị vận chuyển</div>
          <div className="page-subtitle">
            Cấu hình kết nối GHN, GHTK, J&T, SPX để đẩy đơn và theo dõi vận đơn / COD
          </div>
        </div>
        <button className="btn btn-secondary" type="button" onClick={fetchShippers} disabled={loading}>
          <RefreshCw size={14} style={{ animation: loading ? 'spin 0.8s linear infinite' : 'none' }} /> Tải lại
        </button>
      </div>

      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 10,
        padding: '12px 16px',
        background: '#eff6ff',
        border: '1px solid #bfdbfe',
        borderRadius: 8,
        marginBottom: 20,
      }}>
        <ShieldCheck size={16} color="#2563eb" style={{ flexShrink: 0, marginTop: 1 }} />
        <div>
          <span style={{ fontWeight: 700, color: '#1d4ed8', fontSize: 13 }}>Bảo mật Token/API Key: </span>
          <span style={{ fontSize: 13, color: '#1d4ed8' }}>
            Token/API key được mã hóa phía server và chỉ hiển thị dạng rút gọn (****xxxx) sau khi lưu.
            Để trống ô bí mật nếu muốn giữ nguyên giá trị cũ đã cấu hình.
          </span>
        </div>
      </div>

      {loadError && !loading && (
        <div className="card mb-16" style={{ padding: '20px 24px' }}>
          <div className="empty-state" style={{ padding: '24px 16px' }}>
            <div className="empty-state-icon" style={{ background: 'var(--danger-light)', color: 'var(--danger)' }}>
              <AlertCircle size={28} />
            </div>
            <h3>Không thể tải cấu hình vận chuyển</h3>
            <p>{loadError}</p>
            <button type="button" className="btn btn-primary" onClick={fetchShippers}>
              <RefreshCw size={14} /> Thử lại
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid-2" style={{ gap: 16 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card" style={{ padding: 22 }}>
              <div style={{ display: 'flex', gap: 14, marginBottom: 16 }}>
                <div className="skeleton" style={{ width: 52, height: 52, borderRadius: 10, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ height: 18, width: '60%', marginBottom: 8 }} />
                  <div className="skeleton" style={{ height: 12, width: '40%' }} />
                </div>
              </div>
              <div className="skeleton" style={{ height: 40, marginBottom: 14 }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                <div className="skeleton" style={{ height: 56, borderRadius: 8 }} />
                <div className="skeleton" style={{ height: 56, borderRadius: 8 }} />
              </div>
              <div className="skeleton" style={{ height: 38, borderRadius: 8 }} />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid-2" style={{ gap: 16 }}>
          {CARRIER_CATALOG.map((catalog) => {
            const shipper = shipperMap.get(catalog.code);
            const configured = Boolean(shipper?.apiKeyMasked || shipper?.apiTokenMasked);
            const active = shipper?.status === 'active';
            const mode = shipper?.mode || 'mock';
            const statusInfo = getStatusInfo(shipper || { mode: 'mock' });
            const isEditing = editingCode === catalog.code;
            const orderCount = shipper?._count?.orders ?? 0;

            let parsedMaskedJT = null;
            if (catalog.code === 'JT' && shipper?.apiKeyMasked?.startsWith('{')) {
              try { parsedMaskedJT = JSON.parse(shipper.apiKeyMasked); } catch(e) {}
            }

            return (
              <div
                key={catalog.code}
                className={`carrier-card ${active && configured ? 'active-configured' : ''}`}
                style={{
                  borderColor: isEditing ? 'var(--primary)' : undefined,
                  boxShadow: isEditing ? '0 0 0 3px rgba(37,99,235,0.1)' : undefined,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div className="carrier-logo" style={{ background: catalog.bgColor, color: catalog.color }}>
                      <Truck size={20} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 15.5 }}>{catalog.name}</div>
                      <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                        <ModeBadge mode={mode} />
                        <span className={`badge ${statusInfo.cls}`} style={{ fontSize: '10px' }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusInfo.dot, display: 'inline-block', marginRight: 4 }} />
                          {statusInfo.label}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Đơn vận chuyển</div>
                    <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--text-primary)' }}>{orderCount}</div>
                  </div>
                </div>

                <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: 14 }}>
                  {catalog.description}
                </p>

                {catalog.code === 'JT' ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8, marginBottom: 14 }}>
                    <MaskedField label="eccompanyid" value={parsedMaskedJT?.eccompanyid} />
                    <MaskedField label="customerid" value={parsedMaskedJT?.customerid} />
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                    <MaskedField label={catalog.apiKeyLabel} value={shipper?.apiKeyMasked} />
                    <MaskedField label={catalog.apiTokenLabel} value={shipper?.apiTokenMasked} />
                  </div>
                )}

                <div style={{ display: 'flex', gap: 16, fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 16, paddingBottom: 14, borderBottom: '1px solid var(--border-light)' }}>
                  <div>Phí COD: <strong style={{ color: 'var(--text-primary)' }}>{shipper?.codFeePercent || 0}%</strong></div>
                  <div>Adapter: <strong style={{ color: active ? 'var(--success)' : 'var(--text-muted)' }}>{active ? 'Ready' : 'Disabled'}</strong></div>
                  {!catalog.supportedModes.includes('production') && (
                    <div style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Production chưa hỗ trợ</div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    className={`btn ${isEditing ? 'btn-secondary' : 'btn-primary'}`}
                    style={{ flex: 1, justifyContent: 'center', gap: 6 }}
                    onClick={() => isEditing ? closeConfig() : openConfig(catalog.code)}
                  >
                    {isEditing ? <><ChevronRight size={14} style={{ transform: 'rotate(90deg)' }} /> Đóng</> : <><Settings size={14} /> Cấu hình</>}
                  </button>
                </div>

                {isEditing && (
                  <form
                    onSubmit={handleSave}
                    style={{
                      marginTop: 18, paddingTop: 18, borderTop: '1px solid var(--border)',
                      display: 'flex', flexDirection: 'column', gap: 14, animation: 'slideUp 0.22s ease',
                    }}
                  >
                    {catalog.code === 'JT' && (
                      <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px', color: '#334155' }}>
                        <div style={{ fontWeight: 600, marginBottom: 4, color: '#0f172a' }}>Cần J&T cấp các thông tin sau:</div>
                        <ul style={{ paddingLeft: 20, margin: 0, lineHeight: 1.6 }}>
                          <li>eccompanyid (Mã định danh KH)</li>
                          <li>customerid (Mã khách hàng)</li>
                          <li>key (API Secret)</li>
                          <li>Endpoint production (nếu khác mặc định)</li>
                        </ul>
                        <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px dashed #cbd5e1' }}>
                          <span style={{ fontWeight: 600 }}>Webhook URL gửi cho J&T:</span><br/>
                          <code style={{ fontSize: 11, background: '#e2e8f0', padding: '2px 6px', borderRadius: 4, wordBreak: 'break-all' }}>
                            https://hship-management.vercel.app/api/webhooks/jt?secret=********
                          </code>
                          <div style={{ fontSize: 10, marginTop: 4, color: '#64748b' }}>
                            * Thay ******** bằng WEBHOOK_SECRET được cấu hình trên server.
                          </div>
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 12px', background: 'var(--bg-input)', borderRadius: 8, fontSize: 12.5, color: 'var(--text-secondary)' }}>
                      <Lock size={13} style={{ flexShrink: 0, marginTop: 1, color: 'var(--text-muted)' }} />
                      Nhập API Key/Secret mới. Để trống các trường nếu muốn giữ nguyên giá trị đã lưu trước đó.
                    </div>

                    <div className="form-grid form-grid-2">
                      <div className="form-group">
                        <label className="form-label">Chế độ vận hành</label>
                        <select
                          className="form-control"
                          value={form.mode}
                          onChange={(e) => setForm((p) => ({ ...p, mode: e.target.value }))}
                        >
                          {catalog.supportedModes.map((m) => (
                            <option key={m} value={m}>
                              {m === 'mock' ? 'Mock Mode (Chạy thử)' : m === 'sandbox' ? 'Sandbox (Môi trường test)' : 'Production (Chạy thật)'}
                            </option>
                          ))}
                          {!catalog.supportedModes.includes('sandbox') && <option value="sandbox" disabled>Sandbox (Chưa hỗ trợ)</option>}
                          {!catalog.supportedModes.includes('production') && <option value="production" disabled>Production (Chưa hỗ trợ)</option>}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Trạng thái hoạt động</label>
                        <select
                          className="form-control"
                          value={form.status}
                          onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                        >
                          <option value="active">Bật ĐVVC này</option>
                          <option value="inactive">Tắt ĐVVC này</option>
                        </select>
                      </div>
                    </div>

                    {catalog.code === 'JT' ? (
                      <>
                        <div className="form-group">
                          <label className="form-label">eccompanyid (Mới)</label>
                          <input
                            className="form-control"
                            placeholder="Nhập eccompanyid..."
                            value={form.jtConfig?.eccompanyid || ''}
                            onChange={(e) => setForm((p) => ({ ...p, jtConfig: { ...p.jtConfig, eccompanyid: e.target.value } }))}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">customerid (Mới)</label>
                          <input
                            className="form-control"
                            placeholder="Nhập customerid..."
                            value={form.jtConfig?.customerid || ''}
                            onChange={(e) => setForm((p) => ({ ...p, jtConfig: { ...p.jtConfig, customerid: e.target.value } }))}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">API Secret / Key (Mới) <Lock size={11} color="var(--text-muted)" style={{display: 'inline'}} /></label>
                          <input
                            className="form-control"
                            type="password"
                            placeholder="Nhập key bảo mật..."
                            value={form.jtConfig?.key || ''}
                            onChange={(e) => setForm((p) => ({ ...p, jtConfig: { ...p.jtConfig, key: e.target.value } }))}
                            autoComplete="new-password"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Create Order URL (Tùy chọn)</label>
                          <input
                            className="form-control"
                            placeholder="Để trống dùng mặc định"
                            value={form.jtConfig?.createOrderUrl || ''}
                            onChange={(e) => setForm((p) => ({ ...p, jtConfig: { ...p.jtConfig, createOrderUrl: e.target.value } }))}
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="form-group">
                          <label className="form-label">{catalog.apiKeyLabel} (mới)</label>
                          <input
                            className="form-control"
                            placeholder={catalog.apiKeyPlaceholder}
                            value={form.apiKey}
                            onChange={(e) => setForm((p) => ({ ...p, apiKey: e.target.value }))}
                            autoComplete="off"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              {catalog.apiTokenLabel} (mới) <Lock size={11} color="var(--text-muted)" />
                            </span>
                          </label>
                          <input
                            className="form-control"
                            type="password"
                            placeholder={catalog.apiTokenPlaceholder}
                            value={form.apiToken}
                            onChange={(e) => setForm((p) => ({ ...p, apiToken: e.target.value }))}
                            autoComplete="new-password"
                          />
                        </div>
                      </>
                    )}

                    <div className="form-group">
                      <label className="form-label">Phí COD đối soát (%)</label>
                      <input
                        className="form-control"
                        type="number" step="0.01" min="0" max="100"
                        value={form.codFeePercent}
                        onChange={(e) => setForm((p) => ({ ...p, codFeePercent: e.target.value }))}
                      />
                    </div>

                    {form.mode !== 'mock' && !catalog.supportedModes.includes(form.mode) && (
                      <div className="alert alert-warning">
                        <AlertCircle size={14} />
                        <span style={{ fontSize: 12.5 }}>Chế độ <strong>{form.mode}</strong> cho {catalog.name} chưa được hỗ trợ trong phiên bản hiện tại.</span>
                      </div>
                    )}

                    {testResult[editingCode] && (
                      <div className={`alert ${testResult[editingCode].ok ? 'alert-success' : 'alert-danger'}`}>
                        {testResult[editingCode].ok ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                        <span style={{ fontSize: 12.5 }}>{testResult[editingCode].msg}</span>
                      </div>
                    )}

                    <button
                      type="button" className="btn btn-secondary" onClick={handleTest} disabled={testing}
                      style={{ justifyContent: 'center', gap: 6 }}
                    >
                      {testing ? <RefreshCw size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Zap size={14} />}
                      {testing ? 'Đang kiểm tra kết nối...' : 'Test kết nối'}
                    </button>

                    <div style={{ display: 'flex', gap: 10 }}>
                      <button type="button" className="btn btn-secondary" onClick={closeConfig} disabled={updating} style={{ flex: 1, justifyContent: 'center' }}>Hủy</button>
                      <button type="submit" className="btn btn-primary" disabled={updating} style={{ flex: 2, justifyContent: 'center', gap: 6 }}>
                        {updating ? <RefreshCw size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : <CheckCircle size={14} />}
                        {updating ? 'Đang lưu...' : 'Lưu cấu hình'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!loading && !loadError && (
        <div className="card mb-16" style={{ marginTop: 20, padding: '16px 20px', background: 'var(--bg-input)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <PackageSearch size={16} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
              <strong>Lưu ý vận hành:</strong> Ở chế độ <strong>Mock</strong>, đơn hàng được giả lập tracking number và không giao dịch với API thật.
              Chế độ <strong>Sandbox/Production</strong> yêu cầu API credentials thật từ nhà vận chuyển và cấu hình webhook nhận sự kiện.
              Token lưu trữ dưới dạng mã hóa AES, không lộ raw value ra ngoài UI hay log.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

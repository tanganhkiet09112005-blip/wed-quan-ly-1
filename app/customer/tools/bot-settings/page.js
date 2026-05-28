'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, RefreshCw, Save, Settings, ToggleLeft, ToggleRight, Wrench } from 'lucide-react';

export default function BotSettingsPage() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/bot-settings');
      const json = await res.json();
      if (json.success) setSettings(json.data);
      else setError(json.error || 'Không thể tải cài đặt bot.');
    } catch {
      setError('Không thể kết nối máy chủ.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { const t = setTimeout(load, 0); return () => clearTimeout(t); }, [load]);

  const update = (field, value) => setSettings((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/bot-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setSuccess('Đã lưu cài đặt chatbot thành công!');
        setSettings(json.data);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(json.error || 'Không thể lưu cài đặt.');
      }
    } catch {
      setError('Không thể kết nối máy chủ.');
    } finally {
      setSaving(false);
    }
  };

  const Toggle = ({ field, label, hint }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '14px 0', borderBottom: '1px solid var(--border-light)' }}>
      <div>
        <div style={{ fontWeight: 700, fontSize: 14 }}>{label}</div>
        {hint && <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 3 }}>{hint}</div>}
      </div>
      <button
        type="button"
        onClick={() => update(field, !settings?.[field])}
        disabled={loading || saving}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0, marginLeft: 16 }}
      >
        {settings?.[field]
          ? <ToggleRight size={28} color="var(--primary)" />
          : <ToggleLeft size={28} color="#94a3b8" />}
      </button>
    </div>
  );

  const Textarea = ({ field, label, hint, placeholder }) => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <textarea
        className="form-control" rows={3} placeholder={placeholder}
        value={settings?.[field] || ''}
        onChange={(e) => update(field, e.target.value)}
        disabled={loading || saving}
      />
      {hint && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{hint}</div>}
    </div>
  );

  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <div className="page-title">Cài đặt Chatbot</div>
          <div className="page-subtitle">Cấu hình hành vi bot tự động trả lời Facebook Fanpage và Livestream</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" className="btn btn-secondary" onClick={load} disabled={loading}>
            <RefreshCw size={14} style={{ animation: loading ? 'spin 0.8s linear infinite' : 'none' }} /> Tải lại
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSave} disabled={loading || saving}>
            {saving
              ? <><RefreshCw size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Đang lưu...</>
              : <><Save size={14} /> Lưu cài đặt</>}
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger mb-16" style={{ gap: 8 }}>
          <AlertCircle size={14} style={{ flexShrink: 0 }} /><span>{error}</span>
        </div>
      )}
      {success && (
        <div className="alert alert-success mb-16" style={{ gap: 8 }}>
          <Settings size={14} style={{ flexShrink: 0 }} /><span>{success}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Toggle settings */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Wrench size={16} color="var(--primary)" />
            <div className="card-title" style={{ marginBottom: 0 }}>Tùy chọn bot</div>
          </div>
          <div className="card-subtitle" style={{ marginBottom: 14 }}>Bật/tắt từng tính năng tự động của bot</div>

          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{ padding: '14px 0', borderBottom: '1px solid var(--border-light)' }}>
                <div className="skeleton" style={{ height: 16, width: '60%', marginBottom: 6 }} />
                <div className="skeleton" style={{ height: 12, width: '80%' }} />
              </div>
            ))
          ) : (
            <>
              <Toggle
                field="botEnabled"
                label="Bật bot chatbot"
                hint="Bot sẽ xử lý comment và tin nhắn từ Fanpage/Livestream"
              />
              <Toggle
                field="autoReply"
                label="Tự động trả lời"
                hint="Bot tự gửi tin nhắn hỏi thông tin còn thiếu mà không cần xác nhận từ shop"
              />
            </>
          )}
        </div>

        {/* Message templates */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Settings size={16} color="var(--primary)" />
            <div className="card-title" style={{ marginBottom: 0 }}>Tin nhắn bot mẫu</div>
          </div>
          <div className="card-subtitle" style={{ marginBottom: 14 }}>Tùy chỉnh nội dung bot tự động gửi</div>

          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 80, borderRadius: 8, marginBottom: 12 }} />
            ))
          ) : (
            <>
              <Textarea
                field="welcomeMessage"
                label="Tin nhắn chào mừng"
                placeholder="Ví dụ: Xin chào! Cảm ơn bạn đã quan tâm. Shop hỗ trợ bạn gì ạ?"
                hint="Gửi khi khách lần đầu nhắn tin"
              />
              <Textarea
                field="missingPhoneMessage"
                label="Hỏi số điện thoại"
                placeholder="Ví dụ: Bạn ơi, cho shop xin số điện thoại để xác nhận đơn nha!"
                hint="Gửi khi bot chưa bắt được SĐT từ comment"
              />
              <Textarea
                field="missingAddressMessage"
                label="Hỏi địa chỉ giao hàng"
                placeholder="Ví dụ: Bạn vui lòng cho shop địa chỉ giao hàng nhé!"
                hint="Gửi khi bot chưa bắt được địa chỉ"
              />
              <Textarea
                field="orderConfirmMessage"
                label="Xác nhận đơn hàng"
                placeholder="Ví dụ: Đơn hàng của bạn đã được xác nhận! Shop sẽ đóng gói và gửi hàng ngay."
                hint="Gửi khi shop confirm đơn"
              />
            </>
          )}
        </div>
      </div>

      <div className="alert" style={{ marginTop: 16, background: '#f0f9ff', borderColor: '#bae6fd', color: '#0369a1', gap: 8 }}>
        <AlertCircle size={14} style={{ flexShrink: 0 }} />
        <span>
          Bot hoạt động ở <strong>Mock Mode</strong> — không kết nối Facebook thật.
          Để bật production, cấu hình Facebook Page tại{' '}
          <Link href="/customer/channels/settings" style={{ color: 'var(--primary)', fontWeight: 600 }}>
            Tích hợp Facebook
          </Link>.
        </span>
      </div>
    </div>
  );
}

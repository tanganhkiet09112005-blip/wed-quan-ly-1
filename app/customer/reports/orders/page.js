'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, BarChart2, Package, RefreshCw, ShoppingCart, Truck } from 'lucide-react';

const fmtN = (v) => new Intl.NumberFormat('vi-VN').format(v || 0);
const CHANNEL_LABEL = { direct: 'Web', fanpage: 'Fanpage', livestream: 'Livestream', pos: 'POS', ecommerce: 'Sàn TMĐT' };

export default function OrderReportsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const dateFrom = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
      const res = await fetch(`/api/reports/overview?dateFrom=${dateFrom}`);
      const json = await res.json();
      if (json.success) setData(json.data);
      else setError(json.error || 'Không thể tải báo cáo đơn hàng.');
    } catch {
      setError('Không thể kết nối máy chủ.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const byStatus = data?.byStatus || {};
  const byChannel = data?.byChannel || {};
  const byCarrier = data?.byCarrier || {};
  const totalOrders = useMemo(() => Object.values(byStatus).reduce((s, v) => s + v, 0), [byStatus]);

  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <div className="page-title">Báo cáo đơn hàng</div>
          <div className="page-subtitle">Tổng hợp trạng thái đơn, nguồn đơn và carrier trong 30 ngày gần nhất</div>
        </div>
        <button type="button" className="btn btn-secondary" onClick={load} disabled={loading}>
          <RefreshCw size={14} style={{ animation: loading ? 'spin 0.8s linear infinite' : 'none' }} /> Tải lại
        </button>
      </div>

      {error && (
        <div className="alert alert-danger mb-16" style={{ gap: 8 }}>
          <AlertCircle size={14} style={{ flexShrink: 0 }} /> {error}
        </div>
      )}

      <div className="grid-kpi" style={{ marginBottom: 20 }}>
        <div className="kpi-card"><div className="kpi-icon kpi-icon-blue"><Package size={18} /></div><div className="kpi-content"><div className="kpi-value">{loading ? '...' : fmtN(totalOrders)}</div><div className="kpi-label">Tổng đơn</div></div></div>
        <div className="kpi-card"><div className="kpi-icon kpi-icon-green"><Truck size={18} /></div><div className="kpi-content"><div className="kpi-value">{loading ? '...' : fmtN(data?.kpis?.deliveredOrders)}</div><div className="kpi-label">Giao thành công</div></div></div>
        <div className="kpi-card"><div className="kpi-icon kpi-icon-purple"><BarChart2 size={18} /></div><div className="kpi-content"><div className="kpi-value">{loading ? '...' : `${data?.kpis?.deliveryRate || 0}%`}</div><div className="kpi-label">Tỉ lệ thành công</div></div></div>
        <div className="kpi-card"><div className="kpi-icon kpi-icon-yellow"><ShoppingCart size={18} /></div><div className="kpi-content"><div className="kpi-value">{loading ? '...' : fmtN(Object.keys(byChannel).length)}</div><div className="kpi-label">Kênh có đơn</div></div></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        <Breakdown title="Theo trạng thái" entries={Object.entries(byStatus)} empty="Chưa có đơn trong kỳ này" />
        <Breakdown title="Theo kênh bán" entries={Object.entries(byChannel).map(([k, v]) => [CHANNEL_LABEL[k] || k, v])} empty="Chưa có dữ liệu kênh bán" />
        <Breakdown title="Theo carrier" entries={Object.entries(byCarrier)} empty="Chưa có carrier phát sinh" />
      </div>

      <div className="card" style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center' }}>
        <div>
          <div className="card-title" style={{ marginBottom: 4 }}>Cần xem từng đơn?</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Mở bảng vận hành để lọc theo trạng thái, carrier, COD và nguồn đơn.</div>
        </div>
        <Link href="/customer/orders/manage" className="btn btn-primary">Mở quản lý đơn</Link>
      </div>
    </div>
  );
}

function Breakdown({ title, entries, empty }) {
  const total = entries.reduce((s, [, count]) => s + Number(count || 0), 0);
  return (
    <div className="card">
      <div className="card-title" style={{ marginBottom: 14 }}>{title}</div>
      {entries.length === 0 ? (
        <div className="empty-state" style={{ padding: 24 }}>
          <div className="empty-state-icon"><BarChart2 size={22} /></div>
          <h3>{empty}</h3>
        </div>
      ) : entries.sort((a, b) => b[1] - a[1]).map(([label, count]) => {
        const pct = total > 0 ? Math.round((Number(count) / total) * 100) : 0;
        return (
          <div key={label} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
              <span style={{ fontWeight: 700 }}>{label}</span>
              <span>{fmtN(count)} ({pct}%)</span>
            </div>
            <div className="progress-bar-wrapper" style={{ height: 7 }}>
              <div className="progress-bar progress-blue" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

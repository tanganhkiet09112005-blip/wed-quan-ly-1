'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

const formatCurrency = (value) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value || 0);

const formatNumber = (value) => new Intl.NumberFormat('vi-VN').format(value || 0);

function AreaChart({ data }) {
  const allZero = data.every(d => d.value === 0);
  if (!data || data.length === 0 || allZero) {
    return (
      <div className="empty-state" style={{ padding: '80px 0' }}>
        <div className="empty-state-icon" style={{ marginBottom: 16 }}>
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
        </div>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#334155' }}>Chưa có doanh thu</p>
        <p style={{ fontSize: 13, marginTop: 4 }}>Chưa có doanh thu trong khoảng thời gian này.</p>
      </div>
    );
  }

  // Very simple SVG chart logic for demo
  const height = 240;
  const width = 800; // Will scale via SVG viewBox
  const padding = { top: 20, right: 20, bottom: 30, left: 60 };

  const maxValueInData = Math.max(...data.map(d => d.value));
  const maxVal = maxValueInData * 1.2 || 100;
  const minVal = 0;

  const getX = (index) => padding.left + (index * (width - padding.left - padding.right)) / Math.max(data.length - 1, 1);
  const getY = (val) => height - padding.bottom - ((val - minVal) / (maxVal - minVal)) * (height - padding.top - padding.bottom);

  const points = data.map((d, i) => `${getX(i)},${getY(d.value)}`).join(' ');
  const areaPoints = `${getX(0)},${height - padding.bottom} ${points} ${getX(data.length - 1)},${height - padding.bottom}`;

  return (
    <div className="chart-container" style={{ width: '100%', overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ width: '100%', height: height, minWidth: 600 }}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((tick, i) => {
          const y = getY(minVal + (maxVal - minVal) * tick);
          const val = minVal + (maxVal - minVal) * tick;
          let label = '0';
          if (val > 0) {
            if (val >= 1000000) label = (val / 1000000).toFixed(1).replace('.0', '') + 'tr';
            else if (val >= 1000) label = (val / 1000).toFixed(0) + 'k';
            else label = formatNumber(val);
          }
          return (
            <g key={i}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
              <text x={padding.left - 10} y={y + 4} textAnchor="end" fontSize="11" fill="#94a3b8">
                {label}
              </text>
            </g>
          );
        })}

        {/* X Axis */}
        <line x1={padding.left} y1={height - padding.bottom} x2={width - padding.right} y2={height - padding.bottom} stroke="#e2e8f0" strokeWidth="1" />
        {data.map((d, i) => (
          <text key={i} x={getX(i)} y={height - padding.bottom + 20} textAnchor="middle" fontSize="11" fill="#94a3b8">
            {d.label}
          </text>
        ))}

        {/* Area */}
        <polygon points={areaPoints} fill="url(#areaGradient)" className="chart-area" />
        
        {/* Line */}
        <polyline points={points} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Points */}
        {data.map((d, i) => (
          <g key={i} className="chart-dot-group">
            <circle cx={getX(i)} cy={getY(d.value)} r="4" fill="white" stroke="#3b82f6" strokeWidth="2" className="chart-dot" />
            <title>{d.label}: {formatCurrency(d.value)}</title>
          </g>
        ))}

        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function DonutChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="empty-state" style={{ padding: '40px 0' }}>
        <p>Chưa có dữ liệu vận chuyển</p>
      </div>
    );
  }

  const size = 220;
  const center = size / 2;
  const radius = size * 0.36;
  const strokeWidth = size * 0.12;
  const total = data.reduce((sum, item) => sum + item.value, 0);

  const segments = data.reduce((acc, item) => {
    const angle = (item.value / total) * 360;
    const startAngle = acc.currentAngle;
    const endAngle = startAngle + angle;

    // Convert angles to radians
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    // Calculate coordinates
    const x1 = center + radius * Math.cos(startRad);
    const y1 = center + radius * Math.sin(startRad);
    const x2 = center + radius * Math.cos(endRad);
    const y2 = center + radius * Math.sin(endRad);

    const largeArcFlag = angle > 180 ? 1 : 0;

    const pathData = `
      M ${center} ${center}
      L ${x1} ${y1}
      A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}
      Z
    `;

    acc.segments.push({ ...item, pathData, startAngle, endAngle });
    acc.currentAngle = endAngle;
    return acc;
  }, { segments: [], currentAngle: -90 }).segments;

  return (
    <div className="donut-container">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="donut-svg">
        <circle cx={center} cy={center} r={radius} fill="none" stroke="#f1f5f9" strokeWidth={strokeWidth} />
        {segments.map((seg, i) => {
          if (seg.value === 0) return null;
          
          // CSS variables for stroke-dasharray technique
          const dasharray = 2 * Math.PI * radius;
          const dashoffset = dasharray - (seg.value / total) * dasharray;
          // Calculate rotation based on previous segments
          const prevTotal = data.slice(0, i).reduce((sum, d) => sum + d.value, 0);
          const rotation = (prevTotal / total) * 360 - 90;

          return (
            <circle
              key={i}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeDasharray={dasharray}
              strokeDashoffset={dashoffset}
              transform={`rotate(${rotation} ${center} ${center})`}
              className="donut-segment"
            >
              <title>{seg.label}: {seg.value}</title>
            </circle>
          );
        })}
        {/* Inner white circle for donut hole */}
        <circle cx={center} cy={center} r={radius - strokeWidth/2 + 2} fill="white" />
        <text x={center} y={center + 8} textAnchor="middle" fontSize="24" fontWeight="800" fill="#0f172a">
          {total}
        </text>
        <text x={center} y={center + 24} textAnchor="middle" fontSize="12" fill="#64748b" fontWeight="600">
          đơn
        </text>
      </svg>
      <div className="donut-legend" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {data.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <div className="donut-legend-dot" style={{ background: item.color, marginTop: 4 }} />
            <div>
              <div style={{ fontSize: 12, color: '#475569', marginBottom: 2 }}>{item.label}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{item.value} đơn</div>
              {item.amount !== undefined && (
                <div style={{ fontSize: 12, color: '#94a3b8' }}>{formatCurrency(item.amount)}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [inventory, setInventory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateFilter, setDateFilter] = useState('7days'); // 7days, 15days

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const [dashboardRes, inventoryRes] = await Promise.all([
        fetch('/api/shop/dashboard'),
        fetch('/api/inventory/overview'),
      ]);
      const dashboardJson = await dashboardRes.json();
      const inventoryJson = await inventoryRes.json();

      if (dashboardJson.success) {
        setDashboard(dashboardJson.data);
        setInventory(inventoryJson.success ? inventoryJson.data : null);
        setError('');
      } else {
        setError(dashboardJson.error || 'Không thể tải dashboard shop.');
      }
    } catch {
      setError('Không thể tải dữ liệu, vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user?.id) return undefined;
    const t = setTimeout(loadDashboard, 0);
    return () => clearTimeout(t);
  }, [user?.id, loadDashboard]);

  const summary = useMemo(() => dashboard?.summary || {}, [dashboard?.summary]);
  const orders = useMemo(() => dashboard?.orders || [], [dashboard?.orders]);
  
  const posOrders = useMemo(() => orders.filter((o) => o.channel?.toLowerCase() === 'pos'), [orders]);
  const posCount = posOrders.length;
  const posAmount = posOrders.reduce((sum, o) => sum + Number(o.codAmount || 0), 0);

  const ecommerceOrders = useMemo(() => orders.filter((o) => ['shopee', 'lazada', 'tiktok', 'ecommerce'].includes(o.channel?.toLowerCase())), [orders]);
  const ecommerceCount = ecommerceOrders.length;
  const ecommerceAmount = ecommerceOrders.reduce((sum, o) => sum + Number(o.codAmount || 0), 0);

  // Calculate chart data from orders
  const chartData = useMemo(() => {
    if (!orders.length) return [];
    
    // Create last X days array
    const days = dateFilter === '7days' ? 7 : 15;
    const dataMap = new Map();

    // Anchor to the latest order date if orders exist and are older than today
    let anchorDate = new Date();
    if (orders && orders.length > 0) {
      const maxTime = Math.max(...orders.map(o => new Date(o.createdAt).getTime()));
      if (maxTime > 0) {
        // Only override if the latest order is older than 7 days, or we want to anchor exactly on it
        // Actually, let's just always anchor to today UNLESS max order is older than our window
        if (maxTime < anchorDate.getTime() - 86400000 * 2) {
          anchorDate = new Date(maxTime);
        }
      }
    }
    
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(anchorDate.getTime());
      d.setDate(d.getDate() - i);
      const dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
      dataMap.set(dateStr, 0);
    }

    orders.forEach(order => {
      if (order.status === 'draft' || order.status === 'cancelled') return;
      const d = new Date(order.createdAt);
      const dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (dataMap.has(dateStr)) {
        const orderValue = Number(order.codAmount || 0) + (order.totalAmount ? Number(order.totalAmount) : 0);
        // We use either codAmount or totalAmount depending on what is available in the order schema.
        // Assuming the mock has codAmount set. If not, fallback to 0.
        dataMap.set(dateStr, dataMap.get(dateStr) + Number(order.codAmount || 0));
      }
    });

    return Array.from(dataMap.entries()).map(([label, value]) => ({ label, value }));
  }, [orders, dateFilter]);

  const shippingStatusData = useMemo(() => {
    const byStatus = summary.byStatus || {};
    const amountMap = {};
    if (orders) {
      orders.forEach(o => {
        amountMap[o.status] = (amountMap[o.status] || 0) + Number(o.codAmount || 0) + (o.totalAmount ? Number(o.totalAmount) : 0);
      });
    }
    return [
      { label: 'Gửi giao hàng', value: byStatus.ready_to_ship || 0, amount: amountMap.ready_to_ship || 0, color: '#f59e0b' },
      { label: 'Lấy hàng thành công', value: byStatus.pushed_to_carrier || 0, amount: amountMap.pushed_to_carrier || 0, color: '#0ea5e9' },
      { label: 'Đang vận chuyển', value: byStatus.shipping || 0, amount: amountMap.shipping || 0, color: '#3b82f6' },
      { label: 'Đang giao hàng', value: byStatus.delivering || 0, amount: amountMap.delivering || 0, color: '#10b981' },
      { label: 'Giao thành công', value: byStatus.delivered || 0, amount: amountMap.delivered || 0, color: '#22c55e' },
      { label: 'Chuyển hoàn', value: (byStatus.returned || 0) + (byStatus.cancelled || 0), amount: (amountMap.returned || 0) + (amountMap.cancelled || 0), color: '#ef4444' },
    ];
  }, [summary, orders]);

  const lowStockItems = inventory?.lowStockItems || [];
  const lowStockCount = inventory?.summary?.lowStockSkuCount || 0;

  if (loading && !dashboard) {
    return (
      <div className="page-container" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="animate-pulse" style={{ width: 40, height: 40, border: '3px solid var(--primary)', borderRadius: '50%', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header & Filter */}
      <div className="page-header" style={{ marginBottom: 20 }}>
        <h1 className="page-title" style={{ fontSize: 24 }}>Tổng quan</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>
            Hôm nay, {new Date().toLocaleDateString('vi-VN')}
          </div>
          <div className="tabs" style={{ margin: 0 }}>
            <button 
              className={`tab ${dateFilter === '7days' ? 'active' : ''}`}
              onClick={() => setDateFilter('7days')}
            >
              7 NGÀY
            </button>
            <button 
              className={`tab ${dateFilter === '15days' ? 'active' : ''}`}
              onClick={() => setDateFilter('15days')}
            >
              15 NGÀY
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger mb-16">{error}</div>
      )}

      <div className="dashboard-grid">
        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Doanh thu theo thời gian */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
              <h2 className="card-title" style={{ fontSize: 16 }}>Doanh thu theo thời gian</h2>
            </div>
            
            {/* 4 KPIs Row */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
              <div style={{ flex: 1, padding: '16px 24px', borderRight: '1px solid var(--border)', position: 'relative' }}>
                <div style={{ position: 'absolute', top: -1, left: 24, right: 24, height: 3, background: 'var(--primary)', borderRadius: '0 0 4px 4px' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: '#64748b', fontSize: 13, fontWeight: 600 }}>
                  <span style={{ color: 'var(--primary)' }}>■</span> Tổng đơn hàng
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#1e293b' }}>{formatNumber(summary.totalOrders)} <span style={{ fontSize: 14, fontWeight: 600, color: '#64748b' }}>đơn</span></div>
                <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>{formatCurrency(summary.codCollected + summary.codPending)}</div>
              </div>
              <div style={{ flex: 1, padding: '16px 24px', borderRight: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: '#64748b', fontSize: 13, fontWeight: 600 }}>
                  <span style={{ color: '#22c55e' }}>■</span> Đơn giao hàng
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#1e293b' }}>{formatNumber(summary.byStatus?.delivered || 0)} <span style={{ fontSize: 14, fontWeight: 600, color: '#64748b' }}>đơn</span></div>
                <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>{formatCurrency(summary.codCollected)}</div>
              </div>
              <div style={{ flex: 1, padding: '16px 24px', borderRight: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: '#64748b', fontSize: 13, fontWeight: 600 }}>
                  <span style={{ color: '#eab308' }}>■</span> Bán tại quầy
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#1e293b' }}>{formatNumber(posCount)} <span style={{ fontSize: 14, fontWeight: 600, color: '#64748b' }}>đơn</span></div>
                <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>{formatCurrency(posAmount)}</div>
              </div>
              <div style={{ flex: 1, padding: '16px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: '#64748b', fontSize: 13, fontWeight: 600 }}>
                  <span style={{ color: '#8b5cf6' }}>■</span> Sàn thương mại điện tử
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#1e293b' }}>{formatNumber(ecommerceCount)} <span style={{ fontSize: 14, fontWeight: 600, color: '#64748b' }}>đơn</span></div>
                <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>{formatCurrency(ecommerceAmount)}</div>
              </div>
            </div>

            {/* Chart Area */}
            <div style={{ padding: '24px 24px 16px' }}>
              <AreaChart data={chartData} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Tỉ lệ đơn hàng theo trạng thái */}
            <div className="card">
              <div style={{ marginBottom: 24 }}>
                <h2 className="card-title" style={{ fontSize: 16 }}>Tỉ lệ đơn hàng theo trạng thái vận chuyển</h2>
              </div>
              <DonutChart data={shippingStatusData} />
            </div>

            {/* Top sản phẩm bán chạy */}
            <div className="card">
              <div style={{ marginBottom: 24 }}>
                <h2 className="card-title" style={{ fontSize: 16 }}>Top sản phẩm bán chạy</h2>
              </div>
              <div className="empty-state" style={{ padding: '50px 0' }}>
                <div className="empty-state-icon" style={{ borderRadius: '50%', width: 72, height: 72, background: 'var(--bg-input)', marginBottom: 16 }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
                    <path d="M20 7.5v9l-8 4.5-8-4.5v-9l8-4.5z"/>
                    <path d="M12 22v-9"/>
                    <path d="M12 13l8-4.5"/>
                    <path d="M12 13L4 8.5"/>
                  </svg>
                </div>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#334155' }}>Chưa có sản phẩm bán chạy</p>
                <p style={{ fontSize: 13, marginTop: 6, color: '#94a3b8', textAlign: 'center', maxWidth: 220 }}>Dữ liệu sản phẩm bán chạy nhất sẽ tự động hiển thị tại đây.</p>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Tồn kho dưới định mức */}
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2.2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Tồn kho dưới định mức</h3>
              </div>
              <Link href="/customer/inventory" style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 600 }}>Xem tất cả</Link>
            </div>
            <div style={{ padding: '24px 20px' }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>
                {formatNumber(lowStockCount)} <span style={{ fontSize: 14, fontWeight: 600, color: '#64748b' }}>SKU</span>
              </div>
              {lowStockCount === 0 ? (
                <div style={{ fontSize: 13, color: '#64748b' }}>Không có sản phẩm dưới định mức</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {lowStockItems.slice(0, 4).map((item) => (
                    <div key={item.id} style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-input)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12 }}>
                        <strong style={{ color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.productName}</strong>
                        <span style={{ color: item.stockQuantity === 0 ? 'var(--danger)' : '#d97706', fontWeight: 800 }}>
                          {formatNumber(item.stockQuantity)}/{formatNumber(item.lowStockThreshold)}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 2, fontFamily: 'monospace' }}>{item.sku}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Banner Livestream App */}
          <div className="card" style={{ padding: 0, background: 'linear-gradient(135deg, #4f46e5, #6366f1)', color: 'white', overflow: 'hidden', position: 'relative' }}>
            <div style={{ padding: '24px 20px', position: 'relative', zIndex: 1 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 8, letterSpacing: -0.3 }}>TẢI APP HSHIP</h3>
              <p style={{ fontSize: 13, opacity: 0.9, marginBottom: 16, lineHeight: 1.5 }}>Kết nối, quản lý bán hàng dễ dàng,<br/>chốt đơn Livestream nhanh chóng</p>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ width: 100, height: 32, background: 'rgba(255,255,255,0.2)', borderRadius: 4 }} />
                <div style={{ width: 100, height: 32, background: 'rgba(255,255,255,0.2)', borderRadius: 4 }} />
              </div>
            </div>
            {/* Mock phone graphic */}
            <div style={{ position: 'absolute', right: -20, bottom: -20, width: 120, height: 160, background: '#ffffff', borderRadius: '16px 0 0 0', opacity: 0.1, transform: 'rotate(-10deg)' }} />
          </div>

          {/* Kiểm tra đơn bất thường */}
          <div className="card" style={{ padding: 0, background: 'linear-gradient(180deg, #3b82f6, #1d4ed8)', color: 'white' }}>
            <div style={{ padding: '20px' }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Kiểm tra đơn bất thường</h3>
              <p style={{ fontSize: 13, opacity: 0.9, marginBottom: 20, lineHeight: 1.6 }}>
                Hãy thường xuyên kiểm tra vận đơn của bạn trong 30 ngày qua để xem có vận đơn nào đã ngừng nhận tương tác quá 03 ngày không nhé!
              </p>
              <Link href="/customer/orders/manage" className="btn" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}>Xem chi tiết</Link>
            </div>
          </div>

          {/* Kiện vấn đề */}
          <div className="card" style={{ padding: 0, background: 'linear-gradient(180deg, #6366f1, #4f46e5)', color: 'white', minHeight: 280, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 15, fontWeight: 700 }}>Kiện vấn đề</h3>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
            </div>
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ flex: 1, padding: '10px', textAlign: 'center', fontSize: 13, fontWeight: 600, borderRight: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.1)' }}>Tất cả</div>
              <div style={{ flex: 1, padding: '10px', textAlign: 'center', fontSize: 13, fontWeight: 500, opacity: 0.8 }}>Chưa xử lý</div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20, opacity: 0.9 }}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ marginBottom: 16, opacity: 0.5 }}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
              </svg>
              <div style={{ fontSize: 13, fontWeight: 500 }}>May quá, không có kiện vấn đề nào!</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { orders, orderChartData, formatCurrency, getStatusLabel, getStatusColor } from '@/lib/mock-data';

const stats = {
  total: orders.length,
  delivered: orders.filter(o => o.status === 'delivered').length,
  shipping: orders.filter(o => o.status === 'shipping').length,
  returned: orders.filter(o => o.status === 'returned').length,
  pending: orders.filter(o => o.status === 'pending').length,
  issue: orders.filter(o => o.status === 'issue').length,
};

const shipperStats = [
  { name: 'GHN', orders: 342, delivered: 318, rate: 92.9 },
  { name: 'SPX', orders: 245, delivered: 228, rate: 93.1 },
  { name: 'J&T', orders: 156, delivered: 143, rate: 91.7 },
];

export default function OrdersOverviewPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Tổng quan giao hàng</h1>
          <div className="page-subtitle">Thống kê tổng thể tình trạng giao hàng</div>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid-kpi" style={{ marginBottom: 24 }}>
        <div className="kpi-card">
          <div className="kpi-content">
            <div className="kpi-value">{stats.total}</div>
            <div className="kpi-label">Tổng đơn</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-content">
            <div className="kpi-value">{stats.delivered}</div>
            <div className="kpi-label">Đã giao</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-content">
            <div className="kpi-value">{stats.shipping}</div>
            <div className="kpi-label">Đang giao</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-content">
            <div className="kpi-value">{stats.pending}</div>
            <div className="kpi-label">Chờ xử lý</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-content">
            <div className="kpi-value">{stats.returned}</div>
            <div className="kpi-label">Trả hàng</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-content">
            <div className="kpi-value">{stats.issue}</div>
            <div className="kpi-label">Kiện vấn đề</div>
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Chart */}
        <div className="card">
          <div className="card-title">Xu hướng đơn hàng</div>
          <div className="card-subtitle">6 ngày gần nhất</div>
          <div className="chart-wrapper">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={orderChartData} barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" stroke="var(--text-muted)" tick={{ fontSize: 12 }} />
                  <YAxis stroke="var(--text-muted)" tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="orders" fill="#6366f1" name="Tổng đơn" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="delivered" fill="#10b981" name="Đã giao" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="returned" fill="#8b5cf6" name="Trả hàng" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)' }}>
                Đang tải biểu đồ...
              </div>
            )}
          </div>
        </div>

        {/* Shipper performance */}
        <div className="card">
          <div className="card-title">Hiệu suất đơn vị vận chuyển</div>
          <div className="card-subtitle">Tỷ lệ giao hàng thành công</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>
            {shipperStats.map(s => (
              <div key={s.name}>
                <div className="flex-between" style={{ marginBottom: 6 }}>
                  <span style={{ fontWeight: 600 }}>{s.name}</span>
                  <span style={{ color: '#34d399', fontWeight: 700 }}>{s.rate}%</span>
                </div>
                <div className="progress-bar-wrapper">
                  <div className="progress-bar progress-blue" style={{ width: `${s.rate}%` }} />
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  {s.delivered}/{s.orders} đơn giao thành công
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Orders table */}
      <div className="card">
        <div className="card-title mb-16">Danh sách đơn hàng</div>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Khách hàng</th>
                <th>ĐVVC</th>
                <th>Mã vận đơn</th>
                <th>Giá trị COD</th>
                <th>Ngày tạo</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id}>
                  <td>
                    <span style={{ color: 'var(--primary-light)', fontWeight: 600 }}>{order.id}</span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{order.customerName}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{order.phone}</div>
                  </td>
                  <td>
                    <span className="badge" style={{ background: 'var(--bg-input)', color: 'var(--text-secondary)' }}>{order.shipper}</span>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{order.trackingCode}</td>
                  <td>
                    <span style={{ fontWeight: 700 }}>{formatCurrency(order.codAmount)}</span>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{order.createdAt}</td>
                  <td>
                    <span className={`badge ${getStatusColor(order.status)}`}>{getStatusLabel(order.status)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, Boxes, Edit2, Package, PlusCircle, RefreshCw, Search, Tag, X } from 'lucide-react';

const fmt = (value) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value || 0);
const fmtN = (value) => new Intl.NumberFormat('vi-VN').format(value || 0);

const STATUS_LABEL = { active: 'Đang bán', inactive: 'Ngừng bán' };
const STATUS_CLS = { active: 'status-delivered', inactive: 'status-cancelled' };

function priceRange(product) {
  const min = Number(product.priceMin || 0);
  const max = Number(product.priceMax || 0);
  if (!min && !max) return fmt(0);
  return min === max ? fmt(min) : `${fmt(min)} - ${fmt(max)}`;
}

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({ total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: '1', limit: '100' });
      if (search.trim()) params.set('search', search.trim());
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (lowStockOnly) params.set('lowStock', 'true');

      const res = await fetch(`/api/products?${params}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Không thể tải sản phẩm.');

      setProducts(json.data?.items || []);
      setMeta(json.data || { total: 0 });
    } catch (err) {
      setError(err.message || 'Không thể kết nối máy chủ.');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, lowStockOnly]);

  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [load]);

  const summary = useMemo(() => {
    const totalStock = products.reduce((sum, product) => sum + Number(product.totalStock || 0), 0);
    const lowStockCount = products.reduce((sum, product) => sum + Number(product.lowStockCount || 0), 0);
    const variantCount = products.reduce((sum, product) => sum + Number(product.variantCount || 0), 0);
    return { totalStock, lowStockCount, variantCount };
  }, [products]);

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setLowStockOnly(false);
  };

  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <div className="page-title">Sản phẩm</div>
          <div className="page-subtitle">Quản lý sản phẩm, SKU, biến thể và tồn kho của shop</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" className="btn btn-secondary" onClick={load} disabled={loading}>
            <RefreshCw size={14} style={{ animation: loading ? 'spin 0.8s linear infinite' : 'none' }} /> Tải lại
          </button>
          <Link href="/customer/products/create" className="btn btn-primary">
            <PlusCircle size={14} /> Thêm sản phẩm
          </Link>
        </div>
      </div>

      <div className="grid-kpi" style={{ marginBottom: 20 }}>
        {[
          { label: 'Tổng sản phẩm', value: loading ? '...' : fmtN(meta.total || products.length), cls: 'kpi-icon-blue', icon: Tag },
          { label: 'Tổng SKU', value: loading ? '...' : fmtN(summary.variantCount), cls: 'kpi-icon-purple', icon: Boxes },
          { label: 'Tổng tồn kho', value: loading ? '...' : fmtN(summary.totalStock), cls: 'kpi-icon-green', icon: Package },
          { label: 'SKU dưới định mức', value: loading ? '...' : fmtN(summary.lowStockCount), cls: summary.lowStockCount > 0 ? 'kpi-icon-red' : 'kpi-icon-green', icon: AlertCircle },
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

      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-wrapper" style={{ flex: 1, minWidth: 240 }}>
            <Search size={15} className="search-icon" />
            <input className="search-input" placeholder="Tìm tên, mã sản phẩm, SKU..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="form-control" style={{ width: 170 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang bán</option>
            <option value="inactive">Ngừng bán</option>
          </select>
          <label className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}>
            <input type="checkbox" checked={lowStockOnly} onChange={(e) => setLowStockOnly(e.target.checked)} style={{ accentColor: 'var(--primary)' }} />
            Dưới định mức
          </label>
          {(search || statusFilter !== 'all' || lowStockOnly) && (
            <button type="button" className="btn btn-secondary btn-sm" onClick={clearFilters}>
              <X size={12} /> Xóa lọc
            </button>
          )}
        </div>

        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Mã sản phẩm</th>
                <th>Tên sản phẩm</th>
                <th style={{ textAlign: 'right' }}>Số variant</th>
                <th style={{ textAlign: 'right' }}>Tổng tồn</th>
                <th>Giá bán</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 7 }).map((__, j) => (
                    <td key={j}><div className="skeleton" style={{ height: 16, borderRadius: 4 }} /></td>
                  ))}</tr>
                ))
              ) : error ? (
                <tr><td colSpan={7} style={{ padding: 0 }}>
                  <div className="empty-state" style={{ padding: 36 }}>
                    <div className="empty-state-icon" style={{ background: 'var(--danger-light)', color: 'var(--danger)' }}><AlertCircle size={24} /></div>
                    <h3>Không thể tải sản phẩm</h3>
                    <p>{error}</p>
                    <button type="button" className="btn btn-primary" onClick={load}><RefreshCw size={14} /> Thử lại</button>
                  </div>
                </td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: 0 }}>
                  <div className="empty-state" style={{ padding: 48 }}>
                    <div className="empty-state-icon"><Package size={26} /></div>
                    <h3>Chưa có sản phẩm phù hợp</h3>
                    <p>{search || lowStockOnly || statusFilter !== 'all' ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.' : 'Thêm sản phẩm đầu tiên để bắt đầu quản lý SKU và tồn kho.'}</p>
                    <Link href="/customer/products/create" className="btn btn-primary"><PlusCircle size={14} /> Thêm sản phẩm</Link>
                  </div>
                </td></tr>
              ) : products.map((product) => (
                <tr key={product.id}>
                  <td>
                    <div style={{ fontFamily: 'monospace', color: 'var(--primary)', fontWeight: 800 }}>{product.code}</div>
                    {product.sku && <div style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)' }}>{product.sku}</div>}
                  </td>
                  <td>
                    <div style={{ fontWeight: 800 }}>{product.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{product.category || 'Chưa phân loại'}</div>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>{fmtN(product.variantCount)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <span style={{ fontWeight: 800, color: product.lowStockCount > 0 ? 'var(--danger)' : 'var(--text-primary)' }}>{fmtN(product.totalStock)}</span>
                    {product.lowStockCount > 0 && <div style={{ fontSize: 11, color: 'var(--danger)' }}>{product.lowStockCount} SKU thấp</div>}
                  </td>
                  <td style={{ fontWeight: 800 }}>{priceRange(product)}</td>
                  <td><span className={`badge ${STATUS_CLS[product.status] || 'status-pending'}`}>{STATUS_LABEL[product.status] || product.status}</span></td>
                  <td>
                    <Link href={`/customer/products/${product.id}`} className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <Edit2 size={12} /> Xem/Sửa
                    </Link>
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

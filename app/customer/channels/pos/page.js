'use client';

import { useCallback, useEffect, useReducer, useState } from 'react';
import {
  AlertCircle,
  CheckCircle,
  CreditCard,
  FileText,
  Minus,
  Package,
  Plus,
  Printer,
  RefreshCw,
  Search,
  ShoppingCart,
  Store,
  Tag,
  Trash2,
  X,
} from 'lucide-react';

const fmt = (v) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(v || 0);
const fmtN = (v) => new Intl.NumberFormat('vi-VN').format(v || 0);

/* ─── Cart reducer ─── */
const CART_INIT = { items: [], customerName: '', customerPhone: '', note: '', discount: 0, paymentMethod: 'cash' };

function cartReducer(state, action) {
  switch (action.type) {
    case 'add': {
      const { product, variant } = action;
      const variantId = variant.id;
      const price = Number(variant.price ?? product.price ?? 0);
      const maxStock = Number(variant.stockQuantity ?? 0);

      const existingIndex = state.items.findIndex((i) => i.variantId === variantId);

      if (existingIndex >= 0) {
        const items = [...state.items];
        const newQty = items[existingIndex].quantity + 1;
        if (newQty > maxStock) {
          action.onError?.(`Không thể thêm. SKU ${variant.sku} chỉ còn tối đa ${maxStock} sản phẩm.`);
          return state;
        }
        items[existingIndex] = { ...items[existingIndex], quantity: newQty };
        return { ...state, items };
      }

      if (maxStock <= 0) {
        action.onError?.(`SKU ${variant.sku} đã hết hàng.`);
        return state;
      }

      const variantName = [variant.size, variant.color, variant.name].filter(Boolean).join(' / ') || 'Mặc định';
      const fullName = `${product.name} - ${variantName}`;

      return {
        ...state,
        items: [
          ...state.items,
          {
            productId: product.id,
            variantId,
            sku: variant.sku,
            productName: product.name,
            variantName,
            name: fullName,
            price,
            quantity: 1,
            maxStock,
            size: variant.size || null,
            color: variant.color || null,
          },
        ],
      };
    }
    case 'qty': {
      const items = state.items.map((item, idx) => {
        if (idx !== action.index) return item;
        const newQty = Math.max(1, item.quantity + action.delta);
        if (newQty > item.maxStock) {
          action.onError?.(`Chỉ còn ${item.maxStock} sản phẩm trong kho.`);
          return item;
        }
        return { ...item, quantity: newQty };
      });
      return { ...state, items };
    }
    case 'remove':
      return { ...state, items: state.items.filter((_, idx) => idx !== action.index) };
    case 'set':
      return { ...state, [action.field]: action.value };
    case 'clear':
      return { ...CART_INIT, customerName: '', customerPhone: '', note: '', discount: 0, paymentMethod: 'cash' };
    default:
      return state;
  }
}

export default function POSPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [cart, dispatch] = useReducer(cartReducer, CART_INIT);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [toastError, setToastError] = useState('');

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/products?status=active&limit=100&includeVariants=1');
      const json = await res.json();
      if (json.success) {
        setProducts(json.data?.items || []);
      } else {
        setError(json.message || 'Không thể tải sản phẩm.');
      }
    } catch {
      setError('Lỗi kết nối máy chủ khi tải sản phẩm.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Toast auto-clear
  useEffect(() => {
    if (toastError) {
      const t = setTimeout(() => setToastError(''), 4000);
      return () => clearTimeout(t);
    }
  }, [toastError]);

  const triggerToast = (msg) => {
    setToastError(msg);
  };

  // Filter products & their variants
  const filteredProducts = products
    .map((p) => {
      // Filter variants within each product
      let filteredVariants = (p.variants || []).filter((v) => v.status === 'active');

      if (inStockOnly) {
        filteredVariants = filteredVariants.filter((v) => v.stockQuantity > 0);
      }
      if (lowStockOnly) {
        filteredVariants = filteredVariants.filter((v) => v.stockQuantity <= v.lowStockThreshold);
      }

      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesProduct =
          p.name.toLowerCase().includes(query) || (p.code || '').toLowerCase().includes(query);

        if (!matchesProduct) {
          // Keep only variants matching query
          filteredVariants = filteredVariants.filter(
            (v) =>
              (v.sku || '').toLowerCase().includes(query) ||
              (v.name || '').toLowerCase().includes(query) ||
              (v.size || '').toLowerCase().includes(query) ||
              (v.color || '').toLowerCase().includes(query)
          );
        }
      }

      return { ...p, variants: filteredVariants };
    })
    .filter((p) => p.variants.length > 0);

  const totalValue = cart.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const finalTotal = Math.max(0, totalValue - Number(cart.discount || 0));

  const handleCheckout = async () => {
    if (cart.items.length === 0) {
      triggerToast('Giỏ hàng trống.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/pos/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.items.map((i) => ({
            variantId: i.variantId,
            quantity: i.quantity,
          })),
          customerName: cart.customerName,
          phone: cart.customerPhone,
          note: cart.note,
          paymentMethod: cart.paymentMethod,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setResult(json.data);
        dispatch({ type: 'clear' });
      } else {
        triggerToast(json.error || 'Thanh toán đơn hàng thất bại.');
      }
    } catch {
      triggerToast('Không thể kết nối tới API POS.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="page-container">
      {/* Dynamic inline styles for 80mm thermo-printer printing */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
            background: none !important;
          }
          #print-receipt-section, #print-receipt-section * {
            visibility: visible;
          }
          #print-receipt-section {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
            padding: 4mm;
            color: #000;
            font-family: 'Courier New', Courier, monospace;
            font-size: 12px;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Floating Toast Notification */}
      {toastError && (
        <div
          className="no-print"
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            backgroundColor: 'var(--danger)',
            color: 'white',
            padding: '12px 20px',
            borderRadius: 8,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontWeight: 600,
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <AlertCircle size={16} />
          <span>{toastError}</span>
          <button
            onClick={() => setToastError('')}
            style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: 0 }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="page-header no-print" style={{ marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Store size={22} color="var(--primary)" />
            <div className="page-title" style={{ marginBottom: 0 }}>Bán tại quầy</div>
          </div>
          <div className="page-subtitle">Tạo đơn bán trực tiếp tại cửa hàng, chọn SKU, thanh toán và trừ tồn kho</div>
        </div>
        <button type="button" className="btn btn-secondary btn-sm" onClick={loadProducts} disabled={loading}>
          <RefreshCw size={13} style={{ marginRight: 6, animation: loading ? 'spin 0.8s linear infinite' : 'none' }} />
          Tải lại dữ liệu
        </button>
      </div>

      <div className="no-print" style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 16, alignItems: 'start' }}>
        {/* Left: Product Picker */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Filters Bar */}
          <div className="card" style={{ padding: 12 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
              <div className="search-wrapper" style={{ flex: 1, minWidth: 200 }}>
                <Search size={14} className="search-icon" />
                <input
                  className="search-input"
                  placeholder="Tìm theo tên sản phẩm, mã sản phẩm hoặc SKU..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {/* Status Filters */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setInStockOnly(!inStockOnly)}
                  className={`btn btn-sm ${inStockOnly ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ borderRadius: 20 }}
                >
                  Chỉ còn hàng
                </button>
                <button
                  type="button"
                  onClick={() => setLowStockOnly(!lowStockOnly)}
                  className={`btn btn-sm ${lowStockOnly ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ borderRadius: 20, color: lowStockOnly ? '#fff' : '#d97706', borderColor: '#fef3c7' }}
                >
                  Cảnh báo tồn thấp
                </button>
              </div>
            </div>
          </div>

          {/* Product Cards Container */}
          <div className="card" style={{ minHeight: 400, padding: 16 }}>
            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="skeleton" style={{ height: 140, borderRadius: 12 }} />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="empty-state" style={{ padding: '60px 20px' }}>
                <div className="empty-state-icon" style={{ backgroundColor: 'var(--bg-input)' }}>
                  <Package size={28} />
                </div>
                <h3>{products.length === 0 ? 'Không có sản phẩm nào' : 'Không tìm thấy kết quả'}</h3>
                <p>{products.length === 0 ? 'Vui lòng thêm sản phẩm mới trong cấu hình trước khi dùng POS.' : 'Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm.'}</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                {filteredProducts.map((prod) => (
                  <div
                    key={prod.id}
                    style={{
                      border: '1px solid var(--border-light)',
                      borderRadius: 12,
                      padding: 12,
                      backgroundColor: 'var(--bg-card)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 8 }}>
                        <div
                          style={{
                            backgroundColor: 'var(--primary-light)',
                            color: 'var(--primary)',
                            padding: 6,
                            borderRadius: 8,
                            flexShrink: 0,
                          }}
                        >
                          <Tag size={15} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text)', lineHeight: 1.3 }}>{prod.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Mã sản phẩm: {prod.code}</div>
                        </div>
                      </div>

                      {/* Variant List / SKU List under product */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                        {prod.variants.map((variant) => {
                          const isLowStock = variant.stockQuantity <= variant.lowStockThreshold;
                          const isOutOfStock = variant.stockQuantity <= 0;
                          const varLabel = [variant.size, variant.color, variant.name].filter(Boolean).join(' / ') || 'Mặc định';

                          return (
                            <div
                              key={variant.id}
                              style={{
                                display: 'flex',
                                justifySelf: 'stretch',
                                alignItems: 'center',
                                gap: 6,
                                padding: '6px 8px',
                                borderRadius: 8,
                                border: '1px dashed var(--border)',
                                backgroundColor: isOutOfStock ? 'var(--bg-input)' : 'var(--bg-card)',
                                opacity: isOutOfStock ? 0.6 : 1,
                              }}
                            >
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }} className="truncate" title={varLabel}>
                                  {varLabel}
                                </div>
                                <div style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                                  {variant.sku}
                                </div>
                                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 2 }}>
                                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)' }}>
                                    {fmt(variant.price)}
                                  </span>
                                  <span style={{ fontSize: 10.5, color: isLowStock ? '#d97706' : 'var(--text-muted)' }}>
                                    {isOutOfStock ? 'Hết hàng' : `Kho: ${variant.stockQuantity}`}
                                    {isLowStock && !isOutOfStock && ' (Tồn thấp)'}
                                  </span>
                                </div>
                              </div>
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '4px 8px', minWidth: 0, height: 28, borderRadius: 6 }}
                                disabled={isOutOfStock}
                                onClick={() => dispatch({ type: 'add', product: prod, variant, onError: triggerToast })}
                              >
                                <Plus size={13} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Cart & Checkout Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Cart Items */}
          <div className="card" style={{ padding: 0 }}>
            <div
              style={{
                padding: '13px 16px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 14.5, display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShoppingCart size={16} />
                Giỏ hàng ({cart.items.length})
              </div>
              {cart.items.length > 0 && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ color: 'var(--danger)', borderColor: 'var(--danger-light)' }}
                  onClick={() => dispatch({ type: 'clear' })}
                >
                  Xóa sạch
                </button>
              )}
            </div>

            {cart.items.length === 0 ? (
              <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                Vui lòng chọn SKU sản phẩm ở danh sách bên trái
              </div>
            ) : (
              <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                {cart.items.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid var(--border-light)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }} className="truncate">
                        {item.productName}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.variantName}</div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 2 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{fmt(item.price)}</span>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>SKU: {item.sku}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ padding: 4, width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        onClick={() => dispatch({ type: 'qty', index: idx, delta: -1, onError: triggerToast })}
                      >
                        <Minus size={11} />
                      </button>
                      <span style={{ fontWeight: 800, fontSize: 13.5, width: 28, textAlign: 'center' }}>
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ padding: 4, width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        onClick={() => dispatch({ type: 'qty', index: idx, delta: 1, onError: triggerToast })}
                      >
                        <Plus size={11} />
                      </button>
                    </div>

                    <div style={{ fontWeight: 800, fontSize: 13, width: 75, textAlign: 'right', flexShrink: 0 }}>
                      {fmt(item.price * item.quantity)}
                    </div>

                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ padding: 5, color: 'var(--danger)', flexShrink: 0 }}
                      onClick={() => dispatch({ type: 'remove', index: idx })}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Checkout & Bill Form */}
          <div className="card" style={{ padding: 16 }}>
            <div className="card-title" style={{ marginBottom: 12, fontSize: 14.5 }}>
              Thông tin đơn &amp; Thanh toán
            </div>

            <div className="form-group">
              <label className="form-label">Tên khách hàng</label>
              <input
                className="form-control"
                placeholder="Mặc định: Khách lẻ POS"
                value={cart.customerName}
                onChange={(e) => dispatch({ type: 'set', field: 'customerName', value: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Số điện thoại</label>
              <input
                className="form-control"
                placeholder="Nhập SĐT nếu muốn tích điểm"
                value={cart.customerPhone}
                onChange={(e) => dispatch({ type: 'set', field: 'customerPhone', value: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Ghi chú đơn hàng</label>
              <input
                className="form-control"
                placeholder="Ghi chú nội bộ cho đơn..."
                value={cart.note}
                onChange={(e) => dispatch({ type: 'set', field: 'note', value: e.target.value })}
              />
            </div>

            {/* Discount Option */}
            <div className="form-group">
              <label className="form-label">Giảm giá trực tiếp (VND)</label>
              <input
                type="number"
                min="0"
                step="1000"
                className="form-control"
                placeholder="Giảm giá VNĐ"
                value={cart.discount || ''}
                onChange={(e) => dispatch({ type: 'set', field: 'discount', value: Math.max(0, Number(e.target.value)) })}
              />
            </div>

            {/* Payment Method Selector */}
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Phương thức thanh toán</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {[
                  { value: 'cash', label: 'Tiền mặt' },
                  { value: 'transfer', label: 'Chuyển khoản' },
                  { value: 'card', label: 'Quẹt thẻ' },
                ].map((method) => (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => dispatch({ type: 'set', field: 'paymentMethod', value: method.value })}
                    className={`btn btn-sm ${cart.paymentMethod === method.value ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: 11.5 }}
                  >
                    {method.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Financial Summary */}
            <div
              style={{
                backgroundColor: 'var(--bg-input)',
                borderRadius: 10,
                padding: 12,
                marginBottom: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-muted)' }}>
                <span>Tổng tiền hàng:</span>
                <span>{fmt(totalValue)}</span>
              </div>
              {Number(cart.discount) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--danger)' }}>
                  <span>Chiết khấu:</span>
                  <span>-{fmt(cart.discount)}</span>
                </div>
              )}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 15,
                  fontWeight: 900,
                  color: 'var(--primary)',
                  borderTop: '1px solid var(--border)',
                  paddingTop: 6,
                  marginTop: 4,
                }}
              >
                <span>Khách phải trả:</span>
                <span>{fmt(finalTotal)}</span>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              style={{ width: '100%', gap: 8, padding: '12px 16px', fontSize: 15 }}
              onClick={handleCheckout}
              disabled={submitting || cart.items.length === 0}
            >
              {submitting ? (
                <>
                  <RefreshCw size={15} style={{ animation: 'spin 0.8s linear infinite' }} />
                  Đang ghi nhận đơn...
                </>
              ) : (
                <>
                  <CreditCard size={15} />
                  Thanh toán và Giao hàng
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Success Modal & Thermo Receipt View */}
      {result && (
        <div
          className="no-print"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 16,
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: 460,
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            }}
          >
            {/* Header Success */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
              <div
                style={{
                  backgroundColor: 'var(--success-light)',
                  color: 'var(--success)',
                  padding: 8,
                  borderRadius: 10,
                }}
              >
                <CheckCircle size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--success)' }}>Thanh toán thành công</h3>
                <p style={{ margin: '2px 0 0 0', fontSize: 11.5, color: 'var(--text-muted)' }}>
                  Mã đơn: <span style={{ fontFamily: 'monospace', fontWeight: 800 }}>{result.code}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setResult(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Receipt Content for preview */}
            <div
              style={{
                backgroundColor: 'var(--bg-input)',
                borderRadius: 10,
                padding: 14,
                fontFamily: 'monospace',
                fontSize: 12.5,
                color: '#334155',
                maxHeight: 280,
                overflowY: 'auto',
                border: '1px solid var(--border)',
              }}
            >
              <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 14, marginBottom: 8 }}>
                HÓA ĐƠN BÁN HÀNG (POS)
              </div>
              <div style={{ textAlign: 'center', marginBottom: 12 }}>Hship.vn - UPOS Style</div>

              <div style={{ borderBottom: '1px dashed var(--border)', paddingBottom: 8, marginBottom: 8 }}>
                <div>Mã hóa đơn: {result.code}</div>
                <div>Thời gian: {new Date(result.createdAt).toLocaleString('vi-VN')}</div>
                <div>Khách hàng: {result.shippingName || 'Khách lẻ POS'}</div>
                <div>Điện thoại: {result.shippingPhone || 'POS'}</div>
              </div>

              {/* Items in receipt */}
              <div style={{ borderBottom: '1px dashed var(--border)', paddingBottom: 8, marginBottom: 8 }}>
                <div style={{ display: 'flex', fontWeight: 'bold', marginBottom: 4 }}>
                  <div style={{ flex: 1 }}>Tên SP</div>
                  <div style={{ width: 40, textAlign: 'center' }}>SL</div>
                  <div style={{ width: 80, textAlign: 'right' }}>Thành tiền</div>
                </div>
                {(result.items || []).map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', marginBottom: 4 }}>
                    <div style={{ flex: 1, minWidth: 0 }} className="truncate">
                      {item.name || item.productName}
                    </div>
                    <div style={{ width: 40, textAlign: 'center' }}>x{item.quantity}</div>
                    <div style={{ width: 80, textAlign: 'right' }}>{fmt(item.price * item.quantity)}</div>
                  </div>
                ))}
              </div>

              {/* Totals in receipt */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span>Tổng tiền hàng:</span>
                <span>{fmt(result.totalValue || result.codAmount)}</span>
              </div>
              {result.totalValue - result.codAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, color: 'var(--danger)' }}>
                  <span>Chiết khấu:</span>
                  <span>-{fmt(result.totalValue - result.codAmount)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderTop: '1px dashed var(--border)', paddingTop: 6, marginTop: 4 }}>
                <span>Thực thanh toán:</span>
                <span>{fmt(result.codAmount)}</span>
              </div>
              <div style={{ fontSize: 11, textAlign: 'center', marginTop: 14, color: 'var(--text-muted)' }}>
                Cảm ơn Quý khách hàng! Hẹn gặp lại!
              </div>
            </div>

            {/* Actions modal */}
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1, gap: 6 }}
                onClick={handlePrint}
              >
                <Printer size={15} /> In hóa đơn
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={() => setResult(null)}
              >
                Tiếp tục bán hàng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Secret Div Only Displayed During Web Page Print window.print() */}
      {result && (
        <div id="print-receipt-section" style={{ display: 'none' }}>
          <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '15px', margin: '0 0 5px 0' }}>
            HÓA ĐƠN THANH TOÁN
          </div>
          <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '13px', margin: '0 0 15px 0' }}>
            Hship.vn - BÁN TẠI QUẦY
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', marginBottom: '10px' }}>
            <tbody>
              <tr>
                <td style={{ padding: '2px 0' }}>Mã hóa đơn:</td>
                <td style={{ padding: '2px 0', textAlign: 'right', fontWeight: 'bold' }}>{result.code}</td>
              </tr>
              <tr>
                <td style={{ padding: '2px 0' }}>Ngày tạo:</td>
                <td style={{ padding: '2px 0', textAlign: 'right' }}>{new Date(result.createdAt).toLocaleString('vi-VN')}</td>
              </tr>
              <tr>
                <td style={{ padding: '2px 0' }}>Khách hàng:</td>
                <td style={{ padding: '2px 0', textAlign: 'right' }}>{result.shippingName || 'Khách lẻ POS'}</td>
              </tr>
              <tr>
                <td style={{ padding: '2px 0' }}>Số điện thoại:</td>
                <td style={{ padding: '2px 0', textAlign: 'right' }}>{result.shippingPhone || 'POS'}</td>
              </tr>
            </tbody>
          </table>

          <div style={{ borderBottom: '1px dashed #000', margin: '10px 0' }} />

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <thead>
              <tr style={{ borderBottom: '1px dashed #000' }}>
                <th style={{ textAlign: 'left', padding: '4px 0' }}>Sản phẩm</th>
                <th style={{ textAlign: 'center', padding: '4px 0', width: '30px' }}>SL</th>
                <th style={{ textAlign: 'right', padding: '4px 0', width: '80px' }}>T.Tiền</th>
              </tr>
            </thead>
            <tbody>
              {(result.items || []).map((item, idx) => (
                <tr key={idx}>
                  <td style={{ padding: '4px 0', wordBreak: 'break-all' }}>{item.name || item.productName}</td>
                  <td style={{ padding: '4px 0', textAlign: 'center' }}>{item.quantity}</td>
                  <td style={{ padding: '4px 0', textAlign: 'right' }}>{fmt(item.price * item.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ borderBottom: '1px dashed #000', margin: '10px 0' }} />

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', fontWeight: 'bold' }}>
            <tbody>
              <tr>
                <td style={{ padding: '2px 0', fontWeight: 'normal' }}>Tổng cộng:</td>
                <td style={{ padding: '2px 0', textAlign: 'right', fontWeight: 'normal' }}>{fmt(result.totalValue || result.codAmount)}</td>
              </tr>
              {result.totalValue - result.codAmount > 0 && (
                <tr>
                  <td style={{ padding: '2px 0', fontWeight: 'normal' }}>Chiết khấu:</td>
                  <td style={{ padding: '2px 0', textAlign: 'right', fontWeight: 'normal' }}>-{fmt(result.totalValue - result.codAmount)}</td>
                </tr>
              )}
              <tr style={{ fontSize: '13px' }}>
                <td style={{ padding: '4px 0' }}>Thực thu:</td>
                <td style={{ padding: '4px 0', textAlign: 'right' }}>{fmt(result.codAmount)}</td>
              </tr>
            </tbody>
          </table>

          <div style={{ borderBottom: '1px dashed #000', margin: '15px 0 10px 0' }} />

          <div style={{ textAlign: 'center', fontSize: '10px', fontStyle: 'italic', marginTop: '10px' }}>
            Xin cảm ơn quý khách hàng!<br />
            Hẹn gặp lại quý khách!
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/lib/toast-context';

const formatCurrency = (value) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value || 0);

const fallbackShippers = [
  { id: 'GHN', code: 'GHN', name: 'Giao Hàng Nhanh (GHN)', status: 'active' },
  { id: 'GHTK', code: 'GHTK', name: 'Giao Hàng Tiết Kiệm (GHTK)', status: 'active' },
  { id: 'JT', code: 'JT', name: 'J&T Express', status: 'active' },
  { id: 'SPX', code: 'SPX', name: 'Shopee Xpress (SPX)', status: 'active' },
];

function OrderForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [form, setForm] = useState({
    customerName: searchParams.get('customerName') || '',
    phone: '',
    address: '',
    shipperCode: 'GHN',
    codAmount: '',
    shippingFee: '',
    note: '',
    channel: searchParams.get('customerName') ? 'fanpage' : 'direct',
    products: [{ name: searchParams.get('product') || '', qty: 1, price: searchParams.get('price') || '' }],
    customerId: '',
  });
  const [saving, setSaving] = useState(false);
  const [savedCode, setSavedCode] = useState('');
  const [customers, setCustomers] = useState([]);
  const [shippers, setShippers] = useState(fallbackShippers);
  const [catalog, setCatalog] = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    Promise.all([
      fetch('/api/customers').then((res) => res.json()).catch(() => null),
      fetch('/api/shippers').then((res) => res.json()).catch(() => null),
      fetch('/api/products?status=active&limit=200&includeVariants=1').then((res) => res.json()).catch(() => null),
    ]).then(([customerJson, shipperJson, productJson]) => {
      if (customerJson?.success) setCustomers(customerJson.data || []);
      if (shipperJson?.success && shipperJson.data?.length) setShippers(shipperJson.data);
      if (productJson?.success) setCatalog(productJson.data?.items || []);
    });
  }, []);

  const catalogOptions = useMemo(() => catalog.flatMap((product) => (
    (product.variants || []).filter((variant) => variant.status !== 'inactive').map((variant) => {
      const variantLabel = [variant.size, variant.color, variant.name].filter(Boolean).join(' / ') || 'Mặc định';
      return {
        productId: product.id,
        productCode: product.code,
        productName: product.name,
        variantId: variant.id,
        variantName: variant.name || variantLabel,
        sku: variant.sku,
        size: variant.size || '',
        color: variant.color || '',
        price: Number(variant.price || 0),
        stockQuantity: Number(variant.stockQuantity || 0),
        lowStockThreshold: Number(variant.lowStockThreshold || 5),
        label: `${product.name} · ${variant.sku} · ${variantLabel}`,
      };
    })
  )), [catalog]);

  const blacklistWarning = useMemo(() => {
    const phone = form.phone.trim();
    if (!phone) return null;
    const matched = customers.find((customer) => customer.status === 'blacklist' && customer.phone === phone);
    return matched
      ? `Khách ${matched.name} đang nằm trong danh sách khách bom hàng. Lý do: ${matched.blacklistReason || 'Có lịch sử không nhận hàng'}.`
      : null;
  }, [form.phone, customers]);

  const filteredCustomers = useMemo(() => {
    const keyword = customerSearch.trim().toLowerCase();
    if (!keyword) return customers.slice(0, 8);
    return customers.filter((customer) =>
      customer.name.toLowerCase().includes(keyword) || customer.phone.includes(keyword)
    ).slice(0, 8);
  }, [customerSearch, customers]);

  const totalValue = useMemo(
    () => form.products.reduce((sum, item) => sum + (Number(item.qty || 0) * Number(item.price || 0)), 0),
    [form.products]
  );

  const selectedCod = form.codAmount !== '' ? Number(form.codAmount) : totalValue;

  const selectCustomer = (customer) => {
    setForm((current) => ({
      ...current,
      customerName: customer.name,
      phone: customer.phone,
      address: customer.address,
      customerId: customer.id,
    }));
    setCustomerSearch(`${customer.name} - ${customer.phone}`);
    setShowDropdown(false);
  };

  const addProduct = () => {
    setForm((current) => ({ ...current, products: [...current.products, { name: '', qty: 1, price: '', picker: '' }] }));
  };

  const removeProduct = (index) => {
    setForm((current) => ({ ...current, products: current.products.filter((_, itemIndex) => itemIndex !== index) }));
  };

  const updateProduct = (index, field, value) => {
    setForm((current) => ({
      ...current,
      products: current.products.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item),
    }));
  };

  const selectVariant = (index, option) => {
    setForm((current) => ({
      ...current,
      products: current.products.map((item, itemIndex) => itemIndex === index ? {
        ...item,
        picker: option.label,
        productId: option.productId,
        variantId: option.variantId,
        sku: option.sku,
        productCode: option.productCode,
        productName: option.productName,
        variantName: option.variantName,
        size: option.size,
        color: option.color,
        stockQuantity: option.stockQuantity,
        name: [option.productName, option.variantName].filter(Boolean).join(' - '),
        price: String(option.price),
      } : item),
    }));
  };

  const clearVariant = (index) => {
    setForm((current) => ({
      ...current,
      products: current.products.map((item, itemIndex) => itemIndex === index ? {
        name: item.name,
        qty: item.qty,
        price: item.price,
        picker: '',
      } : item),
    }));
  };

  const updatePicker = (index, value) => {
    setForm((current) => ({
      ...current,
      products: current.products.map((item, itemIndex) => {
        if (itemIndex !== index) return item;
        if (!item.variantId) return { ...item, picker: value };
        return {
          name: item.name,
          qty: item.qty,
          price: item.price,
          picker: value,
        };
      }),
    }));
  };

  const getPickerOptions = (keyword) => {
    const normalized = String(keyword || '').trim().toLowerCase();
    if (!normalized) return catalogOptions.slice(0, 8);
    return catalogOptions.filter((option) =>
      option.productName.toLowerCase().includes(normalized)
      || option.productCode.toLowerCase().includes(normalized)
      || option.sku.toLowerCase().includes(normalized)
      || option.label.toLowerCase().includes(normalized)
    ).slice(0, 8);
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.customerName.trim()) nextErrors.customerName = 'Vui lòng nhập tên người nhận.';
    if (!form.phone.trim()) nextErrors.phone = 'Vui lòng nhập số điện thoại.';
    if (!form.address.trim()) nextErrors.address = 'Vui lòng nhập địa chỉ giao hàng.';
    if (form.codAmount !== '' && Number(form.codAmount) < 0) nextErrors.codAmount = 'COD không được âm.';
    if (form.shippingFee !== '' && Number(form.shippingFee) < 0) nextErrors.shippingFee = 'Cước phí không được âm.';
    form.products.forEach((item, index) => {
      if (!item.name.trim()) nextErrors[`product_${index}`] = 'Tên sản phẩm là bắt buộc.';
      if (Number(item.qty) <= 0) nextErrors[`qty_${index}`] = 'Số lượng phải lớn hơn 0.';
      if (Number(item.price) < 0 || item.price === '') nextErrors[`price_${index}`] = 'Đơn giá không hợp lệ.';
      if (item.variantId && Number(item.qty) > Number(item.stockQuantity || 0)) {
        nextErrors[`stock_${index}`] = `SKU ${item.sku} chỉ còn ${item.stockQuantity || 0}, không đủ để tạo đơn.`;
      }
    });
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shippingName: form.customerName,
          shippingPhone: form.phone,
          shippingAddress: form.address,
          shipperCode: form.shipperCode,
          channel: form.channel,
          codAmount: selectedCod,
          shippingFee: form.shippingFee ? Number(form.shippingFee) : undefined,
          note: form.note,
          customerId: form.customerId || null,
          items: form.products.map((item) => ({
            name: item.name,
            quantity: Number(item.qty),
            unitPrice: Number(item.price),
            price: Number(item.price),
            productId: item.productId || null,
            variantId: item.variantId || null,
            sku: item.sku || null,
            productCode: item.productCode || null,
            productName: item.productName || item.name,
            variantName: item.variantName || null,
            size: item.size || null,
            color: item.color || null,
          })),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSavedCode(data.data.code);
        setTimeout(() => router.push('/customer/orders/manage'), 1200);
      } else {
        toast.error(data.error || 'Không thể tạo đơn hàng.');
        setErrors(data.errors || {});
      }
    } catch {
      toast.error('Không thể kết nối máy chủ.');
    } finally {
      setSaving(false);
    }
  };

  if (savedCode) {
    return (
      <div className="page-container" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card" style={{ textAlign: 'center', maxWidth: 420 }}>
          <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 8, color: '#047857' }}>Tạo đơn thành công</div>
          <div style={{ color: 'var(--text-muted)', marginBottom: 18 }}>Đang chuyển về trang quản lý đơn hàng.</div>
          <span className="badge status-delivered" style={{ fontSize: 14, padding: '8px 18px' }}>Mã đơn: {savedCode}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: 22 }}>
        <div>
          <div className="page-title">Tạo đơn giao hàng</div>
          <div className="page-subtitle">Shop nhập thông tin người nhận, sản phẩm, COD và đơn vị vận chuyển mock.</div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="card">
              <div className="card-title">Thông tin người nhận</div>
              <div className="card-subtitle">Có thể chọn khách đã có để tự điền SĐT và địa chỉ.</div>

              {blacklistWarning && (
                <div style={{ padding: '12px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#b91c1c', fontWeight: 600, marginBottom: 16 }}>
                  {blacklistWarning}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group" style={{ position: 'relative' }}>
                  <label className="form-label">Tìm khách hàng</label>
                  <input
                    className="form-control"
                    placeholder="Tìm theo tên hoặc SĐT..."
                    value={customerSearch}
                    onChange={(event) => { setCustomerSearch(event.target.value); setShowDropdown(true); }}
                    onFocus={() => setShowDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 180)}
                  />
                  {showDropdown && filteredCustomers.length > 0 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, marginTop: 4, maxHeight: 240, overflowY: 'auto', boxShadow: 'var(--shadow-md)' }}>
                      {filteredCustomers.map((customer) => (
                        <button
                          key={customer.id}
                          type="button"
                          onMouseDown={() => selectCustomer(customer)}
                          style={{ width: '100%', textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid var(--border)', background: 'transparent', cursor: 'pointer' }}
                        >
                          <div style={{ fontWeight: 700 }}>{customer.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{customer.phone} · {customer.status === 'blacklist' ? 'Khách bom hàng' : 'Khách thường'}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Số điện thoại *</label>
                  <input className="form-control" placeholder="0901234567" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value, customerId: '' }))} />
                  {errors.phone && <div style={{ color: '#b91c1c', fontSize: 12, marginTop: 4 }}>{errors.phone}</div>}
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Họ tên người nhận *</label>
                  <input className="form-control" placeholder="Nguyễn Văn A" value={form.customerName} onChange={(event) => setForm((current) => ({ ...current, customerName: event.target.value }))} />
                  {errors.customerName && <div style={{ color: '#b91c1c', fontSize: 12, marginTop: 4 }}>{errors.customerName}</div>}
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Địa chỉ giao hàng *</label>
                  <input className="form-control" placeholder="12 Nguyễn Huệ, Quận 1, TP.HCM" value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} />
                  {errors.address && <div style={{ color: '#b91c1c', fontSize: 12, marginTop: 4 }}>{errors.address}</div>}
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex-between" style={{ marginBottom: 16 }}>
                <div>
                  <div className="card-title">Thông tin sản phẩm</div>
                  <div className="card-subtitle" style={{ marginBottom: 0 }}>Chọn SKU từ kho để tự điền giá/tồn; vẫn hỗ trợ item tự do cho đơn ngoài catalog.</div>
                </div>
                <button type="button" className="btn btn-secondary btn-sm" onClick={addProduct}>Thêm sản phẩm</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {form.products.map((item, index) => (
                  <div key={index} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 12, background: 'var(--bg-input)' }}>
                    <div className="form-group" style={{ marginBottom: 10, position: 'relative' }}>
                      {index === 0 && <label className="form-label">Chọn SKU từ kho</label>}
                      <input
                        className="form-control"
                        placeholder="Tìm tên sản phẩm, mã hoặc SKU..."
                        value={item.picker || ''}
                        onChange={(event) => updatePicker(index, event.target.value)}
                      />
                      {item.picker !== undefined && !item.variantId && item.picker.trim() && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 15, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, marginTop: 4, maxHeight: 260, overflowY: 'auto', boxShadow: 'var(--shadow-md)' }}>
                          {getPickerOptions(item.picker).map((option) => (
                            <button
                              key={option.variantId}
                              type="button"
                              onMouseDown={() => selectVariant(index, option)}
                              style={{ width: '100%', textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid var(--border)', background: 'transparent', cursor: 'pointer' }}
                            >
                              <div style={{ fontWeight: 800 }}>{option.productName}</div>
                              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                {option.sku} · {option.size || '-'} / {option.color || '-'} · Tồn {option.stockQuantity} · {formatCurrency(option.price)}
                              </div>
                            </button>
                          ))}
                          {getPickerOptions(item.picker).length === 0 && (
                            <div style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: 13 }}>Không tìm thấy SKU phù hợp.</div>
                          )}
                        </div>
                      )}
                      {item.variantId && (
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 8 }}>
                          <span className="badge" style={{ background: '#ecfdf5', color: '#047857' }}>SKU {item.sku}</span>
                          <button type="button" className="btn btn-secondary btn-sm" onClick={() => clearVariant(index)}>Bỏ chọn</button>
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 140px 40px', gap: 10, alignItems: 'start' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      {index === 0 && <label className="form-label">Tên sản phẩm *</label>}
                      <input className="form-control" placeholder="Item tự do nếu không chọn SKU" value={item.name} disabled={Boolean(item.variantId)} onChange={(event) => updateProduct(index, 'name', event.target.value)} />
                      {errors[`product_${index}`] && <div style={{ color: '#b91c1c', fontSize: 12, marginTop: 4 }}>{errors[`product_${index}`]}</div>}
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      {index === 0 && <label className="form-label">SL *</label>}
                      <input className="form-control" type="number" min="1" value={item.qty} onChange={(event) => updateProduct(index, 'qty', event.target.value)} />
                      {errors[`qty_${index}`] && <div style={{ color: '#b91c1c', fontSize: 12, marginTop: 4 }}>{errors[`qty_${index}`]}</div>}
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      {index === 0 && <label className="form-label">Đơn giá *</label>}
                      <input className="form-control" type="number" min="0" placeholder="199000" value={item.price} disabled={Boolean(item.variantId)} onChange={(event) => updateProduct(index, 'price', event.target.value)} />
                      {errors[`price_${index}`] && <div style={{ color: '#b91c1c', fontSize: 12, marginTop: 4 }}>{errors[`price_${index}`]}</div>}
                    </div>
                    <div>
                      {index === 0 && <div style={{ height: 27 }} />}
                      {form.products.length > 1 && (
                        <button type="button" onClick={() => removeProduct(index)} className="btn btn-secondary btn-sm" style={{ width: 40, height: 38, padding: 0 }}>×</button>
                      )}
                    </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginTop: 10, color: 'var(--text-muted)', fontSize: 12 }}>
                      <span>
                        {item.variantId
                          ? `Tồn hiện tại: ${item.stockQuantity || 0}${item.size || item.color ? ` · ${[item.size, item.color].filter(Boolean).join(' / ')}` : ''}`
                          : 'Item tự do: không trừ tồn kho tự động.'}
                      </span>
                      <strong style={{ color: 'var(--text-primary)' }}>Thành tiền: {formatCurrency(Number(item.qty || 0) * Number(item.price || 0))}</strong>
                    </div>
                    {errors[`stock_${index}`] && <div style={{ color: '#b91c1c', fontSize: 12, marginTop: 6 }}>{errors[`stock_${index}`]}</div>}
                    {item.variantId && Number(item.qty || 0) > Number(item.stockQuantity || 0) && (
                      <div style={{ color: '#b91c1c', fontSize: 12, marginTop: 6 }}>Số lượng vượt tồn kho hiện tại. Vui lòng giảm số lượng trước khi tạo đơn.</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-title">Ghi chú nội bộ</div>
              <div className="card-subtitle">Dùng cho shop ghi yêu cầu giao hàng hoặc lưu ý từ khách.</div>
              <textarea className="form-control" rows={3} placeholder="Ví dụ: khách cần giao giờ hành chính..." value={form.note} onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="card">
              <div className="card-title">COD / cước phí</div>
              <div className="card-subtitle">Nếu bỏ trống COD, hệ thống dùng tổng giá trị hàng.</div>
              <div className="form-group">
                <label className="form-label">Số tiền COD</label>
                <input className="form-control" type="number" min="0" placeholder={`${totalValue || 0}`} value={form.codAmount} onChange={(event) => setForm((current) => ({ ...current, codAmount: event.target.value }))} />
                {errors.codAmount && <div style={{ color: '#b91c1c', fontSize: 12, marginTop: 4 }}>{errors.codAmount}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Cước phí dự kiến</label>
                <input className="form-control" type="number" min="0" placeholder="Carrier mock có thể tự tính" value={form.shippingFee} onChange={(event) => setForm((current) => ({ ...current, shippingFee: event.target.value }))} />
                {errors.shippingFee && <div style={{ color: '#b91c1c', fontSize: 12, marginTop: 4 }}>{errors.shippingFee}</div>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 14px', background: 'var(--bg-input)', borderRadius: 8 }}>
                <div className="flex-between"><span style={{ color: 'var(--text-muted)' }}>Giá trị hàng</span><strong>{formatCurrency(totalValue)}</strong></div>
                <div className="flex-between"><span style={{ color: 'var(--text-muted)' }}>COD thu hộ</span><strong>{formatCurrency(selectedCod)}</strong></div>
              </div>
            </div>

            <div className="card">
              <div className="card-title">Đơn vị vận chuyển</div>
              <div className="card-subtitle">Tất cả carrier đang chạy mock/sandbox cho bản demo.</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {shippers.map((shipper) => (
                  <label key={shipper.code} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', border: `1px solid ${form.shipperCode === shipper.code ? 'var(--primary)' : 'var(--border)'}`, borderRadius: 8, background: form.shipperCode === shipper.code ? 'rgba(37,99,235,0.06)' : 'var(--bg-input)', cursor: 'pointer' }}>
                    <input type="radio" name="shipper" value={shipper.code} checked={form.shipperCode === shipper.code} onChange={(event) => setForm((current) => ({ ...current, shipperCode: event.target.value }))} />
                    <div>
                      <div style={{ fontWeight: 700 }}>{shipper.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{shipper.status === 'active' ? 'Đã cấu hình/mock sẵn' : 'Chưa cấu hình hoặc đang tắt'}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-title">Kênh bán hàng</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                {[
                  { value: 'direct', label: 'Tạo trực tiếp trên web' },
                  { value: 'fanpage', label: 'Facebook Fanpage mock' },
                  { value: 'livestream', label: 'Facebook Livestream mock' },
                ].map((channel) => (
                  <label key={channel.value} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', border: `1px solid ${form.channel === channel.value ? 'var(--primary)' : 'var(--border)'}`, borderRadius: 8 }}>
                    <input type="radio" name="channel" value={channel.value} checked={form.channel === channel.value} onChange={(event) => setForm((current) => ({ ...current, channel: event.target.value }))} />
                    {channel.label}
                  </label>
                ))}
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center', height: 48 }} disabled={saving}>
              {saving ? 'Đang tạo đơn...' : 'Tạo đơn'}
            </button>
            <button type="button" className="btn btn-secondary" style={{ justifyContent: 'center' }} onClick={() => router.push('/customer/orders/manage')}>
              Hủy
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function CreateOrderPage() {
  return (
    <Suspense fallback={<div className="page-container">Đang tải form tạo đơn...</div>}>
      <OrderForm />
    </Suspense>
  );
}

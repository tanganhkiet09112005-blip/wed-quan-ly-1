'use client';
import { useState, useEffect } from 'react';
import { useToast } from '@/lib/toast-context';

export default function ShippersAdminPage() {
  const { toast } = useToast();
  const [shippers, setShippers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ apiKey: '', apiToken: '', status: 'active', codFeePercent: 0 });

  useEffect(() => {
    // In a real app, this would fetch from /api/admin/shippers
    // For now, mock data
    setShippers([
      { id: '1', code: 'GHN', name: 'Giao Hàng Nhanh (GHN)', status: 'active', apiKey: 'ghn_***', apiToken: 'token_***', codFeePercent: 0 },
      { id: '2', code: 'SPX', name: 'Shopee Xpress (SPX)', status: 'active', apiKey: 'spx_***', apiToken: '', codFeePercent: 1.5 },
      { id: '3', code: 'JT', name: 'J&T Express', status: 'inactive', apiKey: '', apiToken: '', codFeePercent: 1.0 },
    ]);
    setLoading(false);
  }, []);

  const handleEdit = (shipper) => {
    setEditingId(shipper.id);
    setEditForm({
      apiKey: shipper.apiKey || '',
      apiToken: shipper.apiToken || '',
      status: shipper.status,
      codFeePercent: shipper.codFeePercent,
    });
  };

  const handleSave = (id) => {
    setShippers(shippers.map(s => s.id === id ? { ...s, ...editForm } : s));
    setEditingId(null);
    toast.success('Đã lưu cấu hình thành công!');
  };

  if (loading) return <div className="page-container">Đang tải...</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <div className="page-title">Đơn vị vận chuyển</div>
          <div className="page-subtitle">Cấu hình kết nối API với các nhà cung cấp vận chuyển (GHN, SPX, J&T...)</div>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Mã ĐVVC</th>
                <th>Tên hiển thị</th>
                <th>API Key / Client ID</th>
                <th>API Token / Secret</th>
                <th>Phí thu hộ (COD)</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {shippers.map(shipper => (
                <tr key={shipper.id}>
                  <td><span className="badge" style={{ background: 'var(--bg-input)' }}>{shipper.code}</span></td>
                  <td style={{ fontWeight: 600 }}>{shipper.name}</td>
                  
                  {editingId === shipper.id ? (
                    <>
                      <td><input className="form-control" style={{ padding: '4px 8px', fontSize: 13 }} value={editForm.apiKey} onChange={e => setEditForm({...editForm, apiKey: e.target.value})} placeholder="API Key" /></td>
                      <td><input className="form-control" style={{ padding: '4px 8px', fontSize: 13 }} value={editForm.apiToken} onChange={e => setEditForm({...editForm, apiToken: e.target.value})} placeholder="Token" /></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <input type="number" step="0.1" className="form-control" style={{ padding: '4px 8px', fontSize: 13, width: 60 }} value={editForm.codFeePercent} onChange={e => setEditForm({...editForm, codFeePercent: parseFloat(e.target.value)})} /> %
                        </div>
                      </td>
                      <td>
                        <select className="form-control" style={{ padding: '4px 8px', fontSize: 13 }} value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})}>
                          <option value="active">Hoạt động</option>
                          <option value="inactive">Tạm ngưng</option>
                        </select>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-primary btn-sm" onClick={() => handleSave(shipper.id)}>Lưu</button>
                          <button className="btn btn-secondary btn-sm" onClick={() => setEditingId(null)}>Hủy</button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td><code style={{ fontSize: 12, color: 'var(--text-muted)' }}>{shipper.apiKey ? 'Cấu hình trong .env' : '—'}</code></td>
                      <td><code style={{ fontSize: 12, color: 'var(--text-muted)' }}>{shipper.apiToken ? 'Cấu hình trong .env' : '—'}</code></td>
                      <td>{shipper.codFeePercent}%</td>
                      <td>
                        {shipper.status === 'active' 
                          ? <span className="badge status-delivered">Hoạt động</span> 
                          : <span className="badge status-cancelled">Tạm ngưng</span>}
                      </td>
                      <td>
                        <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(shipper)}>Cấu hình</button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

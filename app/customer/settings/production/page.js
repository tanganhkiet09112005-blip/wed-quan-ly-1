'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';
import Link from 'next/link';
import { CheckCircle, AlertTriangle, RefreshCw, Box, ShoppingCart, Truck, FileText, Settings, Copy, Check, Users } from 'lucide-react';

function StatusBadge({ ready, text, sandbox }) {
  if (ready) {
    return <span className="badge status-delivered" style={{ display: 'flex', gap: 4, alignItems: 'center' }}><CheckCircle size={12} /> {text || 'Ready'}</span>;
  }
  if (sandbox) {
    return <span className="badge status-pending" style={{ display: 'flex', gap: 4, alignItems: 'center' }}><Box size={12} /> Sandbox Only</span>;
  }
  return <span className="badge status-cancelled" style={{ display: 'flex', gap: 4, alignItems: 'center' }}><AlertTriangle size={12} /> {text || 'Missing Credentials'}</span>;
}

export default function ProductionReadinessPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [shopRes, shippersRes, ecommerceRes] = await Promise.all([
        fetch(`/api/shops/${user.shopId}`).then(r => r.json()),
        fetch('/api/shippers').then(r => r.json()),
        fetch('/api/ecommerce/channels').then(r => r.json())
      ]);
      
      const shopData = shopRes.success ? shopRes.data : null;
      const shippersData = shippersRes.success ? shippersRes.data : [];
      const ecommerceData = ecommerceRes.success ? ecommerceRes.data : [];

      setData({
        shop: shopData?.shop,
        config: shopData?.config,
        shippers: shippersData,
        ecommerce: ecommerceData,
      });
    } catch {
      toast.error('Lỗi tải thông tin');
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (user) {
      const t = setTimeout(fetchData, 0);
      return () => clearTimeout(t);
    }
  }, [user, fetchData]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Đã copy Webhook URL');
    setTimeout(() => setCopied(false), 2000);
  };

  if (!user || loading || !data) {
    return (
      <div className="page-container" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text-muted)' }}><RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> Đang tải cấu hình...</div>
      </div>
    );
  }

  const { shop, config, shippers, ecommerce } = data;
  const isProfileReady = Boolean(shop?.email && shop?.phone);
  
  const jt = shippers.find(s => s.code === 'JT');
  // Check if JT is production ready (has eccompanyid etc. in masked JSON)
  const isJTReady = jt?.mode === 'production' && jt?.isConfigured;
  const ghn = shippers.find(s => s.code === 'GHN');
  const isGHNReady = ghn?.mode === 'production' && ghn?.isConfigured;
  
  const hasEcommerceReady = ecommerce.some(e => e.mode === 'production' && e.status === 'active');
  const isFacebookReady = config?.fbStatus === 'active' && config?.hasFbPageId;
  const isInvoiceReady = config?.misaStatus === 'active' && config?.hasMisaAppId;

  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <div className="page-title">Production Credential Center</div>
          <div className="page-subtitle">Quản lý và kiểm tra trạng thái sẵn sàng (Production-ready) của các module. Hệ thống yêu cầu API/Key thật để chạy live.</div>
        </div>
        <button type="button" className="btn btn-secondary" onClick={fetchData} disabled={loading}>
          <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Tải lại
        </button>
      </div>

      <div className="grid-2" style={{ gap: 20 }}>
        {/* A. Shop Profile */}
        <div className="card">
          <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Settings size={16} /> Shop Profile</span>
            <StatusBadge ready={isProfileReady} />
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
            Yêu cầu điền đầy đủ Tên shop, SĐT, Email và Địa chỉ kho để đồng bộ với đơn vị vận chuyển.
          </div>
          <Link href="/customer/profile" className="btn btn-secondary btn-sm">Cập nhật Profile</Link>
        </div>

        {/* B. Vận chuyển */}
        <div className="card">
          <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Truck size={16} /> Vận chuyển (Carrier APIs)</span>
            <StatusBadge ready={isJTReady || isGHNReady} text={isJTReady || isGHNReady ? 'Production Ready' : 'Chờ khách cấu hình'} />
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
            <strong>J&T Express:</strong> Yêu cầu <code>eccompanyid</code>, <code>customerid</code>, <code>key</code> và endpoints. <br/>
            <strong>GHN / GHTK:</strong> Yêu cầu Token API & Shop ID.
          </div>
          <div style={{ background: 'var(--bg-input)', padding: 12, borderRadius: 8, marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Webhook URL (Dùng cho J&T/GHN báo trạng thái):</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)' }}>
              <code style={{ fontSize: 11, flex: 1, wordBreak: 'break-all' }}>https://hship-management.vercel.app/api/webhooks/jt?secret=********</code>
              <button type="button" onClick={() => copyToClipboard('https://hship-management.vercel.app/api/webhooks/jt')} className="btn btn-secondary btn-sm" style={{ padding: 4 }}>
                {copied ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
              </button>
            </div>
          </div>
          <Link href="/customer/partners/shippers" className="btn btn-secondary btn-sm">Cấu hình Vận chuyển</Link>
        </div>

        {/* C. Sàn TMĐT */}
        <div className="card">
          <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><ShoppingCart size={16} /> Sàn TMĐT (Open Platform)</span>
            <StatusBadge ready={hasEcommerceReady} text={hasEcommerceReady ? 'Production Ready' : 'Pending Open Platform'} />
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
            Shopee / Lazada / TikTok: <br/>
            Khách cần tạo app và cấp quyền trên Open Platform của từng sàn. Yêu cầu nhập <code>App Key</code>, <code>App Secret</code>, <code>Access Token</code> vào hệ thống.
          </div>
          <Link href="/customer/channels/ecommerce" className="btn btn-secondary btn-sm">Kết nối Sàn</Link>
        </div>

        {/* D. Mạng xã hội */}
        <div className="card">
          <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Users size={16} /> Facebook / Fanpage</span>
            <StatusBadge ready={isFacebookReady} text={isFacebookReady ? 'Production Ready' : 'Pending Meta App'} />
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
            Fanpage / Livestream: <br/>
            Khách cần cấp <code>Page Token</code>, <code>App Secret</code> và setup Webhook trên giao diện lập trình viên Meta.
          </div>
          <Link href="/customer/channels/fanpage" className="btn btn-secondary btn-sm">Cấu hình Facebook</Link>
        </div>

        {/* E. Hóa đơn */}
        <div className="card">
          <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><FileText size={16} /> Hóa đơn điện tử</span>
            <StatusBadge ready={isInvoiceReady} text={isInvoiceReady ? 'Production Ready' : 'Pending MISA/VNPT'} />
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
            Hệ thống hóa đơn yêu cầu credentials tích hợp từ MISA SME hoặc VNPT Invoice. Không thể xuất hóa đơn thật nếu chưa có API Key hợp lệ.
          </div>
          <Link href="/customer/invoices" className="btn btn-secondary btn-sm">Cấu hình Hóa đơn</Link>
        </div>
      </div>
    </div>
  );
}

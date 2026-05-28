'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import {
  BarChart2,
  Bell,
  BookOpen,
  Box,
  Calendar,
  ChevronDown,
  ChevronRight,
  CreditCard,
  FileText,
  Grid,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Package,
  PackageCheck,
  PackageX,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Store,
  Tag,
  Truck,
  TruckIcon,
  Users,
  Video,
  Warehouse,
  Wrench,
  Zap,
} from 'lucide-react';

/* ─── Nav structure ─────────────────────────── */
const NAV_GROUPS = [
  {
    key: 'overview',
    section: 'Tổng quan',
    items: [
      { href: '/customer/dashboard', label: 'Tổng quan vận hành', icon: LayoutDashboard },
    ],
  },
  {
    key: 'operations',
    section: 'Đơn hàng & Sản phẩm',
    items: [
      { href: '/customer/products', label: 'Sản phẩm', icon: Tag },
      { href: '/customer/orders/manage', label: 'Đơn hàng', icon: Package },
      { href: '/customer/orders/delivery', label: 'Vận chuyển', icon: Truck },
      { href: '/customer/inventory', label: 'Kho', icon: Warehouse },
      { href: '/customer/partners/shippers', label: 'Đối tác', icon: TruckIcon },
      { href: '/customer/appointments', label: 'Lịch hẹn', icon: Calendar },
    ],
  },
  {
    key: 'channels',
    section: 'Kênh bán hàng',
    items: [
      { href: '/customer/channels/fanpage', label: 'Facebook Fanpage', icon: MessageCircle },
      { href: '/customer/channels/livestream', label: 'Livestream', icon: Video },
      { href: '/customer/channels/ecommerce', label: 'Sàn TMĐT', icon: ShoppingBag },
      { href: '/customer/channels/pos', label: 'Bán tại quầy (POS)', icon: Store },
    ],
  },
  {
    key: 'invoices',
    section: 'Hóa đơn điện tử',
    items: [
      { href: '/customer/invoices', label: 'Hóa đơn điện tử', icon: FileText },
    ],
  },
  {
    key: 'reports',
    section: 'Báo cáo & Kế toán',
    items: [
      { href: '/customer/accounting', label: 'Kế toán', icon: BookOpen },
      { href: '/customer/reports/cod', label: 'Quản lý COD', icon: CreditCard },
      { href: '/customer/reports', label: 'Báo cáo', icon: BarChart2 },
    ],
  },
  {
    key: 'tools',
    section: 'Công cụ bổ trợ',
    items: [
      { href: '/customer/tools', label: 'Công cụ bổ trợ', icon: Wrench },
      { href: '/customer/tools/bot-settings', label: 'Cài đặt Chatbot', icon: Zap },
    ],
  },
  {
    key: 'settings',
    section: 'Cài đặt',
    items: [
      { href: '/customer/settings', label: 'Cài đặt shop', icon: Settings },
      { href: '/customer/channels/settings', label: 'Tích hợp Facebook', icon: MessageCircle },
      { href: '/customer/clients', label: 'Khách hàng', icon: Users },
      { href: '/customer/clients/blacklist', label: 'Khách bom hàng', icon: BookOpen },
    ],
  },
];

/* Flatten all items for breadcrumb lookup */
const ALL_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

function isItemActive(pathname, href) {
  if (pathname === href) return true;
  if (href !== '/customer/dashboard' && pathname.startsWith(href + '/')) return true;
  if (href === '/customer/orders/manage' && /^\/customer\/orders\/[^/]+$/.test(pathname)) return true;
  if (href === '/customer/products' && pathname.startsWith('/customer/products/')) return true;
  if (href === '/customer/clients' && pathname.startsWith('/customer/clients/')) return true;
  return false;
}

/* ─── Collapsible nav group ─── */
function NavGroup({ group, pathname }) {
  const hasActive = group.items.some((item) => isItemActive(pathname, item.href));
  const [open, setOpen] = useState(hasActive || group.key === 'overview');

  useEffect(() => {
    if (hasActive) setOpen(true);
  }, [pathname, hasActive]);

  return (
    <div className="nav-section">
      <button
        type="button"
        className="nav-section-title"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor: 'pointer', background: 'none', border: 'none'
        }}
      >
        <span>{group.section}</span>
        {group.key !== 'overview' && (
          open
            ? <ChevronDown size={11} style={{ opacity: 0.5 }} />
            : <ChevronRight size={11} style={{ opacity: 0.5 }} />
        )}
      </button>

      {open && (
        <div style={{ animation: 'fadeIn 0.15s ease' }}>
          {group.items.map((item) => {
            const Icon = item.icon;
            const active = isItemActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item ${active ? 'active' : ''}`}
              >
                <Icon size={15} style={{ flexShrink: 0, opacity: active ? 1 : 0.65 }} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Main layout ─────────────────────────── */
export default function CustomerLayout({ children }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'customer')) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) return null;

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const currentPage = ALL_ITEMS.find((item) => isItemActive(pathname, item.href)) || { label: 'Shop Portal' };

  return (
    <div className="main-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">H</div>
          <div>
            <div className="logo-text">Hship.vn</div>
            <div className="logo-sub">{user.shop?.name || 'Shop Portal'}</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV_GROUPS.map((group) => (
            <NavGroup key={group.key} group={group} pathname={pathname} />
          ))}
        </nav>

        <div className="sidebar-footer">
          <button
            type="button"
            className="user-info"
            onClick={handleLogout}
            title="Đăng xuất"
          >
            <div className="avatar" style={{ background: 'linear-gradient(135deg, #2563eb, #0891b2)', fontSize: 13, width: 32, height: 32 }}>
              {user.name?.[0]?.toUpperCase() || 'S'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="user-name truncate">{user.name}</div>
              <div className="user-role">{user.shop?.code || 'Shop'}</div>
            </div>
            <LogOut size={13} style={{ color: '#94a3b8', flexShrink: 0 }} />
          </button>
        </div>
      </aside>

      {/* Topbar */}
      <header className="main-header">
        <div className="header-left">
          <div className="breadcrumb">
            <span style={{ color: '#64748b' }}>Shop Portal</span>
            <span style={{ color: '#334155', margin: '0 6px' }}>/</span>
            <span>{currentPage.label}</span>
          </div>
        </div>
        <div className="header-right">
          {user.shop?.name && (
            <div className="shop-badge">{user.shop.name}</div>
          )}
          <button type="button" className="header-btn" title="Thông báo">
            <Bell size={14} />
          </button>
          <button
            type="button"
            className="header-btn"
            onClick={handleLogout}
            title="Đăng xuất"
          >
            <LogOut size={14} />
            Đăng xuất
          </button>
        </div>
      </header>

      <main className="main-content animate-fade">{children}</main>
    </div>
  );
}

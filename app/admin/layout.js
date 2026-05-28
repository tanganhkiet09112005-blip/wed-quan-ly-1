'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

const navItems = [
  {
    section: 'QUẢN TRỊ NỀN TẢNG',
    items: [
      { href: '/admin/dashboard', label: 'Dashboard hệ thống', icon: '▣' },
      { href: '/admin/shops', label: 'Quản lý shop', icon: '◎' },
    ],
  },
];

export default function AdminLayout({ children }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) return null;

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const currentPage = navItems
    .flatMap((section) => section.items)
    .find((item) => pathname.startsWith(item.href)) || { label: 'Admin Portal' };

  return (
    <div className="main-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>H</div>
          <div>
            <div className="logo-text">Hship.vn</div>
            <div className="logo-sub">Admin Portal</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((section) => (
            <div className="nav-section" key={section.section}>
              <div className="nav-section-title">{section.section}</div>
              {section.items.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`nav-item ${isActive ? 'active' : ''}`}
                  >
                    <span style={{ fontSize: 14, opacity: isActive ? 1 : 0.7, width: 18, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button
            type="button"
            className="user-info"
            onClick={handleLogout}
            title="Đăng xuất"
          >
            <div className="avatar" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', fontSize: 13, width: 32, height: 32 }}>
              {user.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="user-name truncate">{user.name}</div>
              <div className="user-role">Quản trị nền tảng</div>
            </div>
            <span style={{ color: '#94a3b8', fontSize: 12 }}>Thoát</span>
          </button>
        </div>
      </aside>

      {/* Topbar — Dark Navy */}
      <header className="main-header">
        <div className="header-left">
          <div className="breadcrumb">
            Admin Portal<span style={{ color: '#334155', margin: '0 6px' }}>/</span>
            <span>{currentPage.label}</span>
          </div>
        </div>
        <div className="header-right">
          <button
            type="button"
            className="header-btn"
            onClick={handleLogout}
            title="Đăng xuất"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Đăng xuất
          </button>
        </div>
      </header>

      <main className="main-content animate-fade">{children}</main>
    </div>
  );
}

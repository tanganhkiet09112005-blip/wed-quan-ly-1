'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email.trim(), password);

    if (result.success) {
      if (result.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/customer/dashboard');
      }
    } else {
      setError(result.error || 'Đăng nhập thất bại');
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg-orb login-bg-orb-1" />
      <div className="login-bg-orb login-bg-orb-2" />

      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">H</div>
          <div>
            <div className="login-title">Hship.vn</div>
            <div className="login-subtitle">Hệ thống quản lý nội bộ</div>
          </div>
        </div>

        <form onSubmit={handleLogin}>
          {error && <div className="login-error">{error}</div>}

          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label">Email</label>
            <input
              id="email"
              type="email"
              className="form-control"
              placeholder="Nhập email đăng nhập"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group" style={{ marginBottom: 24 }}>
            <label className="form-label">Mật khẩu</label>
            <input
              id="password"
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full"
            style={{ justifyContent: 'center', height: 46, fontSize: 15 }}
            disabled={loading}
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        {process.env.NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS === 'true' && process.env.NODE_ENV !== 'production' && (
          <div className="login-demo">
            <div style={{ marginBottom: 8, fontWeight: 600, color: 'var(--text-secondary)' }}>Tài khoản demo:</div>
            <div style={{ fontSize: 13, lineHeight: 2 }}>
              <div>Admin: <code>admin@hship.vn</code> · <code>admin123</code></div>
              <div>Shop GenZ: <code>genz@hship.vn</code> · <code>shop123</code></div>
              <div>Shop Baby: <code>baby@hship.vn</code> · <code>shop123</code></div>
              <div>Shop Smart: <code>smart@hship.vn</code> · <code>shop123</code></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

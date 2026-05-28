import { AuthProvider } from '@/lib/auth-context';
import { ToastProvider } from '@/lib/toast-context';
import './globals.css';

export const metadata = {
  title: 'WEN - Hệ Thống Quản Lý Nội Bộ',
  description: 'Hệ thống quản lý đơn hàng, kênh bán hàng, kế toán và đối tác cho doanh nghiệp',
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

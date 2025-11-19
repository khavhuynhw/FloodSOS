import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SOS Cứu Trợ - Hệ Thống Yêu Cầu Cứu Trợ Khẩn Cấp',
  description: 'Gửi và quản lý yêu cầu cứu trợ khẩn cấp theo thời gian thực',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}


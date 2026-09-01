import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '우리나라 문화 탐험대',
  description: '우리나라의 멋과 지혜를 놀이로 만나는 유아 문화 교육 웹앱',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}

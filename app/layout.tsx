import type { Metadata } from 'next';
import './globals.css';

const siteUrl = 'https://koreaculture.vercel.app';
const previewImageUrl = `${siteUrl}/og.png`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: '우리나라 문화 탐험대',
  description: '우리나라의 멋과 지혜를 놀이로 만나는 유아 문화 교육 웹앱',
  alternates: { canonical: '/' },
  icons: { icon: '/favicon.png' },
  openGraph: {
    url: siteUrl,
    title: '우리나라 문화 탐험대',
    description: '우리나라의 멋과 지혜를 찾아 떠나요!',
    siteName: '우리나라 문화 탐험대',
    type: 'website',
    locale: 'ko_KR',
    images: [{ url: previewImageUrl, width: 1200, height: 630, alt: '우리나라 문화 탐험대' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '우리나라 문화 탐험대',
    description: '우리나라의 멋과 지혜를 찾아 떠나요!',
    images: [previewImageUrl],
  },
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

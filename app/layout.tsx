import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { PerformanceMonitoring } from '@/components/layout/PerformanceMonitoring';
import Header from '@/components/layout/header';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Colorific - Turn any photo into a coloring-book adventure',
  description: 'Let their imagination run wild. Instantly turn everyday pictures into magical coloring pages.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <PerformanceMonitoring />
        <Header />
        {children}
      </body>
    </html>
  );
}
import type { Metadata } from 'next';
import './globals.css';
import { KostProvider } from '../context/KostContext';

export const metadata: Metadata = {
  title: 'KostHub 8 - Sistem Kos 8 Pintu & Pembayaran QRIS',
  description:
    'Aplikasi manajemen kos-kosan 8 pintu modern dengan pembayaran QRIS, akses role pemilik/penghuni, dan laporan keuangan bulanan otomatis.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Outfit:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-slate-50 text-slate-900 antialiased selection:bg-emerald-600 selection:text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}

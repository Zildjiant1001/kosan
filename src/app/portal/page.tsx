import { Suspense } from 'react';
import PortalClient from './PortalClient';

export const metadata = {
  title: 'Portal Manajemen & Penghuni - KostHub 8',
  description: 'Portal internal pengelola kos dan penghuni untuk tagihan QRIS, tiket keluhan, dan okupansi kamar.',
};

export default function PortalPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-800 text-sm">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            <span>Memuat Portal Kos...</span>
          </div>
        </div>
      }
    >
      <PortalClient />
    </Suspense>
  );
}

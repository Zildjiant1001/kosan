import { Suspense } from 'react';
import { AuthPage } from '../../components/AuthPage';

export const metadata = {
  title: 'Masuk & Pendaftaran Akun - KostHub Enterprise',
  description: 'Pintu masuk resmi penghuni, mitra pemilik kos, dan Super Admin Enterprise.',
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white text-sm">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <span>Memuat Halaman Autentikasi...</span>
          </div>
        </div>
      }
    >
      <AuthPage />
    </Suspense>
  );
}

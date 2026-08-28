import { Suspense } from 'react';
import EnterpriseClient from './EnterpriseClient';

export const metadata = {
  title: 'Enterprise Management Portal - KostHub Super Admin',
  description: 'Pusat pengelolaan akun, approval sign up, direktori user, dan multi-properti kos enterprise.',
};

export default function EnterprisePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white text-sm">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <span>Memuat Enterprise Portal...</span>
          </div>
        </div>
      }
    >
      <EnterpriseClient />
    </Suspense>
  );
}

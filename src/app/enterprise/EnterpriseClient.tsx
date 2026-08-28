'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useKost } from '../../context/KostContext';
import { EnterprisePortalView } from '../../components/EnterprisePortalView';
import { UserRole } from '../../types';

export default function EnterpriseClient() {
  const router = useRouter();
  const { role, setRole, activeAppUser, logoutAppUser } = useKost();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isSuperAdmin = activeAppUser?.role === 'superadmin' || (!activeAppUser && role === 'superadmin');

  // Guard: Only Super Admin can access Enterprise Portal
  useEffect(() => {
    if (!mounted) return;
    if (activeAppUser && activeAppUser.role !== 'superadmin') {
      router.replace(`/portal?role=${activeAppUser.role}`);
    } else if (!activeAppUser && role !== 'superadmin') {
      router.replace(`/portal?role=${role}`);
    }
  }, [mounted, role, activeAppUser, router]);

  const handleGoToPortal = (targetRole: UserRole) => {
    setRole(targetRole);
    router.push(`/portal?role=${targetRole}`);
  };

  const handleGoToLanding = () => {
    router.push('/');
  };

  const handleLogout = () => {
    logoutAppUser();
    router.push('/login');
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // If user is not superadmin, show restricted access notice while redirecting
  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-3 max-w-md">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto">
            <span className="font-bold text-lg">!</span>
          </div>
          <h2 className="text-xl font-bold font-heading">Akses Khusus Super Admin</h2>
          <p className="text-xs text-slate-400">
            Halaman Enterprise hanya dapat diakses oleh Super Admin Enterprise. Mengalihkan ke Dashboard Anda...
          </p>
        </div>
      </div>
    );
  }

  return (
    <EnterprisePortalView
      onGoToPortal={handleGoToPortal}
      onGoToLanding={handleGoToLanding}
      onLogout={handleLogout}
    />
  );
}

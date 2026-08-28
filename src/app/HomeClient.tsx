'use client';

import React, { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useKost } from '../context/KostContext';
import { LandingPage } from '../components/LandingPage';
import { UserRole } from '../types';

export default function HomeClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setRole } = useKost();

  useEffect(() => {
    const action = searchParams.get('login');
    if (action) {
      router.push('/login');
    }
  }, [searchParams, router]);

  const handleEnterPortal = (targetRole?: UserRole) => {
    const role = targetRole || 'penghuni';
    setRole(role);
    router.push(`/portal?role=${role}`);
  };

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100">
      <LandingPage onEnterPortal={handleEnterPortal} />
    </main>
  );
}

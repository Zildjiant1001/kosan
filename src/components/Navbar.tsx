import React, { useState } from 'react';
import { useKost } from '../context/KostContext';
import {
  Building2,
  UserCheck,
  ShieldCheck,
  CreditCard,
  FileSpreadsheet,
  Receipt,
  Wrench,
  RotateCcw,
  Sparkles,
  Settings,
  Bell,
  Home,
  Users,
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenSettings: () => void;
  onOpenGoogleAuth: () => void;
  onGoToLanding: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenSettings,
  onOpenGoogleAuth,
  onGoToLanding,
}) => {
  const {
    role,
    setRole,
    selectedTenantRoomId,
    setSelectedTenantRoomId,
    rooms,
    bookings,
    invoices,
    tickets,
    settings,
    resetToDefaultData,
    currentUser,
    isCloudConnected,
  } = useKost();

  const pendingPaymentsCount = invoices.filter(
    i => i.status === 'menunggu_verifikasi'
  ).length;

  const pendingBookingsCount = bookings.filter(
    b => b.status === 'pending'
  ).length;

  const pendingTicketsCount = tickets.filter(t => t.status === 'menunggu' || t.status === 'diproses').length;
  const [showResetModal, setShowResetModal] = useState(false);

  return (
    <header id="main-header" className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 text-slate-900 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab(role === 'pemilik' ? 'dashboard' : 'tenant_home')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-sm text-white font-bold text-lg">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-slate-900 font-heading">
                  {settings.kostName}
                </span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  8 Pintu
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Sistem Manajemen Kos & Pembayaran QRIS Dinamis
              </p>
            </div>
          </div>

          {/* Center / Role Switcher Header */}
          <div className="flex items-center gap-1 sm:gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              id="btn-goto-landing"
              onClick={onGoToLanding}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-emerald-800 hover:bg-emerald-50 transition cursor-pointer"
              title="Lihat Landing Page Iklan & Informasi Umum"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Website Iklan</span>
            </button>

            <button
              id="role-btn-pemilik"
              onClick={() => {
                setRole('pemilik');
                setActiveTab('dashboard');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                role === 'pemilik'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Akun Pemilik</span>
              {pendingPaymentsCount > 0 && (
                <span className="ml-1 w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-extrabold flex items-center justify-center animate-pulse">
                  {pendingPaymentsCount}
                </span>
              )}
            </button>

            <button
              id="role-btn-penghuni"
              onClick={() => {
                setRole('penghuni');
                setActiveTab('tenant_home');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                role === 'penghuni'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Portal Penghuni</span>
            </button>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            {/* Google Authentication Trigger Button */}
            {currentUser ? (
              <button
                id="btn-google-user-profile"
                onClick={onOpenGoogleAuth}
                title={`Login sebagai ${currentUser.displayName || currentUser.email}`}
                className="flex items-center gap-2 bg-white hover:bg-slate-50 border border-emerald-200 shadow-2xs rounded-xl py-1 px-2.5 transition cursor-pointer group"
              >
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'Google Avatar'}
                    className="w-6 h-6 rounded-full border border-emerald-400 object-cover shrink-0"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'G'}
                  </div>
                )}
                <div className="text-left hidden lg:block">
                  <div className="text-[11px] font-bold text-slate-800 leading-tight truncate max-w-[100px]">
                    {currentUser.displayName ? currentUser.displayName.split(' ')[0] : 'Akun Google'}
                  </div>
                  <div className="text-[9px] text-emerald-600 font-semibold leading-none flex items-center gap-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                    Terhubung
                  </div>
                </div>
              </button>
            ) : (
              <button
                id="btn-google-auth-login"
                onClick={onOpenGoogleAuth}
                className="flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 shadow-2xs rounded-xl py-1.5 px-3 transition cursor-pointer text-xs font-bold text-slate-700"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span className="hidden sm:inline">Masuk Google</span>
              </button>
            )}

            {role === 'penghuni' ? (
              <div className="flex items-center gap-2 bg-white border border-slate-200 shadow-xs rounded-xl px-2.5 py-1">
                <span className="text-xs text-slate-500 font-medium hidden md:inline">Pilih Kamar:</span>
                <select
                  id="tenant-room-selector"
                  value={selectedTenantRoomId}
                  onChange={e => setSelectedTenantRoomId(Number(e.target.value))}
                  className="bg-slate-50 text-blue-700 text-xs font-semibold rounded-lg border border-slate-200 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  {rooms.map(room => (
                    <option key={room.id} value={room.id}>
                      {room.roomNumber} ({room.tenant ? room.tenant.name.split(' ')[0] : 'Kosong'})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <button
                id="btn-open-settings"
                onClick={onOpenSettings}
                title="Pengaturan Kos & QRIS"
                className="p-2 rounded-xl bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 shadow-xs transition cursor-pointer"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}

            <button
              id="btn-reset-demo"
              onClick={() => setShowResetModal(true)}
              title="Reset data demo ke awal"
              className="p-2 rounded-xl bg-white hover:bg-slate-50 text-slate-400 hover:text-amber-600 border border-slate-200 shadow-xs transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar for Owner */}
        {role === 'pemilik' && (
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-2.5 border-t border-slate-100 no-scrollbar">
            <button
              id="nav-tab-dashboard"
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>Kamar 8 Pintu</span>
            </button>

            <button
              id="nav-tab-tenants"
              onClick={() => setActiveTab('penyewa')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                activeTab === 'penyewa'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Data Penyewa & Booking</span>
              {pendingBookingsCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white font-bold text-[10px]">
                  {pendingBookingsCount}
                </span>
              )}
            </button>

            <button
              id="nav-tab-report"
              onClick={() => setActiveTab('laporan')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                activeTab === 'laporan'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-semibold text-emerald-800">Laporan Bulanan Online</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-100 text-emerald-800 font-bold">Khusus Pemilik</span>
            </button>

            <button
              id="nav-tab-payments"
              onClick={() => setActiveTab('pembayaran')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                activeTab === 'pembayaran'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Verifikasi QRIS & Tagihan</span>
              {pendingPaymentsCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white font-bold text-[10px]">
                  {pendingPaymentsCount} Baru
                </span>
              )}
            </button>

            <button
              id="nav-tab-expenses"
              onClick={() => setActiveTab('pengeluaran')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                activeTab === 'pengeluaran'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Catat Pengeluaran</span>
            </button>

            <button
              id="nav-tab-tickets"
              onClick={() => setActiveTab('keluhan')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                activeTab === 'keluhan'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Tiket Keluhan</span>
              {pendingTicketsCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold text-[10px]">
                  {pendingTicketsCount}
                </span>
              )}
            </button>
          </div>
        )}

        {/* Navigation Tabs Bar for Tenant */}
        {role === 'penghuni' && (
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-2.5 border-t border-slate-100 no-scrollbar">
            <button
              id="tenant-nav-tab-home"
              onClick={() => setActiveTab('tenant_home')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                activeTab === 'tenant_home'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Tagihan & Pembayaran QRIS</span>
            </button>

            <button
              id="tenant-nav-tab-complaint"
              onClick={() => setActiveTab('tenant_complaint')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                activeTab === 'tenant_complaint'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Lapor Keluhan Kamar</span>
            </button>

            <button
              id="tenant-nav-tab-rules"
              onClick={() => setActiveTab('tenant_rules')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                activeTab === 'tenant_rules'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tata Tertib & Fasilitas Kos</span>
            </button>
          </div>
        )}
      </div>

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm shadow-2xl p-5 space-y-3.5 text-xs text-slate-700 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <RotateCcw className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-center text-slate-900">Reset Data Demo Kos?</h4>
            <p className="text-center text-slate-500 text-xs leading-relaxed">
              Pengaturan kamar dan transaksi akan dikembalikan ke kondisi bawaan contoh.
            </p>
            <div className="pt-2 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  resetToDefaultData();
                  setShowResetModal(false);
                }}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-xs cursor-pointer"
              >
                Ya, Reset Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
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
  User,
  Shield,
  ChevronDown,
  ExternalLink,
  LogOut,
  SlidersHorizontal,
  Globe,
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
    users,
    branches,
    selectedBranchId,
    setSelectedBranchId,
    activeAppUser,
    logoutAppUser,
  } = useKost();

  const router = useRouter();

  const pendingPaymentsCount = invoices.filter(
    i => i.status === 'menunggu_verifikasi'
  ).length;

  const pendingBookingsCount = bookings.filter(
    b => b.status === 'pending'
  ).length;

  const pendingTicketsCount = tickets.filter(t => t.status === 'menunggu' || t.status === 'diproses').length;
  const pendingApprovalsCount = users.filter(u => u.status === 'pending_approval').length;
  const [showResetModal, setShowResetModal] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const isOwnerOrSuperAdmin = role === 'pemilik' || activeAppUser?.role === 'superadmin' || activeAppUser?.role === 'pemilik';

  return (
    <header id="main-header" className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 text-slate-900 shadow-xs w-full">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
          {/* Brand Logo & Name */}
          <div
            className="flex items-center gap-2 sm:gap-3 cursor-pointer select-none min-w-0"
            onClick={() => setActiveTab(role === 'pemilik' ? 'dashboard' : 'tenant_home')}
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-xs text-white font-bold text-base sm:text-lg hover:scale-105 transition-transform duration-200 shrink-0">
              <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 font-heading whitespace-nowrap">
                  Smart Kosan
                </span>
                <span className="hidden md:inline-flex px-2 py-0.5 text-[11px] font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                  {selectedBranchId === 'all' 
                    ? `Semua Cabang (${branches.length})` 
                    : (branches.find(b => b.id === selectedBranchId)?.code || `${rooms.length} Pintu`)}
                </span>
                {role === 'penghuni' && (
                  <span className="px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-[11px] font-bold rounded-full bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap">
                    K0{selectedTenantRoomId}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block leading-tight">
                smart system for property business
              </p>
            </div>
          </div>

          {/* Right Header Controls: Global Branch Selector + Unified Profile Dropdown */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Global Branch Selector (For Owner & Super Admin) */}
            {role === 'pemilik' && branches.length > 0 && (
              <div className="flex items-center gap-1 sm:gap-2 bg-slate-50 hover:bg-slate-100/90 border border-slate-200 hover:border-slate-300 rounded-xl sm:rounded-2xl px-2 sm:px-3 py-1 sm:py-1.5 shadow-2xs transition-all duration-150">
                <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-600 shrink-0" />
                <span className="text-xs text-slate-600 font-semibold hidden md:inline whitespace-nowrap">Cabang:</span>
                <select
                  id="global-navbar-branch-select"
                  value={selectedBranchId}
                  onChange={e => setSelectedBranchId(e.target.value)}
                  className="bg-transparent text-slate-800 text-[11px] sm:text-xs font-bold focus:outline-none cursor-pointer max-w-[100px] xs:max-w-[130px] sm:max-w-[200px] truncate"
                  title="Pilih Cabang Properti Global"
                >
                  <option value="all">🌟 Semua ({branches.length})</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Unified Profile & Status Badge with Dropdown */}
            <div className="relative z-50">
              <button
                type="button"
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center gap-1.5 sm:gap-2.5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 shadow-2xs rounded-xl sm:rounded-2xl py-1 sm:py-1.5 px-1.5 sm:px-3 transition-all duration-150 cursor-pointer group relative"
              >
                {/* Avatar Icon / Profile Photo */}
                <div className="relative shrink-0">
                  <img
                    src={
                      currentUser?.photoURL ||
                      activeAppUser?.avatarUrl ||
                      (role === 'pemilik'
                        ? 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
                        : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80')
                    }
                    alt={currentUser?.displayName || activeAppUser?.name || 'Profile'}
                    className="w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-lg sm:rounded-xl border border-emerald-400/80 object-cover shrink-0 shadow-2xs"
                  />
                  {/* Mobile notification dot */}
                  {(pendingPaymentsCount > 0 || pendingApprovalsCount > 0) && (
                    <span className="sm:hidden absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-500 text-white text-[9px] font-black flex items-center justify-center ring-2 ring-white animate-pulse">
                      {pendingPaymentsCount + pendingApprovalsCount}
                    </span>
                  )}
                </div>

                {/* Identity Details */}
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">
                    {currentUser?.displayName || activeAppUser?.name || (role === 'pemilik' ? 'Akun Pemilik' : 'Penghuni Kos')}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium leading-none flex items-center gap-1 mt-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${role === 'pemilik' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                    <span>{role === 'pemilik' ? 'Pengelola' : `Penghuni K0${selectedTenantRoomId}`}</span>
                  </div>
                </div>

                {/* Notification Badges inside Dropdown Trigger (Desktop) */}
                {(pendingPaymentsCount > 0 || pendingApprovalsCount > 0) && (
                  <span className="hidden sm:flex px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black items-center justify-center animate-pulse">
                    {pendingPaymentsCount + pendingApprovalsCount}
                  </span>
                )}

                <ChevronDown
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 group-hover:text-slate-600 transition-transform duration-200 ${
                    isProfileDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-60"
                    onClick={() => setIsProfileDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-2xl z-70 p-2 animate-in fade-in zoom-in-95 duration-150 space-y-1">
                    {/* Account Header Info */}
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 mb-1 flex items-center gap-2.5">
                      <img
                        src={
                          currentUser?.photoURL ||
                          activeAppUser?.avatarUrl ||
                          (role === 'pemilik'
                            ? 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
                            : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80')
                        }
                        alt={currentUser?.displayName || activeAppUser?.name || 'Profile'}
                        className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0 shadow-2xs"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-slate-800 truncate">
                          {currentUser?.displayName || activeAppUser?.name || (role === 'pemilik' ? 'Pemilik Kos Griya' : 'Penghuni Kos')}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate">
                          {currentUser?.email || activeAppUser?.email || settings.ownerEmail}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[10px] font-bold text-emerald-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>{isCloudConnected ? 'Cloud Online' : 'Lokal Mode'}</span>
                          <span className="text-slate-300">&bull;</span>
                          <span className="uppercase">{role}</span>
                        </div>
                      </div>
                    </div>

                    {/* Switch Section: Only Super Admin can switch to Enterprise */}
                    {activeAppUser?.role === 'superadmin' && (
                      <div className="p-1 rounded-xl bg-slate-100/80 border border-slate-200 flex items-center gap-1 mb-1">
                        <button
                          type="button"
                          onClick={() => {
                            setRole('pemilik');
                            setActiveTab('dashboard');
                            setIsProfileDropdownOpen(false);
                          }}
                          className={`flex-1 py-1 px-2 rounded-lg text-xs font-bold transition text-center ${
                            activeTab !== 'enterprise' && role === 'pemilik'
                              ? 'bg-emerald-600 text-white shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Pemilik
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            router.push('/enterprise');
                            setIsProfileDropdownOpen(false);
                          }}
                          className={`flex-1 py-1 px-2 rounded-lg text-xs font-bold transition text-center relative ${
                            activeTab === 'enterprise'
                              ? 'bg-amber-600 text-white shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <span>Enterprise</span>
                          {pendingApprovalsCount > 0 && (
                            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[9px] font-black">
                              {pendingApprovalsCount}
                            </span>
                          )}
                        </button>
                      </div>
                    )}

                    {/* Pengaturan Kos (Owner) */}
                    {role === 'pemilik' && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          onOpenSettings();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                      >
                        <Settings className="w-4 h-4 text-slate-500" />
                        <span>Pengaturan Kos & QRIS</span>
                      </button>
                    )}

                    {/* Reset Demo Data (Owner/Superadmin only) */}
                    {role !== 'penghuni' && activeAppUser?.role !== 'penghuni' && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          setShowResetModal(true);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-semibold text-slate-500 hover:text-amber-700 hover:bg-amber-50/50 transition cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4 text-slate-400" />
                        <span>Reset Data Demo Kos</span>
                      </button>
                    )}

                    {/* Direct Logout Option */}
                    <div className="my-1 border-t border-slate-100" />
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        logoutAppUser();
                        if (typeof window !== 'undefined') {
                          window.location.href = '/login';
                        }
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      <span>Keluar Akun (Logout)</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs Bar for Owner */}
        {role === 'pemilik' && (
          <div className="relative border-t border-slate-100/90 w-full overflow-hidden">
            <nav
              aria-label="Navigasi Pengelola"
              className="flex items-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 overflow-x-auto no-scrollbar scroll-smooth w-full px-0.5 sm:px-0 sm:flex-wrap"
            >
              <button
                id="nav-tab-dashboard"
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-300/80 shadow-2xs font-bold'
                    : 'bg-slate-100/60 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-transparent'
                }`}
              >
                <Home className="w-3.5 h-3.5 shrink-0" />
                <span>Halaman Utama</span>
              </button>

              <button
                id="nav-tab-tenants"
                onClick={() => setActiveTab('penyewa')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                  activeTab === 'penyewa'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-300/80 shadow-2xs font-bold'
                    : 'bg-slate-100/60 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-transparent'
                }`}
              >
                <Users className="w-3.5 h-3.5 shrink-0" />
                <span>Data Penyewa</span>
                {pendingBookingsCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white font-bold text-[10px]">
                    {pendingBookingsCount}
                  </span>
                )}
              </button>

              <button
                id="nav-tab-report"
                onClick={() => setActiveTab('laporan')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                  activeTab === 'laporan'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-300/80 shadow-2xs font-bold'
                    : 'bg-slate-100/60 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-transparent'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
                <span>Laporan Keuangan</span>
              </button>

              <button
                id="nav-tab-payments"
                onClick={() => setActiveTab('pembayaran')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                  activeTab === 'pembayaran'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-300/80 shadow-2xs font-bold'
                    : 'bg-slate-100/60 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-transparent'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5 shrink-0" />
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
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                  activeTab === 'pengeluaran'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-300/80 shadow-2xs font-bold'
                    : 'bg-slate-100/60 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-transparent'
                }`}
              >
                <Receipt className="w-3.5 h-3.5 shrink-0" />
                <span>Catat Pengeluaran</span>
              </button>

              <button
                id="nav-tab-tickets"
                onClick={() => setActiveTab('keluhan')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                  activeTab === 'keluhan'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-300/80 shadow-2xs font-bold'
                    : 'bg-slate-100/60 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-transparent'
                }`}
              >
                <Wrench className="w-3.5 h-3.5 shrink-0" />
                <span>Tiket Keluhan</span>
                {pendingTicketsCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold text-[10px]">
                    {pendingTicketsCount}
                  </span>
                )}
              </button>

              <button
                id="nav-tab-account-owner"
                onClick={() => setActiveTab('account')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                  activeTab === 'account'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-300/80 shadow-2xs font-bold'
                    : 'bg-slate-100/60 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-transparent'
                }`}
              >
                <User className="w-3.5 h-3.5 shrink-0" />
                <span>Pengaturan Akun</span>
              </button>
            </nav>
          </div>
        )}

        {/* Navigation Tabs Bar for Tenant */}
        {role === 'penghuni' && (
          <div className="relative border-t border-slate-100/90 w-full overflow-hidden">
            <nav
              aria-label="Navigasi Penghuni"
              className="flex items-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 overflow-x-auto no-scrollbar scroll-smooth w-full px-0.5 sm:px-0 sm:flex-wrap"
            >
              <button
                id="tenant-nav-tab-home"
                onClick={() => setActiveTab('tenant_home')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                  activeTab === 'tenant_home'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs font-bold'
                    : 'bg-slate-100/60 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-transparent'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5 shrink-0" />
                <span>Tagihan & QRIS</span>
              </button>

              <button
                id="tenant-nav-tab-complaint"
                onClick={() => setActiveTab('tenant_complaint')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                  activeTab === 'tenant_complaint'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs font-bold'
                    : 'bg-slate-100/60 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-transparent'
                }`}
              >
                <Wrench className="w-3.5 h-3.5 shrink-0" />
                <span>Lapor Keluhan</span>
              </button>

              <button
                id="tenant-nav-tab-rules"
                onClick={() => setActiveTab('tenant_rules')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                  activeTab === 'tenant_rules'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs font-bold'
                    : 'bg-slate-100/60 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-transparent'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>Tata Tertib & Fasilitas</span>
              </button>

              <button
                id="tenant-nav-tab-account"
                onClick={() => setActiveTab('account')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                  activeTab === 'account'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs font-bold'
                    : 'bg-slate-100/60 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-transparent'
                }`}
              >
                <User className="w-3.5 h-3.5 shrink-0" />
                <span>Profil & Akun</span>
              </button>
            </nav>
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

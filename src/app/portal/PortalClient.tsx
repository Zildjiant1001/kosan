'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useKost } from '../../context/KostContext';
import { Navbar } from '../../components/Navbar';
import { RoomGrid } from '../../components/RoomGrid';
import { RoomDetailModal } from '../../components/RoomDetailModal';
import { QRISPaymentModal } from '../../components/QRISPaymentModal';
import { ReceiptModal } from '../../components/ReceiptModal';
import { MonthlyReportView } from '../../components/MonthlyReportView';
import { PaymentManagementView } from '../../components/PaymentManagementView';
import { ExpenseManagementView } from '../../components/ExpenseManagementView';
import { MaintenanceTicketsView } from '../../components/MaintenanceTicketsView';
import { TenantManagementView } from '../../components/TenantManagementView';
import { TenantPortal } from '../../components/TenantPortal';
import { AccountManagementView } from '../../components/AccountManagementView';
import { EnterprisePortalView } from '../../components/EnterprisePortalView';
import { KostSettingsModal } from '../../components/KostSettingsModal';
import { GoogleAuthModal } from '../../components/GoogleAuthModal';
import { Room, Invoice, UserRole } from '../../types';
import { formatRupiah } from '../../utils/formatters';
import {
  Building2,
  TrendingUp,
  CreditCard,
  Users,
  ShieldCheck,
  Sparkles,
  QrCode,
  FileSpreadsheet,
  Plus,
  HelpCircle,
  CheckCircle2,
  Clock,
  Send,
  Shield,
  Receipt,
  AlertTriangle,
} from 'lucide-react';

export default function PortalClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    role,
    setRole,
    rooms,
    invoices,
    expenses,
    settings,
    branches,
    selectedBranchId,
    setSelectedBranchId,
    activeReportMonth,
    updateRoom,
    checkInTenant,
    checkOutTenant,
    submitTenantPayment,
    getMonthlySummary,
    logoutAppUser,
    activeAppUser,
  } = useKost();

  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  useEffect(() => {
    setIsMounted(true);
    // If logged in user is explicitly a tenant, strictly restrict to 'penghuni' views
    if (activeAppUser?.role === 'penghuni') {
      setRole('penghuni');
      const validTenantTabs = ['tenant_home', 'tenant_complaint', 'tenant_rules', 'account'];
      const tabParam = searchParams.get('tab');
      if (tabParam && validTenantTabs.includes(tabParam)) {
        setActiveTab(tabParam);
      } else {
        setActiveTab('tenant_home');
      }
      return;
    }

    const roleParam = searchParams.get('role') as UserRole;
    const tabParam = searchParams.get('tab');

    if (activeAppUser) {
      if (activeAppUser.role === 'superadmin') {
        setRole('pemilik');
        if (tabParam === 'enterprise') {
          setActiveTab('enterprise');
        } else {
          setActiveTab('dashboard');
        }
      } else {
        setRole(activeAppUser.role);
        setActiveTab(tabParam || 'dashboard');
      }
      return;
    }

    if (roleParam === 'pemilik' || roleParam === 'penghuni' || roleParam === 'superadmin') {
      if (roleParam === 'superadmin') {
        setRole('pemilik');
        setActiveTab('enterprise');
      } else {
        setRole(roleParam);
        if (roleParam === 'penghuni') {
          setActiveTab('tenant_home');
        } else if (tabParam === 'enterprise') {
          setActiveTab('enterprise');
        } else {
          setActiveTab('dashboard');
        }
      }
    } else if (tabParam === 'enterprise') {
      setRole('pemilik');
      setActiveTab('enterprise');
    }
  }, [searchParams, setRole, activeAppUser]);

  // Modal States
  const [selectedRoomForModal, setSelectedRoomForModal] = useState<Room | null>(null);
  const [activeInvoiceForQRIS, setActiveInvoiceForQRIS] = useState<Invoice | null>(null);
  const [activeInvoiceForReceipt, setActiveInvoiceForReceipt] = useState<Invoice | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isGoogleAuthOpen, setIsGoogleAuthOpen] = useState<boolean>(false);
  const [authDefaultRole, setAuthDefaultRole] = useState<UserRole>('pemilik');

  const summary = getMonthlySummary(activeReportMonth);

  const handleOpenRoomModal = (room: Room) => {
    setSelectedRoomForModal(room);
  };

  const handleOpenQRIS = (invoice: Invoice) => {
    setActiveInvoiceForQRIS(invoice);
  };

  const handleViewReceipt = (invoice: Invoice) => {
    setActiveInvoiceForReceipt(invoice);
  };

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-800 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <span>Memuat Portal Manajemen Kos...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-emerald-600 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenGoogleAuth={() => {
          setAuthDefaultRole(role);
          setIsGoogleAuthOpen(true);
        }}
        onGoToLanding={() => router.push('/')}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* ================= PEMILIK (OWNER) VIEWS ================= */}
        {role === 'pemilik' && (
          <>
            {/* View 1: 8 Pintu Dashboard */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6 animate-in fade-in duration-150">
                {/* Header Summary Banner */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 flex items-center gap-1.5 shadow-2xs">
                        <Building2 className="w-3.5 h-3.5" />
                        <span>
                          {selectedBranchId === 'all'
                            ? `🌟 Semua Cabang Terintegrasi (${branches.length} Cabang)`
                            : (branches.find(b => b.id === selectedBranchId)?.name || settings.kostName)}
                        </span>
                      </span>
                    </div>

                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-heading tracking-tight">
                      {selectedBranchId === 'all'
                        ? `Manajemen Portofolio: Seluruh Cabang Properti`
                        : `Manajemen Unit: ${branches.find(b => b.id === selectedBranchId)?.name || 'Kosan'}`}
                    </h1>

                    <p className="text-xs text-slate-500">
                      {selectedBranchId === 'all'
                        ? `Pantau okupansi ${rooms.length} kamar, perputaran keuangan dan operasional dari ${branches.length} cabang properti terdaftar.`
                        : `Lokasi: ${branches.find(b => b.id === selectedBranchId)?.address || '-'}, ${branches.find(b => b.id === selectedBranchId)?.city || '-'} • Pengelola: ${branches.find(b => b.id === selectedBranchId)?.managerName || '-'}`}
                    </p>
                  </div>
                </div>

                {/* 4 Synchronized Metric KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Card 1: Total Pemasukan */}
                  <div className="bg-white border border-slate-200/90 hover:border-emerald-300 p-4.5 rounded-2xl shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                        Pemasukan {activeReportMonth}
                      </span>
                      <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                        <CreditCard className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="text-xl sm:text-2xl font-black text-emerald-600 font-mono tracking-tight">
                        {formatRupiah(summary.totalIncome)}
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium mt-1 block">
                        {summary.paidInvoicesCount} dari {summary.occupancyCount > 0 ? summary.occupancyCount : rooms.length} kamar terisi lunas
                      </span>
                    </div>
                  </div>

                  {/* Card 2: Laba Bersih with Dynamic Warning Colors */}
                  {(() => {
                    const profitMargin = summary.totalIncome > 0
                      ? Math.round((summary.netProfit / summary.totalIncome) * 100)
                      : (summary.netProfit < 0 ? -100 : 0);
                    const isNegative = summary.netProfit < 0;
                    const isLowMargin = !isNegative && profitMargin <= 20;

                    return (
                      <div
                        className={`p-4.5 rounded-2xl shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between border ${isNegative
                            ? 'bg-rose-50/70 border-rose-300 hover:border-rose-400'
                            : isLowMargin
                              ? 'bg-amber-50/70 border-amber-300 hover:border-amber-400'
                              : 'bg-white border-slate-200/90 hover:border-teal-300'
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-[11px] font-bold uppercase tracking-wider ${isNegative ? 'text-rose-700' : isLowMargin ? 'text-amber-800' : 'text-slate-500'
                              }`}
                          >
                            Laba Bersih Kos
                          </span>
                          <div
                            className={`p-2 rounded-xl border ${isNegative
                                ? 'bg-rose-100 text-rose-700 border-rose-200'
                                : isLowMargin
                                  ? 'bg-amber-100 text-amber-700 border-amber-200'
                                  : 'bg-teal-50 text-teal-600 border border-teal-100'
                              }`}
                          >
                            <FileSpreadsheet className="w-4 h-4" />
                          </div>
                        </div>
                        <div className="mt-2">
                          <div
                            className={`text-xl sm:text-2xl font-black font-mono tracking-tight ${isNegative ? 'text-rose-600' : isLowMargin ? 'text-amber-700' : 'text-teal-700'
                              }`}
                          >
                            {formatRupiah(summary.netProfit)}
                          </div>
                          <div className="flex items-center justify-between mt-1 text-[11px]">
                            <span className={isNegative ? 'text-rose-700 font-semibold' : isLowMargin ? 'text-amber-800 font-semibold' : 'text-slate-500 font-medium'}>
                              Margin: {profitMargin}%
                            </span>
                            {isNegative && (
                              <span className="px-1.5 py-0.2 rounded bg-rose-200 text-rose-800 text-[10px] font-extrabold">
                                Defisit
                              </span>
                            )}
                            {isLowMargin && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 text-[10px] font-extrabold">
                                Margin Rendah
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Card 3: Okupansi Kamar */}
                  <div className="bg-white border border-slate-200/90 hover:border-blue-300 p-4.5 rounded-2xl shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                        Okupansi {summary.totalRooms || rooms.length} Kamar
                      </span>
                      <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                        <Building2 className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono tracking-tight">
                          {summary.occupancyCount} / {summary.totalRooms || rooms.length} Pintu
                        </span>
                        <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                          {summary.occupancyRate}%
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium mt-1 block">
                        {(summary.totalRooms || rooms.length) - summary.occupancyCount} kamar kosong siap huni
                      </span>
                    </div>
                  </div>

                  {/* Card 4: Total Belum Bayar / Terlambat */}
                  <div className="bg-white border border-slate-200/90 hover:border-amber-300 p-4.5 rounded-2xl shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                        Tunggakan / Belum Bayar
                      </span>
                      <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="text-xl sm:text-2xl font-black text-amber-700 font-mono tracking-tight">
                        {formatRupiah(summary.totalUnpaidAmount)}
                      </div>
                      <span className="text-[11px] text-amber-800 font-semibold mt-1 block">
                        {summary.unpaidOccupiedRoomsCount} dari {summary.occupancyCount} kamar terisi belum lunas
                      </span>
                    </div>
                  </div>
                </div>

                {/* 8-Door Interactive Room Grid */}
                <RoomGrid
                  onSelectRoom={handleOpenRoomModal}
                  onPayRoomQRIS={handleOpenQRIS}
                />
              </div>
            )}

            {/* View 2: Tenant CRM Management */}
            {activeTab === 'penyewa' && (
              <div className="animate-in fade-in duration-150">
                <TenantManagementView onOpenRoomModal={handleOpenRoomModal} />
              </div>
            )}

            {/* View 3: Payment Verification & Invoices */}
            {activeTab === 'pembayaran' && (
              <div className="animate-in fade-in duration-150">
                <PaymentManagementView
                  onOpenQRIS={handleOpenQRIS}
                  onViewReceipt={handleViewReceipt}
                />
              </div>
            )}

            {/* View 4: Monthly Financial Report */}
            {activeTab === 'laporan' && (
              <div className="animate-in fade-in duration-150">
                <MonthlyReportView
                  onViewReceipt={handleViewReceipt}
                  onOpenNewExpenseModal={() => setActiveTab('pengeluaran')}
                />
              </div>
            )}

            {/* View 5: Expense Tracker */}
            {activeTab === 'pengeluaran' && (
              <div className="animate-in fade-in duration-150">
                <ExpenseManagementView />
              </div>
            )}

            {/* View 6: Maintenance Tickets */}
            {activeTab === 'keluhan' && (
              <div className="animate-in fade-in duration-150">
                <MaintenanceTicketsView isTenantView={false} />
              </div>
            )}

            {/* View 7: Enterprise Portal & User Management (Only for Super Admin & Pemilik) */}
            {activeTab === 'enterprise' && (
              <div className="animate-in fade-in duration-150 -mx-4 sm:-mx-6 lg:-mx-8 -my-6">
                <EnterprisePortalView
                  hideHeader={true}
                  onGoToPortal={(r) => {
                    setRole(r);
                    if (r === 'penghuni') {
                      setActiveTab('tenant_home');
                    } else {
                      setActiveTab('dashboard');
                    }
                  }}
                  onGoToLanding={() => router.push('/')}
                  onLogout={() => {
                    logoutAppUser();
                    router.push('/login');
                  }}
                />
              </div>
            )}
          </>
        )}

        {/* ================= PENGHUNI (TENANT) VIEWS ================= */}
        {role === 'penghuni' && (
          <>
            {/* View 1: Tenant Home & QRIS Billing */}
            {activeTab === 'tenant_home' && (
              <div className="animate-in fade-in duration-150">
                <TenantPortal
                  onOpenQRIS={handleOpenQRIS}
                  onViewReceipt={handleViewReceipt}
                  onNavigateToComplaint={() => setActiveTab('tenant_complaint')}
                />
              </div>
            )}

            {/* View 2: Lapor Keluhan Kamar */}
            {activeTab === 'tenant_complaint' && (
              <div className="animate-in fade-in duration-150">
                <MaintenanceTicketsView isTenantView={true} />
              </div>
            )}

            {/* View 3: Rules & Facilities */}
            {activeTab === 'tenant_rules' && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs animate-in fade-in duration-150">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Informasi & Tata Tertib Penghuni</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-heading">
                    Pedoman Kenyamanan Bersama {settings.kostName}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Tata tertib disusun untuk kenyamanan, keamanan, dan kebersihan seluruh penghuni kos 8 pintu.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-3">
                    <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Aturan & Ketertiban Kos</span>
                    </h3>
                    <ul className="space-y-2.5 text-xs text-slate-700">
                      {settings.rules.map((rule, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="leading-relaxed">{rule}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-3">
                    <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-teal-600" />
                      <span>Informasi Penting & Kontak Darurat</span>
                    </h3>
                    <div className="space-y-3 text-xs">
                      <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                        <span className="text-slate-400 text-[10px] uppercase font-bold">WiFi Bersama</span>
                        <div className="font-bold text-slate-900 text-sm">{settings.wifiSsid}</div>
                        <div className="text-slate-600 text-xs font-mono">Password: {settings.wifiPass}</div>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                        <span className="text-slate-400 text-[10px] uppercase font-bold">Pengelola Kos</span>
                        <div className="font-bold text-slate-900">{settings.ownerName}</div>
                        <div className="text-slate-600">WhatsApp: +{settings.ownerPhone}</div>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                        <span className="text-slate-400 text-[10px] uppercase font-bold">Jatuh Tempo Sewa</span>
                        <div className="text-slate-700">
                          Setiap tanggal <strong>{settings.paymentDueDay}</strong> setiap bulannya.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ================= SHARED / ACCOUNT MANAGEMENT VIEW ================= */}
        {activeTab === 'account' && (
          <div className="animate-in fade-in duration-150">
            <AccountManagementView />
          </div>
        )}
      </main>

      {/* Global Modals */}
      {selectedRoomForModal && (
        <RoomDetailModal
          room={selectedRoomForModal}
          isOpen={!!selectedRoomForModal}
          onClose={() => setSelectedRoomForModal(null)}
          onUpdateRoom={updateRoom}
          onCheckIn={checkInTenant}
          onCheckOut={checkOutTenant}
        />
      )}

      {activeInvoiceForQRIS && (
        <QRISPaymentModal
          invoice={activeInvoiceForQRIS}
          settings={settings}
          isOpen={!!activeInvoiceForQRIS}
          onClose={() => setActiveInvoiceForQRIS(null)}
          onSubmitPayment={submitTenantPayment}
        />
      )}

      {activeInvoiceForReceipt && (
        <ReceiptModal
          invoice={activeInvoiceForReceipt}
          settings={settings}
          isOpen={!!activeInvoiceForReceipt}
          onClose={() => setActiveInvoiceForReceipt(null)}
        />
      )}

      <KostSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <GoogleAuthModal
        isOpen={isGoogleAuthOpen}
        defaultRole={authDefaultRole}
        onClose={() => setIsGoogleAuthOpen(false)}
        onSuccessRedirect={(targetRole) => {
          setRole(targetRole);
          if (targetRole === 'penghuni') {
            setActiveTab('tenant_home');
          } else {
            setActiveTab('dashboard');
          }
        }}
      />

      {/* Footer */}
      <footer className="no-print border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 {settings.kostName} &bull; Sistem Manajemen Kos 8 Pintu & Pembayaran QRIS</p>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-emerald-700 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>QRIS Standar Nasional Terintegrasi</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

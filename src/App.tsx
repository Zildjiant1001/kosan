'use client';

import React, { useState } from 'react';
import { KostProvider, useKost } from './context/KostContext';
import { Navbar } from './components/Navbar';
import { RoomGrid } from './components/RoomGrid';
import { RoomDetailModal } from './components/RoomDetailModal';
import { QRISPaymentModal } from './components/QRISPaymentModal';
import { ReceiptModal } from './components/ReceiptModal';
import { MonthlyReportView } from './components/MonthlyReportView';
import { PaymentManagementView } from './components/PaymentManagementView';
import { ExpenseManagementView } from './components/ExpenseManagementView';
import { MaintenanceTicketsView } from './components/MaintenanceTicketsView';
import { TenantManagementView } from './components/TenantManagementView';
import { TenantPortal } from './components/TenantPortal';
import { KostSettingsModal } from './components/KostSettingsModal';
import { GoogleAuthModal } from './components/GoogleAuthModal';
import { LandingPage } from './components/LandingPage';
import { Room, Invoice, Tenant, UserRole } from './types';
import { formatRupiah } from './utils/formatters';
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
} from 'lucide-react';

const MainKostApp: React.FC = () => {
  const {
    role,
    setRole,
    rooms,
    invoices,
    expenses,
    settings,
    activeReportMonth,
    updateRoom,
    checkInTenant,
    checkOutTenant,
    submitTenantPayment,
    getMonthlySummary,
  } = useKost();

  const [currentView, setCurrentView] = useState<'landing' | 'portal'>('landing');
  const [activeTab, setActiveTab] = useState<string>('dashboard');

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

  if (currentView === 'landing') {
    return (
      <>
        <LandingPage
          onEnterPortal={(targetRole) => {
            if (targetRole) {
              setRole(targetRole);
              if (targetRole === 'penghuni') {
                setActiveTab('tenant_home');
              } else {
                setActiveTab('dashboard');
              }
            }
            setCurrentView('portal');
          }}
          onOpenLoginModal={(targetRole) => {
            setAuthDefaultRole(targetRole || 'pemilik');
            setIsGoogleAuthOpen(true);
          }}
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
            setCurrentView('portal');
          }}
        />
      </>
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
        onGoToLanding={() => setCurrentView('landing')}
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
                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                        Dashboard Pengelola
                      </span>
                      <span className="text-xs text-slate-500">
                        Periode Aktif: <strong className="text-slate-800">{activeReportMonth}</strong>
                      </span>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 font-heading tracking-tight">
                      Manajemen Kosan 8 Pintu & QRIS
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Pantau okupansi 8 kamar, proses pembayaran QRIS penghuni, dan kelola operasional harian secara online.
                    </p>
                  </div>

                  {/* Fast Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setActiveTab('laporan')}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>Buka Laporan Keuangan</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('pembayaran')}
                      className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <CreditCard className="w-4 h-4 text-emerald-600" />
                      <span>Verifikasi Pembayaran</span>
                    </button>
                  </div>
                </div>

                {/* 4 Mini KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                  <div className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-xs hover:border-slate-300 transition">
                    <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Pemasukan Bulan Ini</span>
                    <div className="text-base sm:text-xl font-extrabold text-emerald-600 font-mono mt-1">
                      {formatRupiah(summary.totalIncome)}
                    </div>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      {summary.paidInvoicesCount} kamar telah lunas
                    </span>
                  </div>

                  <div className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-xs hover:border-slate-300 transition">
                    <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Laba Bersih Kos</span>
                    <div className="text-base sm:text-xl font-extrabold text-teal-700 font-mono mt-1">
                      {formatRupiah(summary.netProfit)}
                    </div>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      Setelah biaya operasional
                    </span>
                  </div>

                  <div className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-xs hover:border-slate-300 transition">
                    <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Okupansi Kamar</span>
                    <div className="text-base sm:text-xl font-extrabold text-slate-900 font-mono mt-1">
                      {summary.occupancyCount} / 8 Pintu
                    </div>
                    <span className="text-[10px] text-blue-600 mt-0.5 block font-bold">
                      {summary.occupancyRate}% Terisi
                    </span>
                  </div>

                  <div className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-xs hover:border-slate-300 transition">
                    <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Menunggu Verifikasi</span>
                    <div className="text-base sm:text-xl font-extrabold text-amber-600 font-mono mt-1">
                      {summary.pendingInvoicesCount} Tagihan
                    </div>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      QRIS / transfer masuk
                    </span>
                  </div>
                </div>

                {/* 8-Door Interactive Room Grid */}
                <RoomGrid
                  onSelectRoom={handleOpenRoomModal}
                  onPayRoomQRIS={handleOpenQRIS}
                />
              </div>
            )}

            {/* View 2: Database Penyewa & Permohonan Sewa */}
            {activeTab === 'penyewa' && (
              <div className="animate-in fade-in duration-150">
                <TenantManagementView onOpenRoomModal={handleOpenRoomModal} />
              </div>
            )}

            {/* View 3: Laporan Keuangan Online Khusus Pemilik */}
            {activeTab === 'laporan' && (
              <div className="animate-in fade-in duration-150">
                <MonthlyReportView
                  onViewReceipt={handleViewReceipt}
                  onOpenNewExpenseModal={() => setActiveTab('pengeluaran')}
                />
              </div>
            )}

            {/* View 3: Verifikasi QRIS & Pembayaran */}
            {activeTab === 'pembayaran' && (
              <div className="animate-in fade-in duration-150">
                <PaymentManagementView
                  onOpenQRIS={handleOpenQRIS}
                  onViewReceipt={handleViewReceipt}
                />
              </div>
            )}

            {/* View 4: Catat Pengeluaran */}
            {activeTab === 'pengeluaran' && (
              <div className="animate-in fade-in duration-150">
                <ExpenseManagementView />
              </div>
            )}

            {/* View 5: Tiket Keluhan */}
            {activeTab === 'keluhan' && (
              <div className="animate-in fade-in duration-150">
                <MaintenanceTicketsView isTenantView={false} />
              </div>
            )}
          </>
        )}

        {/* ================= PENGHUNI (TENANT) VIEWS ================= */}
        {role === 'penghuni' && (
          <>
            {/* Tenant Home & QRIS Billing */}
            {activeTab === 'tenant_home' && (
              <div className="animate-in fade-in duration-150">
                <TenantPortal
                  onOpenQRIS={handleOpenQRIS}
                  onViewReceipt={handleViewReceipt}
                  onNavigateToComplaint={() => setActiveTab('tenant_complaint')}
                />
              </div>
            )}

            {/* Tenant Complaints */}
            {activeTab === 'tenant_complaint' && (
              <div className="animate-in fade-in duration-150">
                <MaintenanceTicketsView isTenantView={true} />
              </div>
            )}

            {/* Tenant Rules */}
            {activeTab === 'tenant_rules' && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 animate-in fade-in duration-150 shadow-sm">
                <div className="border-b border-slate-200 pb-4">
                  <h2 className="text-xl font-extrabold text-slate-900 font-heading">
                    Tata Tertib, Fasilitas & Pedoman Bersama
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {settings.kostName} &bull; {settings.address}, {settings.city}
                  </p>
                </div>

                <div className="space-y-3">
                  {settings.rules.map((rule, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3.5"
                    >
                      <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-black shrink-0">
                        {idx + 1}
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed font-medium mt-0.5">{rule}</p>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-3">
                  <p>Butuh bantuan pengelola? WhatsApp: <strong className="text-emerald-700">{settings.ownerPhone}</strong></p>
                  <button
                    onClick={() => setActiveTab('tenant_home')}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-semibold self-start transition cursor-pointer"
                  >
                    Kembali ke Tagihan QRIS
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Global Modals */}
      <RoomDetailModal
        room={selectedRoomForModal}
        isOpen={!!selectedRoomForModal}
        onClose={() => setSelectedRoomForModal(null)}
        onUpdateRoom={updateRoom}
        onCheckIn={checkInTenant}
        onCheckOut={checkOutTenant}
      />

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
};

export default function App() {
  return (
    <KostProvider>
      <MainKostApp />
    </KostProvider>
  );
}

import React, { useState } from 'react';
import { useKost } from '../context/KostContext';
import { Invoice, Room } from '../types';
import { formatRupiah, formatIndonesianDate, formatIndonesianMonthYear } from '../utils/formatters';
import {
  CreditCard,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileText,
  Wifi,
  Copy,
  Phone,
  Building,
  ShieldCheck,
  Wrench,
  Sparkles,
  Info,
  Calendar,
  XCircle,
  RefreshCw,
} from 'lucide-react';

interface TenantPortalProps {
  onOpenQRIS: (invoice: Invoice) => void;
  onViewReceipt: (invoice: Invoice) => void;
  onNavigateToComplaint: () => void;
}

export const TenantPortal: React.FC<TenantPortalProps> = ({
  onOpenQRIS,
  onViewReceipt,
  onNavigateToComplaint,
}) => {
  const {
    selectedTenantRoomId,
    setSelectedTenantRoomId,
    rooms,
    allRooms,
    invoices,
    activeReportMonth,
    settings,
    activeAppUser,
    currentUser,
  } = useKost();

  const [copiedWifi, setCopiedWifi] = useState(false);

  const fallbackRoom: Room = {
    id: selectedTenantRoomId || 1,
    branchId: 'branch-01',
    roomNumber: `Kamar 0${selectedTenantRoomId || 1}`,
    floor: 1,
    type: 'Deluxe AC',
    size: '3.5 x 4 m',
    basePrice: 1750000,
    status: 'terisi',
    electricityType: 'token_mandiri',
    facilities: ['AC 1/2 PK', 'Kamar Mandi Dalam', 'WiFi 100Mbps'],
    description: 'Kamar siap huni',
    tenant: activeAppUser ? {
      id: activeAppUser.id,
      roomId: selectedTenantRoomId || 1,
      name: activeAppUser.name,
      phone: activeAppUser.phone,
      email: activeAppUser.email,
      identityNumber: '3201000000000000',
      occupation: 'Penyewa Terdaftar',
      checkInDate: new Date().toISOString().split('T')[0],
      contractDurationMonths: 12,
      emergencyContact: {
        name: 'Keluarga',
        relationship: 'Keluarga',
        phone: '081234567890',
      },
    } : undefined,
  };

  const currentRoom: Room = (rooms && rooms.find(r => r.id === selectedTenantRoomId)) || 
                           (allRooms && allRooms.find(r => r.id === selectedTenantRoomId)) || 
                           (rooms && rooms[0]) || 
                           (allRooms && allRooms[0]) || 
                           fallbackRoom;

  const foundInvoice = invoices.find(
    i => i.roomId === currentRoom.id && i.month === activeReportMonth
  );

  // Fallback invoice if not generated yet
  const currentInvoice: Invoice = foundInvoice || {
    id: `inv-${activeReportMonth.replace('-', '')}-K0${currentRoom.id}`,
    invoiceNumber: `INV/${activeReportMonth.replace('-', '')}/K0${currentRoom.id}`,
    roomId: currentRoom.id,
    roomNumber: currentRoom.roomNumber,
    tenantName: currentRoom.tenant?.name || activeAppUser?.name || 'Penghuni Kamar',
    tenantPhone: currentRoom.tenant?.phone || activeAppUser?.phone || '',
    month: activeReportMonth,
    baseAmount: currentRoom.basePrice,
    additionalFees: [{ id: `f-${currentRoom.id}`, name: 'Iuran Kebersihan & Sampah', amount: 25000 }],
    totalAmount: currentRoom.basePrice + 25000,
    dueDate: `${activeReportMonth}-05`,
    status: 'belum_bayar',
    notes: `Tagihan sewa kamar ${currentRoom.roomNumber} periode ${activeReportMonth}.`,
  };

  // All invoices for this room sorted by month descending
  const roomInvoices = invoices
    .filter(i => i.roomId === currentRoom.id)
    .sort((a, b) => b.month.localeCompare(a.month));

  const copyWifiPassword = () => {
    navigator.clipboard.writeText(settings.wifiPass);
    setCopiedWifi(true);
    setTimeout(() => setCopiedWifi(false), 2000);
  };

  // Date & Overdue Logic
  const todayStr = new Date().toISOString().split('T')[0];
  const dueDateStr = currentInvoice?.dueDate || `${activeReportMonth}-05`;
  const isOverdue = todayStr > dueDateStr;

  const isPaid = currentInvoice?.status === 'lunas';
  const isPending = currentInvoice?.status === 'menunggu_verifikasi';
  const isRejected = currentInvoice?.status === 'ditolak' || currentInvoice?.status === 'verifikasi_ditolak';
  const isUnpaid = (currentInvoice?.status === 'belum_bayar' || !currentInvoice) && !isRejected;

  return (
    <div id="tenant-portal-view" className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={
                currentRoom.tenant?.avatarUrl ||
                activeAppUser?.avatarUrl ||
                currentUser?.photoURL ||
                'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
              }
              alt={currentRoom.tenant?.name || 'Penghuni'}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500 shadow-sm shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-extrabold border border-emerald-200">
                  {currentRoom.roomNumber} &bull; Lantai {currentRoom.floor}
                </span>
                <span className="text-xs text-slate-500 font-medium">{currentRoom.type}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1 font-heading">
                Halo, {currentRoom.tenant ? currentRoom.tenant.name : 'Penghuni Kos'}! 👋
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Selamat datang di portal penghuni {settings.kostName}. Kelola pembayaran QRIS & informasi kamar Anda.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Billing Card: Payment via QRIS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Active Bill */}
        <div className={`bg-white border rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-6 lg:col-span-2 ${
          isRejected ? 'border-rose-300 ring-2 ring-rose-100' : 'border-slate-200'
        }`}>
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl border ${
                  isRejected 
                    ? 'bg-rose-50 text-rose-700 border-rose-200' 
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}>
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg text-slate-900 font-heading">
                    Tagihan Sewa Periode {formatIndonesianMonthYear(activeReportMonth)}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Batas Bayar:{' '}
                    <strong className={isOverdue && !isPaid ? 'text-rose-600 font-bold' : 'text-slate-800'}>
                      {formatIndonesianDate(dueDateStr)}
                    </strong>
                    {isOverdue && !isPaid && (
                      <span className="ml-2 text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                        (Melewati Batas Tgl {dueDateStr.split('-')[2]})
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div>
                {isPaid && (
                  <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-extrabold text-xs border border-emerald-200 inline-flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    LUNAS
                  </span>
                )}
                {isPending && (
                  <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 font-extrabold text-xs border border-amber-200 inline-flex items-center gap-1.5 animate-pulse">
                    <Clock className="w-4 h-4 text-amber-600" />
                    MENUNGGU VERIFIKASI
                  </span>
                )}
                {isRejected && (
                  <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 font-extrabold text-xs border border-rose-300 inline-flex items-center gap-1.5 animate-pulse">
                    <XCircle className="w-4 h-4 text-rose-600" />
                    VERIFIKASI DITOLAK
                  </span>
                )}
                {isUnpaid && (
                  <span className={`px-3 py-1 rounded-full font-extrabold text-xs border inline-flex items-center gap-1.5 ${
                    isOverdue 
                      ? 'bg-rose-100 text-rose-800 border-rose-300 animate-bounce' 
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}>
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    {isOverdue ? 'TERLAMBAT / BELUM DIBAYAR' : 'BELUM DIBAYAR'}
                  </span>
                )}
              </div>
            </div>

            {/* Rejection Notification Banner */}
            {isRejected && (
              <div className="mt-5 p-4 sm:p-5 rounded-2xl bg-rose-50/90 border-2 border-rose-300 text-rose-950 space-y-3 shadow-xs animate-in fade-in duration-300">
                <div className="flex items-center gap-2 text-rose-800 font-extrabold text-sm sm:text-base">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                  <span>Verifikasi Pembayaran Ditolak Pemilik Kos</span>
                </div>

                <div className="bg-white/95 p-3.5 rounded-xl border border-rose-200 space-y-1 shadow-2xs">
                  <div className="text-[11px] font-bold text-rose-700 uppercase tracking-wide flex items-center gap-1">
                    <span>Alasan Penolakan:</span>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-rose-900 leading-relaxed">
                    "{currentInvoice.rejectionReason || currentInvoice.notes || 'Bukti pembayaran tidak sesuai atau dana belum terverifikasi.'}"
                  </p>
                  {currentInvoice.rejectedAt && (
                    <span className="text-[10px] text-rose-600 block pt-1 font-mono">
                      Ditolak pada: {formatIndonesianDate(currentInvoice.rejectedAt.split(' ')[0])} {currentInvoice.rejectedAt.split(' ')[1] || ''}
                    </span>
                  )}
                </div>

                <p className="text-xs text-rose-800 font-medium leading-relaxed">
                  Silakan lakukan pembayaran ulang melalui QRIS di bawah ini dan pastikan mengunggah bukti transfer yang jelas dan nominal yang sesuai.
                </p>
              </div>
            )}

            {/* Amount Breakdown */}
            <div className="mt-5 bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="flex justify-between items-center text-xs text-slate-600">
                <span>Sewa Pokok Kamar ({currentRoom.roomNumber}):</span>
                <span className="font-mono font-semibold text-slate-900">{formatRupiah(currentRoom.basePrice)}</span>
              </div>

              {currentInvoice?.additionalFees.map(fee => (
                <div key={fee.id} className="flex justify-between items-center text-xs text-slate-600">
                  <span>{fee.name}:</span>
                  <span className="font-mono font-semibold text-slate-900">{formatRupiah(fee.amount)}</span>
                </div>
              ))}

              <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                <span className="text-sm font-bold text-slate-900">Total Tagihan:</span>
                <div className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono tracking-tight">
                  {formatRupiah(currentInvoice?.totalAmount || currentRoom.basePrice + 25000)}
                </div>
              </div>
            </div>
          </div>

          {/* Payment CTA Buttons */}
          <div className="pt-2">
            {/* If Rejected: Show Red Repayment CTA with QR Code icon */}
            {isRejected && currentInvoice && (
              <div className="space-y-3">
                <button
                  id="btn-tenant-repay-qris"
                  onClick={() => onOpenQRIS(currentInvoice)}
                  className="w-full py-4 px-6 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-3 shadow-md hover:shadow-lg transition cursor-pointer"
                >
                  <QrCode className="w-6 h-6" />
                  <span>Bayar Ulang dengan QRIS & Unggah Bukti Baru</span>
                </button>
                <p className="text-[11px] text-slate-500 text-center">
                  Setelah bukti baru diunggah, pengelola akan memverifikasi kembali status pembayaran Anda.
                </p>
              </div>
            )}

            {isUnpaid && currentInvoice && (
              <div className="space-y-3">
                <button
                  id="btn-tenant-pay-qris"
                  onClick={() => onOpenQRIS(currentInvoice)}
                  className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-3 shadow-xs transition cursor-pointer"
                >
                  <QrCode className="w-6 h-6" />
                  <span>Bayar Sekarang dengan QRIS (BCA, GoPay, DANA, dll)</span>
                </button>
                <p className="text-[11px] text-slate-500 text-center">
                  Pembayaran QRIS langsung terverifikasi dengan QR Code dinamis dan nominal presisi.
                </p>
              </div>
            )}

            {isPending && currentInvoice && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-800 space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>Bukti Pembayaran Sedang Diverifikasi</span>
                </div>
                <p>
                  Terima kasih! Bukti transfer/QRIS Anda telah kami terima dan sedang dikonfirmasi oleh Bapak/Ibu pengelola kos. Kuitansi resmi akan segera diterbitkan.
                </p>
              </div>
            )}

            {isPaid && currentInvoice && (
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => onViewReceipt(currentInvoice)}
                  className="flex-1 py-3 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>Lihat / Unduh Kuitansi Resmi LUNAS</span>
                </button>

                <button
                  onClick={onNavigateToComplaint}
                  className="py-3 px-5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 border border-slate-200 transition cursor-pointer"
                >
                  <Wrench className="w-4 h-4 text-blue-600" />
                  <span>Lapor Keluhan Kamar</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Quick Info & WiFi Credentials */}
        <div className="space-y-4">
          {/* WiFi Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-cyan-600">
              <Wifi className="w-5 h-5" />
              <h4 className="font-extrabold text-sm text-slate-900 font-heading">
                Koneksi WiFi 100Mbps Kos
              </h4>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">SSID / Nama WiFi:</span>
                <span className="font-mono font-bold text-slate-900">{settings.wifiSsid}</span>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <span className="text-slate-500">Password WiFi:</span>
                <span className="font-mono font-bold text-emerald-700">{settings.wifiPass}</span>
              </div>
            </div>

            <button
              onClick={copyWifiPassword}
              className="w-full py-2 px-3 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-700 text-xs font-semibold flex items-center justify-center gap-1.5 border border-cyan-200 transition cursor-pointer"
            >
              {copiedWifi ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Password Berhasil Disalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Password WiFi</span>
                </>
              )}
            </button>
          </div>

          {/* Owner Emergency Contact */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3 text-xs">
            <h4 className="font-extrabold text-sm text-slate-900 font-heading flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-600" />
              <span>Kontak Darurat Pengelola</span>
            </h4>
            <div className="text-slate-600 space-y-1">
              <p className="font-bold text-slate-900">{settings.ownerName}</p>
              <p className="text-slate-500">{settings.address}, {settings.city}</p>
            </div>
            <a
              href={`https://wa.me/${settings.ownerPhone.replace(/[^0-9]/g, '')}?text=Halo%20Bapak/Ibu%20Pengelola%20Kos%20Harmoni%208`}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold border border-emerald-200 transition cursor-pointer"
            >
              Chat WhatsApp Pengelola ({settings.ownerPhone})
            </a>
          </div>
        </div>
      </div>

      {/* Past Invoices & Payment History */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <h3 className="font-extrabold text-base text-slate-900 font-heading flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-600" />
          <span>Riwayat Pembayaran Sewa Kamar Ini</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider bg-slate-50">
                <th className="py-2.5 px-3 rounded-l-lg">Periode</th>
                <th className="py-2.5 px-3">Nomor Tagihan</th>
                <th className="py-2.5 px-3">Tanggal Bayar</th>
                <th className="py-2.5 px-3">Metode</th>
                <th className="py-2.5 px-3">Total (IDR)</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right rounded-r-lg">Kuitansi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {roomInvoices.length > 0 ? (
                roomInvoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {formatIndonesianMonthYear(inv.month)}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-500">{inv.invoiceNumber}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">
                      {inv.paidDate ? formatIndonesianDate(inv.paidDate) : '-'}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="uppercase text-[10px] font-bold text-slate-600">
                        {inv.paymentMethod ? (inv.paymentMethod === 'qris' ? 'QRIS' : 'Transfer') : '-'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                      {formatRupiah(inv.totalAmount)}
                    </td>
                    <td className="py-2.5 px-3">
                      {inv.status === 'lunas' && (
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-extrabold text-[10px]">
                          LUNAS
                        </span>
                      )}
                      {inv.status === 'menunggu_verifikasi' && (
                        <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-extrabold text-[10px] animate-pulse">
                          MENUNGGU KONFIRMASI
                        </span>
                      )}
                      {(inv.status === 'ditolak' || inv.status === 'verifikasi_ditolak') && (
                        <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300 font-extrabold text-[10px] inline-flex items-center gap-1">
                          <XCircle className="w-3 h-3 text-rose-600" />
                          DITOLAK
                        </span>
                      )}
                      {inv.status === 'belum_bayar' && (
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-extrabold text-[10px]">
                          BELUM BAYAR
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {inv.status === 'lunas' ? (
                        <button
                          onClick={() => onViewReceipt(inv)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[11px] font-bold transition cursor-pointer"
                        >
                          Buka Kuitansi
                        </button>
                      ) : (inv.status === 'ditolak' || inv.status === 'verifikasi_ditolak') ? (
                        <button
                          onClick={() => onOpenQRIS(inv)}
                          className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold transition cursor-pointer inline-flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Bayar Ulang</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => onOpenQRIS(inv)}
                          className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-bold transition cursor-pointer inline-flex items-center gap-1"
                        >
                          <QrCode className="w-3 h-3" />
                          <span>Bayar QRIS</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400 italic">
                    Belum ada riwayat pembayaran sewa recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rules and Guidelines */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-3">
        <h3 className="font-extrabold text-base text-slate-900 font-heading flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Tata Tertib & Peraturan Bersama Kos</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs text-slate-600">
          {settings.rules.map((rule, idx) => (
            <div key={idx} className="flex items-start gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200/70">
              <span className="w-5 h-5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <p className="leading-relaxed">{rule}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

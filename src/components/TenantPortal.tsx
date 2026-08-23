import React, { useState } from 'react';
import { useKost } from '../context/KostContext';
import { Invoice } from '../types';
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
    invoices,
    activeReportMonth,
    settings,
  } = useKost();

  const [copiedWifi, setCopiedWifi] = useState(false);

  const currentRoom = rooms.find(r => r.id === selectedTenantRoomId) || rooms[0];
  const currentInvoice = invoices.find(
    i => i.roomId === currentRoom.id && i.month === activeReportMonth
  );

  // Past invoices for this room
  const pastInvoices = invoices.filter(
    i => i.roomId === currentRoom.id && i.month !== activeReportMonth
  );

  const copyWifiPassword = () => {
    navigator.clipboard.writeText(settings.wifiPass);
    setCopiedWifi(true);
    setTimeout(() => setCopiedWifi(false), 2000);
  };

  const isPaid = currentInvoice?.status === 'lunas';
  const isPending = currentInvoice?.status === 'menunggu_verifikasi';
  const isUnpaid = currentInvoice?.status === 'belum_bayar' || !currentInvoice;

  return (
    <div id="tenant-portal-view" className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {currentRoom.tenant?.avatarUrl ? (
              <img
                src={currentRoom.tenant.avatarUrl}
                alt={currentRoom.tenant.name}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500 shadow-sm shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-2xl border border-emerald-200 shrink-0">
                {currentRoom.tenant ? currentRoom.tenant.name[0] : '🏠'}
              </div>
            )}
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

          {/* Quick Room Switcher for Demo */}
          <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200 text-xs shrink-0 shadow-2xs">
            <span className="text-slate-500 block text-[11px] mb-1 font-medium">Ganti Akun Kamar (Demo):</span>
            <select
              value={selectedTenantRoomId}
              onChange={e => setSelectedTenantRoomId(Number(e.target.value))}
              className="bg-white text-emerald-700 font-bold rounded-xl px-3 py-1.5 border border-slate-200 focus:outline-none cursor-pointer w-full shadow-2xs"
            >
              {rooms.map(r => (
                <option key={r.id} value={r.id}>
                  {r.roomNumber} ({r.tenant ? r.tenant.name.split(' ')[0] : 'Kosong'})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Billing Card: Payment via QRIS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Active Bill */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg text-slate-900 font-heading">
                    Tagihan Sewa Periode {formatIndonesianMonthYear(activeReportMonth)}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Jatuh Tempo:{' '}
                    <strong className="text-slate-800">
                      {formatIndonesianDate(currentInvoice?.dueDate || `${activeReportMonth}-05`)}
                    </strong>
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div>
                {isPaid && (
                  <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-extrabold text-xs border border-emerald-200 inline-flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    LUNAS
                  </span>
                )}
                {isPending && (
                  <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 font-extrabold text-xs border border-amber-200 inline-flex items-center gap-1.5 animate-pulse">
                    <Clock className="w-4 h-4" />
                    MENUNGGU VERIFIKASI
                  </span>
                )}
                {isUnpaid && (
                  <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-700 font-extrabold text-xs border border-rose-200 inline-flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    BELUM DIBAYAR
                  </span>
                )}
              </div>
            </div>

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
              {pastInvoices.length > 0 ? (
                pastInvoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {formatIndonesianMonthYear(inv.month)}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-500">{inv.invoiceNumber}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">
                      {formatIndonesianDate(inv.paidDate || inv.dueDate)}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="uppercase text-[10px] font-bold text-slate-600">
                        {inv.paymentMethod || 'QRIS'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-700">
                      {formatRupiah(inv.totalAmount)}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px]">
                        LUNAS
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => onViewReceipt(inv)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition cursor-pointer"
                      >
                        Buka Kuitansi
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400 italic">
                    Belum ada riwayat pembayaran bulan lampau.
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

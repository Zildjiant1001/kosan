import React, { useState } from 'react';
import { useKost } from '../context/KostContext';
import { Invoice } from '../types';
import { MonthPickerPopover } from './MonthPickerPopover';
import {
  formatRupiah,
  formatIndonesianDate,
  formatIndonesianMonthYear,
  generateWhatsAppReminderUrl,
} from '../utils/formatters';
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  FileText,
  Eye,
  Plus,
  Filter,
  Search,
  Building,
  Building2,
  Calendar,
  QrCode,
  AlertTriangle,
} from 'lucide-react';

interface PaymentManagementViewProps {
  onOpenQRIS: (invoice: Invoice) => void;
  onViewReceipt: (invoice: Invoice) => void;
}

export const PaymentManagementView: React.FC<PaymentManagementViewProps> = ({
  onOpenQRIS,
  onViewReceipt,
}) => {
  const {
    invoices,
    activeReportMonth,
    setActiveReportMonth,
    availableMonths,
    verifyPayment,
    addInvoice,
    rooms,
    settings,
    branches,
    selectedBranchId,
  } = useKost();

  const [activeFilter, setActiveFilter] = useState<'all' | 'menunggu_verifikasi' | 'belum_bayar' | 'lunas' | 'ditolak'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProofImage, setSelectedProofImage] = useState<string | null>(null);

  // Rejection Modal State
  const [rejectModalInvoice, setRejectModalInvoice] = useState<Invoice | null>(null);
  const [selectedReasonPreset, setSelectedReasonPreset] = useState<string>(
    'Bukti transfer buram, terpotong, atau tidak terbaca dengan jelas'
  );
  const [customReasonText, setCustomReasonText] = useState<string>('');

  const PRESET_REJECTION_REASONS = [
    'Bukti transfer buram, terpotong, atau tidak terbaca dengan jelas',
    'Nominal transfer tidak sesuai dengan total tagihan sewa',
    'Nomor rekening tujuan salah / bukan rekening resmi kos',
    'Mutasi / dana belum masuk ke rekening bank atau QRIS pengelola',
    'Bukti transfer terindikasi kadaluarsa atau duplikat',
    'Lainnya (Tulis alasan khusus)',
  ];

  const todayStr = new Date().toISOString().split('T')[0];

  // New Invoice Modal state
  const [isAddInvoiceOpen, setIsAddInvoiceOpen] = useState(false);
  const [newInvRoomId, setNewInvRoomId] = useState(1);
  const [newInvMonth, setNewInvMonth] = useState(activeReportMonth);
  const [newInvExtraName, setNewInvExtraName] = useState('Iuran Kebersihan & Sampah');
  const [newInvExtraAmount, setNewInvExtraAmount] = useState(25000);

  const filteredInvoices = invoices.filter(inv => {
    if (inv.month !== activeReportMonth) return false;
    if (activeFilter === 'ditolak') {
      if (inv.status !== 'ditolak' && inv.status !== 'verifikasi_ditolak') return false;
    } else if (activeFilter !== 'all' && inv.status !== activeFilter) {
      return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        inv.roomNumber.toLowerCase().includes(q) ||
        inv.tenantName.toLowerCase().includes(q) ||
        inv.invoiceNumber.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const pendingCount = invoices.filter(
    i => i.month === activeReportMonth && i.status === 'menunggu_verifikasi'
  ).length;

  const rejectedCount = invoices.filter(
    i => i.month === activeReportMonth && (i.status === 'ditolak' || i.status === 'verifikasi_ditolak')
  ).length;

  const handleConfirmRejection = () => {
    if (!rejectModalInvoice) return;
    const finalReason =
      selectedReasonPreset === 'Lainnya (Tulis alasan khusus)'
        ? customReasonText.trim() || 'Bukti transfer tidak sesuai/valid'
        : selectedReasonPreset + (customReasonText.trim() ? ` - ${customReasonText.trim()}` : '');

    verifyPayment(
      rejectModalInvoice.id,
      'ditolak',
      `Penolakan: ${finalReason}`,
      finalReason
    );

    setRejectModalInvoice(null);
    setCustomReasonText('');
    setSelectedReasonPreset('Bukti transfer buram, terpotong, atau tidak terbaca dengan jelas');
  };

  const handleCreateNewInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const room = rooms.find(r => r.id === Number(newInvRoomId));
    if (!room) return;

    addInvoice({
      roomId: room.id,
      roomNumber: room.roomNumber,
      tenantName: room.tenant?.name || 'Penghuni ' + room.roomNumber,
      tenantPhone: room.tenant?.phone,
      month: newInvMonth,
      baseAmount: room.basePrice,
      additionalFees: newInvExtraAmount > 0 ? [{ id: `f-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, name: newInvExtraName, amount: Number(newInvExtraAmount) }] : [],
      totalAmount: room.basePrice + (Number(newInvExtraAmount) || 0),
      dueDate: `${newInvMonth}-05`,
      status: 'belum_bayar',
      notes: `Tagihan manual periode ${newInvMonth}`,
    });

    setIsAddInvoiceOpen(false);
  };

  return (
    <div id="payment-management-view" className="space-y-6 animate-in fade-in duration-200">
      {/* Top Standardized Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 flex items-center gap-1.5 shadow-2xs">
              <CreditCard className="w-3.5 h-3.5" />
              <span>Verifikasi Finansial & Tagihan</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 text-xs font-bold border border-teal-200 flex items-center gap-1 shadow-2xs">
              <Building2 className="w-3 h-3" />
              <span>{selectedBranchId === 'all' ? `Semua Cabang (${branches.length})` : (branches.find(b => b.id === selectedBranchId)?.name || 'Cabang')}</span>
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Periode: <strong className="text-slate-800">{formatIndonesianMonthYear(activeReportMonth)}</strong>
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-heading tracking-tight">
            Verifikasi Pembayaran QRIS & Tagihan Sewa
          </h1>
          <p className="text-xs text-slate-500">
            Persetujuan bukti transfer penyewa, penerbitan QRIS dinamis otomatis, dan pengiriman invoice tagihan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <MonthPickerPopover
            id="payment-month-picker"
            value={activeReportMonth}
            onChange={setActiveReportMonth}
            label="Bulan:"
            align="right"
          />

          <button
            onClick={() => setIsAddInvoiceOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Buat Tagihan Baru</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border border-slate-200 p-3 rounded-2xl shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-slate-100 text-slate-900 border border-slate-200 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Semua Tagihan ({invoices.filter(i => i.month === activeReportMonth).length})
          </button>
          <button
            onClick={() => setActiveFilter('menunggu_verifikasi')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeFilter === 'menunggu_verifikasi'
                ? 'bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs font-bold'
                : 'text-amber-700 hover:bg-amber-50/50'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Menunggu Verifikasi</span>
            {pendingCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-black">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveFilter('ditolak')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeFilter === 'ditolak'
                ? 'bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs font-bold'
                : 'text-rose-700 hover:bg-rose-50/60'
            }`}
          >
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Ditolak</span>
            {rejectedCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] flex items-center justify-center font-black">
                {rejectedCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveFilter('belum_bayar')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
              activeFilter === 'belum_bayar'
                ? 'bg-slate-800 text-white border border-slate-700 shadow-2xs font-bold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Belum Bayar
          </button>
          <button
            onClick={() => setActiveFilter('lunas')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
              activeFilter === 'lunas'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs font-bold'
                : 'text-emerald-700 hover:bg-emerald-50/50'
            }`}
          >
            Lunas Terverifikasi
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari kamar / nama penyewa..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
          />
        </div>
      </div>

      {/* Invoices List */}
      <div className="space-y-3">
        {filteredInvoices.length > 0 ? (
          filteredInvoices.map(inv => {
            const isPaid = inv.status === 'lunas';
            const isPending = inv.status === 'menunggu_verifikasi';
            const isRejected = inv.status === 'ditolak' || inv.status === 'verifikasi_ditolak';
            const isUnpaid = inv.status === 'belum_bayar';

            return (
              <div
                key={inv.id}
                id={`invoice-item-${inv.id}`}
                className={`bg-white border rounded-2xl p-4 sm:p-5 shadow-xs transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isRejected
                    ? 'border-rose-300 bg-rose-50/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Left Side: Room, Tenant, Invoice ID */}
                <div className="flex items-start gap-3.5">
                  <div
                    className={`p-3 rounded-2xl flex items-center justify-center font-bold shrink-0 shadow-2xs ${
                      isPaid
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : isPending
                        ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                        : isRejected
                        ? 'bg-rose-100 text-rose-700 border border-rose-300'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    <Building className="w-6 h-6" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-extrabold text-base text-slate-900 font-heading">
                        {inv.roomNumber}
                      </h3>
                      <span className="font-mono text-xs text-slate-600 font-semibold bg-slate-100 px-2 py-0.5 rounded border border-slate-200/80">
                        {inv.invoiceNumber}
                      </span>
                      {isPaid && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                          LUNAS
                        </span>
                      )}
                      {isPending && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold text-[10px] border border-amber-200">
                          MENUNGGU VERIFIKASI
                        </span>
                      )}
                      {isRejected && (
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-extrabold text-[10px] border border-rose-300 flex items-center gap-1">
                          <XCircle className="w-3 h-3 text-rose-600" />
                          VERIFIKASI DITOLAK
                        </span>
                      )}
                      {isUnpaid && (
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px] border border-slate-200">
                          BELUM BAYAR
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-700 font-medium">
                      {inv.tenantName} {inv.tenantPhone && <span className="text-slate-400">&bull; {inv.tenantPhone}</span>}
                    </div>

                    <div className="text-[11px] text-slate-500 flex flex-wrap gap-x-3 gap-y-1">
                      <span>
                        Batas Bayar:{' '}
                        <strong className={todayStr > inv.dueDate && !isPaid ? 'text-rose-600 font-bold' : 'text-slate-700'}>
                          {formatIndonesianDate(inv.dueDate)}
                        </strong>
                        {todayStr > inv.dueDate && !isPaid && (
                          <span className="ml-1.5 text-[9px] font-extrabold text-rose-600 bg-rose-50 px-1 py-0.5 rounded border border-rose-200">
                            TERLAMBAT
                          </span>
                        )}
                      </span>
                      {inv.paidDate && (
                        <span>Diajukan: <strong className="text-slate-700">{formatIndonesianDate(inv.paidDate)}</strong></span>
                      )}
                      {inv.paymentMethod && (
                        <span>Metode: <strong className="text-slate-700 uppercase">{inv.paymentMethod}</strong></span>
                      )}
                    </div>

                    {/* Rejection Alert Box if Rejected */}
                    {isRejected && (
                      <div className="mt-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1 max-w-xl">
                        <div className="flex items-center gap-1.5 font-bold text-rose-800 text-[11px]">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          <span>Alasan Penolakan:</span>
                        </div>
                        <p className="text-[11px] text-rose-900 font-medium pl-5 bg-white/80 p-1.5 rounded border border-rose-200/80">
                          "{inv.rejectionReason || inv.notes || 'Bukti transfer tidak sesuai'}"
                        </p>
                        {inv.rejectedAt && (
                          <span className="text-[10px] text-rose-600 pl-5 block">
                            Ditolak pada: {formatIndonesianDate(inv.rejectedAt.split(' ')[0])} {inv.rejectedAt.split(' ')[1] || ''} oleh {inv.rejectedBy || 'Pemilik'}
                          </span>
                        )}
                      </div>
                    )}

                    {inv.notes && !isRejected && (
                      <p className="text-[11px] text-slate-600 italic bg-slate-50 px-2 py-0.5 rounded border border-slate-200 max-w-xl">
                        {inv.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Side: Total Amount & Action Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between md:justify-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <div className="text-left md:text-right">
                    <span className="text-[11px] text-slate-500 block">Total Tagihan:</span>
                    <div className="font-extrabold text-lg sm:text-xl text-slate-900 font-mono">
                      {formatRupiah(inv.totalAmount)}
                    </div>
                  </div>

                  {/* Proof Image Thumbnail */}
                  {inv.proofImageUrl && (
                    <button
                      onClick={() => setSelectedProofImage(inv.proofImageUrl || null)}
                      className="p-1 rounded-xl bg-slate-50 border border-slate-200 hover:border-emerald-500 transition relative group shrink-0 cursor-pointer"
                      title="Klik untuk lihat bukti transfer"
                    >
                      <img
                        src={inv.proofImageUrl}
                        alt="Bukti Transfer"
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 bg-slate-900/40 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                        <Eye className="w-4 h-4 text-white" />
                      </div>
                    </button>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* If Pending Verification: Show Approve / Reject Modal Trigger */}
                    {isPending && (
                      <>
                        <button
                          onClick={() => verifyPayment(inv.id, 'lunas', 'Diverifikasi langsung oleh pemilik.')}
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Setujui (Lunas)</span>
                        </button>

                        <button
                          onClick={() => {
                            setRejectModalInvoice(inv);
                            setSelectedReasonPreset('Bukti transfer buram, terpotong, atau tidak terbaca dengan jelas');
                            setCustomReasonText('');
                          }}
                          className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <XCircle className="w-4 h-4 text-rose-600" />
                          <span>Tolak Verifikasi</span>
                        </button>
                      </>
                    )}

                    {/* If Rejected: Show QRIS button, WA Reminder, & Re-verify button */}
                    {isRejected && (
                      <>
                        <button
                          onClick={() => onOpenQRIS(inv)}
                          className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-emerald-700 hover:text-emerald-800 border border-slate-200 shadow-2xs text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <QrCode className="w-4 h-4" />
                          <span>Buka QRIS</span>
                        </button>

                        {inv.tenantPhone && (
                          <a
                            href={`https://wa.me/${inv.tenantPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                              `Halo Sdr/i ${inv.tenantName} (${inv.roomNumber}), bukti pembayaran sewa periode ${inv.month} sebesar ${formatRupiah(inv.totalAmount)} belum dapat kami verifikasi karena: "${inv.rejectionReason || 'Bukti transfer tidak sesuai'}". Mohon periksa kembali dan lakukan pembayaran/unggah bukti ulang di portal penghuni. Terima kasih!`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Kirim Info WA</span>
                          </a>
                        )}

                        <button
                          onClick={() => verifyPayment(inv.id, 'lunas', 'Disetujui manual oleh pemilik setelah pengecekan ulang.')}
                          className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                          title="Ubah menjadi Lunas jika dana sudah masuk"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Ubah Lunas</span>
                        </button>
                      </>
                    )}

                    {/* If Unpaid: Show QRIS button + WhatsApp button */}
                    {isUnpaid && (
                      <>
                        <button
                          onClick={() => onOpenQRIS(inv)}
                          className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-emerald-700 hover:text-emerald-800 border border-slate-200 shadow-2xs text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <QrCode className="w-4 h-4" />
                          <span>Buka QRIS</span>
                        </button>

                        {inv.tenantPhone && (
                          <a
                            href={generateWhatsAppReminderUrl(
                              inv.tenantPhone,
                              inv.tenantName,
                              inv.roomNumber,
                              inv.month,
                              inv.totalAmount,
                              inv.dueDate,
                              settings.kostName,
                              settings.qrisMerchantName
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Kirim Tagihan WA</span>
                          </a>
                        )}
                      </>
                    )}

                    {/* If Paid: Show Digital Receipt */}
                    {isPaid && (
                      <button
                        onClick={() => onViewReceipt(inv)}
                        className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-emerald-700 hover:text-emerald-800 border border-slate-200 shadow-2xs text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <FileText className="w-4 h-4" />
                        <span>Kuitansi Resmi</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 text-xs space-y-2 shadow-xs">
            <p className="font-semibold text-slate-700">Tidak ada data tagihan yang sesuai kriteria.</p>
            <p>Silakan ubah filter atau buat tagihan sewa baru.</p>
          </div>
        )}
      </div>

      {/* Proof Image Preview Modal */}
      {selectedProofImage && (
        <div
          onClick={() => setSelectedProofImage(null)}
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-white border border-slate-200 rounded-2xl p-4 max-w-lg w-full shadow-2xl relative">
            <div className="flex justify-between items-center pb-3 mb-3 border-b border-slate-100">
              <h4 className="font-bold text-sm text-slate-900 font-heading">Bukti Pembayaran Penghuni</h4>
              <button
                onClick={() => setSelectedProofImage(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <img
              src={selectedProofImage}
              alt="Bukti Transfer Penuh"
              className="w-full h-auto max-h-[75vh] object-contain rounded-xl border border-slate-100"
            />
          </div>
        </div>
      )}

      {/* Add New Invoice Modal */}
      {isAddInvoiceOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 font-heading">
                Buat Tagihan Sewa Baru
              </h3>
              <button
                onClick={() => setIsAddInvoiceOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNewInvoice} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Pilih Kamar *</label>
                <select
                  value={newInvRoomId}
                  onChange={e => setNewInvRoomId(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs cursor-pointer"
                >
                  {rooms.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.roomNumber} - {r.tenant?.name || 'Kosong'} ({formatRupiah(r.basePrice)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Periode Bulan *</label>
                <input
                  type="month"
                  value={newInvMonth}
                  onChange={e => setNewInvMonth(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nama Biaya Tambahan (Opsional)</label>
                <input
                  type="text"
                  value={newInvExtraName}
                  onChange={e => setNewInvExtraName(e.target.value)}
                  placeholder="Iuran Kebersihan / Parkir / Denda"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nominal Biaya Tambahan (IDR)</label>
                <input
                  type="number"
                  value={newInvExtraAmount}
                  onChange={e => setNewInvExtraAmount(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono shadow-2xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddInvoiceOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs cursor-pointer"
                >
                  Terbitkan Tagihan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {rejectModalInvoice && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={e => {
            if (e.target === e.currentTarget) setRejectModalInvoice(null);
          }}
        >
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200">
                  <XCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 font-heading">
                    Tolak Verifikasi Pembayaran
                  </h3>
                  <p className="text-xs text-slate-500">
                    Pilih alasan penolakan untuk penghuni {rejectModalInvoice.roomNumber}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRejectModalInvoice(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            {/* Target Invoice Info Summary */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">Tagihan Penyewa:</span>
                <span className="font-bold text-slate-900">
                  {rejectModalInvoice.tenantName} ({rejectModalInvoice.roomNumber})
                </span>
                <span className="text-[11px] font-mono text-slate-500 block">
                  {rejectModalInvoice.invoiceNumber}
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block text-[11px]">Total Tagihan:</span>
                <span className="font-extrabold text-emerald-700 font-mono text-sm">
                  {formatRupiah(rejectModalInvoice.totalAmount)}
                </span>
              </div>
            </div>

            {/* Proof Thumbnail if exists */}
            {rejectModalInvoice.proofImageUrl && (
              <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-50 border border-slate-200">
                <img
                  src={rejectModalInvoice.proofImageUrl}
                  alt="Bukti"
                  className="w-12 h-12 object-cover rounded-xl border border-slate-200 shrink-0"
                />
                <div className="text-xs text-slate-600">
                  <span className="font-semibold text-slate-800 block">Bukti Transfer Penyewa</span>
                  <button
                    type="button"
                    onClick={() => setSelectedProofImage(rejectModalInvoice.proofImageUrl || null)}
                    className="text-emerald-700 hover:text-emerald-800 underline text-[11px] font-bold cursor-pointer"
                  >
                    Buka Ukuran Penuh
                  </button>
                </div>
              </div>
            )}

            {/* Predefined Rejection Reasons */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                Pilih Alasan Penolakan:
              </label>
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {PRESET_REJECTION_REASONS.map((reason, idx) => {
                  const isSelected = selectedReasonPreset === reason;
                  return (
                    <label
                      key={idx}
                      className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                        isSelected
                          ? 'bg-rose-50 border-rose-300 text-rose-950 font-medium'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="rejectionPreset"
                        checked={isSelected}
                        onChange={() => setSelectedReasonPreset(reason)}
                        className="mt-0.5 text-rose-600 focus:ring-rose-500"
                      />
                      <span>{reason}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Custom Notes / Specific Detail */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">
                Catatan Tambahan untuk Penghuni (Opsional):
              </label>
              <textarea
                value={customReasonText}
                onChange={e => setCustomReasonText(e.target.value)}
                placeholder="Contoh: Tolong kirim bukti transfer dengan nominal pas Rp 1.775.000 atau transfer ulang ke rekening BCA..."
                rows={2}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-500 shadow-2xs"
              />
            </div>

            {/* Alert note */}
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Status tagihan akan berubah menjadi <strong>"Verifikasi Ditolak"</strong>. Penghuni akan melihat alasan penolakan ini di portal mereka dan QR code pembayaran akan dimunculkan kembali untuk pembayaran ulang.
              </span>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 border-t border-slate-100 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setRejectModalInvoice(null)}
                className="px-4 py-2.5 rounded-xl text-slate-600 hover:text-slate-900 text-xs font-semibold cursor-pointer"
              >
                Batalkan
              </button>
              <button
                type="button"
                onClick={handleConfirmRejection}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
                <span>Konfirmasi Tolak Verifikasi</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

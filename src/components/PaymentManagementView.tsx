import React, { useState } from 'react';
import { useKost } from '../context/KostContext';
import { Invoice } from '../types';
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
  } = useKost();

  const [activeFilter, setActiveFilter] = useState<'all' | 'menunggu_verifikasi' | 'belum_bayar' | 'lunas'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProofImage, setSelectedProofImage] = useState<string | null>(null);

  // New Invoice Modal state
  const [isAddInvoiceOpen, setIsAddInvoiceOpen] = useState(false);
  const [newInvRoomId, setNewInvRoomId] = useState(1);
  const [newInvMonth, setNewInvMonth] = useState(activeReportMonth);
  const [newInvExtraName, setNewInvExtraName] = useState('Iuran Kebersihan & Sampah');
  const [newInvExtraAmount, setNewInvExtraAmount] = useState(25000);

  const filteredInvoices = invoices.filter(inv => {
    if (inv.month !== activeReportMonth) return false;
    if (activeFilter !== 'all' && inv.status !== activeFilter) return false;
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
      additionalFees: newInvExtraAmount > 0 ? [{ id: `f-${Date.now()}`, name: newInvExtraName, amount: Number(newInvExtraAmount) }] : [],
      totalAmount: room.basePrice + (Number(newInvExtraAmount) || 0),
      dueDate: `${newInvMonth}-05`,
      status: 'belum_bayar',
      notes: `Tagihan manual periode ${newInvMonth}`,
    });

    setIsAddInvoiceOpen(false);
  };

  return (
    <div id="payment-management-view" className="space-y-5">
      {/* Top Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 font-heading">
                Verifikasi Pembayaran QRIS & Tagihan Sewa
              </h2>
              <p className="text-xs text-slate-500">
                Persetujuan bukti transfer, pembuatan QRIS dinamis, dan pengingat WhatsApp
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs shadow-2xs">
            <span className="text-slate-600 font-medium">Bulan:</span>
            <select
              value={activeReportMonth}
              onChange={e => setActiveReportMonth(e.target.value)}
              className="bg-white text-emerald-700 font-bold rounded-lg px-2 py-0.5 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer shadow-2xs"
            >
              {availableMonths.map(m => (
                <option key={m} value={m}>
                  {formatIndonesianMonthYear(m)}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setIsAddInvoiceOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
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
            onClick={() => setActiveFilter('belum_bayar')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
              activeFilter === 'belum_bayar'
                ? 'bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs font-bold'
                : 'text-rose-600 hover:bg-rose-50/50'
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
            const isUnpaid = inv.status === 'belum_bayar';

            return (
              <div
                key={inv.id}
                id={`invoice-item-${inv.id}`}
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-4 sm:p-5 shadow-xs transition flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left Side: Room, Tenant, Invoice ID */}
                <div className="flex items-start gap-3.5">
                  <div
                    className={`p-3 rounded-2xl flex items-center justify-center font-bold shrink-0 shadow-2xs ${
                      isPaid
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : isPending
                        ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    <Building className="w-6 h-6" />
                  </div>

                  <div>
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
                      {isUnpaid && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold text-[10px] border border-rose-200">
                          BELUM BAYAR
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-700 font-medium mt-1">
                      {inv.tenantName} {inv.tenantPhone && <span className="text-slate-400">&bull; {inv.tenantPhone}</span>}
                    </div>

                    <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                      <span>Jatuh Tempo: <strong className="text-slate-700">{formatIndonesianDate(inv.dueDate)}</strong></span>
                      {inv.paidDate && (
                        <span>Dibayar: <strong className="text-emerald-700">{formatIndonesianDate(inv.paidDate)}</strong></span>
                      )}
                      {inv.paymentMethod && (
                        <span>Metode: <strong className="text-slate-700 uppercase">{inv.paymentMethod}</strong></span>
                      )}
                    </div>

                    {inv.notes && (
                      <p className="text-[11px] text-slate-600 italic mt-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
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
                    {/* If Pending Verification: Show Approve / Reject */}
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
                            const reason = prompt('Alasan penolakan pembayaran:', 'Bukti transfer tidak valid/nominal tidak sesuai');
                            if (reason) {
                              verifyPayment(inv.id, 'ditolak', reason);
                            }
                          }}
                          className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-200 transition cursor-pointer"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Tolak</span>
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
                            className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition cursor-pointer"
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
    </div>
  );
};

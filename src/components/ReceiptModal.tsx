import React from 'react';
import { Invoice, KostSettings } from '../types';
import { formatRupiah, formatIndonesianDate, formatIndonesianMonthYear } from '../utils/formatters';
import { X, Printer, Download, CheckCircle2, ShieldCheck, Building2 } from 'lucide-react';

interface ReceiptModalProps {
  invoice: Invoice;
  settings: KostSettings;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  invoice,
  settings,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="receipt-modal" className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in duration-200">
        {/* Modal Controls Header (Hidden in Print) */}
        <div className="no-print bg-slate-50 px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span className="font-bold text-sm text-slate-900 font-heading">
              Kuitansi Resmi Pembayaran Sewa Kos
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / Simpan PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper Container */}
        <div className="p-6 sm:p-8 bg-white text-slate-900 overflow-hidden relative">
          {/* Watermark / Stamp */}
          <div className="absolute right-8 top-28 pointer-events-none opacity-80 rotate-[-12deg] select-none">
            <div className="border-4 border-emerald-600 text-emerald-700 px-6 py-2 rounded-xl text-center font-extrabold uppercase tracking-widest text-xl bg-emerald-50/50 shadow-sm">
              <div className="text-2xl font-black">LUNAS</div>
              <div className="text-[10px] tracking-normal font-bold text-emerald-800">
                VERIFIED &bull; QRIS KOSTHUB
              </div>
            </div>
          </div>

          {/* Receipt Header */}
          <div className="border-b-2 border-slate-800 pb-4 mb-5">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-white">
                  <Building2 className="w-7 h-7 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-slate-950 font-heading tracking-tight">
                    {settings.kostName}
                  </h2>
                  <p className="text-xs text-slate-600">{settings.address}, {settings.city}</p>
                  <p className="text-xs text-slate-600">WhatsApp/Telp: {settings.ownerPhone}</p>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  BUKTI PEMBAYARAN RESMI
                </div>
                <div className="font-mono text-sm font-extrabold text-slate-900 mt-0.5">
                  {invoice.invoiceNumber}
                </div>
                <div className="text-xs text-slate-600 mt-0.5">
                  Tanggal: {formatIndonesianDate(invoice.paidDate || invoice.dueDate)}
                </div>
              </div>
            </div>
          </div>

          {/* Transaction Metadata Grid */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs mb-5">
            <div>
              <div className="text-slate-500 font-medium">Telah Diterima Dari:</div>
              <div className="font-bold text-slate-900 text-sm mt-0.5">{invoice.tenantName}</div>
              <div className="text-slate-600 mt-0.5">Unit Sewa: <strong className="text-slate-900">{invoice.roomNumber}</strong></div>
              {invoice.tenantPhone && <div className="text-slate-600">Kontak: {invoice.tenantPhone}</div>}
            </div>

            <div className="text-right sm:text-left">
              <div className="text-slate-500 font-medium">Untuk Pembayaran Sewa Periode:</div>
              <div className="font-bold text-emerald-700 text-sm mt-0.5">
                Bulan {formatIndonesianMonthYear(invoice.month)}
              </div>
              <div className="text-slate-600 mt-0.5">
                Metode: <strong className="text-slate-900 uppercase">{invoice.paymentMethod === 'qris' ? 'QRIS Nasional (Dinamis)' : invoice.paymentMethod === 'transfer_bank' ? 'Transfer Bank' : 'Tunai'}</strong>
              </div>
              {invoice.qrisRef && (
                <div className="text-[11px] text-slate-500 font-mono">Ref: {invoice.qrisRef}</div>
              )}
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full text-xs text-left border-collapse mb-5">
            <thead>
              <tr className="border-b border-slate-300 bg-slate-100 text-slate-700 font-bold uppercase">
                <th className="py-2.5 px-3">Deskripsi Tagihan</th>
                <th className="py-2.5 px-3 text-center">Periode</th>
                <th className="py-2.5 px-3 text-right">Jumlah (IDR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800">
              <tr>
                <td className="py-2.5 px-3 font-semibold">
                  Sewa Kamar {invoice.roomNumber} ({formatIndonesianMonthYear(invoice.month)})
                </td>
                <td className="py-2.5 px-3 text-center text-slate-600">1 Bulan</td>
                <td className="py-2.5 px-3 text-right font-mono font-medium">
                  {formatRupiah(invoice.baseAmount)}
                </td>
              </tr>
              {invoice.additionalFees.map(fee => (
                <tr key={fee.id}>
                  <td className="py-2 px-3 text-slate-700">{fee.name}</td>
                  <td className="py-2 px-3 text-center text-slate-500">1 Bulan</td>
                  <td className="py-2 px-3 text-right font-mono text-slate-700">
                    {formatRupiah(fee.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-800 font-bold text-sm bg-slate-50">
                <td colSpan={2} className="py-3 px-3 text-right uppercase text-slate-700">
                  Total Dibayar:
                </td>
                <td className="py-3 px-3 text-right font-mono font-extrabold text-emerald-700 text-base">
                  {formatRupiah(invoice.totalAmount)}
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Signatures & Footer */}
          <div className="mt-8 pt-4 border-t border-slate-200 flex justify-between items-end text-xs text-slate-600">
            <div>
              <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span>Dokumen Sah & Tercatat Secara Digital</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Dicetak pada {new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })} melalui KostHub 8.
              </p>
            </div>

            <div className="text-center w-48">
              <p className="text-xs text-slate-600 mb-10">Pengelola / Pemilik Kos,</p>
              <div className="font-bold text-slate-900 border-t border-slate-400 pt-1">
                {settings.ownerName}
              </div>
              <div className="text-[10px] text-slate-500">{settings.kostName}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

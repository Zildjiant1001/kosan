import React, { useState } from 'react';
import { useKost } from '../context/KostContext';
import {
  formatRupiah,
  formatIndonesianDate,
  formatIndonesianMonthYear,
  generateWhatsAppReminderUrl,
} from '../utils/formatters';
import { Invoice, Room, Expense } from '../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  FileSpreadsheet,
  Printer,
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Calendar,
  Building,
  Plus,
  Send,
  FileText,
  HelpCircle,
  BarChart3,
  PieChart as PieIcon,
  ShieldCheck,
} from 'lucide-react';

interface MonthlyReportViewProps {
  onViewReceipt: (invoice: Invoice) => void;
  onOpenNewExpenseModal: () => void;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#64748b'];

export const MonthlyReportView: React.FC<MonthlyReportViewProps> = ({
  onViewReceipt,
  onOpenNewExpenseModal,
}) => {
  const {
    activeReportMonth,
    setActiveReportMonth,
    availableMonths,
    getMonthlySummary,
    rooms,
    invoices,
    expenses,
    settings,
  } = useKost();

  const [filterCategory, setFilterCategory] = useState<string>('all');
  const summary = getMonthlySummary(activeReportMonth);

  // Month invoices & expenses
  const currentInvoices = invoices.filter(i => i.month === activeReportMonth);
  const currentExpenses = expenses.filter(e => e.month === activeReportMonth);

  // Prepare trend data for the last 3-4 months for the comparative chart
  const trendData = availableMonths
    .slice(0, 4)
    .reverse()
    .map(m => {
      const s = getMonthlySummary(m);
      return {
        name: formatIndonesianMonthYear(m).split(' ')[0], // Month name
        fullMonth: m,
        Pemasukan: s.totalIncome,
        Pengeluaran: s.totalExpense,
        LabaBersih: s.netProfit,
      };
    });

  // Prepare category data for Pie chart
  const pieData = (Object.entries(summary.expensesByCategory) as [string, number][])
    .filter(([_, val]) => typeof val === 'number' && val > 0)
    .map(([cat, val]) => {
      const categoryNames: Record<string, string> = {
        listrik: 'Listrik Fasum',
        air_pdam: 'Air PDAM',
        wifi_internet: 'WiFi Internet',
        kebersihan_sampah: 'Kebersihan & Sampah',
        maintenance_ac: 'Servis & Cuci AC',
        perbaikan_fasilitas: 'Perbaikan Kerusakan',
        gaji_pengelola: 'Gaji Penjaga/Pengelola',
        lain_lain: 'Lain-lain',
      };
      return {
        name: categoryNames[cat] || cat,
        value: val,
      };
    });

  // Export to CSV
  const handleExportCSV = () => {
    const rows = [
      ['LAPORAN KEUANGAN BULANAN KOST 8 PINTU'],
      ['Nama Kos:', settings.kostName],
      ['Periode:', formatIndonesianMonthYear(activeReportMonth)],
      ['Tanggal Ekspor:', new Date().toLocaleDateString('id-ID')],
      [],
      ['=== REKAPITULASI PEMASUKAN 8 KAMAR ==='],
      ['No Kamar', 'Tipe', 'Nama Penghuni', 'Status', 'Metode Bayar', 'Sewa Pokok', 'Biaya Tambahan', 'Total Tagihan (IDR)'],
      ...rooms.map(room => {
        const inv = currentInvoices.find(i => i.roomId === room.id);
        return [
          room.roomNumber,
          room.type,
          room.tenant ? room.tenant.name : 'Kosong',
          inv ? inv.status.toUpperCase() : (room.status === 'kosong' ? 'KOSONG' : 'BELUM BAYAR'),
          inv?.paymentMethod ? inv.paymentMethod.toUpperCase() : '-',
          room.basePrice.toString(),
          inv?.additionalFees.reduce((s, f) => s + f.amount, 0).toString() || '0',
          inv ? inv.totalAmount.toString() : '0',
        ];
      }),
      [],
      ['Total Pemasukan:', summary.totalIncome.toString()],
      ['Total Pengeluaran:', summary.totalExpense.toString()],
      ['Laba Bersih:', summary.netProfit.toString()],
      ['Tingkat Okupansi:', `${summary.occupancyRate}% (${summary.occupancyCount}/8 Pintu)`],
      [],
      ['=== RINCIAN PENGELUARAN OPERASIONAL ==='],
      ['Tanggal', 'Kategori', 'Deskripsi Pengeluaran', 'Penerima / Vendor', 'Jumlah (IDR)'],
      ...currentExpenses.map(exp => [
        exp.date,
        exp.category,
        exp.title,
        exp.paidTo || '-',
        exp.amount.toString(),
      ]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Kost_${settings.kostName.replace(/\s+/g, '_')}_${activeReportMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="monthly-report-view" className="space-y-6">
      {/* Top Filter & Action Bar */}
      <div className="no-print bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 font-heading tracking-tight">
                Pengolahan Data & Laporan Bulanan
              </h2>
              <p className="text-xs text-slate-500">
                Laporan Keuangan & Okupansi 8 Pintu Real-time Khusus Pemilik
              </p>
            </div>
          </div>
        </div>

        {/* Month Selector & Export Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 shadow-2xs">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span className="text-xs text-slate-600 font-medium">Periode:</span>
            <select
              id="report-month-select"
              value={activeReportMonth}
              onChange={e => setActiveReportMonth(e.target.value)}
              className="bg-white text-emerald-700 text-xs font-bold rounded-lg border border-slate-200 px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer shadow-2xs"
            >
              {availableMonths.map(m => (
                <option key={m} value={m}>
                  {formatIndonesianMonthYear(m)}
                </option>
              ))}
            </select>
          </div>

          <button
            id="btn-export-csv"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 text-xs font-semibold shadow-2xs transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>Ekspor CSV</span>
          </button>

          <button
            id="btn-print-report"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Laporan Resmi (PDF)</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Income */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-slate-500">Total Pemasukan Sewa</p>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1.5 font-heading">
                {formatRupiah(summary.totalIncome)}
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{summary.paidInvoicesCount} Kamar Lunas Dibayar</span>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-slate-500">Pengeluaran Operasional</p>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1.5 font-heading">
                {formatRupiah(summary.totalExpense)}
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
            <span>{currentExpenses.length} Pos Pengeluaran Rutin</span>
          </div>
        </div>

        {/* Net Profit */}
        <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4 sm:p-5 shadow-xs relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-emerald-800">Laba Bersih (Net Profit)</p>
              <h3 className="text-xl sm:text-2xl font-extrabold text-emerald-800 mt-1.5 font-heading">
                {formatRupiah(summary.netProfit)}
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-2xs">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-700 font-medium">
            Margin Keuntungan:{' '}
            <strong className="text-emerald-800 font-bold">
              {summary.totalIncome > 0 ? Math.round((summary.netProfit / summary.totalIncome) * 100) : 0}%
            </strong>
          </div>
        </div>

        {/* Occupancy Rate */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-slate-500">Tingkat Okupansi</p>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1.5 font-heading">
                {summary.occupancyRate}%
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-blue-700 font-medium">
            <span>{summary.occupancyCount} dari 8 Pintu Terisi</span>
          </div>
        </div>
      </div>

      {/* Charts Section (Hidden in print for clarity or shown depending on container) */}
      <div className="no-print grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Bar Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900 font-heading">
                Tren Pemasukan, Pengeluaran & Laba Bulanan
              </h3>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">Satuan: IDR</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.8} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickFormatter={val => `Rp ${(val / 1000000).toFixed(1)}M`}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(val: any) => [formatRupiah(Number(val)), '']}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#cbd5e1',
                    borderRadius: '0.75rem',
                    color: '#0f172a',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="Pemasukan" fill="#059669" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Pengeluaran" fill="#e11d48" radius={[4, 4, 0, 0]} />
                <Bar dataKey="LabaBersih" fill="#0284c7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Composition Pie Chart */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <PieIcon className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900 font-heading">
                Komposisi Pengeluaran
              </h3>
            </div>
            <div className="h-52 w-full">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => [formatRupiah(Number(val)), '']}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderColor: '#cbd5e1',
                        borderRadius: '0.75rem',
                        color: '#0f172a',
                        fontSize: '11px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  Belum ada catatan pengeluaran
                </div>
              )}
            </div>
          </div>

          <div className="mt-2 space-y-1 text-[11px] max-h-28 overflow-y-auto pr-1">
            {pieData.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-slate-600">
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block"
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  />
                  <span>{item.name}</span>
                </div>
                <span className="font-semibold text-slate-900">{formatRupiah(item.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Table 1: Rekapitulasi Rinci Per Pintu 8 Kamar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 font-heading">
              Rekapitulasi Pemasukan 8 Pintu ({formatIndonesianMonthYear(activeReportMonth)})
            </h3>
            <p className="text-xs text-slate-500">
              Rincian status pembayaran, metode pembayaran QRIS/Bank, dan kwitansi per unit
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
              8 Pintu Kos Aktif
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider bg-slate-50 font-semibold">
                <th className="py-3 px-3">No. Kamar</th>
                <th className="py-3 px-3">Tipe Kamar</th>
                <th className="py-3 px-3">Penghuni / Kontak</th>
                <th className="py-3 px-3">Tarif Sewa</th>
                <th className="py-3 px-3">Iuran/Lain</th>
                <th className="py-3 px-3">Total Tagihan</th>
                <th className="py-3 px-3">Metode Bayar</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right no-print">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {rooms.map(room => {
                const inv = currentInvoices.find(i => i.roomId === room.id);
                const isPaid = inv?.status === 'lunas';
                const isPending = inv?.status === 'menunggu_verifikasi';
                const isUnpaid = inv?.status === 'belum_bayar';
                const isVacant = room.status === 'kosong';

                const totalBill = inv ? inv.totalAmount : (isVacant ? 0 : room.basePrice);
                const extraFees = inv ? inv.additionalFees.reduce((acc, f) => acc + f.amount, 0) : 0;

                return (
                  <tr key={room.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3 font-bold text-slate-900 whitespace-nowrap">
                      {room.roomNumber}
                    </td>
                    <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                      {room.type} (Lt. {room.floor})
                    </td>
                    <td className="py-3 px-3">
                      {room.tenant ? (
                        <div>
                          <div className="font-semibold text-slate-900">{room.tenant.name}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{room.tenant.phone}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Kamar Kosong</span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-700">{formatRupiah(room.basePrice)}</td>
                    <td className="py-3 px-3 font-mono text-slate-500">
                      {extraFees > 0 ? formatRupiah(extraFees) : '-'}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">
                      {isVacant ? '-' : formatRupiah(totalBill)}
                    </td>
                    <td className="py-3 px-3">
                      {inv?.paymentMethod === 'qris' ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-[10px]">
                          QRIS Dinamis
                        </span>
                      ) : inv?.paymentMethod === 'transfer_bank' ? (
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold text-[10px]">
                          Transfer Bank
                        </span>
                      ) : inv?.paymentMethod === 'tunai' ? (
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-[10px]">
                          Tunai
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {isPaid && (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 text-[11px] inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          LUNAS
                        </span>
                      )}
                      {isPending && (
                        <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-bold border border-amber-200 text-[11px] inline-flex items-center gap-1 animate-pulse">
                          <Clock className="w-3 h-3" />
                          VERIFIKASI
                        </span>
                      )}
                      {isUnpaid && (
                        <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 font-bold border border-rose-200 text-[11px] inline-flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          BELUM BAYAR
                        </span>
                      )}
                      {isVacant && (
                        <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 font-medium text-[11px]">
                          KOSONG
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right no-print whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {inv && isPaid && (
                          <button
                            onClick={() => onViewReceipt(inv)}
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
                            title="Lihat Kuitansi Resmi"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Kuitansi</span>
                          </button>
                        )}
                        {room.tenant && (isUnpaid || isPending) && (
                          <a
                            href={generateWhatsAppReminderUrl(
                              room.tenant.phone,
                              room.tenant.name,
                              room.roomNumber,
                              activeReportMonth,
                              totalBill,
                              inv?.dueDate || `${activeReportMonth}-05`,
                              settings.kostName,
                              settings.qrisMerchantName
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer shadow-2xs"
                            title="Kirim Pengingat WhatsApp Otomatis"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Tagih WA</span>
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200 bg-slate-50 font-bold text-slate-900">
                <td colSpan={3} className="py-3 px-3 uppercase text-slate-600">
                  Total Pemasukan Terverifikasi ({summary.paidInvoicesCount} Lunas):
                </td>
                <td colSpan={2}></td>
                <td className="py-3 px-3 font-mono font-extrabold text-emerald-700 text-sm">
                  {formatRupiah(summary.totalIncome)}
                </td>
                <td colSpan={3}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Table 2: Rincian Pengeluaran Operasional */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 font-heading">
              Rincian Pengeluaran Operasional ({formatIndonesianMonthYear(activeReportMonth)})
            </h3>
            <p className="text-xs text-slate-500">
              Biaya utilitas, internet, kebersihan, pemeliharaan & servis AC
            </p>
          </div>
          <button
            onClick={onOpenNewExpenseModal}
            className="no-print flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Catat Pengeluaran Baru</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider bg-slate-50 font-semibold">
                <th className="py-3 px-3">Tanggal</th>
                <th className="py-3 px-3">Kategori</th>
                <th className="py-3 px-3">Deskripsi Pengeluaran</th>
                <th className="py-3 px-3">Dibayarkan Kepada / Vendor</th>
                <th className="py-3 px-3 text-right">Jumlah (IDR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {currentExpenses.length > 0 ? (
                currentExpenses.map(exp => (
                  <tr key={exp.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap">
                      {formatIndonesianDate(exp.date)}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-medium text-[10px] uppercase">
                        {exp.category.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-900">{exp.title}</td>
                    <td className="py-2.5 px-3 text-slate-500">{exp.paidTo || '-'}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-right text-rose-600">
                      {formatRupiah(exp.amount)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400 italic">
                    Belum ada data pengeluaran yang dicatat untuk bulan ini.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200 bg-slate-50 font-bold text-slate-900">
                <td colSpan={4} className="py-3 px-3 uppercase text-slate-600 text-right">
                  Total Biaya Operasional:
                </td>
                <td className="py-3 px-3 font-mono font-extrabold text-rose-600 text-sm text-right">
                  {formatRupiah(summary.totalExpense)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Smart Financial Insights / Recommendations for Kost Owner */}
      <div className="no-print bg-emerald-50/50 border border-emerald-200 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-2 text-emerald-800 mb-2">
          <Sparkles className="w-5 h-5 text-emerald-600" />
          <h3 className="font-bold text-sm text-slate-900 font-heading">
            Analisis & Evaluasi Performa Bisnis Kos
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-700 mt-3">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
            <span className="font-bold text-emerald-700 block">Kesehatan Arus Kas (Cash Flow)</span>
            <p className="text-slate-600 leading-relaxed">
              Dengan laba bersih <strong className="text-slate-900">{formatRupiah(summary.netProfit)}</strong> (margin{' '}
              {summary.totalIncome > 0 ? Math.round((summary.netProfit / summary.totalIncome) * 100) : 0}%), arus kas properti sangat sehat untuk menopang dana cadangan darurat.
            </p>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
            <span className="font-bold text-blue-700 block">Optimasi Kamar Kosong</span>
            <p className="text-slate-600 leading-relaxed">
              {summary.occupancyCount < 8 ? (
                <>
                  Terdapat {8 - summary.occupancyCount} pintu kosong. Mengisi unit ini berpotensi menambah omset bulanan hingga{' '}
                  <strong className="text-slate-900">Rp 1.750.000 / bulan</strong>.
                </>
              ) : (
                'Seluruh 8 pintu terisi penuh (100% Okupansi)! Pertahankan kualitas layanan dan ketepatan servis fasilitas.'
              )}
            </p>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
            <span className="font-bold text-amber-700 block">Efektivitas Pembayaran QRIS</span>
            <p className="text-slate-600 leading-relaxed">
              Penggunaan QRIS Dinamis mempercepat rekonsiliasi pembayaran sewa hingga 90% lebih cepat dibanding metode transfer manual atau uang tunai.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

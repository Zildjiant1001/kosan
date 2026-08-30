import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { useKost } from '../context/KostContext';
import {
  formatRupiah,
  formatIndonesianDate,
  formatIndonesianMonthYear,
  generateWhatsAppReminderUrl,
} from '../utils/formatters';
import { Invoice, Room, Expense } from '../types';
import { MonthPickerPopover } from './MonthPickerPopover';
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
  Building2,
  Plus,
  Send,
  FileText,
  HelpCircle,
  BarChart3,
  PieChart as PieIcon,
  ShieldCheck,
  Layers,
  ArrowUpRight,
  ChevronRight,
  Filter,
  Eye,
  Copy,
  X,
  FileCode,
  Table,
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
    allRooms,
    invoices,
    allInvoices,
    expenses,
    allExpenses,
    branches,
    selectedBranchId,
    setSelectedBranchId,
    settings,
  } = useKost();

  // Branch filter directly uses global synchronized selectedBranchId
  const reportBranchId = selectedBranchId;
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewTab, setPreviewTab] = useState<'summary' | 'rooms' | 'expenses' | 'raw_csv'>('summary');
  const [copiedCsv, setCopiedCsv] = useState(false);

  const isAllBranches = reportBranchId === 'all';
  const selectedBranchObj = !isAllBranches ? branches.find(b => b.id === reportBranchId) : null;
  const summary = getMonthlySummary(activeReportMonth, reportBranchId);

  // Filtered rooms, invoices, and expenses based on branch filter
  const currentRooms = isAllBranches 
    ? allRooms 
    : allRooms.filter(r => (r.branchId || 'branch-01') === reportBranchId);

  const currentInvoices = isAllBranches
    ? allInvoices.filter(i => i.month === activeReportMonth)
    : allInvoices.filter(i => i.month === activeReportMonth && (i.branchId || 'branch-01') === reportBranchId);

  const currentExpenses = isAllBranches
    ? allExpenses.filter(e => e.month === activeReportMonth)
    : allExpenses.filter(e => e.month === activeReportMonth && (e.branchId || 'branch-01') === reportBranchId);

  // Prepare trend data for the last 3-4 months for the comparative chart
  const trendData = availableMonths
    .slice(0, 4)
    .reverse()
    .map(m => {
      const s = getMonthlySummary(m, reportBranchId);
      return {
        name: formatIndonesianMonthYear(m).split(' ')[0],
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

  // 1. Export Genuine Multi-Sheet Excel Spreadsheet (.XLSX)
  const handleExportExcel = () => {
    const scopeLabel = isAllBranches 
      ? `Semua Cabang (${branches.length} Cabang Terintegrasi)`
      : (selectedBranchObj ? `${selectedBranchObj.name} (${selectedBranchObj.code})` : 'Cabang Utama');

    const wb = XLSX.utils.book_new();

    // SHEET 1: Konsolidasi & Performa Cabang
    const sheet1Data: (string | number)[][] = [
      ['LAPORAN KEUANGAN KONSOLIDASI ENTERPRISE'],
      ['Nama Properti / Entitas', settings.kostName || 'Kosan Enterprise'],
      ['Cakupan Laporan', scopeLabel],
      ['Periode Laporan', formatIndonesianMonthYear(activeReportMonth)],
      ['Tanggal Generate', new Date().toLocaleString('id-ID')],
      [],
      ['RINGKASAN EKSEKUTIF KEUANGAN'],
      ['Indikator Metrik', 'Nilai (IDR / Satuan)', 'Keterangan'],
      ['Total Pemasukan Sewa Terverifikasi', summary.totalIncome, `${summary.paidInvoicesCount} kamar lunas`],
      ['Total Pengeluaran Operasional', summary.totalExpense, `${currentExpenses.length} transaksi`],
      ['Laba Bersih Operasional (Net Profit)', summary.netProfit, `${summary.totalIncome > 0 ? Math.round((summary.netProfit / summary.totalIncome) * 100) : 0}% Profit Margin`],
      ['Tingkat Okupansi Hunian', `${summary.occupancyRate}%`, `${summary.occupancyCount} dari ${summary.totalRooms} kamar terisi`],
      ['Total Tunggakan / Belum Bayar', summary.totalUnpaidAmount, `${summary.unpaidOccupiedRoomsCount} kamar menunggak`],
      [],
    ];

    if (isAllBranches && summary.branchBreakdowns && summary.branchBreakdowns.length > 0) {
      sheet1Data.push(
        ['PERFORMA & KONTRIBUSI KEUANGAN PER CABANG PROPERTI'],
        ['No', 'Nama Cabang', 'Kode', 'Kota', 'Nama Pengelola', 'Total Kamar', 'Kamar Terisi', 'Okupansi (%)', 'Pemasukan (IDR)', 'Pengeluaran (IDR)', 'Laba Bersih (IDR)', 'Tunggakan (IDR)'],
        ...summary.branchBreakdowns.map((b, idx) => [
          idx + 1,
          b.branchName,
          b.branchCode,
          b.city,
          b.managerName,
          b.totalRooms,
          b.occupiedRooms,
          `${b.occupancyRate}%`,
          b.totalIncome,
          b.totalExpense,
          b.netProfit,
          b.unpaidAmount,
        ]),
        [
          'Total Konsolidasi',
          `${summary.branchBreakdowns.length} Cabang`,
          '-',
          '-',
          '-',
          summary.totalRooms,
          summary.occupancyCount,
          `${summary.occupancyRate}%`,
          summary.totalIncome,
          summary.totalExpense,
          summary.netProfit,
          summary.totalUnpaidAmount,
        ]
      );
    }

    const ws1 = XLSX.utils.aoa_to_sheet(sheet1Data);
    ws1['!cols'] = [
      { wch: 6 },
      { wch: 30 },
      { wch: 15 },
      { wch: 18 },
      { wch: 22 },
      { wch: 14 },
      { wch: 14 },
      { wch: 15 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
    ];
    XLSX.utils.book_append_sheet(wb, ws1, 'Konsolidasi & Performa');

    // SHEET 2: Rincian Pemasukan Kamar Lengkap
    const sheet2Data: (string | number)[][] = [
      ['REKAPITULASI PEMASUKAN SEWA KAMAR'],
      ['Periode', formatIndonesianMonthYear(activeReportMonth)],
      ['Cakupan', scopeLabel],
      [],
      [
        'No',
        'Cabang Properti',
        'Nomor Kamar',
        'Lantai',
        'Tipe Kamar',
        'Nama Penghuni',
        'No Telepon / WhatsApp',
        'Status Pembayaran',
        'Metode Pembayaran',
        'Tanggal Bayar',
        'Sewa Pokok (IDR)',
        'Biaya Tambahan (IDR)',
        'Total Tagihan (IDR)',
        'Status Verifikasi / Ref',
      ],
      ...currentRooms.map((room, idx) => {
        const inv = currentInvoices.find(i => i.roomId === room.id);
        const branch = branches.find(b => b.id === (room.branchId || 'branch-01'));
        const isPaid = inv?.status === 'lunas';
        const isPending = inv?.status === 'menunggu_verifikasi';
        const isVacant = room.status === 'kosong' && !room.tenant;
        const additionalFeesSum = inv?.additionalFees.reduce((s, f) => s + f.amount, 0) || 0;
        const totalAmount = inv ? inv.totalAmount : (isVacant ? 0 : room.basePrice);

        let statusLabel = 'Belum Bayar';
        if (isPaid) statusLabel = 'Lunas (Terverifikasi)';
        else if (isPending) statusLabel = 'Menunggu Konfirmasi';
        else if (isVacant) statusLabel = 'Kosong';

        let methodLabel = '-';
        if (inv?.paymentMethod === 'qris') methodLabel = 'QRIS Dinamis';
        else if (inv?.paymentMethod === 'transfer_bank') methodLabel = 'Transfer Bank';
        else if (inv?.paymentMethod === 'tunai') methodLabel = 'Tunai';

        return [
          idx + 1,
          branch ? branch.name : 'Kost Griya Harmoni 8',
          room.roomNumber,
          `Lt ${room.floor}`,
          room.type,
          room.tenant ? room.tenant.name : (isVacant ? 'Siap Huni' : '-'),
          room.tenant?.phone || '-',
          statusLabel,
          methodLabel,
          inv?.paidDate || (isPaid ? activeReportMonth + '-01' : '-'),
          room.basePrice,
          additionalFeesSum,
          totalAmount,
          inv?.qrisRef || (isPaid ? 'Terverifikasi' : '-'),
        ];
      }),
      [],
      [
        'Total Pemasukan Terverifikasi',
        '',
        '',
        '',
        '',
        '',
        '',
        `${summary.paidInvoicesCount} Kamar Lunas`,
        '',
        '',
        '',
        '',
        summary.totalIncome,
        '',
      ],
      [
        'Total Tunggakan Sewa',
        '',
        '',
        '',
        '',
        '',
        '',
        `${summary.unpaidOccupiedRoomsCount} Kamar Belum Lunas`,
        '',
        '',
        '',
        '',
        summary.totalUnpaidAmount,
        '',
      ],
    ];

    const ws2 = XLSX.utils.aoa_to_sheet(sheet2Data);
    ws2['!cols'] = [
      { wch: 6 },
      { wch: 26 },
      { wch: 14 },
      { wch: 8 },
      { wch: 20 },
      { wch: 24 },
      { wch: 18 },
      { wch: 22 },
      { wch: 18 },
      { wch: 14 },
      { wch: 18 },
      { wch: 18 },
      { wch: 20 },
      { wch: 22 },
    ];
    XLSX.utils.book_append_sheet(wb, ws2, 'Pemasukan Sewa Kamar');

    // SHEET 3: Rincian Pengeluaran Operasional
    const sheet3Data: (string | number)[][] = [
      ['RINCIAN PENGELUARAN OPERASIONAL & UTILITAS'],
      ['Periode', formatIndonesianMonthYear(activeReportMonth)],
      ['Cakupan', scopeLabel],
      [],
      [
        'No',
        'Cabang Properti',
        'Tanggal Transaksi',
        'Kategori Biaya',
        'Deskripsi Pengeluaran',
        'Dibayarkan Kepada / Vendor',
        'Catatan Tambahan',
        'Nominal Biaya (IDR)',
      ],
      ...currentExpenses.map((exp, idx) => {
        const branch = branches.find(b => b.id === (exp.branchId || 'branch-01'));
        return [
          idx + 1,
          branch ? branch.name : 'Kost Griya Harmoni 8',
          exp.date,
          exp.category.replace('_', ' ').toUpperCase(),
          exp.title,
          exp.paidTo || '-',
          exp.notes || '-',
          exp.amount,
        ];
      }),
      [],
      [
        'Total Pengeluaran Operasional',
        '',
        '',
        '',
        `${currentExpenses.length} Transaksi`,
        '',
        '',
        summary.totalExpense,
      ],
    ];

    const ws3 = XLSX.utils.aoa_to_sheet(sheet3Data);
    ws3['!cols'] = [
      { wch: 6 },
      { wch: 26 },
      { wch: 15 },
      { wch: 22 },
      { wch: 35 },
      { wch: 24 },
      { wch: 30 },
      { wch: 20 },
    ];
    XLSX.utils.book_append_sheet(wb, ws3, 'Pengeluaran Operasional');

    const fileName = `Laporan_Keuangan_${isAllBranches ? 'Semua_Cabang' : (selectedBranchObj?.name || 'Cabang').replace(/\s+/g, '_')}_${activeReportMonth}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const generateCsvRows = () => {
    const scopeLabel = isAllBranches 
      ? `SEMUA CABANG (${branches.length} Cabang Terintegrasi)`
      : (selectedBranchObj ? `${selectedBranchObj.name} (${selectedBranchObj.code})` : 'Cabang Utama');

    const rows: string[][] = [
      [`LAPORAN KEUANGAN BULANAN KOST - ${scopeLabel.toUpperCase()}`],
      ['Cakupan Laporan:', scopeLabel],
      ['Periode:', formatIndonesianMonthYear(activeReportMonth)],
      ['Tanggal Ekspor:', new Date().toLocaleDateString('id-ID')],
      [],
      ['=== RINGKASAN EKSEKUTIF KEUANGAN ==='],
      ['Total Pemasukan:', summary.totalIncome.toString()],
      ['Total Pengeluaran:', summary.totalExpense.toString()],
      ['Laba Bersih:', summary.netProfit.toString()],
      ['Tingkat Okupansi:', `${summary.occupancyRate}% (${summary.occupancyCount}/${summary.totalRooms} Pintu)`],
      ['Total Tunggakan:', summary.totalUnpaidAmount.toString()],
      [],
    ];

    if (isAllBranches && summary.branchBreakdowns && summary.branchBreakdowns.length > 0) {
      rows.push(
        ['=== KONTRIBUSI KEUANGAN PER CABANG PROPERTI ==='],
        ['Nama Cabang', 'Kode', 'Kota', 'Pengelola', 'Total Pintu', 'Terisi', 'Okupansi (%)', 'Pemasukan (IDR)', 'Pengeluaran (IDR)', 'Laba Bersih (IDR)', 'Tunggakan (IDR)'],
        ...summary.branchBreakdowns.map(b => [
          b.branchName,
          b.branchCode,
          b.city,
          b.managerName,
          b.totalRooms.toString(),
          b.occupiedRooms.toString(),
          `${b.occupancyRate}%`,
          b.totalIncome.toString(),
          b.totalExpense.toString(),
          b.netProfit.toString(),
          b.unpaidAmount.toString(),
        ]),
        []
      );
    }

    rows.push(
      [`=== REKAPITULASI PEMASUKAN ${currentRooms.length} KAMAR ===`],
      ['Cabang Properti', 'No Kamar', 'Tipe', 'Nama Penghuni', 'Status', 'Metode Bayar', 'Sewa Pokok', 'Biaya Tambahan', 'Total Tagihan (IDR)'],
      ...currentRooms.map(room => {
        const inv = currentInvoices.find(i => i.roomId === room.id);
        const branch = branches.find(b => b.id === (room.branchId || 'branch-01'));
        return [
          branch ? branch.name : 'Kost Griya Harmoni 8',
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
      ['=== RINCIAN PENGELUARAN OPERASIONAL ==='],
      ['Cabang', 'Tanggal', 'Kategori', 'Deskripsi Pengeluaran', 'Penerima / Vendor', 'Jumlah (IDR)'],
      ...currentExpenses.map(exp => {
        const branch = branches.find(b => b.id === (exp.branchId || 'branch-01'));
        return [
          branch ? branch.name : 'Kost Griya Harmoni 8',
          exp.date,
          exp.category,
          exp.title,
          exp.paidTo || '-',
          exp.amount.toString(),
        ];
      })
    );

    return rows;
  };

  const getCsvRawText = () => {
    const rows = generateCsvRows();
    return rows.map(e => e.join(',')).join('\n');
  };

  const handleCopyCsv = () => {
    const text = getCsvRawText();
    navigator.clipboard.writeText(text).then(() => {
      setCopiedCsv(true);
      setTimeout(() => setCopiedCsv(false), 2500);
    });
  };

  // 2. Export to CSV
  const handleExportCSV = () => {
    const rows = generateCsvRows();
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download', 
      `Laporan_Keuangan_${isAllBranches ? 'Semua_Cabang' : (selectedBranchObj?.name || 'Cabang').replace(/\s+/g, '_')}_${activeReportMonth}.csv`
    );
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
      <div className="no-print bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
        {/* Row 1: Title & Branch/Month Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 flex items-center gap-1.5 shadow-2xs">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Enterprise Financial Reporting</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 text-xs font-bold border border-teal-200 flex items-center gap-1 shadow-2xs">
                <Building2 className="w-3 h-3" />
                <span>{isAllBranches ? `Semua Cabang (${branches.length})` : (selectedBranchObj?.name || 'Cabang')}</span>
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Periode: <strong className="text-slate-800">{formatIndonesianMonthYear(activeReportMonth)}</strong>
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-heading tracking-tight">
              {isAllBranches 
                ? 'Laporan Keuangan Konsolidasi Enterprise' 
                : `Laporan Keuangan – ${selectedBranchObj?.name || 'Cabang'}`}
            </h1>
            <p className="text-xs text-slate-500">
              {isAllBranches
                ? `Rekapitulasi keuangan terintegrasi dari ${branches.length} cabang properti (${summary.totalRooms} Total Kamar)`
                : `Laporan keuangan terisolasi untuk ${selectedBranchObj?.name} (${summary.totalRooms} Kamar • ${selectedBranchObj?.city || 'Jakarta'})`}
            </p>
          </div>

          {/* Month Selector Popover */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <MonthPickerPopover
              id="report-month-picker"
              value={activeReportMonth}
              onChange={setActiveReportMonth}
              label="Periode:"
              align="right"
            />
          </div>
        </div>

        {/* Row 2: Action Toolbar with Export / Download Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-500 font-medium">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Data Keuangan Sinkron Real-time</span>
            </span>
            <span>&bull;</span>
            <span className="font-mono text-slate-700 font-bold">
              {summary.paidInvoicesCount} Lunas / {summary.totalRooms} Kamar
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider hidden sm:inline">
              Ekspor Laporan:
            </span>

            {/* Download Excel Button */}
            <button
              id="btn-export-excel"
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-2xs transition cursor-pointer"
              title="Download Spreadsheet Excel Multi-Sheet (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Unduh Format XLS</span>
            </button>

            {/* Preview Button (formerly Ekspor CSV) */}
            <button
              id="btn-preview-report"
              onClick={() => setIsPreviewModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 font-semibold shadow-2xs transition cursor-pointer"
              title="Pratinjau / Preview Data Laporan"
            >
              <Eye className="w-3.5 h-3.5 text-blue-600" />
              <span>Preview</span>
            </button>

            {/* Print PDF Button */}
            <button
              id="btn-print-report"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-xs transition cursor-pointer"
              title="Cetak atau Simpan PDF (Format Grid Spreadsheet)"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-400" />
              <span>Cetak PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PRINT-ONLY SPREADSHEET LAYOUT (Strict Excel-Like Format for PDF / Paper)  */}
      {/* ========================================================================= */}
      <div className="print-only hidden font-sans text-slate-900 p-2">
        {/* Formal Header */}
        <div className="border-b-2 border-slate-900 pb-3 mb-4 flex justify-between items-end">
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight text-slate-900">
              {isAllBranches ? 'LAPORAN KEUANGAN KONSOLIDASI ENTERPRISE' : 'LAPORAN KEUANGAN OPERASIONAL KOS'}
            </h1>
            <p className="text-xs font-semibold text-slate-700 mt-0.5">
              {settings.kostName || 'Kosan Enterprise'} &bull; {isAllBranches ? `Semua Cabang (${branches.length} Unit Properti)` : selectedBranchObj?.name}
            </p>
            <p className="text-[10px] text-slate-500">
              Alamat: {selectedBranchObj?.address || settings.address || 'Jakarta'} &bull; Telp: {selectedBranchObj?.managerPhone || settings.ownerPhone || '0812-3456-7890'}
            </p>
          </div>
          <div className="text-right text-[11px] font-mono">
            <div><strong>Periode:</strong> {formatIndonesianMonthYear(activeReportMonth)}</div>
            <div><strong>Dicetak:</strong> {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
          </div>
        </div>

        {/* Executive Summary Metrics Grid */}
        <div className="mb-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-800 mb-1">
            I. RINGKASAN EKSEKUTIF KEUANGAN
          </div>
          <table className="print-excel-table">
            <thead>
              <tr>
                <th style={{ width: '40%' }}>Indikator Keuangan</th>
                <th style={{ width: '30%', textAlign: 'right' }}>Nilai (IDR)</th>
                <th style={{ width: '30%' }}>Keterangan & Catatan</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Total Pemasukan Sewa Terverifikasi</strong></td>
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatRupiah(summary.totalIncome)}</td>
                <td>{summary.paidInvoicesCount} dari {summary.totalRooms} Kamar Terverifikasi Lunas</td>
              </tr>
              <tr>
                <td><strong>Total Beban Pengeluaran Operasional</strong></td>
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatRupiah(summary.totalExpense)}</td>
                <td>{currentExpenses.length} Pos Biaya Utilitas & Pemeliharaan</td>
              </tr>
              <tr style={{ backgroundColor: '#f8fafc' }}>
                <td><strong>Laba Bersih Operasional (Net Profit)</strong></td>
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatRupiah(summary.netProfit)}</td>
                <td>Margin Keuntungan: {summary.totalIncome > 0 ? Math.round((summary.netProfit / summary.totalIncome) * 100) : 0}%</td>
              </tr>
              <tr>
                <td>Tingkat Okupansi Hunian</td>
                <td style={{ textAlign: 'right' }}>{summary.occupancyRate}%</td>
                <td>{summary.occupancyCount} Kamar Terisi &bull; {summary.totalRooms - summary.occupancyCount} Kamar Kosong</td>
              </tr>
              <tr>
                <td>Total Piutang / Tunggakan Sewa</td>
                <td style={{ textAlign: 'right' }}>{formatRupiah(summary.totalUnpaidAmount)}</td>
                <td>{summary.unpaidOccupiedRoomsCount} Kamar Terisi Belum Lunas</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section: Performa Cabang (If multi-branch) */}
        {isAllBranches && summary.branchBreakdowns && summary.branchBreakdowns.length > 0 && (
          <div className="mb-4 print-break-inside-avoid">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-800 mb-1">
              II. KONTRIBUSI & PERFORMA KEUANGAN PER CABANG PROPERTI
            </div>
            <table className="print-excel-table">
              <thead>
                <tr>
                  <th style={{ width: '5%', textAlign: 'center' }}>No</th>
                  <th style={{ width: '22%' }}>Nama Cabang</th>
                  <th style={{ width: '8%', textAlign: 'center' }}>Kode</th>
                  <th style={{ width: '12%' }}>Kota</th>
                  <th style={{ width: '10%', textAlign: 'center' }}>Okupansi</th>
                  <th style={{ width: '14%', textAlign: 'right' }}>Pemasukan</th>
                  <th style={{ width: '14%', textAlign: 'right' }}>Pengeluaran</th>
                  <th style={{ width: '15%', textAlign: 'right' }}>Laba Bersih</th>
                </tr>
              </thead>
              <tbody>
                {summary.branchBreakdowns.map((b, idx) => (
                  <tr key={b.branchId}>
                    <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                    <td><strong>{b.branchName}</strong></td>
                    <td style={{ textAlign: 'center' }}>{b.branchCode}</td>
                    <td>{b.city}</td>
                    <td style={{ textAlign: 'center' }}>{b.occupiedRooms}/{b.totalRooms} ({b.occupancyRate}%)</td>
                    <td style={{ textAlign: 'right' }}>{formatRupiah(b.totalIncome)}</td>
                    <td style={{ textAlign: 'right' }}>{formatRupiah(b.totalExpense)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatRupiah(b.netProfit)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={5} style={{ textAlign: 'right', fontWeight: 'bold' }}>TOTAL KONSOLIDASI:</td>
                  <td style={{ textAlign: 'right' }}>{formatRupiah(summary.totalIncome)}</td>
                  <td style={{ textAlign: 'right' }}>{formatRupiah(summary.totalExpense)}</td>
                  <td style={{ textAlign: 'right' }}>{formatRupiah(summary.netProfit)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Section: Rekapitulasi Pemasukan Kamar */}
        <div className="mb-4 print-break-inside-avoid">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-800 mb-1">
            {isAllBranches ? 'III. REKAPITULASI PEMASUKAN SEWA KAMAR' : 'II. REKAPITULASI PEMASUKAN SEWA KAMAR'}
          </div>
          <table className="print-excel-table">
            <thead>
              <tr>
                <th style={{ width: '4%', textAlign: 'center' }}>No</th>
                {isAllBranches && <th style={{ width: '15%' }}>Cabang</th>}
                <th style={{ width: '10%' }}>Unit Kamar</th>
                <th style={{ width: '12%' }}>Tipe</th>
                <th style={{ width: '18%' }}>Penghuni</th>
                <th style={{ width: '12%', textAlign: 'center' }}>Status</th>
                <th style={{ width: '12%', textAlign: 'center' }}>Metode</th>
                <th style={{ width: '17%', textAlign: 'right' }}>Total Tagihan</th>
              </tr>
            </thead>
            <tbody>
              {currentRooms.map((room, idx) => {
                const inv = currentInvoices.find(i => i.roomId === room.id);
                const branch = branches.find(b => b.id === (room.branchId || 'branch-01'));
                const isPaid = inv?.status === 'lunas';
                const isVacant = room.status === 'kosong' && !room.tenant;
                const totalBill = inv ? inv.totalAmount : (isVacant ? 0 : room.basePrice);

                return (
                  <tr key={room.id}>
                    <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                    {isAllBranches && <td>{branch ? branch.code : 'CBG'}</td>}
                    <td><strong>{room.roomNumber}</strong> (Lt {room.floor})</td>
                    <td>{room.type}</td>
                    <td>{room.tenant ? room.tenant.name : (isVacant ? 'Siap Huni' : '-')}</td>
                    <td style={{ textAlign: 'center', fontWeight: isPaid ? 'bold' : 'normal' }}>
                      {isPaid ? 'LUNAS' : (isVacant ? 'KOSONG' : 'BELUM BAYAR')}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {inv?.paymentMethod ? inv.paymentMethod.toUpperCase() : '-'}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                      {isVacant ? '-' : formatRupiah(totalBill)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={isAllBranches ? 7 : 6} style={{ textAlign: 'right', fontWeight: 'bold' }}>
                  TOTAL PEMASUKAN TERVERIFIKASI:
                </td>
                <td style={{ textAlign: 'right' }}>{formatRupiah(summary.totalIncome)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Section: Rincian Pengeluaran Operasional */}
        <div className="mb-6 print-break-inside-avoid">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-800 mb-1">
            {isAllBranches ? 'IV. RINCIAN PENGELUARAN OPERASIONAL' : 'III. RINCIAN PENGELUARAN OPERASIONAL'}
          </div>
          <table className="print-excel-table">
            <thead>
              <tr>
                <th style={{ width: '4%', textAlign: 'center' }}>No</th>
                {isAllBranches && <th style={{ width: '15%' }}>Cabang</th>}
                <th style={{ width: '12%' }}>Tanggal</th>
                <th style={{ width: '16%' }}>Kategori</th>
                <th style={{ width: '28%' }}>Deskripsi Biaya</th>
                <th style={{ width: '15%' }}>Penerima / Vendor</th>
                <th style={{ width: '15%', textAlign: 'right' }}>Nominal</th>
              </tr>
            </thead>
            <tbody>
              {currentExpenses.length > 0 ? (
                currentExpenses.map((exp, idx) => {
                  const branch = branches.find(b => b.id === (exp.branchId || 'branch-01'));
                  return (
                    <tr key={exp.id}>
                      <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                      {isAllBranches && <td>{branch ? branch.code : 'CBG'}</td>}
                      <td>{formatIndonesianDate(exp.date)}</td>
                      <td>{exp.category.replace('_', ' ').toUpperCase()}</td>
                      <td><strong>{exp.title}</strong></td>
                      <td>{exp.paidTo || '-'}</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatRupiah(exp.amount)}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={isAllBranches ? 7 : 6} style={{ textAlign: 'center', fontStyle: 'italic' }}>
                    Tidak ada transaksi pengeluaran pada periode ini.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={isAllBranches ? 6 : 5} style={{ textAlign: 'right', fontWeight: 'bold' }}>
                  TOTAL BEBAN OPERASIONAL:
                </td>
                <td style={{ textAlign: 'right' }}>{formatRupiah(summary.totalExpense)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Formal Sign-off Section */}
        <div className="print-break-inside-avoid pt-4 border-t border-slate-400">
          <div className="grid grid-cols-2 text-center text-xs">
            <div>
              <p className="text-slate-600">Dibuat & Divalidasi Oleh,</p>
              <div className="h-16"></div>
              <p className="font-bold underline text-slate-900">Staff Administrasi & Keuangan</p>
              <p className="text-[10px] text-slate-500">Sistem Manajemen Kos Otomatis</p>
            </div>
            <div>
              <p className="text-slate-600">Disetujui & Diterima Oleh,</p>
              <div className="h-16"></div>
              <p className="font-bold underline text-slate-900">Pemilik Kos / Direksi Enterprise</p>
              <p className="text-[10px] text-slate-500">{settings.kostName || 'Kosan Enterprise'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SCREEN VIEW (Interactive Rich UI Dashboard)                               */}
      {/* ========================================================================= */}
      {/* KPI Cards Grid */}
      <div className="no-print grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Income */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-slate-500">
                {isAllBranches ? 'Total Pemasukan (Semua Cabang)' : 'Pemasukan Sewa'}
              </p>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1.5 font-heading">
                {formatRupiah(summary.totalIncome)}
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-emerald-700 font-medium">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{summary.paidInvoicesCount} Kamar Lunas</span>
            </div>
            <span className="text-[11px] text-slate-400 font-normal">
              Okupansi: {summary.occupancyRate}%
            </span>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-slate-500">
                {isAllBranches ? 'Pengeluaran (Semua Cabang)' : 'Pengeluaran Operasional'}
              </p>
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

        {/* Net Profit with Dynamic Status Colors */}
        {(() => {
          const profitMargin = summary.totalIncome > 0 
            ? Math.round((summary.netProfit / summary.totalIncome) * 100) 
            : (summary.netProfit < 0 ? -100 : 0);
          const isNegative = summary.netProfit < 0;
          const isLowMargin = !isNegative && profitMargin <= 20;

          return (
            <div
              className={`rounded-2xl p-4 sm:p-5 shadow-xs relative overflow-hidden transition-all duration-200 border ${
                isNegative
                  ? 'bg-rose-50/80 border-rose-300 text-rose-900 shadow-rose-100/50'
                  : isLowMargin
                  ? 'bg-amber-50/80 border-amber-300 text-amber-900 shadow-amber-100/50'
                  : 'bg-emerald-50/60 border-emerald-200 text-emerald-900 shadow-emerald-100/50'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p
                    className={`text-xs font-bold ${
                      isNegative
                        ? 'text-rose-700'
                        : isLowMargin
                        ? 'text-amber-800'
                        : 'text-emerald-800'
                    }`}
                  >
                    Laba Bersih (Net Profit)
                  </p>
                  <h3
                    className={`text-xl sm:text-2xl font-black mt-1.5 font-heading tracking-tight ${
                      isNegative
                        ? 'text-rose-600'
                        : isLowMargin
                        ? 'text-amber-700'
                        : 'text-emerald-700'
                    }`}
                  >
                    {formatRupiah(summary.netProfit)}
                  </h3>
                </div>
                <div
                  className={`p-2.5 rounded-xl text-white shadow-2xs ${
                    isNegative
                      ? 'bg-rose-600'
                      : isLowMargin
                      ? 'bg-amber-500'
                      : 'bg-emerald-600'
                  }`}
                >
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 text-xs text-slate-700 font-medium flex items-center justify-between">
                <span>
                  Margin Keuntungan:{' '}
                  <strong
                    className={`font-black ${
                      isNegative
                        ? 'text-rose-600'
                        : isLowMargin
                        ? 'text-amber-700'
                        : 'text-emerald-700'
                    }`}
                  >
                    {profitMargin}%
                  </strong>
                </span>
                {isNegative && (
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-rose-200/80 text-rose-800 border border-rose-300">
                    Defisit
                  </span>
                )}
                {isLowMargin && (
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-800 border border-amber-300">
                    Margin Tipis
                  </span>
                )}
              </div>
            </div>
          );
        })()}

        {/* Total Belum Bayar / Tunggakan */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-slate-500">Tunggakan / Belum Lunas</p>
              <h3 className="text-xl sm:text-2xl font-extrabold text-amber-700 mt-1.5 font-heading font-mono">
                {formatRupiah(summary.totalUnpaidAmount)}
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-amber-800 font-medium">
            <span>{summary.unpaidOccupiedRoomsCount} dari {summary.occupancyCount} kamar terisi belum lunas</span>
          </div>
        </div>
      </div>

      {/* SECTION: INTEGRATED MULTI-BRANCH FINANCIAL BREAKDOWN (Visible when 'Semua Cabang') */}
      {isAllBranches && summary.branchBreakdowns && summary.branchBreakdowns.length > 0 && (
        <div className="no-print bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-teal-600" />
                <h3 className="text-base font-extrabold text-slate-900 font-heading">
                  Performa & Kontribusi Keuangan Per Cabang Properti
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Perbandingan pemasukan, efisiensi operasional, okupansi kamar, dan laba bersih tiap unit properti
              </p>
            </div>
            <span className="text-xs px-3 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200 font-bold self-start sm:self-auto">
              {branches.length} Cabang Aktif
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider bg-slate-50 font-semibold">
                  <th className="py-3 px-3">Nama Cabang</th>
                  <th className="py-3 px-3">Kota & Pengelola</th>
                  <th className="py-3 px-3">Okupansi Kamar</th>
                  <th className="py-3 px-3">Total Pemasukan</th>
                  <th className="py-3 px-3">Pengeluaran</th>
                  <th className="py-3 px-3">Laba Bersih</th>
                  <th className="py-3 px-3">Tunggakan</th>
                  <th className="py-3 px-3 text-right">Aksi Filter</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {summary.branchBreakdowns.map(branch => {
                  const margin = branch.totalIncome > 0 
                    ? Math.round((branch.netProfit / branch.totalIncome) * 100) 
                    : 0;

                  return (
                    <tr key={branch.branchId} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-teal-600" />
                          <span>{branch.branchName}</span>
                        </div>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-semibold">
                          {branch.branchCode}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <div className="text-slate-900 font-medium">{branch.city}</div>
                        <div className="text-[11px] text-slate-500">PJ: {branch.managerName}</div>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">
                            {branch.occupiedRooms} / {branch.totalRooms} Pintu
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                            branch.occupancyRate >= 80 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {branch.occupancyRate}%
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3 font-mono font-bold text-emerald-700 whitespace-nowrap">
                        {formatRupiah(branch.totalIncome)}
                      </td>

                      <td className="py-3 px-3 font-mono text-rose-600 whitespace-nowrap">
                        {formatRupiah(branch.totalExpense)}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="font-mono font-extrabold text-slate-900">
                          {formatRupiah(branch.netProfit)}
                        </div>
                        <span className="text-[10px] text-slate-500">
                          Margin: {margin}%
                        </span>
                      </td>

                      <td className="py-3 px-3 font-mono whitespace-nowrap">
                        {branch.unpaidAmount > 0 ? (
                          <span className="text-amber-700 font-bold">
                            {formatRupiah(branch.unpaidAmount)}
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-medium">Lunas</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => setSelectedBranchId(branch.branchId)}
                          className="px-2.5 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 text-xs font-semibold inline-flex items-center gap-1 transition cursor-pointer"
                          title={`Tampilkan hanya laporan keuangan ${branch.branchName}`}
                        >
                          <span>Rincian Cabang</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold text-slate-900">
                  <td colSpan={2} className="py-3 px-3 uppercase text-slate-600">
                    Total Seluruh Cabang:
                  </td>
                  <td className="py-3 px-3 text-slate-900">
                    {summary.occupancyCount} / {summary.totalRooms} Pintu ({summary.occupancyRate}%)
                  </td>
                  <td className="py-3 px-3 font-mono font-extrabold text-emerald-700">
                    {formatRupiah(summary.totalIncome)}
                  </td>
                  <td className="py-3 px-3 font-mono text-rose-600">
                    {formatRupiah(summary.totalExpense)}
                  </td>
                  <td className="py-3 px-3 font-mono font-extrabold text-slate-900">
                    {formatRupiah(summary.netProfit)}
                  </td>
                  <td className="py-3 px-3 font-mono text-amber-700">
                    {formatRupiah(summary.totalUnpaidAmount)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="no-print grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Bar Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900 font-heading">
                Tren Pemasukan, Pengeluaran & Laba Bulanan ({isAllBranches ? 'Konsolidasi Semua Cabang' : selectedBranchObj?.name})
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
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="Pemasukan" fill="#10b981" radius={[4, 4, 0, 0]} name="Pemasukan (Omzet)" />
                <Bar dataKey="Pengeluaran" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Pengeluaran Operasional" />
                <Bar dataKey="LabaBersih" fill="#0284c7" radius={[4, 4, 0, 0]} name="Laba Bersih" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Category Breakdown Pie Chart */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900 font-heading">
                Distribusi Beban Operasional
              </h3>
            </div>
          </div>
          {pieData.length > 0 ? (
            <>
              <div className="h-44 w-full relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
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
                        fontSize: '11px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-2 text-[11px] text-slate-600 max-h-24 overflow-y-auto">
                {pieData.map((item, idx) => (
                  <div key={item.name} className="flex items-center gap-1.5 truncate">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                    />
                    <span className="truncate">{item.name}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-400 text-xs italic">
              Belum ada data biaya operasional tercatat bulan ini
            </div>
          )}
        </div>
      </div>

      {/* Table 1: Rekapitulasi Pemasukan Kamar */}
      <div className="no-print bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-emerald-600" />
              <h3 className="text-base font-extrabold text-slate-900 font-heading">
                Rekapitulasi Pemasukan Kamar ({formatIndonesianMonthYear(activeReportMonth)})
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {isAllBranches 
                ? `Rincian per pintu kamar dari ${branches.length} cabang properti (${currentRooms.length} Total Pintu Terdaftar)`
                : `Rincian per pintu kamar untuk cabang ${selectedBranchObj?.name} (${currentRooms.length} Pintu)`}
            </p>
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold self-start sm:self-auto">
            {summary.paidInvoicesCount} dari {currentRooms.length} Kamar Lunas
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider bg-slate-50 font-semibold">
                {isAllBranches && <th className="py-3 px-3">Cabang</th>}
                <th className="py-3 px-3">Kamar</th>
                <th className="py-3 px-3">Tipe</th>
                <th className="py-3 px-3">Penghuni</th>
                <th className="py-3 px-3">Tarif Sewa Pokok</th>
                <th className="py-3 px-3">Biaya Tambahan</th>
                <th className="py-3 px-3">Total Tagihan</th>
                <th className="py-3 px-3">Metode Bayar</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {currentRooms.map(room => {
                const inv = currentInvoices.find(i => i.roomId === room.id);
                const isPaid = inv?.status === 'lunas';
                const isPending = inv?.status === 'menunggu_verifikasi';
                const isUnpaid = inv?.status === 'belum_bayar' || (!inv && room.tenant);
                const isVacant = room.status === 'kosong' && !room.tenant;
                const additionalFeesSum = inv?.additionalFees.reduce((s, f) => s + f.amount, 0) || 0;
                const totalBill = inv ? inv.totalAmount : (isVacant ? 0 : room.basePrice);
                const branch = branches.find(b => b.id === (room.branchId || 'branch-01'));

                return (
                  <tr key={room.id} className="hover:bg-slate-50/80 transition">
                    {isAllBranches && (
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200 font-bold text-[10px]">
                          {branch ? branch.code : 'CBG'}
                        </span>
                      </td>
                    )}
                    <td className="py-3 px-3 font-bold text-slate-900 whitespace-nowrap">
                      {room.roomNumber}
                      <span className="text-[10px] text-slate-400 font-normal block">
                        Lantai {room.floor}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium">
                        {room.type}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {room.tenant ? (
                        <div>
                          <div className="font-semibold text-slate-900">{room.tenant.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{room.tenant.phone}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Siap Huni</span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600">
                      {formatRupiah(room.basePrice)}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-500">
                      {additionalFeesSum > 0 ? formatRupiah(additionalFeesSum) : '-'}
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
                    <td className="py-3 px-3 text-right whitespace-nowrap">
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
                            className="p-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold flex items-center gap-1 transition cursor-pointer shadow-2xs"
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
                <td colSpan={isAllBranches ? 4 : 3} className="py-3 px-3 uppercase text-slate-600">
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
      <div className="no-print bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Catat Pengeluaran Baru</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider bg-slate-50 font-semibold">
                {isAllBranches && <th className="py-3 px-3">Cabang</th>}
                <th className="py-3 px-3">Tanggal</th>
                <th className="py-3 px-3">Kategori</th>
                <th className="py-3 px-3">Deskripsi Pengeluaran</th>
                <th className="py-3 px-3">Dibayarkan Kepada / Vendor</th>
                <th className="py-3 px-3 text-right">Jumlah (IDR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {currentExpenses.length > 0 ? (
                currentExpenses.map(exp => {
                  const branch = branches.find(b => b.id === (exp.branchId || 'branch-01'));
                  return (
                    <tr key={exp.id} className="hover:bg-slate-50/80 transition">
                      {isAllBranches && (
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200 font-bold text-[10px]">
                            {branch ? branch.code : 'CBG'}
                          </span>
                        </td>
                      )}
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
                  );
                })
              ) : (
                <tr>
                  <td colSpan={isAllBranches ? 6 : 5} className="py-6 text-center text-slate-400 italic">
                    Belum ada data pengeluaran yang dicatat untuk bulan ini.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200 bg-slate-50 font-bold text-slate-900">
                <td colSpan={isAllBranches ? 5 : 4} className="py-3 px-3 uppercase text-slate-600 text-right">
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

      {/* Smart Financial Insights / Recommendations */}
      <div className="no-print bg-emerald-50/50 border border-emerald-200 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-2 text-emerald-800 mb-2">
          <Sparkles className="w-5 h-5 text-emerald-600" />
          <h3 className="font-bold text-sm text-slate-900 font-heading">
            Analisis & Evaluasi Performa Bisnis {isAllBranches ? 'Enterprise' : 'Kos'}
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-700 mt-3">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
            <span className="font-bold text-emerald-700 block">Kesehatan Arus Kas (Cash Flow)</span>
            <p className="text-slate-600 leading-relaxed">
              Dengan total laba bersih <strong className="text-slate-900">{formatRupiah(summary.netProfit)}</strong> (margin{' '}
              {summary.totalIncome > 0 ? Math.round((summary.netProfit / summary.totalIncome) * 100) : 0}%), arus kas properti{' '}
              {isAllBranches ? 'jaringan enterprise' : 'unit kos ini'} berada pada tingkat kesehatan yang prima.
            </p>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
            <span className="font-bold text-blue-700 block">Optimasi Kapasitas Kamar</span>
            <p className="text-slate-600 leading-relaxed">
              {summary.occupancyCount < summary.totalRooms ? (
                <>
                  Terdapat <strong className="text-slate-900">{summary.totalRooms - summary.occupancyCount} pintu kosong</strong> dari total {summary.totalRooms} pintu ({summary.occupancyRate}% Okupansi). Mengoptimalkan kamar kosong ini berpotensi meningkatkan omzet secara signifikan.
                </>
              ) : (
                `Seluruh ${summary.totalRooms} pintu kamar terisi penuh (100% Okupansi)! Pertahankan mutu pelayanan fasilitas prima.`
              )}
            </p>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
            <span className="font-bold text-amber-700 block">Digitalisasi Tagihan & QRIS</span>
            <p className="text-slate-600 leading-relaxed">
              Integrasi pembayaran QRIS Dinamis dan pengingat WhatsApp otomatis membantu memangkas tunggakan hingga 85% lebih cepat.
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PREVIEW MODAL (Pratinjau Data Laporan & Format CSV)                       */}
      {/* ========================================================================= */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-5 sm:px-6 py-4 flex items-center justify-between shrink-0 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-blue-500/30 text-blue-200 text-[10px] font-bold uppercase tracking-wider">
                      Pratinjau Laporan
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      Periode: {formatIndonesianMonthYear(activeReportMonth)}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-base sm:text-lg font-heading text-white mt-0.5">
                    {isAllBranches ? 'Laporan Keuangan Konsolidasi (Semua Cabang)' : `Laporan Keuangan – ${selectedBranchObj?.name || 'Cabang'}`}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsPreviewModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                title="Tutup Pratinjau"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tab Switcher */}
            <div className="bg-slate-100/90 px-5 py-2.5 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto shrink-0">
              <button
                type="button"
                onClick={() => setPreviewTab('summary')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  previewTab === 'summary'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                <span>Ringkasan Eksekutif</span>
              </button>

              <button
                type="button"
                onClick={() => setPreviewTab('rooms')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  previewTab === 'rooms'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Table className="w-3.5 h-3.5 text-blue-600" />
                <span>Pemasukan Kamar ({currentRooms.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setPreviewTab('expenses')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  previewTab === 'expenses'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
                <span>Pengeluaran ({currentExpenses.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setPreviewTab('raw_csv')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  previewTab === 'raw_csv'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileCode className="w-3.5 h-3.5 text-purple-600" />
                <span>Format Raw CSV</span>
              </button>
            </div>

            {/* Modal Body Content (Scrollable) */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 text-xs space-y-4">
              {/* TAB 1: SUMMARY */}
              {previewTab === 'summary' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    <div className="bg-emerald-50/70 border border-emerald-200 p-3.5 rounded-xl space-y-1">
                      <span className="text-[10px] font-bold uppercase text-emerald-800 block">Total Pemasukan</span>
                      <span className="text-base sm:text-lg font-black text-emerald-700 font-mono">
                        {formatRupiah(summary.totalIncome)}
                      </span>
                    </div>

                    <div className="bg-rose-50/70 border border-rose-200 p-3.5 rounded-xl space-y-1">
                      <span className="text-[10px] font-bold uppercase text-rose-800 block">Total Pengeluaran</span>
                      <span className="text-base sm:text-lg font-black text-rose-700 font-mono">
                        {formatRupiah(summary.totalExpense)}
                      </span>
                    </div>

                    <div className="bg-blue-50/70 border border-blue-200 p-3.5 rounded-xl space-y-1">
                      <span className="text-[10px] font-bold uppercase text-blue-800 block">Laba Bersih</span>
                      <span className="text-base sm:text-lg font-black text-blue-700 font-mono">
                        {formatRupiah(summary.netProfit)}
                      </span>
                    </div>

                    <div className="bg-teal-50/70 border border-teal-200 p-3.5 rounded-xl space-y-1">
                      <span className="text-[10px] font-bold uppercase text-teal-800 block">Tingkat Okupansi</span>
                      <span className="text-base sm:text-lg font-black text-teal-700 font-heading">
                        {summary.occupancyRate}% <span className="text-xs font-normal text-slate-500">({summary.occupancyCount}/{summary.totalRooms})</span>
                      </span>
                    </div>

                    <div className="bg-amber-50/70 border border-amber-200 p-3.5 rounded-xl space-y-1 col-span-2 sm:col-span-1">
                      <span className="text-[10px] font-bold uppercase text-amber-800 block">Total Tunggakan</span>
                      <span className="text-base sm:text-lg font-black text-amber-700 font-mono">
                        {formatRupiah(summary.totalUnpaidAmount)}
                      </span>
                    </div>
                  </div>

                  {isAllBranches && summary.branchBreakdowns && summary.branchBreakdowns.length > 0 && (
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <div className="bg-slate-50 px-4 py-2.5 font-bold text-slate-800 border-b border-slate-200 flex items-center justify-between">
                        <span>Kontribusi Finansial Antar Cabang Properti</span>
                        <span className="text-[11px] text-slate-500 font-normal">{summary.branchBreakdowns.length} Cabang</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-100/70 text-slate-600 font-bold border-b border-slate-200 text-[11px]">
                              <th className="py-2 px-3">Nama Cabang</th>
                              <th className="py-2 px-3 text-center">Okupansi</th>
                              <th className="py-2 px-3 text-right">Pemasukan</th>
                              <th className="py-2 px-3 text-right">Pengeluaran</th>
                              <th className="py-2 px-3 text-right">Laba Bersih</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-[11px]">
                            {summary.branchBreakdowns.map(b => (
                              <tr key={b.branchId} className="hover:bg-slate-50">
                                <td className="py-2 px-3 font-bold text-slate-800">
                                  {b.branchName} ({b.city})
                                </td>
                                <td className="py-2 px-3 text-center">
                                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold">
                                    {b.occupancyRate}%
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-right font-mono font-bold text-emerald-600">
                                  {formatRupiah(b.totalIncome)}
                                </td>
                                <td className="py-2 px-3 text-right font-mono font-bold text-rose-600">
                                  {formatRupiah(b.totalExpense)}
                                </td>
                                <td className="py-2 px-3 text-right font-mono font-black text-slate-900">
                                  {formatRupiah(b.netProfit)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: ROOMS & INCOMES */}
              {previewTab === 'rooms' && (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead>
                        <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                          <th className="py-2.5 px-3">No Kamar</th>
                          <th className="py-2.5 px-3">Tipe</th>
                          <th className="py-2.5 px-3">Nama Penghuni</th>
                          <th className="py-2.5 px-3 text-center">Status Bayar</th>
                          <th className="py-2.5 px-3">Metode</th>
                          <th className="py-2.5 px-3 text-right">Sewa Pokok</th>
                          <th className="py-2.5 px-3 text-right">Total Tagihan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {currentRooms.map(room => {
                          const inv = currentInvoices.find(i => i.roomId === room.id);
                          const isPaid = inv?.status === 'lunas';
                          return (
                            <tr key={room.id} className="hover:bg-slate-50">
                              <td className="py-2.5 px-3 font-extrabold text-slate-900 font-heading">
                                {room.roomNumber}
                              </td>
                              <td className="py-2.5 px-3 text-slate-600">{room.type}</td>
                              <td className="py-2.5 px-3 font-medium text-slate-800">
                                {room.tenant ? room.tenant.name : <span className="text-slate-400 italic">Kosong</span>}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  isPaid
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : room.status === 'kosong'
                                    ? 'bg-slate-100 text-slate-500'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}>
                                  {isPaid ? 'Lunas' : room.status === 'kosong' ? 'Kosong' : 'Belum Lunas'}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 uppercase text-[10px] text-slate-600">
                                {inv?.paymentMethod || '-'}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                                {formatRupiah(room.basePrice)}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                                {inv ? formatRupiah(inv.totalAmount) : '-'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: EXPENSES */}
              {previewTab === 'expenses' && (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  {currentExpenses.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-[11px]">
                        <thead>
                          <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                            <th className="py-2.5 px-3">Tanggal</th>
                            <th className="py-2.5 px-3">Kategori</th>
                            <th className="py-2.5 px-3">Deskripsi Pengeluaran</th>
                            <th className="py-2.5 px-3">Vendor / Penerima</th>
                            <th className="py-2.5 px-3 text-right">Jumlah Biaya</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {currentExpenses.map(exp => (
                            <tr key={exp.id} className="hover:bg-slate-50">
                              <td className="py-2.5 px-3 text-slate-600 font-mono">{exp.date}</td>
                              <td className="py-2.5 px-3 font-semibold text-slate-800">{exp.category}</td>
                              <td className="py-2.5 px-3 text-slate-700">{exp.title}</td>
                              <td className="py-2.5 px-3 text-slate-600">{exp.paidTo || '-'}</td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600">
                                {formatRupiah(exp.amount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="py-8 text-center text-slate-400 italic">
                      Tidak ada data pengeluaran tercatat untuk periode ini.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: RAW CSV */}
              {previewTab === 'raw_csv' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-600">
                      Format Teks CSV Standar (RFC 4180):
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyCsv}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition cursor-pointer flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedCsv ? '✓ Berhasil Disalin!' : 'Salin Semua Teks CSV'}</span>
                    </button>
                  </div>
                  <pre className="p-3.5 bg-slate-950 text-emerald-400 font-mono text-[10.5px] rounded-xl overflow-x-auto max-h-72 leading-relaxed selection:bg-emerald-800 selection:text-white border border-slate-800">
                    {getCsvRawText()}
                  </pre>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="bg-slate-50 px-5 sm:px-6 py-3.5 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 text-xs">
              <span className="text-slate-500 text-[11px] hidden sm:inline">
                Data laporan siap dicetak atau diekspor ke berbagai format.
              </span>

              <div className="flex items-center gap-2 flex-wrap justify-end">
                <button
                  type="button"
                  onClick={handleCopyCsv}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-200 transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-600" />
                  <span>{copiedCsv ? '✓ Tersalin!' : 'Salin CSV'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold border border-blue-200 transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600" />
                  <span>Unduh CSV</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportExcel}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Unduh XLS</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <Printer className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Cetak PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold transition cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

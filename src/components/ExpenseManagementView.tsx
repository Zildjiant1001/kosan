import React, { useState } from 'react';
import { useKost } from '../context/KostContext';
import { Expense, ExpenseCategory } from '../types';
import { MonthPickerPopover } from './MonthPickerPopover';
import { formatRupiah, formatIndonesianDate, formatIndonesianMonthYear } from '../utils/formatters';
import {
  Receipt,
  Plus,
  Edit,
  Trash2,
  Filter,
  Calendar,
  DollarSign,
  TrendingDown,
  Building,
  Building2,
  Zap,
  Droplets,
  Wifi,
  Trash,
  Wind,
  Wrench,
  UserCheck,
  MoreHorizontal,
  Layers,
  ChevronRight,
  X,
  Upload,
  Image as ImageIcon,
  Eye,
  FileCheck,
  Camera,
} from 'lucide-react';

interface ExpenseManagementViewProps {
  isOpenModalDirectly?: boolean;
}

export const ExpenseManagementView: React.FC<ExpenseManagementViewProps> = () => {
  const {
    expenses,
    allExpenses,
    branches,
    selectedBranchId,
    setSelectedBranchId,
    activeReportMonth,
    setActiveReportMonth,
    availableMonths,
    addExpense,
    updateExpense,
    deleteExpense,
  } = useKost();

  // Branch filter directly uses global synchronized selectedBranchId
  const expenseBranchFilter = selectedBranchId;
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<{ id: string; title: string } | null>(null);
  const [viewingProofExpense, setViewingProofExpense] = useState<Expense | null>(null);
  const [formError, setFormError] = useState('');

  // Form State for Recording New Expense
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>('listrik');
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState<number>(100000);
  const [expensePaidTo, setExpensePaidTo] = useState('');
  const [expenseNotes, setExpenseNotes] = useState('');
  const [expenseProofUrl, setExpenseProofUrl] = useState<string>('');
  const [formBranchId, setFormBranchId] = useState<string>(selectedBranchId || 'branch-01');

  // Form State for Editing Expense
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editCategory, setEditCategory] = useState<ExpenseCategory>('listrik');
  const [editTitle, setEditTitle] = useState('');
  const [editAmount, setEditAmount] = useState<number>(0);
  const [editPaidTo, setEditPaidTo] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editProofUrl, setEditProofUrl] = useState<string>('');
  const [editBranchId, setEditBranchId] = useState<string>('branch-01');
  const [editFormError, setEditFormError] = useState('');

  const isAllBranches = expenseBranchFilter === 'all';
  const activeBranchObj = !isAllBranches ? branches.find(b => b.id === expenseBranchFilter) : null;

  const baseExpenses = isAllBranches 
    ? allExpenses 
    : allExpenses.filter(e => (e.branchId || 'branch-01') === expenseBranchFilter);

  const filteredExpenses = baseExpenses.filter(e => {
    if (e.month !== activeReportMonth) return false;
    if (categoryFilter !== 'all' && e.category !== categoryFilter) return false;
    return true;
  });

  const totalExpenseThisMonth = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Compute breakdown per branch for active report month
  const branchExpenseBreakdown = branches.map(b => {
    const bExpenses = allExpenses.filter(e => (e.branchId || 'branch-01') === b.id && e.month === activeReportMonth);
    const bTotal = bExpenses.reduce((sum, e) => sum + e.amount, 0);
    return {
      branchId: b.id,
      branchName: b.name,
      branchCode: b.code,
      total: bTotal,
      count: bExpenses.length,
    };
  });

  const handleOpenAddModal = () => {
    const initialBranchId = expenseBranchFilter !== 'all' 
      ? expenseBranchFilter 
      : (selectedBranchId || branches[0]?.id || 'branch-01');
    setFormBranchId(initialBranchId);
    setExpenseDate(new Date().toISOString().split('T')[0]);
    setExpenseCategory('listrik');
    setExpenseTitle('');
    setExpenseAmount(100000);
    setExpensePaidTo('');
    setExpenseNotes('');
    setExpenseProofUrl('');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (isEdit) {
          setEditProofUrl(reader.result as string);
        } else {
          setExpenseProofUrl(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseTitle || expenseAmount <= 0) {
      setFormError('Mohon isi judul dan nominal pengeluaran dengan benar!');
      return;
    }
    setFormError('');

    await addExpense({
      date: expenseDate,
      month: expenseDate.substring(0, 7),
      category: expenseCategory,
      title: expenseTitle,
      amount: Number(expenseAmount),
      paidTo: expensePaidTo,
      notes: expenseNotes,
      proofImageUrl: expenseProofUrl || undefined,
      branchId: formBranchId,
    });

    // Reset Form
    setExpenseTitle('');
    setExpensePaidTo('');
    setExpenseNotes('');
    setExpenseProofUrl('');
    setIsModalOpen(false);
  };

  const handleOpenEditModal = (exp: Expense) => {
    setEditingExpense(exp);
    setEditDate(exp.date);
    setEditCategory(exp.category);
    setEditTitle(exp.title);
    setEditAmount(exp.amount);
    setEditPaidTo(exp.paidTo || '');
    setEditNotes(exp.notes || '');
    setEditProofUrl(exp.proofImageUrl || '');
    setEditBranchId(exp.branchId || selectedBranchId || 'branch-01');
    setEditFormError('');
  };

  const handleEditExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense) return;
    if (!editTitle || editAmount <= 0) {
      setEditFormError('Mohon isi judul dan nominal pengeluaran dengan benar!');
      return;
    }
    setEditFormError('');

    await updateExpense({
      ...editingExpense,
      date: editDate,
      month: editDate.substring(0, 7),
      category: editCategory,
      title: editTitle,
      amount: Number(editAmount),
      paidTo: editPaidTo,
      notes: editNotes,
      proofImageUrl: editProofUrl || undefined,
      branchId: editBranchId,
    });

    setEditingExpense(null);
  };

  const getCategoryIcon = (category: ExpenseCategory) => {
    switch (category) {
      case 'listrik':
        return <Zap className="w-4 h-4 text-amber-400" />;
      case 'air_pdam':
        return <Droplets className="w-4 h-4 text-blue-400" />;
      case 'wifi_internet':
        return <Wifi className="w-4 h-4 text-cyan-400" />;
      case 'kebersihan_sampah':
        return <Trash className="w-4 h-4 text-emerald-400" />;
      case 'maintenance_ac':
        return <Wind className="w-4 h-4 text-indigo-400" />;
      case 'perbaikan_fasilitas':
        return <Wrench className="w-4 h-4 text-rose-400" />;
      case 'gaji_pengelola':
        return <UserCheck className="w-4 h-4 text-purple-400" />;
      default:
        return <MoreHorizontal className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div id="expense-management-view" className="space-y-5">
      {/* Top Standardized Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200 flex items-center gap-1.5 shadow-2xs">
              <Receipt className="w-3.5 h-3.5" />
              <span>Biaya Operasional & Utilitas</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 text-xs font-bold border border-teal-200 flex items-center gap-1 shadow-2xs">
              <Building2 className="w-3 h-3" />
              <span>{isAllBranches ? `Semua Cabang (${branches.length})` : (activeBranchObj?.name || 'Cabang')}</span>
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Periode: <strong className="text-slate-800">{formatIndonesianMonthYear(activeReportMonth)}</strong>
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-heading tracking-tight">
            {isAllBranches 
              ? 'Catatan Pengeluaran Terintegrasi' 
              : `Catatan Pengeluaran – ${activeBranchObj?.name || 'Cabang'}`}
          </h1>
          <p className="text-xs text-slate-500">
            {isAllBranches
              ? `Kelola tagihan utilitas, pemeliharaan AC, kebersihan & pengeluaran operasional dari ${branches.length} cabang properti terdaftar.`
              : `Kelola pos biaya dan pengeluaran operasional khusus unit ${activeBranchObj?.name}.`}
          </p>
        </div>

        {/* Action Controls & Filters */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Month Filter Popover */}
          <MonthPickerPopover
            id="expense-month-picker"
            value={activeReportMonth}
            onChange={setActiveReportMonth}
            label="Bulan:"
            align="right"
          />
        </div>
      </div>

      {/* Summary Card & Category Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Total Expense Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">
              {isAllBranches ? 'Total Pengeluaran (Semua Cabang)' : `Pengeluaran ${activeBranchObj?.name || 'Cabang'}`}
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-rose-600 font-mono mt-1">
              {formatRupiah(totalExpenseThisMonth)}
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>{filteredExpenses.length} transaksi tercatat</span>
            <span className="font-semibold text-slate-700">{formatIndonesianMonthYear(activeReportMonth)}</span>
          </div>
        </div>

        {/* Category Filters */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-center">
          <span className="text-xs text-slate-600 font-semibold mb-2 block">
            Filter Berdasarkan Kategori Biaya:
          </span>
          <div className="flex flex-wrap gap-1.5 text-xs">
            {[
              { id: 'all', label: 'Semua Kategori' },
              { id: 'listrik', label: '⚡ Listrik PLN' },
              { id: 'air_pdam', label: '💧 Air PDAM' },
              { id: 'wifi_internet', label: '🌐 WiFi Indihome' },
              { id: 'kebersihan_sampah', label: '🗑️ Sampah & RT' },
              { id: 'maintenance_ac', label: '❄️ Servis AC' },
              { id: 'gaji_pengelola', label: '👤 Gaji Pengelola' },
              { id: 'perbaikan_fasilitas', label: '🛠️ Perbaikan' },
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-3 py-1.5 rounded-xl font-medium transition cursor-pointer ${
                  categoryFilter === cat.id
                    ? 'bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs font-bold'
                    : 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mini Multi-Branch Breakdown Cards (When 'Semua Cabang' is selected) */}
      {isAllBranches && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {branchExpenseBreakdown.map(b => (
            <div 
              key={b.branchId} 
              className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs flex items-center justify-between hover:border-teal-300 transition"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-teal-600" />
                  <span className="font-bold text-xs text-slate-900">{b.branchName}</span>
                </div>
                <span className="text-[11px] text-slate-500 font-mono">
                  {b.count} transaksi • {b.branchCode}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold font-mono text-rose-600 block">
                  {formatRupiah(b.total)}
                </span>
                <button
                  onClick={() => setSelectedBranchId(b.branchId)}
                  className="text-[10px] text-teal-700 hover:underline font-semibold cursor-pointer inline-flex items-center gap-0.5"
                >
                  <span>Filter Cabang</span>
                  <ChevronRight className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Expenses History Table Container */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        {/* Table Header & Action Toolbar with Button "+ Catat Biaya Baru" */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-rose-600" />
              <h3 className="text-base font-extrabold text-slate-900 font-heading">
                Riwayat & Rekapitulasi Pengeluaran ({formatIndonesianMonthYear(activeReportMonth)})
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {isAllBranches 
                ? `Daftar seluruh transaksi biaya operasional dari ${branches.length} cabang properti`
                : `Daftar transaksi biaya operasional untuk unit ${activeBranchObj?.name}`}
            </p>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>+ Catat Biaya Baru</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider bg-slate-50">
                {isAllBranches && <th className="py-3 px-3">Cabang</th>}
                <th className="py-3 px-3 rounded-l-lg">Tanggal</th>
                <th className="py-3 px-3">Kategori</th>
                <th className="py-3 px-3">Deskripsi Pengeluaran</th>
                <th className="py-3 px-3">Dibayarkan Kepada / Vendor</th>
                <th className="py-3 px-3">Bukti / Struk</th>
                <th className="py-3 px-3">Catatan</th>
                <th className="py-3 px-3 text-right">Nominal (IDR)</th>
                <th className="py-3 px-3 text-center rounded-r-lg">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredExpenses.length > 0 ? (
                filteredExpenses.map(exp => {
                  const branch = branches.find(b => b.id === (exp.branchId || 'branch-01'));
                  return (
                    <tr key={exp.id} className="hover:bg-slate-50/80 transition">
                      {isAllBranches && (
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200 font-bold text-[10px]">
                            {branch ? branch.code : 'CBG'}
                          </span>
                        </td>
                      )}
                      <td className="py-3 px-3 font-mono text-slate-500 whitespace-nowrap">
                        {formatIndonesianDate(exp.date)}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          {getCategoryIcon(exp.category)}
                          <span className="capitalize font-semibold text-slate-700">
                            {exp.category.replace('_', ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900">{exp.title}</td>
                      <td className="py-3 px-3 text-slate-600">{exp.paidTo || '-'}</td>
                      
                      {/* Bukti / Struk Column */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {exp.proofImageUrl ? (
                          <button
                            onClick={() => setViewingProofExpense(exp)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-semibold text-[11px] transition cursor-pointer"
                            title="Lihat foto bukti / struk pembayaran"
                          >
                            <ImageIcon className="w-3 h-3" />
                            <span>Lihat Bukti</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">-</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-slate-500 italic text-[11px] max-w-xs truncate">
                        {exp.notes || '-'}
                      </td>
                      <td className="py-3 px-3 font-mono font-extrabold text-rose-600 text-right whitespace-nowrap">
                        {formatRupiah(exp.amount)}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEditModal(exp)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                            title="Edit catatan pengeluaran"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTargetId({ id: exp.id, title: exp.title })}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="Hapus catatan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={isAllBranches ? 9 : 8} className="py-8 text-center text-slate-400 italic">
                    Tidak ada transaksi pengeluaran pada kategori ini untuk bulan dan cabang terpilih.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold text-slate-900">
                <td colSpan={isAllBranches ? 7 : 6} className="py-3 px-3 uppercase text-slate-600 text-right">
                  Total Pengeluaran:
                </td>
                <td className="py-3 px-3 font-mono font-extrabold text-rose-600 text-sm text-right whitespace-nowrap">
                  {formatRupiah(totalExpenseThisMonth)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Modal: Add Expense */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 font-heading">
                    Catat Pengeluaran Operasional Kos
                  </h3>
                  <p className="text-xs text-slate-500">Tambah pos pengeluaran operasional baru</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddExpenseSubmit} className="space-y-4 text-xs">
              {formError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-medium">
                  {formError}
                </div>
              )}

              {/* Branch Selector for New Expense */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Cabang Properti Terdaftar *</label>
                <select
                  value={formBranchId}
                  onChange={e => setFormBranchId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-teal-800 font-bold focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer shadow-2xs"
                >
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code} - {b.city})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Tanggal Transaksi *</label>
                  <input
                    type="date"
                    required
                    value={expenseDate}
                    onChange={e => setExpenseDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-500 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Kategori Biaya *</label>
                  <select
                    value={expenseCategory}
                    onChange={e => setExpenseCategory(e.target.value as ExpenseCategory)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer shadow-2xs"
                  >
                    <option value="listrik">Listrik PLN (Induk/Fasum)</option>
                    <option value="air_pdam">Air PDAM & Tandon</option>
                    <option value="wifi_internet">WiFi Internet 100Mbps</option>
                    <option value="kebersihan_sampah">Kebersihan & Iuran RT</option>
                    <option value="maintenance_ac">Cuci & Servis AC</option>
                    <option value="perbaikan_fasilitas">Perbaikan & Kerusakan</option>
                    <option value="gaji_pengelola">Gaji Pengelola / Kebersihan</option>
                    <option value="lain_lain">Lain-lain</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Judul / Deskripsi Pengeluaran *</label>
                <input
                  type="text"
                  required
                  value={expenseTitle}
                  onChange={e => setExpenseTitle(e.target.value)}
                  placeholder="Contoh: Tagihan WiFi Indihome Bulan Agustus"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-500 shadow-2xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Nominal Biaya (IDR) *</label>
                  <input
                    type="number"
                    required
                    min={1000}
                    value={expenseAmount}
                    onChange={e => setExpenseAmount(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-500 font-mono text-sm font-bold shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Dibayarkan Kepada / Vendor</label>
                  <input
                    type="text"
                    value={expensePaidTo}
                    onChange={e => setExpensePaidTo(e.target.value)}
                    placeholder="Contoh: PT Telkom / Pak Joko"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-500 shadow-2xs"
                  />
                </div>
              </div>

              {/* Upload Bukti Pembayaran / Struk */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Upload Bukti Pembayaran / Struk (Opsional)
                </label>
                
                {expenseProofUrl ? (
                  <div className="relative border border-slate-200 rounded-xl p-3 bg-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <img 
                        src={expenseProofUrl} 
                        alt="Bukti Pengeluaran" 
                        className="w-12 h-12 object-cover rounded-lg border border-slate-300 shrink-0" 
                      />
                      <div className="overflow-hidden">
                        <span className="font-bold text-slate-900 block truncate">Bukti Pembayaran Terlampir</span>
                        <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                          <FileCheck className="w-3 h-3" />
                          File foto siap disimpan
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setExpenseProofUrl('')}
                      className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-100/60 transition cursor-pointer"
                      title="Hapus foto bukti"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="border-2 border-dashed border-slate-300 hover:border-rose-400 rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-slate-50 hover:bg-rose-50/30 transition text-center">
                      <Upload className="w-5 h-5 text-slate-400" />
                      <span className="font-bold text-slate-700">Pilih Foto Bukti / Struk Nota</span>
                      <span className="text-[11px] text-slate-400">Mendukung format JPG, PNG, atau WEBP</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => handleFileUpload(e, false)}
                        className="hidden"
                      />
                    </label>
                    
                    <button
                      type="button"
                      onClick={() => setExpenseProofUrl('https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80')}
                      className="text-[11px] text-rose-600 hover:underline font-semibold cursor-pointer inline-flex items-center gap-1"
                    >
                      <Camera className="w-3 h-3" />
                      <span>Gunakan contoh struk simulasi</span>
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Catatan Tambahan (Opsional)</label>
                <textarea
                  rows={2}
                  value={expenseNotes}
                  onChange={e => setExpenseNotes(e.target.value)}
                  placeholder="Keterangan tambahan atau nomor bukti transaksi..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-500 shadow-2xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 border border-slate-200 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-xs cursor-pointer"
                >
                  Simpan Biaya
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Expense */}
      {editingExpense && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
                  <Edit className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 font-heading">
                    Edit Catatan Pengeluaran
                  </h3>
                  <p className="text-xs text-slate-500">Perbarui rincian data pengeluaran</p>
                </div>
              </div>
              <button 
                onClick={() => setEditingExpense(null)} 
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditExpenseSubmit} className="space-y-4 text-xs">
              {editFormError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-medium">
                  {editFormError}
                </div>
              )}

              {/* Branch Selector for Edit */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Cabang Properti Terdaftar *</label>
                <select
                  value={editBranchId}
                  onChange={e => setEditBranchId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-teal-800 font-bold focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer shadow-2xs"
                >
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code} - {b.city})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Tanggal Transaksi *</label>
                  <input
                    type="date"
                    required
                    value={editDate}
                    onChange={e => setEditDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Kategori Biaya *</label>
                  <select
                    value={editCategory}
                    onChange={e => setEditCategory(e.target.value as ExpenseCategory)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-2xs"
                  >
                    <option value="listrik">Listrik PLN (Induk/Fasum)</option>
                    <option value="air_pdam">Air PDAM & Tandon</option>
                    <option value="wifi_internet">WiFi Internet 100Mbps</option>
                    <option value="kebersihan_sampah">Kebersihan & Iuran RT</option>
                    <option value="maintenance_ac">Cuci & Servis AC</option>
                    <option value="perbaikan_fasilitas">Perbaikan & Kerusakan</option>
                    <option value="gaji_pengelola">Gaji Pengelola / Kebersihan</option>
                    <option value="lain_lain">Lain-lain</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Judul / Deskripsi Pengeluaran *</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  placeholder="Contoh: Tagihan WiFi Indihome Bulan Agustus"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Nominal Biaya (IDR) *</label>
                  <input
                    type="number"
                    required
                    min={1000}
                    value={editAmount}
                    onChange={e => setEditAmount(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-sm font-bold shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Dibayarkan Kepada / Vendor</label>
                  <input
                    type="text"
                    value={editPaidTo}
                    onChange={e => setEditPaidTo(e.target.value)}
                    placeholder="Contoh: PT Telkom / Pak Joko"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
                  />
                </div>
              </div>

              {/* Upload / Ganti Bukti Pembayaran */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Bukti Pembayaran / Struk Nota
                </label>
                
                {editProofUrl ? (
                  <div className="relative border border-slate-200 rounded-xl p-3 bg-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <img 
                        src={editProofUrl} 
                        alt="Bukti Pengeluaran" 
                        className="w-12 h-12 object-cover rounded-lg border border-slate-300 shrink-0" 
                      />
                      <div className="overflow-hidden">
                        <span className="font-bold text-slate-900 block truncate">Bukti Pembayaran Terlampir</span>
                        <label className="text-[11px] text-blue-600 font-semibold hover:underline cursor-pointer">
                          Ganti Foto Bukti
                          <input
                            type="file"
                            accept="image/*"
                            onChange={e => handleFileUpload(e, true)}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditProofUrl('')}
                      className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-100/60 transition cursor-pointer"
                      title="Hapus foto bukti"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-slate-50 hover:bg-blue-50/30 transition text-center">
                      <Upload className="w-5 h-5 text-slate-400" />
                      <span className="font-bold text-slate-700">Unggah Foto Bukti / Struk</span>
                      <span className="text-[11px] text-slate-400">Mendukung format JPG, PNG, atau WEBP</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => handleFileUpload(e, true)}
                        className="hidden"
                      />
                    </label>
                    
                    <button
                      type="button"
                      onClick={() => setEditProofUrl('https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80')}
                      className="text-[11px] text-blue-600 hover:underline font-semibold cursor-pointer inline-flex items-center gap-1"
                    >
                      <Camera className="w-3 h-3" />
                      <span>Gunakan contoh struk simulasi</span>
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Catatan Tambahan (Opsional)</label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={e => setEditNotes(e.target.value)}
                  placeholder="Keterangan tambahan atau nomor bukti transaksi..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingExpense(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 border border-slate-200 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox Modal: View Proof Image Full-Size */}
      {viewingProofExpense && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 font-heading">
                    Bukti Pembayaran / Struk
                  </h3>
                  <p className="text-xs text-slate-500">{viewingProofExpense.title} &bull; {formatRupiah(viewingProofExpense.amount)}</p>
                </div>
              </div>
              <button
                onClick={() => setViewingProofExpense(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-950 flex items-center justify-center max-h-96">
              {viewingProofExpense.proofImageUrl ? (
                <img
                  src={viewingProofExpense.proofImageUrl}
                  alt={`Bukti ${viewingProofExpense.title}`}
                  className="max-h-96 w-auto object-contain"
                />
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Tidak ada gambar bukti terlampir.
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex justify-between items-center">
              <div>
                <span className="font-bold text-slate-900 block">{formatIndonesianDate(viewingProofExpense.date)}</span>
                <span className="text-slate-500">{viewingProofExpense.paidTo ? `Vendor: ${viewingProofExpense.paidTo}` : 'Operasional Kos'}</span>
              </div>
              <span className="font-bold font-mono text-rose-600 text-sm">
                {formatRupiah(viewingProofExpense.amount)}
              </span>
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={() => setViewingProofExpense(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Expense Modal */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm shadow-2xl p-5 space-y-3.5 text-xs text-slate-700 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-center text-slate-900">Hapus Catatan Pengeluaran?</h4>
            <p className="text-center text-slate-500 text-xs">
              Pengeluaran <strong>"{deleteTargetId.title}"</strong> akan dihapus dari laporan keuangan bulan ini.
            </p>
            <div className="pt-2 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setDeleteTargetId(null)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteExpense(deleteTargetId.id);
                  setDeleteTargetId(null);
                }}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-xs cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { useKost } from '../context/KostContext';
import { Expense, ExpenseCategory } from '../types';
import { formatRupiah, formatIndonesianDate, formatIndonesianMonthYear } from '../utils/formatters';
import {
  Receipt,
  Plus,
  Trash2,
  Filter,
  Calendar,
  DollarSign,
  TrendingDown,
  Building,
  Zap,
  Droplets,
  Wifi,
  Trash,
  Wind,
  Wrench,
  UserCheck,
  MoreHorizontal,
} from 'lucide-react';

interface ExpenseManagementViewProps {
  isOpenModalDirectly?: boolean;
}

export const ExpenseManagementView: React.FC<ExpenseManagementViewProps> = () => {
  const {
    expenses,
    activeReportMonth,
    setActiveReportMonth,
    availableMonths,
    addExpense,
    deleteExpense,
  } = useKost();

  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<{ id: string; title: string } | null>(null);
  const [formError, setFormError] = useState('');

  // Form State
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>('listrik');
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState<number>(100000);
  const [expensePaidTo, setExpensePaidTo] = useState('');
  const [expenseNotes, setExpenseNotes] = useState('');

  const filteredExpenses = expenses.filter(e => {
    if (e.month !== activeReportMonth) return false;
    if (categoryFilter !== 'all' && e.category !== categoryFilter) return false;
    return true;
  });

  const totalExpenseThisMonth = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  const handleAddExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseTitle || expenseAmount <= 0) {
      setFormError('Mohon isi judul dan nominal pengeluaran dengan benar!');
      return;
    }
    setFormError('');

    addExpense({
      date: expenseDate,
      month: expenseDate.substring(0, 7),
      category: expenseCategory,
      title: expenseTitle,
      amount: Number(expenseAmount),
      paidTo: expensePaidTo,
      notes: expenseNotes,
    });

    // Reset
    setExpenseTitle('');
    setExpensePaidTo('');
    setExpenseNotes('');
    setIsModalOpen(false);
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
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 font-heading">
                Pencatatan Pengeluaran Operasional
              </h2>
              <p className="text-xs text-slate-500">
                Kelola tagihan utilitas, pemeliharaan gedung & gaji pengelola kosan
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
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Catat Biaya Baru</span>
          </button>
        </div>
      </div>

      {/* Summary Card & Category Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <span className="text-xs text-slate-500 font-medium block">Total Pengeluaran Bulan Ini</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-rose-600 font-mono mt-1">
            {formatRupiah(totalExpenseThisMonth)}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">
            {filteredExpenses.length} transaksi tercatat pada {formatIndonesianMonthYear(activeReportMonth)}
          </span>
        </div>

        <div className="md:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-center">
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

      {/* Expenses Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider bg-slate-50">
                <th className="py-3 px-3 rounded-l-lg">Tanggal</th>
                <th className="py-3 px-3">Kategori</th>
                <th className="py-3 px-3">Deskripsi Pengeluaran</th>
                <th className="py-3 px-3">Dibayarkan Kepada / Vendor</th>
                <th className="py-3 px-3">Catatan</th>
                <th className="py-3 px-3 text-right">Nominal (IDR)</th>
                <th className="py-3 px-3 text-center rounded-r-lg">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredExpenses.length > 0 ? (
                filteredExpenses.map(exp => (
                  <tr key={exp.id} className="hover:bg-slate-50/80 transition">
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
                    <td className="py-3 px-3 text-slate-500 italic text-[11px] max-w-xs truncate">
                      {exp.notes || '-'}
                    </td>
                    <td className="py-3 px-3 font-mono font-extrabold text-rose-600 text-right">
                      {formatRupiah(exp.amount)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => setDeleteTargetId({ id: exp.id, title: exp.title })}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Hapus catatan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                    Tidak ada transaksi pengeluaran pada kategori ini untuk bulan terpilih.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold text-slate-900">
                <td colSpan={5} className="py-3 px-3 uppercase text-slate-600 text-right">
                  Total Pengeluaran:
                </td>
                <td className="py-3 px-3 font-mono font-extrabold text-rose-600 text-sm text-right">
                  {formatRupiah(totalExpenseThisMonth)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 font-heading">
                Catat Pengeluaran Operasional Kos
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddExpenseSubmit} className="space-y-4 text-xs">
              {formError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
                  {formError}
                </div>
              )}
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
                  className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 cursor-pointer"
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

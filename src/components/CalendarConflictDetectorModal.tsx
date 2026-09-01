'use client';

import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Sparkles,
  Building2,
  Calendar,
  Phone,
  MessageSquare,
  RefreshCw,
  Zap,
  Check,
  X,
  Plus,
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck,
  HelpCircle,
  Trash2,
  FileSpreadsheet,
} from 'lucide-react';
import {
  CalendarConflict,
  ConflictResolutionOption,
  ConflictSeverity,
  RentalBooking,
  Room,
} from '../types';
import { useKost } from '../context/KostContext';

interface CalendarConflictDetectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  conflicts: CalendarConflict[];
  onRefresh?: () => void;
}

export const CalendarConflictDetectorModal: React.FC<CalendarConflictDetectorModalProps> = ({
  isOpen,
  onClose,
  conflicts,
  onRefresh,
}) => {
  const {
    rooms,
    allBookings,
    addBooking,
    updateBooking,
    updateBookingStatus,
    deleteBooking,
    updateRoom,
    selectedBranchId,
  } = useKost();

  const [activeTab, setActiveTab] = useState<'all' | 'critical' | 'high' | 'buffer'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Filter conflicts
  const filteredConflicts = useMemo(() => {
    return conflicts.filter(c => {
      // Tab filter
      if (activeTab === 'critical' && c.severity !== 'critical') return false;
      if (activeTab === 'high' && c.severity !== 'high') return false;
      if (activeTab === 'buffer' && c.type !== 'TURNAROUND_TIGHT' && c.type !== 'ROOM_STATUS_MISMATCH') return false;

      // Search filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchRoom = c.roomNumber.toLowerCase().includes(q) || c.roomType.toLowerCase().includes(q);
        const matchPartyA = c.partyA.name.toLowerCase().includes(q) || c.partyA.phone.includes(q);
        const matchPartyB = c.partyB ? (c.partyB.name.toLowerCase().includes(q) || c.partyB.phone.includes(q)) : false;
        return matchRoom || matchPartyA || matchPartyB;
      }
      return true;
    });
  }, [conflicts, activeTab, searchQuery]);

  // Conflict Metrics
  const criticalCount = conflicts.filter(c => c.severity === 'critical').length;
  const highCount = conflicts.filter(c => c.severity === 'high').length;
  const escalatedCount = conflicts.filter(c => c.isEscalated).length;
  const autoResolvableCount = conflicts.filter(c => c.resolutionOptions.some(r => r.isAutoExecutable)).length;

  // Execute Resolution Option
  const handleExecuteResolution = async (conflict: CalendarConflict, option: ConflictResolutionOption) => {
    setExecutingId(option.id);
    try {
      if (option.actionType === 'REALLOCATE_ROOM' && option.suggestedRoomId) {
        const targetRoom = rooms.find(r => r.id === option.suggestedRoomId);
        await updateBooking(option.targetEntityId, {
          roomId: option.suggestedRoomId,
          roomNumber: option.suggestedRoomNumber || targetRoom?.roomNumber || `Kamar 0${option.suggestedRoomId}`,
          roomType: option.suggestedRoomType || targetRoom?.type || 'Deluxe AC',
          notes: `[Auto-Resolved] Direlokasi dari ${conflict.roomNumber} ke ${option.suggestedRoomNumber || targetRoom?.roomNumber} untuk mengatasi konflik double booking.`,
        });
        showToast(`✅ Berhasil! Pemesanan telah direlokasi ke ${option.suggestedRoomNumber || targetRoom?.roomNumber}.`);
      } else if (option.actionType === 'SHIFT_MOVE_IN_DATE' && option.suggestedNewDate) {
        await updateBooking(option.targetEntityId, {
          targetMoveDate: option.suggestedNewDate,
          notes: `[Auto-Resolved] Jadwal masuk disesuaikan ke ${option.suggestedNewDate} setelah masa sewa penghuni sebelumnya selesai.`,
        });
        showToast(`✅ Berhasil! Jadwal masuk diperbarui ke tanggal ${option.suggestedNewDate}.`);
      } else if (option.actionType === 'PRIORITIZE_FIRST_BOOKING' || option.actionType === 'REJECT_BOOKING') {
        await updateBookingStatus(option.targetEntityId, 'ditolak');
        showToast(`✅ Berhasil! Pemesanan ganda telah dibatalkan dengan status Ditolak.`);
      } else if (option.actionType === 'SYNC_ROOM_STATUS' && option.suggestedStatus) {
        const targetRoom = rooms.find(r => String(r.id) === option.targetEntityId);
        if (targetRoom) {
          await updateRoom({
            ...targetRoom,
            status: option.suggestedStatus as any,
          });
          showToast(`✅ Berhasil! Status ${targetRoom.roomNumber} disinkronkan menjadi '${option.suggestedStatus}'.`);
        }
      }

      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to execute resolution:', err);
      showToast('❌ Gagal menjalankan tindakan otomatis. Silakan coba kembali.');
    } finally {
      setExecutingId(null);
    }
  };

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  // WhatsApp Sender
  const handleOpenWhatsApp = (phone: string, text: string) => {
    let cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    }
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Simulation: Create a simulated double-booking
  const handleCreateSimulation = async () => {
    setIsSimulating(true);
    try {
      // Pick first occupied room or Room 1
      const targetRoom = rooms.find(r => r.tenant) || rooms[0];
      const todayStr = new Date().toISOString().split('T')[0];

      // Add simulated booking 1
      await addBooking({
        roomId: targetRoom.id,
        roomNumber: targetRoom.roomNumber,
        roomType: targetRoom.type,
        name: 'Budi Prakoso (Uji Coba Double-Booking)',
        phone: '081234567890',
        email: 'budi.test@example.com',
        occupation: 'Karyawan Tech',
        targetMoveDate: todayStr,
        durationMonths: 6,
        notes: 'SIMULASI KONFLIK: Permohonan sewa bertabrakan dengan jadwal hunian.',
        branchId: targetRoom.branchId || selectedBranchId || 'branch-01',
      });

      showToast('⚡ Simulasi Double-Booking berhasil dibuat! Lihat deteksi konflik di bawah.');
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Simulation error:', err);
      showToast('❌ Gagal membuat data simulasi.');
    } finally {
      setIsSimulating(false);
    }
  };

  // Clean all simulated test bookings
  const handleClearSimulation = async () => {
    const simBookings = allBookings.filter(b => b.name.includes('(Uji Coba') || b.notes?.includes('SIMULASI'));
    if (simBookings.length === 0) {
      showToast('Tidak ada data simulasi aktif.');
      return;
    }
    for (const b of simBookings) {
      await deleteBooking(b.id);
    }
    showToast(`🧹 ${simBookings.length} data simulasi telah dibersihkan.`);
    if (onRefresh) onRefresh();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Toast Alert */}
        {successToast && (
          <div className="bg-emerald-600 text-white px-5 py-3 text-xs font-bold flex items-center justify-between shadow-md animate-in slide-in-from-top duration-150">
            <span>{successToast}</span>
            <button onClick={() => setSuccessToast(null)} className="text-emerald-100 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 sm:p-6 shrink-0 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-200 text-[10px] font-bold border border-rose-400/30 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-300" />
                  <span>AI Conflict Detection & Resolution Engine</span>
                </span>
                <span className="text-xs text-indigo-200 font-medium">
                  KostHub Smart Property System
                </span>
              </div>
              
              <h2 className="text-xl sm:text-2xl font-black font-heading tracking-tight text-white flex items-center gap-2">
                <span>Detektor Konflik Kalender & Double-Booking</span>
              </h2>
              <p className="text-xs text-indigo-200/90 max-w-2xl leading-relaxed">
                Memindai tumpang tindih tanggal sewa, pemesanan ganda (double-booking), dan mengevaluasi solusi relokasi atau penyesuaian jadwal secara otomatis.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                title="Tutup Detektor"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Top 4 Insight Metric Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5 relative z-10">
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-3 text-center">
              <span className="text-[10px] font-semibold text-indigo-200 uppercase block">Total Konflik</span>
              <span className="text-xl font-black text-white font-mono mt-0.5 block">{conflicts.length}</span>
              <span className="text-[9px] text-indigo-200/80">Terdeteksi di sistem</span>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-3 text-center">
              <span className="text-[10px] font-semibold text-rose-300 uppercase block">Kritis (Double Booking)</span>
              <span className="text-xl font-black text-rose-400 font-mono mt-0.5 block">{criticalCount}</span>
              <span className="text-[9px] text-rose-200/80">Perlu tindakan cepat</span>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-3 text-center">
              <span className="text-[10px] font-semibold text-amber-300 uppercase block">Perlu Eskalasi (H-3)</span>
              <span className="text-xl font-black text-amber-400 font-mono mt-0.5 block">{escalatedCount}</span>
              <span className="text-[9px] text-amber-200/80">Mendekati tgl masuk</span>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-3 text-center">
              <span className="text-[10px] font-semibold text-emerald-300 uppercase block">Solusi 1-Click Ready</span>
              <span className="text-xl font-black text-emerald-400 font-mono mt-0.5 block">{autoResolvableCount}</span>
              <span className="text-[9px] text-emerald-200/80">Siap dieksekusi</span>
            </div>
          </div>
        </div>

        {/* Toolbar & Filter Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                activeTab === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Semua ({conflicts.length})
            </button>
            <button
              onClick={() => setActiveTab('critical')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                activeTab === 'critical'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              🔴 Kritis ({criticalCount})
            </button>
            <button
              onClick={() => setActiveTab('high')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                activeTab === 'high'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              🟡 Tumpang Tindih ({highCount})
            </button>
            <button
              onClick={() => setActiveTab('buffer')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                activeTab === 'buffer'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
              }`}
            >
              🔵 Buffer & Status
            </button>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Cari kamar / nama penyewa..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-56"
            />

            {/* Quick Simulation Trigger */}
            <button
              type="button"
              onClick={handleCreateSimulation}
              disabled={isSimulating}
              className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 transition flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
              title="Buat pemesanan bertabrakan untuk menguji detektor"
            >
              <Zap className="w-3.5 h-3.5 text-indigo-600" />
              <span>Simulasi Konflik</span>
            </button>

            <button
              type="button"
              onClick={handleClearSimulation}
              className="p-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-600 transition cursor-pointer shrink-0"
              title="Bersihkan Data Simulasi"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Conflict List Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {filteredConflicts.length > 0 ? (
            filteredConflicts.map((conflict, index) => {
              const isCritical = conflict.severity === 'critical';
              const isHigh = conflict.severity === 'high';

              return (
                <div
                  key={conflict.id}
                  className={`rounded-2xl border transition-all duration-200 p-4 sm:p-5 space-y-4 shadow-sm ${
                    isCritical
                      ? 'border-rose-300 bg-rose-50/20'
                      : isHigh
                      ? 'border-amber-300 bg-amber-50/20'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  {/* Conflict Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-200/80">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-slate-400">#{index + 1}</span>
                      
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${
                          isCritical
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : isHigh
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}
                      >
                        {isCritical && <AlertTriangle className="w-3 h-3 text-rose-600" />}
                        <span>{conflict.type.replace(/_/g, ' ')}</span>
                      </span>

                      <span className="font-extrabold text-sm text-slate-900 font-heading">
                        {conflict.roomNumber} ({conflict.roomType})
                      </span>

                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-teal-50 text-teal-800 text-[10px] font-bold border border-teal-200">
                        <Building2 className="w-3 h-3 text-teal-600" />
                        <span>{conflict.branchName}</span>
                      </span>

                      {conflict.isEscalated && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[9px] font-black uppercase animate-pulse">
                          🚨 Eskalasi Mendesak
                        </span>
                      )}
                    </div>

                    <div className="text-right text-xs text-slate-500">
                      Bertabrakan: <strong className="text-rose-700 font-bold font-mono">{conflict.overlapDays} Hari</strong>
                    </div>
                  </div>

                  {/* Description Box */}
                  <p className="text-xs text-slate-700 leading-relaxed font-medium bg-white p-3 rounded-xl border border-slate-200">
                    {conflict.description}
                  </p>

                  {/* Side-by-Side Comparison of Conflicting Parties */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {/* Party A */}
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Pihak 1: {conflict.partyA.type === 'tenant' ? 'Penghuni Aktif' : 'Pemohon Sewa'}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-[10px] border border-indigo-200">
                          {conflict.partyA.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                          {conflict.partyA.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-extrabold text-slate-900 text-xs truncate">
                            {conflict.partyA.name}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{conflict.partyA.phone}</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 pt-1.5 border-t border-slate-200/60 text-[11px]">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Mulai:</span>
                          <strong className="text-slate-800">{conflict.partyA.startDate || '-'}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Selesai/Durasi:</span>
                          <strong className="text-slate-800">{conflict.partyA.endDate || `${conflict.partyA.durationMonths} Bulan`}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Party B */}
                    {conflict.partyB && (
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            Pihak 2: {conflict.partyB.type === 'tenant' ? 'Penghuni Aktif' : 'Pemohon Sewa'}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-bold text-[10px] border border-amber-200">
                            {conflict.partyB.status}
                          </span>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-amber-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                            {conflict.partyB.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-extrabold text-slate-900 text-xs truncate">
                              {conflict.partyB.name}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{conflict.partyB.phone}</span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5 pt-1.5 border-t border-slate-200/60 text-[11px]">
                          <div>
                            <span className="text-slate-400 block text-[10px]">Target Masuk:</span>
                            <strong className="text-rose-700 font-bold">{conflict.partyB.startDate || '-'}</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Durasi Sewa:</span>
                            <strong className="text-slate-800">{conflict.partyB.durationMonths} Bulan</strong>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* AI Resolution Options Evaluation Engine */}
                  <div className="space-y-2.5 pt-2">
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-indigo-950 font-heading">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      <span>Evaluasi Solusi AI & Rekomendasi Otomatis:</span>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5">
                      {conflict.resolutionOptions.map(option => {
                        const isExecuting = executingId === option.id;

                        return (
                          <div
                            key={option.id}
                            className={`p-3.5 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                              option.recommended
                                ? 'bg-indigo-50/70 border-indigo-300 ring-1 ring-indigo-200'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="space-y-1 max-w-xl">
                              <div className="flex items-center gap-2 flex-wrap">
                                {option.recommended && (
                                  <span className="px-2 py-0.5 rounded-md bg-indigo-600 text-white text-[9px] font-black uppercase flex items-center gap-1">
                                    <Sparkles className="w-2.5 h-2.5" />
                                    <span>Pilihan Terbaik ({option.confidenceScore}%)</span>
                                  </span>
                                )}
                                <h5 className="font-extrabold text-xs text-slate-900 font-heading">
                                  {option.title}
                                </h5>
                              </div>
                              <p className="text-[11px] text-slate-600 leading-relaxed">
                                {option.description}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 flex-wrap">
                              {option.whatsappTemplate && option.whatsappRecipientPhone && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenWhatsApp(option.whatsappRecipientPhone!, option.whatsappTemplate!)}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs border border-emerald-200 transition flex items-center gap-1 cursor-pointer"
                                  title="Kirim pesan WhatsApp otomatis ke pemohon"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                  <span>Kirim WA</span>
                                </button>
                              )}

                              {option.isAutoExecutable && (
                                <button
                                  type="button"
                                  disabled={isExecuting}
                                  onClick={() => handleExecuteResolution(conflict, option)}
                                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
                                    option.recommended
                                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                                  }`}
                                >
                                  {isExecuting ? (
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Zap className="w-3.5 h-3.5 text-amber-300" />
                                  )}
                                  <span>{isExecuting ? 'Mengeksekusi...' : 'Terapkan Solusi'}</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              );
            })
          ) : (
            <div className="py-16 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 font-heading">
                Semua Kalender Bersih & Bebas Konflik!
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Tidak ditemukan adanya double-booking, tanggal sewa tumpang tindih, atau ketidaksinkronan status kamar pada database saat ini.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleCreateSimulation}
                  disabled={isSimulating}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Zap className="w-4 h-4 text-amber-300" />
                  <span>Uji Coba Deteksi Konflik (Simulasi)</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 text-xs">
          <div className="flex items-center gap-2 text-slate-500 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Detektor Konflik Kalender Aktif & Memantau Real-time</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-200 transition cursor-pointer"
            >
              Tutup Panel
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

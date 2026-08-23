import React, { useState } from 'react';
import { useKost } from '../context/KostContext';
import { MaintenanceTicket, TicketStatus, TicketCategory, TicketPriority } from '../types';
import { formatIndonesianDate } from '../utils/formatters';
import {
  Wrench,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Filter,
  Building,
  User,
  Zap,
  Droplets,
  Wind,
  Key,
} from 'lucide-react';

interface MaintenanceTicketsViewProps {
  isTenantView?: boolean;
}

export const MaintenanceTicketsView: React.FC<MaintenanceTicketsViewProps> = ({ isTenantView = false }) => {
  const { tickets, rooms, updateTicketStatus, createTicket, selectedTenantRoomId } = useKost();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);

  // New Ticket State
  const [ticketRoomId, setTicketRoomId] = useState<number>(selectedTenantRoomId || 1);
  const [ticketTitle, setTicketTitle] = useState('');
  const [ticketDescription, setTicketDescription] = useState('');
  const [ticketCategory, setTicketCategory] = useState<TicketCategory>('ac');
  const [ticketPriority, setTicketPriority] = useState<TicketPriority>('sedang');

  const filteredTickets = tickets.filter(t => {
    if (isTenantView && t.roomId !== selectedTenantRoomId) return false;
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    return true;
  });

  const handleCreateTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const room = rooms.find(r => r.id === Number(ticketRoomId));
    if (!room) return;

    createTicket({
      roomId: room.id,
      roomNumber: room.roomNumber,
      tenantName: room.tenant?.name || 'Penghuni ' + room.roomNumber,
      title: ticketTitle,
      description: ticketDescription,
      category: ticketCategory,
      priority: ticketPriority,
      status: 'menunggu',
    });

    setTicketTitle('');
    setTicketDescription('');
    setIsNewTicketModalOpen(false);
  };

  const getCategoryBadge = (cat: TicketCategory) => {
    switch (cat) {
      case 'ac':
        return <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 font-semibold text-[10px]">❄️ AC / Pendingin</span>;
      case 'plumbing':
        return <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-semibold text-[10px]">💧 Kran / Pipa Air</span>;
      case 'kelistrikan':
        return <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-semibold text-[10px]">⚡ Kelistrikan & Lampu</span>;
      case 'kunci_pintu':
        return <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 font-semibold text-[10px]">🔑 Kunci & Pintu</span>;
      default:
        return <span className="px-2 py-0.5 rounded bg-slate-700 text-slate-300 font-semibold text-[10px]">🛠️ Fasilitas Kamar</span>;
    }
  };

  return (
    <div id="maintenance-tickets-view" className="space-y-5">
      {/* Top Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 font-heading">
                {isTenantView ? 'Layanan Keluhan & Perbaikan Kamar' : 'Manajemen Tiket Keluhan & Perbaikan'}
              </h2>
              <p className="text-xs text-slate-500">
                Laporan kerusakan fasilitas, servis AC berkala & perbaikan kamar kos
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-2xs"
          >
            <option value="all">Semua Status</option>
            <option value="menunggu">Menunggu Ditangani</option>
            <option value="diproses">Sedang Dikerjakan</option>
            <option value="selesai">Selesai Diperbaiki</option>
          </select>

          <button
            onClick={() => setIsNewTicketModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Buat Laporan Keluhan</span>
          </button>
        </div>
      </div>

      {/* Tickets List */}
      <div className="space-y-3">
        {filteredTickets.length > 0 ? (
          filteredTickets.map(ticket => {
            const isResolved = ticket.status === 'selesai';
            const isProcessing = ticket.status === 'diproses';
            const isWaiting = ticket.status === 'menunggu';

            return (
              <div
                key={ticket.id}
                id={`ticket-card-${ticket.id}`}
                className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-start justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs text-slate-600 font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {ticket.ticketNumber}
                    </span>
                    <span className="font-bold text-slate-900 text-sm">
                      {ticket.roomNumber} ({ticket.tenantName})
                    </span>
                    {getCategoryBadge(ticket.category)}
                    {isResolved && (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                        SELESAI
                      </span>
                    )}
                    {isProcessing && (
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-[10px] border border-blue-200 animate-pulse">
                        SEDANG DIPROSES
                      </span>
                    )}
                    {isWaiting && (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold text-[10px] border border-amber-200">
                        MENUNGGU TINDAKAN
                      </span>
                    )}
                  </div>

                  <h4 className="font-extrabold text-base text-slate-900">{ticket.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-2xl bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                    {ticket.description}
                  </p>

                  <div className="text-[11px] text-slate-500 flex items-center gap-3 pt-1">
                    <span>Dilaporkan: {ticket.createdAt}</span>
                    {ticket.cost && ticket.cost > 0 && (
                      <span className="text-rose-600 font-semibold">
                        Biaya Perbaikan: Rp {ticket.cost.toLocaleString('id-ID')}
                      </span>
                    )}
                  </div>

                  {ticket.actionNotes && (
                    <div className="text-xs text-emerald-800 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                      <strong>Tindakan / Hasil:</strong> {ticket.actionNotes}
                    </div>
                  )}
                </div>

                {/* Owner Actions */}
                {!isTenantView && (
                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                    {isWaiting && (
                      <button
                        onClick={() => {
                          const note = prompt('Catatan tindakan proses perbaikan:', 'Teknisi dijadwalkan datang besok');
                          if (note !== null) {
                            updateTicketStatus(ticket.id, 'diproses', undefined, note);
                          }
                        }}
                        className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                      >
                        Proses Tiket
                      </button>
                    )}

                    {isProcessing && (
                      <button
                        onClick={() => {
                          const costStr = prompt('Masukkan total biaya perbaikan (IDR):', '0');
                          const actionNote = prompt('Catatan hasil perbaikan:', 'Sudah diperbaiki dan normal kembali');
                          const cost = costStr ? parseInt(costStr, 10) : 0;
                          updateTicketStatus(ticket.id, 'selesai', isNaN(cost) ? 0 : cost, actionNote || 'Selesai');
                        }}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                      >
                        Tandai Selesai & Catat Biaya
                      </button>
                    )}

                    {isResolved && (
                      <span className="text-xs text-slate-400 italic">
                        Tiket telah ditutup
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 text-xs space-y-2 shadow-xs">
            <p className="font-semibold text-slate-700">Tidak ada tiket keluhan aktif.</p>
            <p>Fasilitas kosan dalam kondisi prima!</p>
          </div>
        )}
      </div>

      {/* New Ticket Modal */}
      {isNewTicketModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 font-heading">
                Buat Laporan Keluhan / Perbaikan Kamar
              </h3>
              <button onClick={() => setIsNewTicketModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTicketSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Nomor Kamar *</label>
                  <select
                    value={ticketRoomId}
                    onChange={e => setTicketRoomId(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-2xs"
                  >
                    {rooms.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.roomNumber} ({r.tenant?.name || 'Kosong'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Kategori Keluhan *</label>
                  <select
                    value={ticketCategory}
                    onChange={e => setTicketCategory(e.target.value as TicketCategory)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-2xs"
                  >
                    <option value="ac">AC / Pendingin Ruangan</option>
                    <option value="plumbing">Kran / Saluran Air / Toilet</option>
                    <option value="kelistrikan">Lampu / Saklar / Listrik</option>
                    <option value="kunci_pintu">Kunci Gerbang / Handle Pintu</option>
                    <option value="fasilitas_kamar">Kasur / Lemari / Meja</option>
                    <option value="lainnya">Lain-lain</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Judul Keluhan Singkat *</label>
                <input
                  type="text"
                  required
                  value={ticketTitle}
                  onChange={e => setTicketTitle(e.target.value)}
                  placeholder="Contoh: AC kurang dingin / Kran wastafel bocor"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Deskripsi Lengkap Masalah *</label>
                <textarea
                  required
                  rows={3}
                  value={ticketDescription}
                  onChange={e => setTicketDescription(e.target.value)}
                  placeholder="Jelaskan detail kendala yang dialami agar teknisi membawa perlengkapan yang tepat..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewTicketModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs cursor-pointer"
                >
                  Kirim Laporan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

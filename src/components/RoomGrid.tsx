import React, { useState } from 'react';
import { useKost } from '../context/KostContext';
import { Room, Invoice, RoomStatus } from '../types';
import {
  formatRupiah,
  formatIndonesianDate,
  generateWhatsAppReminderUrl,
} from '../utils/formatters';
import {
  DoorClosed,
  DoorOpen,
  User,
  Phone,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  QrCode,
  Send,
  SlidersHorizontal,
  Wrench,
  Sparkles,
  Info,
  Building,
  Key,
} from 'lucide-react';

interface RoomGridProps {
  onSelectRoom: (room: Room) => void;
  onPayRoomQRIS: (invoice: Invoice) => void;
}

export const RoomGrid: React.FC<RoomGridProps> = ({ onSelectRoom, onPayRoomQRIS }) => {
  const { rooms, invoices, activeReportMonth, settings, role } = useKost();
  const [filterFloor, setFilterFloor] = useState<number | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredRooms = rooms.filter(room => {
    if (filterFloor !== 'all' && room.floor !== filterFloor) return false;
    if (filterStatus !== 'all' && room.status !== filterStatus) return false;
    return true;
  });

  return (
    <div id="room-grid-section" className="space-y-5">
      {/* Filter and Overview Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 font-heading">
              Denah 8 Pintu Kosan
            </h2>
            <p className="text-xs text-slate-500">
              {rooms.filter(r => r.status === 'terisi').length} Terisi &bull; {rooms.filter(r => r.status === 'kosong').length} Kosong
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Floor filter */}
          <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200 text-xs">
            <button
              onClick={() => setFilterFloor('all')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                filterFloor === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua Lantai
            </button>
            <button
              onClick={() => setFilterFloor(1)}
              className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                filterFloor === 1 ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Lantai 1 (K01-K04)
            </button>
            <button
              onClick={() => setFilterFloor(2)}
              className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                filterFloor === 2 ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Lantai 2 (K05-K08)
            </button>
          </div>

          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="bg-white text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer shadow-2xs"
          >
            <option value="all">Semua Status</option>
            <option value="terisi">Terisi</option>
            <option value="kosong">Kosong (Siap Huni)</option>
            <option value="menunggu_pembayaran">Menunggu Pembayaran</option>
            <option value="perbaikan">Dalam Perbaikan</option>
          </select>
        </div>
      </div>

      {/* 8 Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {filteredRooms.map(room => {
          const inv = invoices.find(i => i.roomId === room.id && i.month === activeReportMonth);
          const isPaid = inv?.status === 'lunas';
          const isPending = inv?.status === 'menunggu_verifikasi';
          const isUnpaid = inv?.status === 'belum_bayar';
          const isVacant = room.status === 'kosong';

          return (
            <div
              key={room.id}
              id={`room-card-${room.id}`}
              className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-4.5 shadow-xs flex flex-col justify-between transition hover:shadow-md relative overflow-hidden"
            >
              {/* Top Room Banner */}
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-xl flex items-center justify-center font-bold shadow-2xs ${
                      isVacant ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {isVacant ? <DoorOpen className="w-5 h-5" /> : <DoorClosed className="w-5 h-5" />}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-slate-900 font-heading">
                        {room.roomNumber}
                      </h3>
                      <span className="text-[11px] text-slate-500">
                        Lantai {room.floor} &bull; {room.size}
                      </span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {room.status === 'terisi' && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider">
                        Terisi
                      </span>
                    )}
                    {room.status === 'kosong' && (
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold uppercase tracking-wider">
                        Kosong
                      </span>
                    )}
                    {room.status === 'menunggu_pembayaran' && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold uppercase tracking-wider animate-pulse">
                        Menunggu Bayar
                      </span>
                    )}
                    {room.status === 'perbaikan' && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold uppercase tracking-wider">
                        Perbaikan
                      </span>
                    )}
                  </div>
                </div>

                {/* Room Type & Base Price */}
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-medium border border-slate-200/60">
                    {room.type}
                  </span>
                  <div className="font-bold text-slate-900 font-mono text-sm">
                    {formatRupiah(room.basePrice)}
                    <span className="text-[10px] text-slate-500 font-normal"> /bln</span>
                  </div>
                </div>

                {/* Tenant Information or Vacant Notice */}
                <div className="mt-3 bg-slate-50 p-3 rounded-xl border border-slate-200/70">
                  {room.tenant ? (
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center gap-2">
                        {room.tenant.avatarUrl ? (
                          <img
                            src={room.tenant.avatarUrl}
                            alt={room.tenant.name}
                            className="w-6 h-6 rounded-full object-cover border border-slate-300"
                          />
                        ) : (
                          <User className="w-4 h-4 text-emerald-600" />
                        )}
                        <span className="font-bold text-slate-900 truncate">
                          {room.tenant.name}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{room.tenant.phone}</span>
                        </span>
                        <span className="text-slate-600 font-medium">{room.tenant.occupation}</span>
                      </div>

                      {/* Payment Status this Month */}
                      <div className="pt-2 mt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Status Sewa {activeReportMonth}:</span>
                        {isPaid && (
                          <span className="font-bold text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Lunas
                          </span>
                        )}
                        {isPending && (
                          <span className="font-bold text-amber-700 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            Verifikasi QRIS
                          </span>
                        )}
                        {isUnpaid && (
                          <span className="font-bold text-rose-700 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Belum Bayar
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-2">
                      <p className="text-xs font-semibold text-blue-700">Kamar Siap Huni</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Klik 'Kelola Kamar' untuk check-in penyewa baru
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
                <button
                  onClick={() => onSelectRoom(room)}
                  className="w-full py-2 px-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-xs font-semibold flex items-center justify-center gap-1.5 transition border border-slate-200 shadow-2xs cursor-pointer"
                >
                  <Key className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Kelola Kamar</span>
                </button>

                {room.tenant && inv ? (
                  <button
                    onClick={() => onPayRoomQRIS(inv)}
                    className="w-full py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Bayar QRIS</span>
                  </button>
                ) : (
                  <button
                    onClick={() => onSelectRoom(room)}
                    className="w-full py-2 px-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition border border-blue-200 cursor-pointer"
                  >
                    <span>+ Check In</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

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
  FileCheck,
  MessageSquare,
  Eye,
  Edit,
  X,
  FileText,
  Check,
  Plus,
  Zap,
} from 'lucide-react';

interface RoomGridProps {
  onSelectRoom: (room: Room) => void;
  onPayRoomQRIS: (invoice: Invoice) => void;
}

const AVAILABLE_FACILITIES = [
  'AC 1/2 PK',
  'Kamar Mandi Dalam',
  'Water Heater',
  'Kasur Springbed',
  'Lemari Pakaian',
  'Meja Belajar & Kursi',
  'WiFi 100Mbps',
  'Smart TV 32"',
  'Balkon Pribadi',
  'Dapur Mini',
  'Kulkas Mini',
];

export const RoomGrid: React.FC<RoomGridProps> = ({ onSelectRoom, onPayRoomQRIS }) => {
  const { 
    rooms, 
    invoices, 
    activeReportMonth, 
    settings, 
    users, 
    activeBranch, 
    branches, 
    selectedBranchId,
    updateRoom,
  } = useKost();

  const currentBranch = activeBranch || branches.find(b => b.id === selectedBranchId) || branches[0];
  const uniqueFloors = Array.from(new Set(rooms.map(r => r.floor))).sort((a, b) => a - b);
  const [filterFloor, setFilterFloor] = useState<number | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Modal Preview Proof State
  const [previewProof, setPreviewProof] = useState<{
    url: string;
    tenantName: string;
    roomNumber: string;
    amount: number;
    month: string;
    paidDate?: string;
    qrisRef?: string;
  } | null>(null);

  // Modal Edit Room State
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [editBranchId, setEditBranchId] = useState<string>('branch-01');
  const [editRoomNumber, setEditRoomNumber] = useState<string>('');
  const [editFloor, setEditFloor] = useState<number>(1);
  const [editType, setEditType] = useState<'Deluxe AC' | 'Superior AC' | 'Standard Fan'>('Deluxe AC');
  const [editSize, setEditSize] = useState<string>('3.5 x 4 m');
  const [editBasePrice, setEditBasePrice] = useState<number>(1500000);
  const [editStatus, setEditStatus] = useState<RoomStatus>('kosong');
  const [editElectricityType, setEditElectricityType] = useState<'token_mandiri' | 'termasuk_sewa'>('token_mandiri');
  const [editFacilities, setEditFacilities] = useState<string[]>([]);
  const [editDescription, setEditDescription] = useState<string>('');
  const [editFormError, setEditFormError] = useState<string>('');

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredRooms = rooms.filter(room => {
    if (filterFloor !== 'all' && room.floor !== filterFloor) return false;
    if (filterStatus !== 'all' && room.status !== filterStatus) return false;
    return true;
  });

  const handleOpenEditRoom = (room: Room) => {
    setEditingRoom(room);
    const activeBranchForRoom = room.branchId || (selectedBranchId !== 'all' ? selectedBranchId : 'branch-01');
    setEditBranchId(activeBranchForRoom);
    setEditRoomNumber(room.roomNumber);
    setEditFloor(room.floor || 1);
    setEditType(room.type || 'Deluxe AC');
    setEditSize(room.size || '3.5 x 4 m');
    setEditBasePrice(room.basePrice || 1500000);
    setEditStatus(room.status || 'kosong');
    setEditElectricityType(room.electricityType || 'token_mandiri');
    setEditFacilities(room.facilities || []);
    setEditDescription(room.description || '');
    setEditFormError('');
  };

  const handleToggleFacility = (fac: string) => {
    setEditFacilities(prev => 
      prev.includes(fac) ? prev.filter(f => f !== fac) : [...prev, fac]
    );
  };

  const handleSaveEditRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoom) return;

    if (!editRoomNumber.trim() || editBasePrice <= 0) {
      setEditFormError('Mohon isi Nomor Kamar dan Tarif Sewa dengan benar!');
      return;
    }
    setEditFormError('');

    const updated: Room = {
      ...editingRoom,
      id: editingRoom.id,
      branchId: editBranchId,
      roomNumber: editRoomNumber.trim(),
      floor: Number(editFloor),
      type: editType,
      size: editSize,
      basePrice: Number(editBasePrice),
      status: editStatus,
      electricityType: editElectricityType,
      facilities: editFacilities,
      description: editDescription,
    };

    await updateRoom(updated);
    setEditingRoom(null);
  };

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
              {selectedBranchId === 'all' 
                ? `Denah ${rooms.length} Pintu Kamar – Semua Cabang (${branches.length} Properti)`
                : `Denah ${rooms.length} Pintu Kamar ${currentBranch ? `– ${currentBranch.name}` : ''}`}
            </h2>
            <p className="text-xs text-slate-500">
              {rooms.filter(r => r.status === 'terisi' || users.some(u => u.assignedRoomId === r.id && u.status === 'active')).length} Terisi &bull; {rooms.filter(r => r.status === 'kosong' && !r.tenant).length} Kosong Siap Huni
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
            {uniqueFloors.map(flr => (
              <button
                key={flr}
                onClick={() => setFilterFloor(flr)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                  filterFloor === flr ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Lantai {flr}
              </button>
            ))}
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

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5">
        {filteredRooms.map((room, index) => {
          if (!room) return null;
          const roomId = room.id ?? index + 1;
          const roomBranch = (room.branchId && branches.find(b => b.id === room.branchId)) || currentBranch || branches[0];
          const activeAppUser = users.find(
            u => u.role === 'penghuni' && u.assignedRoomId === room.id && u.status === 'active'
          );
          const activeOccupant = room.tenant || (activeAppUser ? {
            name: activeAppUser.name,
            phone: activeAppUser.phone,
            occupation: 'Penyewa Terdaftar',
            avatarUrl: activeAppUser.avatarUrl,
          } : null);

          const inv = invoices.find(i => i.roomId === room.id && i.month === activeReportMonth);
          const isPaid = inv?.status === 'lunas';
          const isPending = inv?.status === 'menunggu_verifikasi';
          const isUnpaid = inv?.status === 'belum_bayar' || (!inv && activeOccupant);
          const dueDateStr = inv?.dueDate || `${activeReportMonth}-05`;
          const isOverdue = isUnpaid && todayStr > dueDateStr;
          const roomNumberStr = room.roomNumber || `Kamar 0${roomId}`;
          const roomFloor = room.floor || 1;
          const roomSize = room.size || '3 x 4 m';
          const roomType = room.type || 'Deluxe AC';
          const roomPrice = Number(room.basePrice) || 1500000;
          const roomStatus = room.status || (activeOccupant ? 'terisi' : 'kosong');
          const isVacant = roomStatus === 'kosong' && !activeOccupant;

          return (
            <div
              key={`room-card-key-${room.branchId || 'b'}-${roomId}-${index}`}
              id={`room-card-${room.branchId || 'b'}-${roomId}`}
              className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-2xl p-3.5 shadow-2xs hover:shadow-md flex flex-col justify-between transition-all duration-150 relative overflow-hidden"
            >
              {/* Top Room Header */}
              <div>
                {/* Property Branch Badge (Crisp & Clear for Super Admin Enterprise Properties) */}
                <div className="mb-2.5 flex items-center justify-between gap-1.5 text-[10px]">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200/90 font-bold truncate max-w-[200px]">
                    <Building className="w-3 h-3 text-teal-600 shrink-0" />
                    <span className="truncate">{roomBranch?.name || 'Cabang Properti'}</span>
                  </span>
                  <span className="font-mono text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 shrink-0">
                    {roomBranch?.code || 'CBG'}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold shadow-2xs ${
                      isVacant ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {isVacant ? <DoorOpen className="w-4 h-4" /> : <DoorClosed className="w-4 h-4" />}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900 font-heading leading-tight">
                        {roomNumberStr}
                      </h3>
                      <span className="text-[10px] text-slate-500 font-medium">
                        Lt {roomFloor} &bull; {roomSize}
                      </span>
                    </div>
                  </div>

                  {/* Header Status Badge */}
                  <div className="flex items-center gap-1.5">
                    {!isVacant && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider">
                        Terisi
                      </span>
                    )}
                    {isVacant && (
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold uppercase tracking-wider">
                        Kosong
                      </span>
                    )}
                  </div>
                </div>

                {/* Room Type & Base Price */}
                <div className="mt-2.5 flex items-center justify-between text-xs">
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium">
                    {roomType}
                  </span>
                  <div className="font-bold text-slate-900 font-mono text-xs">
                    {formatRupiah(roomPrice)}
                    <span className="text-[10px] text-slate-400 font-normal">/bln</span>
                  </div>
                </div>

                {/* Compact Tenant Info for Occupied Rooms */}
                {activeOccupant && (
                  <div className="mt-2.5 bg-slate-50/90 p-2.5 rounded-xl border border-slate-200/70">
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {activeOccupant.avatarUrl ? (
                            <img
                              src={activeOccupant.avatarUrl}
                              alt={activeOccupant.name}
                              className="w-5 h-5 rounded-full object-cover border border-slate-300 shrink-0"
                            />
                          ) : (
                            <User className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          )}
                          <span className="font-bold text-slate-800 text-[11px] truncate">
                            {activeOccupant.name}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium shrink-0">
                          {activeOccupant.occupation}
                        </span>
                      </div>

                      {/* Payment Status this Month */}
                      <div className="pt-1.5 mt-1 border-t border-slate-200/60 flex items-center justify-between text-[10px]">
                        <span className="text-slate-400">Sewa {activeReportMonth}:</span>
                        {isPaid && (
                          <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Lunas
                          </span>
                        )}
                        {isPending && (
                          <span className="font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 flex items-center gap-1 animate-pulse">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Menunggu Konfirmasi
                          </span>
                        )}
                        {isUnpaid && isOverdue && (
                          <span className="font-bold text-rose-800 bg-rose-100 px-1.5 py-0.5 rounded border border-rose-300 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            Terlambat
                          </span>
                        )}
                        {isUnpaid && !isOverdue && (
                          <span className="font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            Belum Dibayar
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons Footer */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-2">
                {activeOccupant ? (
                  <>
                    {isPaid ? (
                      <button
                        onClick={() => {
                          const proofUrl =
                            inv?.proofImageUrl ||
                            'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=700&auto=format&fit=crop&q=80';
                          setPreviewProof({
                            url: proofUrl,
                            tenantName: activeOccupant.name,
                            roomNumber: room.roomNumber,
                            amount: inv?.totalAmount || room.basePrice + 25000,
                            month: activeReportMonth,
                            paidDate: inv?.paidDate || inv?.verifiedAt || todayStr,
                            qrisRef: inv?.qrisRef || `QRIS-PAY-${room.id}88`,
                          });
                        }}
                        className="flex-1 py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition cursor-pointer"
                      >
                        <FileCheck className="w-3.5 h-3.5" />
                        <span className="truncate">Bukti Bayar</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          if (activeOccupant.phone) {
                            const cleanPhone = activeOccupant.phone.replace(/\D/g, '');
                            const formattedPhone = cleanPhone.startsWith('0')
                              ? '62' + cleanPhone.slice(1)
                              : cleanPhone.startsWith('62')
                              ? cleanPhone
                              : '62' + cleanPhone;
                            const waUrl = generateWhatsAppReminderUrl(
                              formattedPhone,
                              activeOccupant.name,
                              room.roomNumber,
                              activeReportMonth,
                              inv?.totalAmount || room.basePrice + 25000,
                              inv?.dueDate || `${activeReportMonth}-05`,
                              settings.kostName,
                              settings.qrisMerchantName
                            );
                            window.open(waUrl, '_blank', 'noopener,noreferrer');
                          } else {
                            onSelectRoom(room);
                          }
                        }}
                        className="flex-1 py-2 px-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span className="truncate">Kontak WA</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleOpenEditRoom(room)}
                      className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1 transition cursor-pointer border border-slate-200"
                      title="Edit rincian kamar"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleOpenEditRoom(room)}
                    className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer border border-slate-200"
                    title="Edit rincian kamar"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit Rincian Kamar</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Edit Room */}
      {editingRoom && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 font-heading">
                    Edit Data {editingRoom.roomNumber}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Perbarui spesifikasi, tarif sewa, status & fasilitas kamar
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingRoom(null)}
                className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveEditRoom} className="p-5 overflow-y-auto space-y-4 text-xs">
              {editFormError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-medium">
                  {editFormError}
                </div>
              )}

              {/* Cabang Properti Terdaftar */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Cabang Properti Terdaftar (Super Admin) *</label>
                <select
                  value={editBranchId}
                  onChange={e => setEditBranchId(e.target.value)}
                  className="w-full bg-teal-50/70 border border-teal-200 rounded-xl px-3 py-2 text-teal-900 font-bold focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer shadow-2xs"
                >
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code}) • {b.city}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Nomor / Nama Unit Kamar *</label>
                  <input
                    type="text"
                    required
                    value={editRoomNumber}
                    onChange={e => setEditRoomNumber(e.target.value)}
                    placeholder="Contoh: Kamar 01"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Lantai *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={10}
                    value={editFloor}
                    onChange={e => setEditFloor(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Tipe Kamar *</label>
                  <select
                    value={editType}
                    onChange={e => setEditType(e.target.value as 'Deluxe AC' | 'Superior AC' | 'Standard Fan')}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-2xs font-semibold"
                  >
                    <option value="Deluxe AC">Deluxe AC (Kamar Mandi Dalam + Water Heater)</option>
                    <option value="Superior AC">Superior AC (Kamar Mandi Dalam)</option>
                    <option value="Standard Fan">Standard Fan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Ukuran Dimensi Kamar</label>
                  <input
                    type="text"
                    value={editSize}
                    onChange={e => setEditSize(e.target.value)}
                    placeholder="Contoh: 3.5 x 4 m"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Tarif Sewa Pokok (Rp / Bulan) *</label>
                  <input
                    type="number"
                    required
                    min={100000}
                    step={50000}
                    value={editBasePrice}
                    onChange={e => setEditBasePrice(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-sm font-bold shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Status Ketersediaan Kamar *</label>
                  <select
                    value={editStatus}
                    onChange={e => setEditStatus(e.target.value as RoomStatus)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-2xs font-semibold"
                  >
                    <option value="kosong">Kosong (Siap Huni)</option>
                    <option value="terisi">Terisi (Sedang Dihuni)</option>
                    <option value="menunggu_pembayaran">Menunggu Pembayaran</option>
                    <option value="perbaikan">Dalam Pemeliharaan / Renovasi</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Sistem Kelistrikan</label>
                <select
                  value={editElectricityType}
                  onChange={e => setEditElectricityType(e.target.value as 'token_mandiri' | 'termasuk_sewa')}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-2xs"
                >
                  <option value="token_mandiri">Token Listrik Mandiri (PLN Prabayar)</option>
                  <option value="termasuk_sewa">Termasuk Biaya Sewa (Fasum/Listrik Induk)</option>
                </select>
              </div>

              {/* Facilities Checklist */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">Fasilitas Kamar:</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-50 border border-slate-200 rounded-xl p-3">
                  {AVAILABLE_FACILITIES.map(fac => {
                    const isChecked = editFacilities.includes(fac);
                    return (
                      <button
                        type="button"
                        key={fac}
                        onClick={() => handleToggleFacility(fac)}
                        className={`flex items-center gap-1.5 p-2 rounded-lg text-left transition cursor-pointer border ${
                          isChecked 
                            ? 'bg-blue-50 text-blue-800 border-blue-300 font-bold' 
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${
                          isChecked ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300'
                        }`}>
                          {isChecked && <Check className="w-3 h-3" />}
                        </div>
                        <span className="text-[11px] truncate">{fac}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Deskripsi & Catatan Kamar</label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  placeholder="Keterangan kondisi kamar, view jendela, dll..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
                />
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingRoom(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 border border-slate-200 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs cursor-pointer"
                >
                  Simpan Perubahan Kamar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Proof Photo Modal Popup */}
      {previewProof && (
        <div
          onClick={() => setPreviewProof(null)}
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 font-heading">
                    Bukti Pembayaran {previewProof.roomNumber}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Penghuni: <strong className="text-slate-800">{previewProof.tenantName}</strong> &bull; Periode: {previewProof.month}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPreviewProof(null)}
                className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Photo Container */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
              {/* Photo */}
              <div className="bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center p-2">
                <img
                  src={previewProof.url}
                  alt={`Bukti Transfer ${previewProof.tenantName}`}
                  className="w-full h-auto max-h-[50vh] object-contain rounded-xl shadow-lg"
                />
              </div>

              {/* Transaction Metadata Card */}
              <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 text-xs space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Total Terbayar:</span>
                  <span className="font-mono font-extrabold text-emerald-700 text-sm">
                    {formatRupiah(previewProof.amount)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Waktu Pembayaran:</span>
                  <span className="font-semibold text-slate-800">
                    {formatIndonesianDate(previewProof.paidDate || todayStr)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Referensi / Kode QRIS:</span>
                  <span className="font-mono font-semibold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {previewProof.qrisRef}
                  </span>
                </div>
                <div className="pt-2 flex items-center justify-center gap-1.5 text-emerald-700 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Foto Bukti Sah & Terverifikasi Pengelola</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setPreviewProof(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

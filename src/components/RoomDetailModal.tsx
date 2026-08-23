import React, { useState } from 'react';
import { Room, Tenant, RoomStatus } from '../types';
import { formatRupiah, formatIndonesianDate } from '../utils/formatters';
import {
  X,
  DoorClosed,
  User,
  Phone,
  CreditCard,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  LogOut,
  UserPlus,
  Edit3,
  Sparkles,
  ShieldAlert,
  Zap,
} from 'lucide-react';

interface RoomDetailModalProps {
  room: Room | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateRoom: (room: Room) => void;
  onCheckIn: (roomId: number, tenant: Tenant) => void;
  onCheckOut: (roomId: number) => void;
}

export const RoomDetailModal: React.FC<RoomDetailModalProps> = ({
  room,
  isOpen,
  onClose,
  onUpdateRoom,
  onCheckIn,
  onCheckOut,
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'checkin' | 'edit'>('info');

  // Check-In Form State
  const [tenantName, setTenantName] = useState('');
  const [tenantPhone, setTenantPhone] = useState('');
  const [tenantEmail, setTenantEmail] = useState('');
  const [tenantNik, setTenantNik] = useState('');
  const [tenantOccupation, setTenantOccupation] = useState('Karyawan Swasta');
  const [contractDuration, setContractDuration] = useState(12);
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('Orang Tua');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [tenantNotes, setTenantNotes] = useState('');
  const [showCheckoutConfirm, setShowCheckoutConfirm] = useState(false);
  const [formError, setFormError] = useState('');

  // Edit Room State
  const [editPrice, setEditPrice] = useState<number>(room?.basePrice || 1500000);
  const [editStatus, setEditStatus] = useState<RoomStatus>(room?.status || 'terisi');
  const [editType, setEditType] = useState(room?.type || 'Deluxe AC');
  const [editDescription, setEditDescription] = useState(room?.description || '');

  if (!isOpen || !room) return null;

  const handleCheckInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantName || !tenantPhone || !tenantNik) {
      setFormError('Mohon lengkapi Nama Lengkap, Nomor HP, dan NIK penyewa!');
      return;
    }
    setFormError('');

    const newTenant: Tenant = {
      id: `t-${Date.now()}`,
      roomId: room.id,
      name: tenantName,
      phone: tenantPhone,
      email: tenantEmail || undefined,
      identityNumber: tenantNik,
      occupation: tenantOccupation,
      checkInDate: new Date().toISOString().split('T')[0],
      contractDurationMonths: Number(contractDuration),
      emergencyContact: {
        name: emergencyName || 'Keluarga',
        relationship: emergencyRelation,
        phone: emergencyPhone || tenantPhone,
      },
      notes: tenantNotes,
    };

    onCheckIn(room.id, newTenant);
    setActiveTab('info');
    onClose();
  };

  const handleUpdateRoomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateRoom({
      ...room,
      basePrice: Number(editPrice),
      status: editStatus,
      type: editType as any,
      description: editDescription,
    });
    setActiveTab('info');
    onClose();
  };

  return (
    <div id="room-detail-modal" className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <DoorClosed className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-lg text-slate-900 font-heading">
                  {room.roomNumber}
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-semibold">
                  Lantai {room.floor}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                  {room.type}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Ukuran: {room.size} &bull; Tarif: <strong className="text-emerald-700">{formatRupiah(room.basePrice)}/bulan</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-slate-200 bg-slate-50/50 px-5 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('info')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition cursor-pointer ${
              activeTab === 'info'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Rincian Kamar & Penghuni
          </button>

          {!room.tenant && (
            <button
              onClick={() => setActiveTab('checkin')}
              className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'checkin'
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Check-In Penyewa Baru</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('edit')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'edit'
                ? 'border-amber-600 text-amber-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Ubah Spesifikasi / Tarif</span>
          </button>
        </div>

        {/* Tab 1: Info & Active Tenant */}
        {activeTab === 'info' && (
          <div className="p-5 sm:p-6 space-y-5 max-h-[70vh] overflow-y-auto">
            {/* Description & Facilities */}
            <div className="space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                {room.description}
              </p>

              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Fasilitas Kamar:
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {room.facilities.map((fac, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium"
                    >
                      ✓ {fac}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Tenant Details */}
            {room.tenant ? (
              <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-3">
                    {room.tenant.avatarUrl ? (
                      <img
                        src={room.tenant.avatarUrl}
                        alt={room.tenant.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg">
                        {room.tenant.name[0]}
                      </div>
                    )}
                    <div>
                      <h4 className="font-extrabold text-sm sm:text-base text-slate-900 font-heading">
                        {room.tenant.name}
                      </h4>
                      <p className="text-xs text-emerald-700 font-medium">
                        {room.tenant.occupation}
                      </p>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                    Penyewa Aktif
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block">Nomor Telepon / WhatsApp:</span>
                    <span className="font-mono text-slate-900 font-semibold">{room.tenant.phone}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">NIK / No. KTP:</span>
                    <span className="font-mono text-slate-900 font-semibold">{room.tenant.identityNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Tanggal Masuk (Check-In):</span>
                    <span className="text-slate-900 font-semibold">{formatIndonesianDate(room.tenant.checkInDate)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Durasi Kontrak:</span>
                    <span className="text-slate-900 font-semibold">{room.tenant.contractDurationMonths} Bulan</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Kontak Darurat:</span>
                    <span className="text-slate-900 font-semibold">
                      {room.tenant.emergencyContact.name} ({room.tenant.emergencyContact.relationship}) - {room.tenant.emergencyContact.phone}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Catatan Khusus:</span>
                    <span className="text-slate-600 italic">{room.tenant.notes || 'Tidak ada catatan khusus.'}</span>
                  </div>
                </div>

                {/* Check Out Button & Confirmation */}
                <div className="pt-3 border-t border-slate-200">
                  {showCheckoutConfirm ? (
                    <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-2.5 animate-in fade-in">
                      <div className="flex items-start gap-2 text-xs text-rose-900">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">Konfirmasi Check-Out {room.tenant?.name}?</p>
                          <p className="text-[11px] text-rose-700 mt-0.5 leading-relaxed">
                            Kamar <strong>{room.roomNumber}</strong> akan langsung dikosongkan (status siap huni). Data penyewa tetap tersimpan di Database Riwayat.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setShowCheckoutConfirm(false)}
                          className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 text-xs font-semibold cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onCheckOut(room.id);
                            setShowCheckoutConfirm(false);
                            onClose();
                          }}
                          className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Ya, Check-Out Sekarang</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setShowCheckoutConfirm(true)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Check-Out Penyewa (Kosongkan Kamar)</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 rounded-2xl p-6 text-center border border-dashed border-slate-300 space-y-3">
                <p className="text-sm font-semibold text-blue-700">
                  Saat ini {room.roomNumber} berstatus KOSONG.
                </p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Anda dapat mendaftarkan penghuni baru dengan menekan tombol check-in di bawah.
                </p>
                <button
                  onClick={() => setActiveTab('checkin')}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Check-In Penghuni Sekarang</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Check-In Form */}
        {activeTab === 'checkin' && (
          <form onSubmit={handleCheckInSubmit} className="p-5 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap Penyewa *
                </label>
                <input
                  type="text"
                  required
                  value={tenantName}
                  onChange={e => setTenantName(e.target.value)}
                  placeholder="Contoh: Dimas Aditya, S.T."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor HP / WhatsApp *
                </label>
                <input
                  type="tel"
                  required
                  value={tenantPhone}
                  onChange={e => setTenantPhone(e.target.value)}
                  placeholder="Contoh: 081234567890"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  NIK / Nomor KTP *
                </label>
                <input
                  type="text"
                  required
                  value={tenantNik}
                  onChange={e => setTenantNik(e.target.value)}
                  placeholder="16 Digit NIK KTP"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Profesi / Pekerjaan
                </label>
                <input
                  type="text"
                  value={tenantOccupation}
                  onChange={e => setTenantOccupation(e.target.value)}
                  placeholder="Karyawan Swasta / Mahasiswa"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Durasi Kontrak (Bulan)
                </label>
                <select
                  value={contractDuration}
                  onChange={e => setContractDuration(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer shadow-2xs"
                >
                  <option value={1}>1 Bulan</option>
                  <option value={3}>3 Bulan</option>
                  <option value={6}>6 Bulan</option>
                  <option value={12}>12 Bulan (1 Tahun)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Kontak Darurat
                </label>
                <input
                  type="text"
                  value={emergencyName}
                  onChange={e => setEmergencyName(e.target.value)}
                  placeholder="Nama Orang Tua / Saudara"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hubungan Kontak Darurat
                </label>
                <input
                  type="text"
                  value={emergencyRelation}
                  onChange={e => setEmergencyRelation(e.target.value)}
                  placeholder="Orang Tua / Saudara Kandung"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor HP Kontak Darurat
                </label>
                <input
                  type="tel"
                  value={emergencyPhone}
                  onChange={e => setEmergencyPhone(e.target.value)}
                  placeholder="Nomor Telepon Darurat"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Catatan Tambahan (Kendaraan, Dll)
              </label>
              <textarea
                rows={2}
                value={tenantNotes}
                onChange={e => setTenantNotes(e.target.value)}
                placeholder="Contoh: Bawa motor Vario Plat B 1234 ABC"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
              />
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('info')}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Simpan & Check-In
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Edit Room */}
        {activeTab === 'edit' && (
          <form onSubmit={handleUpdateRoomSubmit} className="p-5 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tarif Sewa Bulanan (IDR) *
                </label>
                <input
                  type="number"
                  required
                  value={editPrice}
                  onChange={e => setEditPrice(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tipe Kamar
                </label>
                <select
                  value={editType}
                  onChange={e => setEditType(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer shadow-2xs"
                >
                  <option value="Deluxe AC">Deluxe AC</option>
                  <option value="Superior AC">Superior AC</option>
                  <option value="Standard Fan">Standard Fan</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status Kamar
                </label>
                <select
                  value={editStatus}
                  onChange={e => setEditStatus(e.target.value as RoomStatus)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer shadow-2xs"
                >
                  <option value="terisi">Terisi</option>
                  <option value="kosong">Kosong (Siap Huni)</option>
                  <option value="menunggu_pembayaran">Menunggu Pembayaran</option>
                  <option value="perbaikan">Dalam Perbaikan</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Deskripsi Kamar
              </label>
              <textarea
                rows={3}
                value={editDescription}
                onChange={e => setEditDescription(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
              />
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('info')}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Simpan Perubahan
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

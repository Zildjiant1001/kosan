import React, { useState } from 'react';
import { useKost } from '../context/KostContext';
import { Room, Tenant, RentalBooking, BookingStatus } from '../types';
import { formatRupiah, formatIndonesianDate } from '../utils/formatters';
import {
  Users,
  UserPlus,
  DoorClosed,
  Phone,
  Mail,
  Calendar,
  CreditCard,
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  LogOut,
  MessageSquare,
  Search,
  Filter,
  Plus,
  ArrowRight,
  ShieldCheck,
  FileText,
  Briefcase,
  AlertCircle,
  Check,
  X,
  ExternalLink,
} from 'lucide-react';

interface TenantManagementViewProps {
  onOpenRoomModal?: (room: Room) => void;
}

export const TenantManagementView: React.FC<TenantManagementViewProps> = ({ onOpenRoomModal }) => {
  const {
    rooms,
    tenants,
    bookings,
    users,
    settings,
    branches,
    selectedBranchId,
    setSelectedBranchId,
    checkInTenant,
    checkOutTenant,
    deleteTenant,
    updateBookingStatus,
    deleteBooking,
    addBooking,
    isCloudConnected,
    firebaseProjectId,
  } = useKost();

  const [activeTab, setActiveTab] = useState<'tenants' | 'all_tenants' | 'bookings'>('tenants');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [isNewBookingModalOpen, setIsNewBookingModalOpen] = useState(false);
  const [selectedBookingForCheckIn, setSelectedBookingForCheckIn] = useState<RentalBooking | null>(null);
  const [checkoutConfirmTarget, setCheckoutConfirmTarget] = useState<{
    roomId: number;
    roomNumber: string;
    tenantName: string;
  } | null>(null);
  const [deleteBookingTarget, setDeleteBookingTarget] = useState<string | null>(null);
  const [deleteTenantTarget, setDeleteTenantTarget] = useState<{
    id: string;
    name: string;
    roomLabel: string;
    isActive: boolean;
  } | null>(null);

  // Check-In Form State
  const [selectedRoomId, setSelectedRoomId] = useState<number>(1);
  const [tenantName, setTenantName] = useState('');
  const [tenantPhone, setTenantPhone] = useState('');
  const [tenantEmail, setTenantEmail] = useState('');
  const [tenantNik, setTenantNik] = useState('');
  const [tenantOccupation, setTenantOccupation] = useState('Karyawan Swasta');
  const [checkInDate, setCheckInDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [contractDuration, setContractDuration] = useState(12);
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('Orang Tua');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [tenantNotes, setTenantNotes] = useState('');
  const [autoInvoice, setAutoInvoice] = useState(true);

  // New Booking Manual Form State
  const [bookRoomId, setBookRoomId] = useState<number>(1);
  const [bookName, setBookName] = useState('');
  const [bookPhone, setBookPhone] = useState('');
  const [bookOccupation, setBookOccupation] = useState('Karyawan Swasta');
  const [bookTargetDate, setBookTargetDate] = useState('');
  const [bookDuration, setBookDuration] = useState(6);
  const [bookNotes, setBookNotes] = useState('');

  // Helper to find branch name
  const getBranchName = (branchId?: string) => {
    if (!branchId) return 'Kost Griya Harmoni 8';
    const found = branches.find(b => b.id === branchId || b.name === branchId);
    return found ? found.name : branchId;
  };

  // Counts & Integration with Enterprise Users
  const activeTenants = rooms
    .map(r => {
      const activeAppUser = users.find(
        u => u.role === 'penghuni' && u.assignedRoomId === r.id && u.status === 'active'
      );
      const branchName = getBranchName(r.branchId || activeAppUser?.kostBranch);
      if (r.tenant) {
        return {
          ...r.tenant,
          roomNumber: r.roomNumber,
          roomType: r.type,
          basePrice: r.basePrice,
          branchId: r.branchId || r.tenant.branchId,
          branchName: branchName,
        };
      } else if (activeAppUser) {
        return {
          id: activeAppUser.id,
          roomId: r.id,
          name: activeAppUser.name,
          phone: activeAppUser.phone,
          email: activeAppUser.email,
          identityNumber: '3201' + String(activeAppUser.id).replace(/\D/g, '').slice(-12).padStart(12, '0'),
          occupation: 'Penyewa Terdaftar',
          checkInDate: activeAppUser.approvedAt || activeAppUser.createdAt || new Date().toISOString().split('T')[0],
          contractDurationMonths: 12,
          status: 'active' as const,
          emergencyContact: {
            name: 'Keluarga ' + activeAppUser.name.split(' ')[0],
            relationship: 'Keluarga',
            phone: activeAppUser.phone,
          },
          notes: `Akun resmi disetujui Super Admin pada ${activeAppUser.approvedAt || 'Enterprise'}`,
          avatarUrl: activeAppUser.avatarUrl,
          roomNumber: r.roomNumber,
          roomType: r.type,
          basePrice: r.basePrice,
          branchId: r.branchId,
          branchName: branchName,
        };
      }
      return null;
    })
    .filter(Boolean) as (Tenant & { roomNumber: string; roomType: string; basePrice: number; branchName?: string })[];

  // Unified tenant list combining all database records and active tenants
  const combinedTenantsMap = new Map<string, Tenant>();

  // 1. Add historical/archived tenants from database
  tenants.forEach(t => {
    combinedTenantsMap.set(String(t.id), t);
  });

  // 2. Ensure all currently active occupants are present and marked active
  activeTenants.forEach(at => {
    const existing = combinedTenantsMap.get(String(at.id));
    combinedTenantsMap.set(String(at.id), {
      ...(existing || {}),
      ...at,
      status: 'active',
    });
  });

  const allDatabaseTenants = Array.from(combinedTenantsMap.values());
  const totalTenantsCount = allDatabaseTenants.length;
  const activeTenantsCount = activeTenants.length;
  const checkoutHistoryCount = Math.max(0, totalTenantsCount - activeTenantsCount);

  const occupiedRooms = rooms.filter(r => {
    const hasActiveUser = users.some(u => u.role === 'penghuni' && u.assignedRoomId === r.id && u.status === 'active');
    return r.status === 'terisi' || r.status === 'menunggu_pembayaran' || !!r.tenant || hasActiveUser;
  });

  const emptyRooms = rooms.filter(r => {
    const hasActiveUser = users.some(u => u.role === 'penghuni' && u.assignedRoomId === r.id && u.status === 'active');
    return r.status === 'kosong' && !r.tenant && !hasActiveUser;
  });

  const pendingBookingsCount = bookings.filter(b => b.status === 'pending' || b.status === 'survey_dijadwalkan').length;

  const handleOpenCheckInModal = (booking?: RentalBooking, preselectedRoomId?: number) => {
    const firstEmpty = rooms.find(r => r.status === 'kosong');
    const defaultRoomId = preselectedRoomId || (booking && rooms.some(r => r.id === booking.roomId && r.status === 'kosong') ? booking.roomId : (firstEmpty ? firstEmpty.id : (rooms[0]?.id || 1)));

    setSelectedRoomId(defaultRoomId);

    if (booking) {
      setSelectedBookingForCheckIn(booking);
      setTenantName(booking.name);
      setTenantPhone(booking.phone);
      setTenantOccupation(booking.occupation || 'Karyawan Swasta');
      setContractDuration(booking.durationMonths || 12);
      setTenantNotes(`Berasal dari permohonan survey/booking website. Catatan: ${booking.notes || '-'}`);
    } else {
      setSelectedBookingForCheckIn(null);
      setTenantName('');
      setTenantPhone('');
      setTenantEmail('');
      setTenantNik('');
      setTenantOccupation('Karyawan Swasta');
      setEmergencyName('');
      setEmergencyPhone('');
      setTenantNotes('');
    }
    setIsCheckInModalOpen(true);
  };

  const currentSelectedRoom = rooms.find(r => r.id === selectedRoomId);
  const isSelectedRoomOccupied = currentSelectedRoom?.status === 'terisi' && currentSelectedRoom.tenant;

  const handleCheckInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantName || !tenantPhone || !tenantNik) {
      alert('Mohon isi Nama Lengkap, No. WhatsApp, dan Nomor NIK / KTP penyewa!');
      return;
    }

    const newTenant: Tenant = {
      id: `t-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      roomId: selectedRoomId,
      name: tenantName,
      phone: tenantPhone,
      email: tenantEmail || undefined,
      identityNumber: tenantNik,
      occupation: tenantOccupation,
      checkInDate: checkInDate,
      contractDurationMonths: Number(contractDuration),
      emergencyContact: {
        name: emergencyName || 'Keluarga',
        relationship: emergencyRelation,
        phone: emergencyPhone || tenantPhone,
      },
      notes: tenantNotes,
    };

    await checkInTenant(selectedRoomId, newTenant, autoInvoice);

    // If coming from booking, mark booking as completed
    if (selectedBookingForCheckIn) {
      await updateBookingStatus(selectedBookingForCheckIn.id, 'selesai_checkin');
    }

    setIsCheckInModalOpen(false);
    alert(`Berhasil! Penyewa ${tenantName} telah didaftarkan dan tersimpan ke Firestore pada Kamar 0${selectedRoomId}.`);
  };

  const handleManualBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookName || !bookPhone) {
      alert('Mohon isi nama calon penyewa dan nomor kontak!');
      return;
    }

    const targetRoom = rooms.find(r => r.id === Number(bookRoomId));

    await addBooking({
      roomId: Number(bookRoomId),
      roomNumber: targetRoom ? targetRoom.roomNumber : `Kamar 0${bookRoomId}`,
      roomType: targetRoom ? targetRoom.type : 'Deluxe AC',
      name: bookName,
      phone: bookPhone,
      occupation: bookOccupation,
      targetMoveDate: bookTargetDate || 'Segera',
      durationMonths: Number(bookDuration),
      notes: bookNotes || 'Ditambahkan manual oleh pengelola kos.',
    });

    setIsNewBookingModalOpen(false);
    setBookName('');
    setBookPhone('');
    setBookNotes('');
    alert('Permohonan sewa berhasil ditambahkan ke database Firestore!');
  };

  const handleWhatsAppTenant = (phone: string, name: string, roomNum: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('0')
      ? '62' + cleanPhone.slice(1)
      : cleanPhone.startsWith('62')
      ? cleanPhone
      : '62' + cleanPhone;

    const text = `Halo Kak ${name} (${roomNum}), salam dari pengelola ${settings.kostName}.`;
    window.open(`https://wa.me/${formattedPhone}?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  const handleWhatsAppBooking = (booking: RentalBooking) => {
    const cleanPhone = booking.phone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('0')
      ? '62' + cleanPhone.slice(1)
      : cleanPhone.startsWith('62')
      ? cleanPhone
      : '62' + cleanPhone;

    const text = `Halo Kak ${booking.name}, kami dari pengelola ${settings.kostName} menindaklanjuti permohonan survey/booking untuk ${booking.roomNumber} (${booking.roomType}). Kapan rencana jadwal survey yang nyaman untuk Kakak? Terima kasih.`;
    window.open(`https://wa.me/${formattedPhone}?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  const filteredTenants = activeTenants.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.phone.includes(searchTerm) ||
    t.identityNumber.includes(searchTerm)
  );

  const filteredAllTenants = allDatabaseTenants.filter(t => {
    const assignedRoom = rooms.find(r => r.id === t.roomId);
    const roomNum = assignedRoom ? assignedRoom.roomNumber : `Kamar 0${t.roomId}`;
    return (
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      roomNum.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.phone.includes(searchTerm) ||
      t.identityNumber.includes(searchTerm) ||
      (t.occupation && t.occupation.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  const filteredBookings = bookings.filter(b =>
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.phone.includes(searchTerm)
  );

  return (
    <div id="tenant-management-view" className="space-y-6 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 flex items-center gap-1.5 shadow-2xs">
                <Users className="w-3.5 h-3.5" />
                <span>CRM & Database Penghuni</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 text-xs font-bold border border-teal-200 flex items-center gap-1 shadow-2xs">
                <Building2 className="w-3 h-3" />
                <span>{selectedBranchId === 'all' ? `Semua Cabang (${branches.length})` : (branches.find(b => b.id === selectedBranchId)?.name || 'Cabang')}</span>
              </span>
              <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{isCloudConnected ? 'Cloud Live' : 'Lokal Mode'}</span>
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-heading tracking-tight">
              Database Penyewa & Permohonan Sewa
            </h1>
            <p className="text-xs text-slate-500">
              Kelola data profil penghuni, riwayat kontrak sewa, survei kamar dan proses check-in penyewa baru secara terintegrasi.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              id="btn-add-manual-booking"
              onClick={() => setIsNewBookingModalOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer border border-slate-200 shadow-2xs"
            >
              <Calendar className="w-4 h-4 text-slate-500" />
              <span>Catat Minat Sewa</span>
            </button>

            <button
              id="btn-register-new-tenant"
              onClick={() => handleOpenCheckInModal()}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Daftarkan Penyewa</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 pt-5">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
            <div className="text-[11px] font-semibold text-slate-500">Kamar Terisi</div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              {occupiedRooms.length} <span className="text-xs font-normal text-slate-500">/ {rooms.length} Kamar</span>
            </div>
            <div className="text-[10px] text-emerald-600 font-bold mt-1">
              Tingkat Hunian: {Math.round((occupiedRooms.length / (rooms.length || 1)) * 100)}%
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
            <div className="text-[11px] font-semibold text-slate-500">Kamar Siap Huni (Kosong)</div>
            <div className="text-xl sm:text-2xl font-black text-emerald-600 mt-1">
              {emptyRooms.length} <span className="text-xs font-normal text-slate-500">Kamar</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              {emptyRooms.length === 0
                ? 'Semua unit terisi penuh'
                : emptyRooms.length <= 3
                ? `Unit: ${emptyRooms.map(r => r.roomNumber).join(', ')}`
                : `${emptyRooms.length} unit siap huni & dapat disewa`}
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
            <div className="text-[11px] font-semibold text-slate-500">Total Arsip di Database</div>
            <div className="text-xl sm:text-2xl font-black text-blue-600 mt-1">
              {totalTenantsCount} <span className="text-xs font-normal text-slate-500">Penghuni</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              {activeTenantsCount} Aktif &bull; {checkoutHistoryCount} Riwayat/Checkout
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
            <div className="text-[11px] font-semibold text-slate-500">Permohonan Sewa Masuk</div>
            <div className="text-xl sm:text-2xl font-black text-amber-600 mt-1">
              {bookings.length} <span className="text-xs font-normal text-slate-500">Inquiry</span>
            </div>
            <div className="text-[10px] text-amber-700 font-bold mt-1">
              {pendingBookingsCount} Perlu Ditindaklanjuti
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="border-b border-slate-200 px-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 bg-slate-50/50">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setActiveTab('tenants')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                activeTab === 'tenants'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Penghuni Aktif ({activeTenantsCount})</span>
            </button>

            <button
              onClick={() => setActiveTab('all_tenants')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                activeTab === 'all_tenants'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Database Semua Penyewa ({totalTenantsCount})</span>
            </button>

            <button
              onClick={() => setActiveTab('bookings')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                activeTab === 'bookings'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Permohonan Sewa ({bookings.length})</span>
              {pendingBookingsCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-white text-amber-600 text-[10px] font-black flex items-center justify-center">
                  {pendingBookingsCount}
                </span>
              )}
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={activeTab === 'bookings' ? 'Cari permohonan...' : 'Cari nama, kamar, NIK...'}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {activeTab === 'tenants' && (
          <div className="p-4 sm:p-6 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  Status Alokasi Pintu Kamar Kos
                </h4>
                <span className="text-xs text-slate-500">
                  {emptyRooms.length} kamar kosong tersedia untuk disewakan
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {rooms.map(room => {
                  const activeAppUser = users.find(
                    u => u.role === 'penghuni' && u.assignedRoomId === room.id && u.status === 'active'
                  );
                  const activeOccupant = room.tenant || (activeAppUser ? {
                    name: activeAppUser.name,
                    phone: activeAppUser.phone,
                    checkInDate: activeAppUser.approvedAt || activeAppUser.createdAt || new Date().toISOString().split('T')[0],
                  } : null);
                  const isRoomOccupied = room.status === 'terisi' || room.status === 'menunggu_pembayaran' || !!activeOccupant;
                  const roomBranchName = getBranchName(room.branchId || (activeAppUser?.kostBranch));

                  return (
                    <div
                      key={room.id}
                      className={`p-3 rounded-xl border transition flex flex-col justify-between gap-2 ${
                        isRoomOccupied
                          ? 'bg-emerald-50/40 border-emerald-200'
                          : 'bg-slate-50 border-dashed border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-extrabold text-xs text-slate-900">{room.roomNumber}</span>
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold border border-slate-200/80" title={roomBranchName}>
                              <Building2 className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                              <span className="truncate max-w-[100px]">{roomBranchName}</span>
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500">{room.type}</div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                          isRoomOccupied
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-200 text-slate-600'
                        }`}>
                          {isRoomOccupied ? 'Terisi' : 'Siap Huni'}
                        </span>
                      </div>

                      {activeOccupant ? (
                        <div>
                          <div className="font-bold text-xs text-slate-800 truncate">{activeOccupant.name}</div>
                          <div className="text-[11px] text-slate-500 truncate">{activeOccupant.phone}</div>
                          <div className="text-[10px] text-slate-400 mt-1">
                            Masuk: {formatIndonesianDate(activeOccupant.checkInDate)}
                          </div>
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-500 italic py-1">
                          Kamar kosong, siap diisi penghuni baru.
                        </div>
                      )}

                      <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-1">
                        <span className="text-[10px] font-semibold text-slate-500">
                          {formatRupiah(room.basePrice)}/bln
                        </span>
                        {isRoomOccupied ? (
                          <button
                            onClick={() => onOpenRoomModal && onOpenRoomModal(room)}
                            className="text-[10px] font-bold text-emerald-700 hover:underline cursor-pointer"
                          >
                            Kelola Kamar &rarr;
                          </button>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400">
                            Unit Siap Huni
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Table of Active Tenants */}
            <div>
              <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-3">
                Rincian Data Penghuni yang Sedang Aktif ({filteredTenants.length})
              </h4>

              {filteredTenants.length === 0 ? (
                <div className="py-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-2">
                    <Users className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm">Belum Ada Penghuni Aktif</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    Semua kamar saat ini berstatus kosong. Klik tombol di bawah untuk mendaftarkan penghuni.
                  </p>
                  <button
                    onClick={() => handleOpenCheckInModal()}
                    className="mt-3 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs inline-flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Daftarkan Penyewa Sekarang</span>
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 bg-slate-50">
                        <th className="py-3 px-3.5 font-bold">Kamar</th>
                        <th className="py-3 px-3.5 font-bold">Nama Penghuni & NIK</th>
                        <th className="py-3 px-3.5 font-bold">Kontak & Pekerjaan</th>
                        <th className="py-3 px-3.5 font-bold">Masa Sewa</th>
                        <th className="py-3 px-3.5 font-bold">Kontak Darurat</th>
                        <th className="py-3 px-3.5 font-bold text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {filteredTenants.map((tenant) => (
                        <tr key={tenant.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3.5 px-3.5">
                            <div className="font-extrabold text-slate-900">{tenant.roomNumber}</div>
                            <div className="text-[11px] text-emerald-700 font-semibold">{tenant.roomType}</div>
                            <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[10px] font-semibold border border-emerald-200/80">
                              <Building2 className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span className="truncate max-w-[150px]">{tenant.branchName || getBranchName(tenant.branchId)}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-1">{formatRupiah(tenant.basePrice)}/bln</div>
                          </td>
                          <td className="py-3.5 px-3.5">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={
                                  tenant.avatarUrl ||
                                  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
                                }
                                alt={tenant.name}
                                className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0 shadow-2xs"
                              />
                              <div>
                                <div className="font-bold text-slate-900 text-sm">{tenant.name}</div>
                                <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                  <span>NIK: {tenant.identityNumber || '-'}</span>
                                </div>
                                {tenant.notes && (
                                  <div className="text-[10px] text-slate-500 italic mt-0.5 max-w-xs truncate">
                                    "{tenant.notes}"
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-3.5">
                            <div className="font-medium text-slate-800 flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{tenant.phone}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <Briefcase className="w-3 h-3 text-slate-400" />
                              <span>{tenant.occupation}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-3.5">
                            <div className="text-slate-800 font-medium">
                              Masuk: {formatIndonesianDate(tenant.checkInDate)}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              Durasi: {tenant.contractDurationMonths} Bulan
                            </div>
                          </td>
                          <td className="py-3.5 px-3.5">
                            <div className="font-medium text-slate-800">
                              {tenant.emergencyContact.name} ({tenant.emergencyContact.relationship})
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {tenant.emergencyContact.phone}
                            </div>
                          </td>
                          <td className="py-3.5 px-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleWhatsAppTenant(tenant.phone, tenant.name, tenant.roomNumber)}
                                title="Chat WhatsApp Penghuni"
                                className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition cursor-pointer"
                              >
                                <MessageSquare className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setCheckoutConfirmTarget({
                                    roomId: tenant.roomId,
                                    roomNumber: tenant.roomNumber,
                                    tenantName: tenant.name,
                                  });
                                }}
                                title="Check-Out / Akhiri Masa Sewa"
                                className="px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-[11px] transition cursor-pointer flex items-center gap-1 border border-rose-200/60"
                              >
                                <span>Check-Out</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Database Master & Riwayat Semua Penyewa (Firestore) */}
        {activeTab === 'all_tenants' && (
          <div className="p-4 sm:p-6 space-y-4">
            <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-900 flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Database Master Penyewa Kos (Google Cloud Firestore):</span>
                <p className="text-blue-800 text-[11px] mt-0.5">
                  Seluruh data penyewa yang pernah didaftarkan tersimpan permanen di sini. Penghuni yang sudah check-out atau digantikan tidak akan hilang dari database.
                </p>
              </div>
            </div>

            {filteredAllTenants.length === 0 ? (
              <div className="py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
                  <FileText className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-800 text-base">Belum Ada Rekaman Penyewa</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  Saat Anda mendaftarkan penyewa baru, arsip identitas NIK dan kontak akan otomatis tersimpan di sini.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 bg-slate-50">
                      <th className="py-3 px-3.5 font-bold">Status</th>
                      <th className="py-3 px-3.5 font-bold">Kamar Terdaftar</th>
                      <th className="py-3 px-3.5 font-bold">Nama Lengkap & NIK KTP</th>
                      <th className="py-3 px-3.5 font-bold">Kontak & Profesi</th>
                      <th className="py-3 px-3.5 font-bold">Periode Sewa</th>
                      <th className="py-3 px-3.5 font-bold">Kontak Darurat</th>
                      <th className="py-3 px-3.5 font-bold">Catatan</th>
                      <th className="py-3 px-3.5 font-bold text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredAllTenants.map((tenant) => {
                      const assignedRoom = rooms.find(r => r.id === tenant.roomId);
                      const isCurrentlyActive = assignedRoom?.tenant?.id === tenant.id;
                      const roomLabel = assignedRoom ? assignedRoom.roomNumber : `Kamar 0${tenant.roomId}`;

                      return (
                        <tr key={tenant.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3.5 px-3.5">
                            {isCurrentlyActive ? (
                              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1 w-max">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                                Aktif Menghuni
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px] w-max block">
                                Selesai Sewa / Arsip
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-3.5">
                            <div className="font-extrabold text-slate-900">{roomLabel}</div>
                            {assignedRoom && (
                              <div className="text-[11px] text-slate-500">{assignedRoom.type}</div>
                            )}
                            <div className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-medium border border-slate-200">
                              <Building2 className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                              <span className="truncate max-w-[140px]">{getBranchName(tenant.branchId || assignedRoom?.branchId)}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-3.5">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={
                                  tenant.avatarUrl ||
                                  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
                                }
                                alt={tenant.name}
                                className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0 shadow-2xs"
                              />
                              <div>
                                <div className="font-bold text-slate-900 text-sm">{tenant.name}</div>
                                <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                                  <span>NIK: {tenant.identityNumber || '-'}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-3.5">
                            <div className="font-medium text-slate-800 flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{tenant.phone}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {tenant.occupation || 'Karyawan'}
                            </div>
                          </td>
                          <td className="py-3.5 px-3.5">
                            <div className="text-slate-800 font-medium">
                              Masuk: {formatIndonesianDate(tenant.checkInDate)}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              Durasi: {tenant.contractDurationMonths} Bulan
                              {tenant.checkOutDate && ` (Keluar: ${formatIndonesianDate(tenant.checkOutDate)})`}
                            </div>
                          </td>
                          <td className="py-3.5 px-3.5">
                            <div className="font-medium text-slate-800">
                              {tenant.emergencyContact?.name || '-'} ({tenant.emergencyContact?.relationship || 'Keluarga'})
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {tenant.emergencyContact?.phone || '-'}
                            </div>
                          </td>
                          <td className="py-3.5 px-3.5 text-slate-500 text-[11px] max-w-xs">
                            {tenant.notes || '-'}
                          </td>
                          <td className="py-3.5 px-3.5 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setDeleteTenantTarget({
                                  id: String(tenant.id),
                                  name: tenant.name,
                                  roomLabel: roomLabel,
                                  isActive: isCurrentlyActive,
                                });
                              }}
                              title="Hapus Rekaman Penyewa Ini"
                              className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 transition cursor-pointer border border-rose-200/60 inline-flex items-center gap-1 text-[11px] font-bold"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Hapus</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Permohonan Sewa & Survey Masuk */}
        {activeTab === 'bookings' && (
          <div className="p-4 sm:p-6">
            {filteredBookings.length === 0 ? (
              <div className="py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
                  <Calendar className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-800 text-base">Belum Ada Permohonan Sewa Masuk</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  Permohonan yang dikirimkan calon penyewa dari Website Iklan / Landing Page akan otomatis masuk dan tersimpan di database Firestore di sini.
                </p>
                <div className="mt-4">
                  <button
                    onClick={() => setIsNewBookingModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs inline-flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Input Minat Sewa Manual</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-300 transition"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-slate-900 text-sm">{booking.name}</span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[10px] border border-slate-200">
                          <Building2 className="w-3 h-3 text-slate-500 shrink-0" />
                          <span>{getBranchName(booking.branchId)}</span>
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 font-bold text-[10px]">
                          Minat: {booking.roomNumber} ({booking.roomType})
                        </span>
                        {booking.status === 'pending' && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-[10px]">
                            Menunggu Respon
                          </span>
                        )}
                        {booking.status === 'survey_dijadwalkan' && (
                          <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-bold text-[10px]">
                            Survey Dijadwalkan
                          </span>
                        )}
                        {booking.status === 'disetujui' && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                            Disetujui
                          </span>
                        )}
                        {booking.status === 'selesai_checkin' && (
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bold text-[10px] flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Sudah Check-In
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600">
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>WA: {booking.phone}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Briefcase className="w-3 h-3 text-slate-400" />
                          <span>Status: {booking.occupation}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>Rencana Masuk: {booking.targetMoveDate || 'Segera'} ({booking.durationMonths} Bulan)</span>
                        </div>
                      </div>

                      {booking.notes && (
                        <p className="text-xs text-slate-500 italic bg-white p-2 rounded-lg border border-slate-100">
                          Catatan: {booking.notes}
                        </p>
                      )}
                      <div className="text-[10px] text-slate-400">
                        Diajukan pada: {booking.createdAt} &bull; ID: {booking.id}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap self-end md:self-center shrink-0">
                      <button
                        onClick={() => handleWhatsAppBooking(booking)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition shadow-2xs"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Chat WA</span>
                      </button>

                      {booking.status !== 'selesai_checkin' && (
                        <button
                          onClick={() => handleOpenCheckInModal(booking)}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition shadow-2xs"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Proses Check-In</span>
                        </button>
                      )}

                      <select
                        value={booking.status}
                        onChange={(e) => updateBookingStatus(booking.id, e.target.value as BookingStatus)}
                        className="text-xs bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-slate-700 focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="pending">Pending</option>
                        <option value="survey_dijadwalkan">Survey Dijadwalkan</option>
                        <option value="disetujui">Disetujui</option>
                        <option value="ditolak">Ditolak</option>
                        <option value="selesai_checkin">Selesai Check-in</option>
                      </select>

                      <button
                        onClick={() => setDeleteBookingTarget(booking.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Hapus Booking"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Check-In New Tenant Modal */}
      {isCheckInModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in duration-200">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg font-heading">
                    Pendaftaran & Check-In Penyewa Baru
                  </h3>
                  <p className="text-xs text-slate-300">
                    Data disimpan permanen ke database Cloud Firestore
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCheckInModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCheckInSubmit} className="p-5 sm:p-6 space-y-4 text-xs">
              {/* Pick Room with Interactive Visual Cards */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block font-extrabold text-slate-800">
                    Pilih Nomor Kamar *
                  </label>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {emptyRooms.length} kamar kosong tersedia
                  </span>
                </div>

                {/* Visual Grid of All 8 Rooms */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {rooms.map(room => {
                    const isSelected = selectedRoomId === room.id;
                    const isVacant = room.status === 'kosong';

                    return (
                      <button
                        key={room.id}
                        type="button"
                        onClick={() => setSelectedRoomId(room.id)}
                        className={`p-2.5 rounded-xl border text-left transition relative cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500 shadow-xs'
                            : isVacant
                            ? 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-slate-50/80'
                            : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className={`font-black text-xs ${isSelected ? 'text-emerald-900' : 'text-slate-900'}`}>
                            {room.roomNumber}
                          </span>
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isVacant ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          />
                        </div>

                        <div className="mt-1">
                          <div className="text-[10px] font-semibold text-slate-600 truncate">{room.type}</div>
                          <div className="text-[10px] text-slate-500">{formatRupiah(room.basePrice)}</div>
                        </div>

                        <div className="mt-1.5 pt-1.5 border-t border-slate-100 flex items-center justify-between">
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                              isVacant
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {isVacant ? 'Siap Huni' : 'Terisi'}
                          </span>
                          {isSelected && (
                            <span className="text-[9px] font-black text-emerald-700 flex items-center gap-0.5">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Dipilih
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Selected Room Details / Warning */}
                {isSelectedRoomOccupied ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex items-start gap-2.5 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-bold text-xs">
                        {currentSelectedRoom?.roomNumber} saat ini sedang dihuni oleh "{currentSelectedRoom?.tenant?.name}"
                      </p>
                      <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                        Jika melanjutkan, penghuni lama ({currentSelectedRoom?.tenant?.name}) akan otomatis di-checkout dan diarsipkan ke Database Riwayat.
                      </p>
                      {emptyRooms.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            const firstEmpty = rooms.find(r => r.status === 'kosong');
                            if (firstEmpty) setSelectedRoomId(firstEmpty.id);
                          }}
                          className="mt-2 px-2.5 py-1 bg-white border border-amber-300 rounded-lg text-[11px] font-bold text-amber-900 hover:bg-amber-100 transition cursor-pointer flex items-center gap-1"
                        >
                          &rarr; Alihkan ke Kamar Kosong ({emptyRooms[0]?.roomNumber})
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-emerald-900 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-semibold">
                        Kamar Terpilih: <strong>{currentSelectedRoom?.roomNumber}</strong> ({currentSelectedRoom?.type} - {formatRupiah(currentSelectedRoom?.basePrice || 0)}/bln)
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                      Siap Ditempati
                    </span>
                  </div>
                )}
              </div>

              {/* Personal Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Lengkap Penyewa *</label>
                  <input
                    id="tenant-checkin-fullname"
                    name="tenant_checkin_fullname"
                    type="text"
                    required
                    readOnly
                    onFocus={(e) => { e.currentTarget.readOnly = false; }}
                    autoComplete="one-time-code"
                    autoCorrect="off"
                    spellCheck={false}
                    data-lpignore="true"
                    data-form-type="other"
                    placeholder="Contoh: Dimas Prasetyo"
                    value={tenantName}
                    onChange={(e) => setTenantName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nomor NIK / No. KTP *</label>
                  <input
                    type="text"
                    required
                    placeholder="16 Digit NIK KTP"
                    value={tenantNik}
                    onChange={(e) => setTenantNik(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-800 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">No. WhatsApp Aktif *</label>
                  <input
                    type="tel"
                    required
                    placeholder="081234567890"
                    value={tenantPhone}
                    onChange={(e) => setTenantPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email (Opsional)</label>
                  <input
                    type="email"
                    placeholder="penyewa@email.com"
                    value={tenantEmail}
                    onChange={(e) => setTenantEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pekerjaan / Status</label>
                  <input
                    type="text"
                    placeholder="Software Engineer / Mahasiswa"
                    value={tenantOccupation}
                    onChange={(e) => setTenantOccupation(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-800"
                  />
                </div>
              </div>

              {/* Lease Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Mulai Check-In *</label>
                  <input
                    type="date"
                    required
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Durasi Kontrak Sewa</label>
                  <select
                    value={contractDuration}
                    onChange={(e) => setContractDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-800 bg-white"
                  >
                    <option value={1}>1 Bulan (Bulanan)</option>
                    <option value={3}>3 Bulan (Triwulan)</option>
                    <option value={6}>6 Bulan (Semester)</option>
                    <option value={12}>12 Bulan (1 Tahun)</option>
                  </select>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
                <div className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Kontak Darurat (Keluarga / Kerabat)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Nama Kontak Darurat"
                    value={emergencyName}
                    onChange={(e) => setEmergencyName(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                  />
                  <input
                    type="text"
                    placeholder="Hubungan (cth: Orang Tua)"
                    value={emergencyRelation}
                    onChange={(e) => setEmergencyRelation(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                  />
                  <input
                    type="tel"
                    placeholder="No. HP Darurat"
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan Tambahan & Kendaraan</label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Bawa motor Honda Vario hitam Plat B 1234 ABC."
                  value={tenantNotes}
                  onChange={(e) => setTenantNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-800"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="auto-invoice-check"
                  checked={autoInvoice}
                  onChange={(e) => setAutoInvoice(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
                <label htmlFor="auto-invoice-check" className="text-xs text-slate-700 font-semibold cursor-pointer">
                  Otomatis buatkan invoice sewa bulan pertama & iuran di database tagihan QRIS
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCheckInModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan & Daftarkan Penghuni</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Booking Input Modal */}
      {isNewBookingModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in duration-200">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base font-heading">
                    Catat Minat Sewa / Jadwal Survey
                  </h3>
                  <p className="text-xs text-slate-300">
                    Input data pemohon sewa yang bertanya via telepon/offline
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsNewBookingModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleManualBookingSubmit} className="p-5 sm:p-6 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Kamar Peminat *</label>
                <select
                  value={bookRoomId}
                  onChange={(e) => setBookRoomId(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                >
                  {rooms.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.roomNumber} ({r.type}) - {formatRupiah(r.basePrice)}/bln
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Calon Penyewa *</label>
                  <input
                    id="booking-tenant-fullname"
                    name="booking_tenant_fullname"
                    type="text"
                    required
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    data-lpignore="true"
                    data-form-type="other"
                    placeholder="Nama Lengkap"
                    value={bookName}
                    onChange={(e) => setBookName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">No. WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    placeholder="0812xxxxxxx"
                    value={bookPhone}
                    onChange={(e) => setBookPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pekerjaan / Status</label>
                  <input
                    type="text"
                    placeholder="Karyawan / Mahasiswa"
                    value={bookOccupation}
                    onChange={(e) => setBookOccupation(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Rencana Masuk / Survey</label>
                  <input
                    type="date"
                    value={bookTargetDate}
                    onChange={(e) => setBookTargetDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan</label>
                <textarea
                  rows={2}
                  placeholder="Catatan kebutuhan kamar atau waktu survey..."
                  value={bookNotes}
                  onChange={(e) => setBookNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewBookingModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs"
                >
                  Simpan Minat Sewa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Tenant Check-Out */}
      {checkoutConfirmTarget && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-rose-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm">
                <LogOut className="w-4 h-4" />
                <span>Konfirmasi Check-Out Penghuni</span>
              </div>
              <button
                onClick={() => setCheckoutConfirmTarget(null)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs text-slate-700">
              <p className="leading-relaxed">
                Apakah Anda yakin ingin menyelesaikan masa sewa & melakukan proses <strong>Check-Out</strong> untuk:
              </p>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <div className="font-black text-sm text-slate-900">
                  {checkoutConfirmTarget.tenantName}
                </div>
                <div className="text-slate-600 font-semibold flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    {checkoutConfirmTarget.roomNumber}
                  </span>
                  <span>Status Kamar akan kembali <strong>🟢 Siap Huni (Kosong)</strong></span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-amber-900">
                💡 Data identitas & riwayat sewa <strong>{checkoutConfirmTarget.tenantName}</strong> akan tetap tersimpan aman dan dapat dilihat di tab <strong>Database Semua Penyewa</strong>.
              </p>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCheckoutConfirmTarget(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    checkOutTenant(checkoutConfirmTarget.roomId);
                    setCheckoutConfirmTarget(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Ya, Selesaikan Check-Out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Delete Booking */}
      {deleteBookingTarget && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 space-y-3 text-xs text-slate-700">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <Trash2 className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-center text-slate-900">Hapus Permohonan Sewa?</h4>
              <p className="text-center text-slate-500 text-[11px]">
                Permohonan sewa ini akan dihapus dari daftar. Tindakan ini tidak dapat dibatalkan.
              </p>

              <div className="pt-2 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteBookingTarget(null)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    deleteBooking(deleteBookingTarget);
                    setDeleteBookingTarget(null);
                  }}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-xs cursor-pointer"
                >
                  Ya, Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Delete Tenant */}
      {deleteTenantTarget && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 space-y-3 text-xs text-slate-700">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <Trash2 className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-center text-slate-900">Hapus Rekaman Penyewa?</h4>
              <p className="text-center text-slate-600 text-[12px]">
                Apakah Anda yakin ingin menghapus data penyewa <span className="font-bold text-slate-900">{deleteTenantTarget.name}</span> ({deleteTenantTarget.roomLabel}) secara permanen dari database?
              </p>
              {deleteTenantTarget.isActive && (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    Penyewa ini saat ini masih aktif menghuni. Menghapusnya akan mengosongkan status kamar terkait.
                  </span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteTenantTarget(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await deleteTenant(deleteTenantTarget.id);
                    setDeleteTenantTarget(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Ya, Hapus Permanen</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

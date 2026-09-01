import React, { useState, useMemo } from 'react';
import { useKost } from '../context/KostContext';
import { Room, Tenant, RentalBooking, BookingStatus } from '../types';
import { formatRupiah, formatIndonesianDate, formatIndonesianMonthYear } from '../utils/formatters';
import { MonthPickerPopover } from './MonthPickerPopover';
import { CalendarConflictDetectorModal } from './CalendarConflictDetectorModal';
import { detectCalendarConflicts } from '../utils/calendarConflictDetector';
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
  TrendingUp,
  Award,
  Sparkles,
  Percent,
  ArrowUpRight,
  Activity,
  AlertTriangle,
  HelpCircle,
  Info,
  Layers,
  Table,
  BookOpen,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  CalendarCheck,
  CalendarRange,
  Eye,
  RefreshCw,
  SlidersHorizontal,
  ShieldAlert,
  Zap,
} from 'lucide-react';

interface TenantManagementViewProps {
  onOpenRoomModal?: (room: Room) => void;
}

export const TenantManagementView: React.FC<TenantManagementViewProps> = ({ onOpenRoomModal }) => {
  const {
    rooms,
    tenants,
    bookings,
    allBookings,
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
    updateRoom,
    isCloudConnected,
    firebaseProjectId,
    invoices,
  } = useKost();

  const [activeTab, setActiveTab] = useState<'tenants' | 'all_tenants' | 'calendar_monitor'>('tenants');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Calendar Block Monitor State
  const [calendarViewMode, setCalendarViewMode] = useState<'monthly' | 'yearly' | 'matrix'>('monthly');
  const [calendarFilterStatus, setCalendarFilterStatus] = useState<'all' | 'active' | 'expiring' | 'expired' | 'checkout'>('all');
  const [selectedCalendarMonth, setSelectedCalendarMonth] = useState<string>(() => new Date().toISOString().substring(0, 7)); // e.g. '2026-08'
  const [selectedCalendarYear, setSelectedCalendarYear] = useState<number>(() => new Date().getFullYear());
  const [showCalendarGuide, setShowCalendarGuide] = useState(false);
  const [isConflictDetectorOpen, setIsConflictDetectorOpen] = useState(false);
  const [selectedBlockTenant, setSelectedBlockTenant] = useState<any | null>(null);
  const [extensionMonthsCount, setExtensionMonthsCount] = useState<number>(6);
  const [isExtendingLoading, setIsExtendingLoading] = useState(false);

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

  // ----------------------------------------------------
  // CALENDAR BLOCK MONITOR & RESIDENT TIMELINE ENGINE
  // ----------------------------------------------------
  const today = new Date();

  // Process individual calendar records for each registered tenant
  const tenantCalendarRecords = useMemo(() => {
    return allDatabaseTenants.map(t => {
      const assignedRoom = rooms.find(r => r.id === t.roomId);
      const roomNumber = assignedRoom ? assignedRoom.roomNumber : `Kamar 0${t.roomId}`;
      const roomType = assignedRoom ? assignedRoom.type : 'Deluxe AC';
      const roomPrice = assignedRoom ? assignedRoom.basePrice : 1750000;
      const isCurrentlyActive = activeTenants.some(at => String(at.id) === String(t.id) || at.roomId === t.roomId);

      const inDateStr = t.checkInDate ? t.checkInDate : '2026-01-01';
      const inDate = new Date(inDateStr);

      const contractMonths = t.contractDurationMonths || 12;
      const contractEndDate = new Date(inDate);
      contractEndDate.setMonth(contractEndDate.getMonth() + contractMonths);
      const contractEndDateStr = contractEndDate.toISOString().split('T')[0];

      const outDateStr = t.checkOutDate ? t.checkOutDate : (!isCurrentlyActive ? contractEndDateStr : null);
      const outDate = outDateStr ? new Date(outDateStr) : null;

      // Calculate stay duration
      const effectiveEndDate = outDate || (isCurrentlyActive ? today : contractEndDate);
      const diffTime = Math.max(0, effectiveEndDate.getTime() - inDate.getTime());
      const diffMonths = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24 * 30.4375)));
      const progressPct = Math.min(100, Math.max(0, Math.round((diffMonths / contractMonths) * 100)));

      // Remaining days until contract expires
      const remainingTime = contractEndDate.getTime() - today.getTime();
      const remainingDays = Math.ceil(remainingTime / (1000 * 60 * 60 * 24));
      const isExpiringSoon = isCurrentlyActive && remainingDays <= 30 && remainingDays > 0;
      const isExpired = isCurrentlyActive && remainingDays <= 0;

      // Billing due day of month (e.g. 1st or check-in date)
      const billingDueDay = inDate.getDate() || 1;

      // Total LTV from paid invoices or estimated tenure
      const tenantInvoices = (invoices || []).filter(
        inv => inv.roomId === t.roomId && (inv.status === 'lunas' || inv.tenantName.toLowerCase().includes(t.name.toLowerCase()))
      );
      const actualPaidAmount = tenantInvoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
      const totalLtv = actualPaidAmount > 0 ? actualPaidAmount : diffMonths * roomPrice;

      const branchId = t.branchId || assignedRoom?.branchId;
      const branchName = getBranchName(branchId);

      let calendarStatus: 'active' | 'expiring' | 'expired' | 'checkout' = 'active';
      if (!isCurrentlyActive) {
        calendarStatus = 'checkout';
      } else if (isExpired) {
        calendarStatus = 'expired';
      } else if (isExpiringSoon) {
        calendarStatus = 'expiring';
      } else {
        calendarStatus = 'active';
      }

      return {
        ...t,
        assignedRoom,
        roomNumber,
        roomType,
        roomPrice,
        branchId,
        branchName,
        isCurrentlyActive,
        inDate,
        inDateStr,
        contractMonths,
        contractEndDate,
        contractEndDateStr,
        outDate,
        outDateStr,
        stayDurationMonths: diffMonths,
        progressPct,
        remainingDays,
        isExpiringSoon,
        isExpired,
        billingDueDay,
        totalLtv,
        calendarStatus,
      };
    });
  }, [allDatabaseTenants, rooms, activeTenants, invoices, branches]);

  // Aggregated Calendar KPIs
  const expiringSoonCount = tenantCalendarRecords.filter(t => t.isExpiringSoon).length;
  const expiredCount = tenantCalendarRecords.filter(t => t.isExpired).length;
  const activeBlockCount = tenantCalendarRecords.filter(t => t.isCurrentlyActive).length;
  const totalLtvSum = tenantCalendarRecords.reduce((acc, t) => acc + t.totalLtv, 0);
  const avgLtv = tenantCalendarRecords.length > 0 ? Math.round(totalLtvSum / tenantCalendarRecords.length) : 0;
  const avgStayMonths = tenantCalendarRecords.length > 0 ? (tenantCalendarRecords.reduce((acc, t) => acc + t.stayDurationMonths, 0) / tenantCalendarRecords.length).toFixed(1) : '0';
  const calendarOccupancyRate = Math.round((activeBlockCount / (rooms.length || 1)) * 100);

  // Real-time Calendar Conflicts Detection
  const calendarConflicts = useMemo(() => {
    return detectCalendarConflicts(rooms, tenants, activeTenants, allBookings, branches);
  }, [rooms, tenants, activeTenants, allBookings, branches]);

  // Filtered Records for Calendar Block View
  const filteredCalendarRecords = tenantCalendarRecords.filter(t => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      !searchTerm ||
      t.name.toLowerCase().includes(q) ||
      t.roomNumber.toLowerCase().includes(q) ||
      t.phone.includes(q) ||
      (t.occupation && t.occupation.toLowerCase().includes(q));

    if (!matchSearch) return false;

    if (calendarFilterStatus === 'active') return t.isCurrentlyActive;
    if (calendarFilterStatus === 'expiring') return t.isExpiringSoon;
    if (calendarFilterStatus === 'expired') return t.isExpired;
    if (calendarFilterStatus === 'checkout') return !t.isCurrentlyActive;
    return true;
  });

  // Action: Quick Contract Extension with Instant State & Firestore Sync
  const handleExtendContract = async (tenantId: string, additionalMonths: number) => {
    const target = tenantCalendarRecords.find(t => String(t.id) === String(tenantId));
    if (!target) return;

    setIsExtendingLoading(true);
    try {
      const newDuration = (target.contractDurationMonths || 12) + additionalMonths;
      
      // Update tenant in rooms if active
      if (target.assignedRoom && target.isCurrentlyActive) {
        const updatedTenant = {
          ...(target.assignedRoom.tenant || target),
          contractDurationMonths: newDuration,
        };
        await updateRoom({
          ...target.assignedRoom,
          tenant: updatedTenant,
        });
      }

      const newEnd = new Date(target.inDate);
      newEnd.setMonth(newEnd.getMonth() + newDuration);
      const newEndStr = newEnd.toISOString().split('T')[0];

      alert(`Sukses! Masa kontrak sewa untuk ${target.name} (${target.roomNumber}) berhasil diperpanjang +${additionalMonths} bulan (Total: ${newDuration} bulan, hingga ${formatIndonesianDate(newEndStr)}).`);
      
      if (selectedBlockTenant && String(selectedBlockTenant.id) === String(tenantId)) {
        const updatedRemainingTime = newEnd.getTime() - today.getTime();
        const updatedRemainingDays = Math.ceil(updatedRemainingTime / (1000 * 60 * 60 * 24));
        setSelectedBlockTenant({
          ...selectedBlockTenant,
          contractDurationMonths: newDuration,
          contractMonths: newDuration,
          contractEndDate: newEnd,
          contractEndDateStr: newEndStr,
          remainingDays: updatedRemainingDays,
          isExpiringSoon: updatedRemainingDays <= 30 && updatedRemainingDays > 0,
          isExpired: updatedRemainingDays <= 0,
        });
      }
    } catch (err) {
      console.error('Failed to extend contract:', err);
      alert('Terjadi kesalahan saat memperpanjang kontrak sewa.');
    } finally {
      setIsExtendingLoading(false);
    }
  };

  // Action: 1-Click WhatsApp Reminder
  const handleSendReminderWA = (tenant: typeof tenantCalendarRecords[0], templateType: 'perpanjang' | 'tagihan' | 'sapaan') => {
    if (!tenant.phone) return;
    const clean = tenant.phone.replace(/\D/g, '');
    const formatted = clean.startsWith('0') ? '62' + clean.slice(1) : clean.startsWith('62') ? clean : '62' + clean;

    let message = '';
    if (templateType === 'perpanjang') {
      message = `Halo Kak ${tenant.name} (${tenant.roomNumber}), kami dari pengelola ${settings.kostName} menginformasikan bahwa masa sewa kamar Kakak akan berakhir pada tanggal ${formatIndonesianDate(tenant.contractEndDateStr)} (Sisa ${tenant.remainingDays} hari). Apakah Kakak berencana memperpanjang sewa untuk periode berikutnya? Mohon konfirmasinya ya Kak. Terima kasih! 🙏`;
    } else if (templateType === 'tagihan') {
      message = `Halo Kak ${tenant.name} (${tenant.roomNumber}), pengingat tagihan sewa bulanan kos sebesar ${formatRupiah(tenant.roomPrice)} untuk periode berjalan. Pembayaran dapat dilakukan via transfer atau QRIS melalui sistem. Terima kasih atas kerjasamanya! 😊`;
    } else {
      message = `Halo Kak ${tenant.name} (${tenant.roomNumber}), salam dari pengelola ${settings.kostName}. Semoga Kakak selalu nyaman tinggal di kos kami. Jika ada kendala fasilitas atau saran, jangan ragu untuk menyampaikan ke kami ya. Terima kasih! ✨`;
    }

    window.open(`https://wa.me/${formatted}?text=${encodeURIComponent(message)}`, '_blank');
  };

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
              Database Penyewa & Status Berjalan Sewa
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

          <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3.5">
            <div className="text-[11px] font-semibold text-indigo-700 flex items-center justify-between">
              <span>Monitor Blok Kalender Sewa</span>
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-indigo-900 mt-1">
              {activeBlockCount} <span className="text-xs font-normal text-indigo-600">/ {rooms.length} Kamar Aktif</span>
            </div>
            <div className="text-[10px] text-indigo-700 font-bold mt-1 flex items-center gap-1">
              <span>{calendarOccupancyRate}% Okupansi Blok</span>
              <span>&bull;</span>
              <span>{expiringSoonCount > 0 ? `${expiringSoonCount} Perlu Perpanjang` : 'Semua Kontrak Aman'}</span>
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
              onClick={() => setActiveTab('calendar_monitor')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                activeTab === 'calendar_monitor'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Calendar Block Monitor ({allDatabaseTenants.length})</span>
              {expiringSoonCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center animate-pulse" title={`${expiringSoonCount} penghuni mendekati akhir kontrak`}>
                  {expiringSoonCount}
                </span>
              )}
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={activeTab === 'calendar_monitor' ? 'Cari nama / kamar / NIK di kalender...' : 'Cari nama, kamar, NIK...'}
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

        {/* Tab 3: Calendar Block Monitor Tiap Penghuni */}
        {activeTab === 'calendar_monitor' && (
          <div className="p-4 sm:p-6 space-y-6 animate-in fade-in duration-200">
            {/* Top Insight Header Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-md relative z-30">
              <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
              </div>
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1 max-w-2xl">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-400/20 text-indigo-200 text-[10px] font-bold border border-indigo-400/30 flex items-center gap-1">
                      <CalendarDays className="w-3 h-3 text-indigo-300" />
                      <span>Timeline Blok Kalender Sewa Real-time</span>
                    </span>
                    <span className="text-xs text-indigo-200 font-medium">
                      Total {allDatabaseTenants.length} Data Penyewa Terdaftar
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-extrabold font-heading tracking-tight text-white">
                    Calendar Block Monitor Sewa Tiap Penghuni
                  </h3>
                  <p className="text-xs text-indigo-200/90 leading-relaxed">
                    Pantau alokasi timeline sewa, masa tinggal aktif, tanggal jatuh tempo pembayaran, dan estimasi akhir kontrak tiap penghuni kos dalam format blok visual yang mudah dipahami.
                  </p>
                </div>

                {/* Period Controls & Quick Jump */}
                <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                  <div className="flex items-center bg-white/10 backdrop-blur-md rounded-xl border border-white/15 p-1">
                    <button
                      type="button"
                      onClick={() => {
                        const [y, m] = selectedCalendarMonth.split('-').map(Number);
                        const prevDate = new Date(y, m - 2, 1);
                        const newStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
                        setSelectedCalendarMonth(newStr);
                        setSelectedCalendarYear(prevDate.getFullYear());
                      }}
                      className="p-1.5 rounded-lg hover:bg-white/20 text-indigo-100 transition cursor-pointer"
                      title="Bulan Sebelumnya"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <MonthPickerPopover
                      value={selectedCalendarMonth}
                      onChange={(newMonth) => {
                        setSelectedCalendarMonth(newMonth);
                        const yr = parseInt(newMonth.split('-')[0], 10);
                        if (!isNaN(yr)) setSelectedCalendarYear(yr);
                      }}
                      label=""
                      align="right"
                      className="text-white"
                    />

                    <button
                      type="button"
                      onClick={() => {
                        const [y, m] = selectedCalendarMonth.split('-').map(Number);
                        const nextDate = new Date(y, m, 1);
                        const newStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
                        setSelectedCalendarMonth(newStr);
                        setSelectedCalendarYear(nextDate.getFullYear());
                      }}
                      className="p-1.5 rounded-lg hover:bg-white/20 text-indigo-100 transition cursor-pointer"
                      title="Bulan Berikutnya"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const nowStr = new Date().toISOString().substring(0, 7);
                      setSelectedCalendarMonth(nowStr);
                      setSelectedCalendarYear(new Date().getFullYear());
                    }}
                    className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-indigo-100 text-xs font-bold border border-white/15 transition cursor-pointer"
                  >
                    Bulan Ini
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowCalendarGuide(!showCalendarGuide)}
                    className="px-3 py-2 rounded-xl bg-indigo-500/30 hover:bg-indigo-500/40 text-indigo-100 text-xs font-bold border border-indigo-400/40 flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-indigo-200" />
                    <span>{showCalendarGuide ? 'Tutup Panduan' : '📖 Panduan Blok Kalender'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsConflictDetectorOpen(true)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition cursor-pointer shadow-xs ${
                      calendarConflicts.length > 0
                        ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-400 animate-pulse'
                        : 'bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-100 border-indigo-400/30'
                    }`}
                    title="Buka Detektor Konflik Kalender & Double-Booking"
                  >
                    <ShieldAlert className={`w-3.5 h-3.5 ${calendarConflicts.length > 0 ? 'text-white' : 'text-indigo-300'}`} />
                    <span>
                      {calendarConflicts.length > 0
                        ? `⚡ ${calendarConflicts.length} Konflik Terdeteksi!`
                        : '⚡ Detektor Konflik Kalender'}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Real-time Conflict Alert Banner if any conflicts exist */}
            {calendarConflicts.length > 0 && (
              <div className="p-4 sm:p-5 rounded-2xl bg-rose-50 border border-rose-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-rose-600 text-white shadow-xs shrink-0 animate-bounce">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-rose-950 font-heading flex items-center gap-2">
                      <span>Peringatan Sistem: {calendarConflicts.length} Konflik Jadwal & Double-Booking Terdeteksi!</span>
                      <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[9px] font-black uppercase">
                        Action Required
                      </span>
                    </h4>
                    <p className="text-xs text-rose-700 mt-0.5">
                      Ditemukan jadwal sewa bertabrakan atau tumpang tindih pada kamar. AI telah menyiapkan opsi relokasi kamar kosong & penyesuaian otomatis.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsConflictDetectorOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Zap className="w-4 h-4 text-amber-300" />
                  <span>Buka Evaluasi & Solusi Otomatis</span>
                </button>
              </div>
            )}

            {/* Collapsible Educational Guide Box */}
            {showCalendarGuide && (
              <div className="bg-indigo-50/90 border border-indigo-200 rounded-2xl p-5 text-xs text-indigo-950 space-y-3.5 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between border-b border-indigo-200/80 pb-2">
                  <div className="flex items-center gap-2 font-black text-indigo-900 text-sm">
                    <HelpCircle className="w-4 h-4 text-indigo-700" />
                    <span>Panduan Membaca Calendar Block Monitor Sewa Penghuni Kos</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCalendarGuide(false)}
                    className="text-indigo-600 hover:text-indigo-900 text-xs font-bold cursor-pointer"
                  >
                    ✕ Tutup
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
                  <div className="bg-white p-3.5 rounded-xl border border-indigo-100 space-y-1">
                    <h5 className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                      <span>🟢 Blok Sewa Aktif (Hijau)</span>
                    </h5>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Menandakan penyewa sedang dalam masa tinggal sah dan aktif sesuai durasi kontrak sewa terdaftar.
                    </p>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-indigo-100 space-y-1">
                    <h5 className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                      <span>🟡 Mendekati Akhir (&le;30 Hari)</span>
                    </h5>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Kontrak penyewa akan berakhir dalam waktu dekat. Perlu segera konfirmasi perpanjangan sewa via WhatsApp.
                    </p>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-indigo-100 space-y-1">
                    <h5 className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                      <span>🔵 Titik Check-In & Jatuh Tempo</span>
                    </h5>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Penanda hari mulai masuk (IN) dan hari penagihan jatuh tempo sewa bulanan untuk tiap penghuni.
                    </p>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-indigo-100 space-y-1">
                    <h5 className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-800"></span>
                      <span>⚪ Status OUT & Cabang Aktif</span>
                    </h5>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Penanda tanggal resmi penghuni keluar (OUT) beserta badge cabang properti kos asal penyewa.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 4 Summary Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-[11px] font-bold">Okupansi Blok Kalender</span>
                  <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                    <CalendarCheck className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-indigo-900 font-heading">
                  {calendarOccupancyRate}%
                </div>
                <p className="text-[10px] text-slate-500">
                  {activeBlockCount} dari {rooms.length} kamar terisi aktif
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-[11px] font-bold">Rata-rata Durasi Sewa</span>
                  <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900 font-heading">
                  {avgStayMonths} <span className="text-xs font-semibold text-slate-500">Bulan</span>
                </div>
                <p className="text-[10px] text-slate-500">
                  Total {allDatabaseTenants.length} penghuni di database
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-[11px] font-bold">Rata-rata LTV Per Penghuni</span>
                  <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
                    <CreditCard className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
                  {formatRupiah(avgLtv)}
                </div>
                <p className="text-[10px] text-slate-500">
                  Total akumulasi: {formatRupiah(totalLtvSum)}
                </p>
              </div>

              <div className={`border rounded-2xl p-4 shadow-2xs space-y-1 ${
                expiringSoonCount > 0
                  ? 'bg-rose-50/70 border-rose-200'
                  : 'bg-white border-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-rose-800">Mendekati Akhir Kontrak</span>
                  <div className="p-1.5 rounded-lg bg-rose-100 text-rose-600 border border-rose-200">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-rose-700 font-heading">
                  {expiringSoonCount} <span className="text-xs font-semibold text-rose-600">Penyewa</span>
                </div>
                <p className="text-[10px] text-rose-600 font-medium">
                  {expiringSoonCount > 0 ? 'Kontrak berakhir dalam <30 hari (Perlu Follow-up)' : 'Semua kontrak aktif dalam kondisi aman'}
                </p>
              </div>
            </div>

            {/* View Mode Switcher & Filter Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-2 bg-slate-100/90 rounded-2xl border border-slate-200">
              {/* View Mode Buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setCalendarViewMode('monthly')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    calendarViewMode === 'monthly'
                      ? 'bg-white text-indigo-900 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                  <span>🗓️ Kalender Harian ({formatIndonesianMonthYear(selectedCalendarMonth)})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCalendarViewMode('yearly')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    calendarViewMode === 'yearly'
                      ? 'bg-white text-indigo-900 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <CalendarRange className="w-3.5 h-3.5 text-emerald-600" />
                  <span>📅 Timeline 12 Bulan ({selectedCalendarYear})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCalendarViewMode('matrix')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    calendarViewMode === 'matrix'
                      ? 'bg-white text-indigo-900 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Table className="w-3.5 h-3.5 text-purple-600" />
                  <span>📊 Matriks Blok & Sisa Kontrak</span>
                </button>
              </div>

              {/* Status Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto">
                <button
                  onClick={() => setCalendarFilterStatus('all')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                    calendarFilterStatus === 'all'
                      ? 'bg-slate-800 text-white shadow-2xs'
                      : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                  }`}
                >
                  Semua ({tenantCalendarRecords.length})
                </button>
                <button
                  onClick={() => setCalendarFilterStatus('active')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                    calendarFilterStatus === 'active'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                  }`}
                >
                  🟢 Aktif ({activeBlockCount})
                </button>
                <button
                  onClick={() => setCalendarFilterStatus('expiring')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                    calendarFilterStatus === 'expiring'
                      ? 'bg-amber-600 text-white shadow-2xs font-bold'
                      : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                  }`}
                >
                  🟡 Mendekati Akhir ({expiringSoonCount})
                </button>
                <button
                  onClick={() => setCalendarFilterStatus('checkout')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                    calendarFilterStatus === 'checkout'
                      ? 'bg-slate-700 text-white shadow-2xs font-bold'
                      : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  ⚪ Status OUT / Selesai ({checkoutHistoryCount})
                </button>
              </div>
            </div>

            {/* VIEW 1: KALENDER HARIAN BULANAN (1 to 28/30/31 Days Grid) */}
            {calendarViewMode === 'monthly' && (() => {
              const [viewYear, viewMonthNum] = selectedCalendarMonth.split('-').map(Number);
              const daysInMonth = new Date(viewYear, viewMonthNum, 0).getDate();
              const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

              return (
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 text-[10px] font-black uppercase">
                          Blok Harian
                        </span>
                        <h4 className="font-extrabold text-sm text-slate-900 font-heading">
                          Monitor Kalender Blok Harian &mdash; {formatIndonesianMonthYear(selectedCalendarMonth)}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Menampilkan status hunian kamar tiap tanggal pada bulan {formatIndonesianMonthYear(selectedCalendarMonth)}. Klik pada baris atau blok untuk detail & perpanjangan kontrak.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-600 flex-wrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        Aktif Menghuni
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        Masuk (IN)
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        Akhir Kontrak
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-200 text-slate-800 font-bold">
                        <span className="w-2 h-2 rounded-full bg-slate-800"></span>
                        Keluar (OUT)
                      </span>
                    </div>
                  </div>

                  {filteredCalendarRecords.length > 0 ? (
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full text-xs text-left border-collapse min-w-[900px]">
                        <thead>
                          <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                            <th className="py-2.5 px-3 sticky left-0 z-20 bg-slate-50 min-w-[200px] border-r border-slate-200 shadow-xs">
                              Penghuni & Kamar
                            </th>
                            <th className="py-2.5 px-2.5 text-center min-w-[100px] border-r border-slate-200">
                              Status Kontrak
                            </th>
                            {daysArray.map(d => {
                              const dayDate = new Date(viewYear, viewMonthNum - 1, d);
                              const isWeekend = dayDate.getDay() === 0 || dayDate.getDay() === 6;
                              const isTodayDate = dayDate.toDateString() === today.toDateString();

                              return (
                                <th
                                  key={d}
                                  className={`py-2 px-1 text-center font-bold text-[10px] min-w-[28px] border-r border-slate-100 ${
                                    isTodayDate
                                      ? 'bg-indigo-100/80 text-indigo-900 font-black'
                                      : isWeekend
                                      ? 'bg-amber-50/50 text-amber-800'
                                      : 'text-slate-600'
                                  }`}
                                  title={`Tanggal ${d} ${formatIndonesianMonthYear(selectedCalendarMonth)}`}
                                >
                                  <div>{d}</div>
                                  <div className="text-[8px] font-normal opacity-70">
                                    {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'][dayDate.getDay()]}
                                  </div>
                                </th>
                              );
                            })}
                            <th className="py-2.5 px-3 text-right sticky right-0 z-20 bg-slate-50 min-w-[110px] border-l border-slate-200 shadow-xs">
                              Aksi
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredCalendarRecords.map(item => {
                            return (
                              <tr
                                key={item.id}
                                className="hover:bg-indigo-50/30 transition group"
                              >
                                {/* Sticky Resident Info Column */}
                                <td
                                  onClick={() => setSelectedBlockTenant(item)}
                                  className="py-2.5 px-3 sticky left-0 z-10 bg-white group-hover:bg-slate-50 border-r border-slate-200 shadow-xs cursor-pointer"
                                  title="Klik untuk melihat detail & perpanjangan sewa"
                                >
                                  <div className="flex items-center gap-2">
                                    <img
                                      src={
                                        item.avatarUrl ||
                                        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
                                      }
                                      alt={item.name}
                                      className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
                                    />
                                    <div className="min-w-0">
                                      <div className="font-extrabold text-slate-900 truncate font-heading text-xs">
                                        {item.name}
                                      </div>
                                      <div className="text-[10px] text-slate-500 flex items-center gap-1 truncate flex-wrap mt-0.5">
                                        <span className="font-bold text-indigo-700">{item.roomNumber}</span>
                                        <span>&bull;</span>
                                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-teal-50 text-teal-800 font-semibold text-[9px] border border-teal-200 truncate max-w-[120px]">
                                          <Building2 className="w-2.5 h-2.5 text-teal-600 shrink-0" />
                                          <span className="truncate">{item.branchName}</span>
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                {/* Contract Status Summary */}
                                <td className="py-2 px-2.5 text-center border-r border-slate-200">
                                  {item.isCurrentlyActive ? (
                                    item.isExpiringSoon ? (
                                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[9px] block whitespace-nowrap animate-pulse">
                                        Sisa {item.remainingDays} Hari
                                      </span>
                                    ) : item.isExpired ? (
                                      <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[9px] block whitespace-nowrap">
                                        Lewat Kontrak
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[9px] block whitespace-nowrap">
                                        Aktif ({item.stayDurationMonths}/{item.contractMonths} Bln)
                                      </span>
                                    )
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300 font-bold text-[9px] block whitespace-nowrap">
                                      OUT (Selesai)
                                    </span>
                                  )}
                                </td>

                                {/* 28-31 Day Cells */}
                                {daysArray.map(d => {
                                  const dayDate = new Date(viewYear, viewMonthNum - 1, d, 12, 0, 0);
                                  const inTime = new Date(item.inDate.getFullYear(), item.inDate.getMonth(), item.inDate.getDate(), 0, 0, 0).getTime();
                                  const endTime = new Date(item.contractEndDate.getFullYear(), item.contractEndDate.getMonth(), item.contractEndDate.getDate(), 23, 59, 59).getTime();
                                  const currentDayTime = dayDate.getTime();
                                  const outTime = item.outDate ? new Date(item.outDate.getFullYear(), item.outDate.getMonth(), item.outDate.getDate(), 23, 59, 59).getTime() : null;

                                  const isBeforeCheckIn = currentDayTime < inTime;
                                  const isAfterContract = currentDayTime > endTime;
                                  const isCheckOutDay = !item.isCurrentlyActive && item.outDate && dayDate.toDateString() === item.outDate.toDateString();
                                  const isAfterCheckout = !item.isCurrentlyActive && outTime && currentDayTime > outTime;

                                  const isCheckInDay = dayDate.toDateString() === item.inDate.toDateString();
                                  const isContractEndDay = dayDate.toDateString() === item.contractEndDate.toDateString();
                                  const isTodayDate = dayDate.toDateString() === today.toDateString();

                                  let cellClass = 'bg-slate-50/40 text-slate-300';
                                  let cellLabel = '';
                                  let cellTooltip = `${d} ${formatIndonesianMonthYear(selectedCalendarMonth)}: Kamar Kosong / Belum Sewa`;

                                  if (isBeforeCheckIn) {
                                    cellClass = 'bg-slate-50/40 text-slate-300';
                                  } else if (isCheckOutDay) {
                                    cellClass = 'bg-slate-900 text-white font-black shadow-2xs ring-1 ring-slate-700';
                                    cellLabel = 'OUT';
                                    cellTooltip = `${d} ${formatIndonesianMonthYear(selectedCalendarMonth)}: Tanggal Check-Out / Selesai Sewa (${item.name})`;
                                  } else if (isAfterCheckout) {
                                    cellClass = 'bg-slate-100/60 text-slate-400';
                                    cellTooltip = `${d} ${formatIndonesianMonthYear(selectedCalendarMonth)}: Sudah Check-Out (Status OUT)`;
                                  } else if (isAfterContract) {
                                    if (item.isCurrentlyActive) {
                                      cellClass = 'bg-rose-100 text-rose-800 font-bold';
                                      cellLabel = '!';
                                      cellTooltip = `${d} ${formatIndonesianMonthYear(selectedCalendarMonth)}: Kontrak Lewat Batas`;
                                    } else {
                                      cellClass = 'bg-slate-100 text-slate-400';
                                    }
                                  } else {
                                    // Within contract
                                    if (isCheckInDay) {
                                      cellClass = 'bg-blue-600 text-white font-black shadow-2xs ring-1 ring-blue-400';
                                      cellLabel = 'IN';
                                      cellTooltip = `${d} ${formatIndonesianMonthYear(selectedCalendarMonth)}: Tanggal Mulai Check-In (${item.name})`;
                                    } else if (isContractEndDay) {
                                      cellClass = 'bg-amber-500 text-white font-black shadow-2xs ring-1 ring-amber-300 animate-pulse';
                                      cellLabel = 'EXP';
                                      cellTooltip = `${d} ${formatIndonesianMonthYear(selectedCalendarMonth)}: Batas Akhir Kontrak Sewa (${item.name})`;
                                    } else if (item.isExpiringSoon) {
                                      cellClass = 'bg-amber-100 hover:bg-amber-200 text-amber-900';
                                      cellTooltip = `${d} ${formatIndonesianMonthYear(selectedCalendarMonth)}: Masa Sewa Aktif - Mendekati Akhir Kontrak (${item.name})`;
                                    } else {
                                      cellClass = 'bg-emerald-500 hover:bg-emerald-600 text-white';
                                      cellTooltip = `${d} ${formatIndonesianMonthYear(selectedCalendarMonth)}: Masa Sewa Aktif Normal (${item.name})`;
                                    }
                                  }

                                  return (
                                    <td
                                      key={d}
                                      className={`p-0.5 text-center border-r border-slate-100 h-8 ${isTodayDate ? 'ring-1 ring-indigo-400' : ''}`}
                                      title={cellTooltip}
                                    >
                                      <div className={`w-full h-7 rounded flex items-center justify-center text-[9px] transition ${cellClass}`}>
                                        {cellLabel || (cellClass.includes('emerald-500') ? '•' : '')}
                                      </div>
                                    </td>
                                  );
                                })}

                                {/* Sticky Action Column */}
                                <td
                                  className="py-2 px-3 sticky right-0 z-10 bg-white group-hover:bg-slate-50 text-right border-l border-slate-200 shadow-xs"
                                  onClick={e => e.stopPropagation()}
                                >
                                  <div className="flex items-center justify-end gap-1.5">
                                    {item.phone && (
                                      <button
                                        type="button"
                                        onClick={() => handleSendReminderWA(item, item.isExpiringSoon ? 'perpanjang' : 'sapaan')}
                                        className={`p-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                                          item.isExpiringSoon
                                            ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                        }`}
                                        title={item.isExpiringSoon ? 'Kirim WA Pengingat Perpanjangan' : 'Chat WhatsApp Penghuni'}
                                      >
                                        <MessageSquare className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => setSelectedBlockTenant(item)}
                                      className="px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[10px] border border-indigo-200 transition cursor-pointer"
                                      title="Buka Detail Blok & Perpanjang Kontrak"
                                    >
                                      Detail
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="py-8 text-center text-slate-400 text-xs italic">
                      Tidak ada data sewa yang cocok dengan filter yang dipilih.
                    </div>
                  )}
                </div>
              );
            })()}

            {/* VIEW 2: TIMELINE 12 BULAN (Yearly Overview Jan-Des) */}
            {calendarViewMode === 'yearly' && (() => {
              const monthsList = [
                { num: 0, name: 'Jan', full: 'Januari' },
                { num: 1, name: 'Feb', full: 'Februari' },
                { num: 2, name: 'Mar', full: 'Maret' },
                { num: 3, name: 'Apr', full: 'April' },
                { num: 4, name: 'Mei', full: 'Mei' },
                { num: 5, name: 'Jun', full: 'Juni' },
                { num: 6, name: 'Jul', full: 'Juli' },
                { num: 7, name: 'Agu', full: 'Agustus' },
                { num: 8, name: 'Sep', full: 'September' },
                { num: 9, name: 'Okt', full: 'Oktober' },
                { num: 10, name: 'Nov', full: 'November' },
                { num: 11, name: 'Des', full: 'Desember' },
              ];

              return (
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                          Timeline Tahunan
                        </span>
                        <h4 className="font-extrabold text-sm text-slate-900 font-heading">
                          Timeline Blok Sewa 12 Bulan &mdash; Tahun {selectedCalendarYear}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Gambaran komprehensif alokasi dan kelangsungan sewa seluruh penghuni sepanjang tahun {selectedCalendarYear}.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedCalendarYear(prev => prev - 1)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                        title="Tahun Sebelumnya"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="font-extrabold text-sm text-slate-800 font-heading">
                        {selectedCalendarYear}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedCalendarYear(prev => prev + 1)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                        title="Tahun Berikutnya"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-xs text-left border-collapse min-w-[850px]">
                      <thead>
                        <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                          <th className="py-2.5 px-3 sticky left-0 z-20 bg-slate-50 min-w-[200px] border-r border-slate-200">
                            Penghuni & Kamar
                          </th>
                          <th className="py-2.5 px-2.5 text-center min-w-[90px] border-r border-slate-200">
                            Masa Sewa
                          </th>
                          {monthsList.map(m => {
                            const isCurrentMonth = today.getFullYear() === selectedCalendarYear && today.getMonth() === m.num;

                            return (
                              <th
                                key={m.num}
                                className={`py-2.5 px-2 text-center text-xs font-bold min-w-[55px] border-r border-slate-100 ${
                                  isCurrentMonth ? 'bg-indigo-100 text-indigo-900 font-black' : 'text-slate-700'
                                }`}
                              >
                                <div>{m.name}</div>
                                {isCurrentMonth && (
                                  <div className="text-[8px] text-indigo-600 font-extrabold uppercase">Kini</div>
                                )}
                              </th>
                            );
                          })}
                          <th className="py-2.5 px-3 text-right sticky right-0 z-20 bg-slate-50 min-w-[90px] border-l border-slate-200">
                            Aksi
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredCalendarRecords.map(item => {
                          return (
                            <tr
                              key={item.id}
                              className="hover:bg-indigo-50/30 transition group"
                            >
                              {/* Sticky Info */}
                              <td
                                onClick={() => setSelectedBlockTenant(item)}
                                className="py-2.5 px-3 sticky left-0 z-10 bg-white group-hover:bg-slate-50 border-r border-slate-200 shadow-xs cursor-pointer"
                                title="Klik untuk melihat detail & perpanjangan sewa"
                              >
                                <div className="font-extrabold text-slate-900 truncate font-heading text-xs">
                                  {item.name}
                                </div>
                                <div className="text-[10px] text-slate-500 flex items-center gap-1 flex-wrap mt-0.5">
                                  <span className="font-bold text-indigo-700">{item.roomNumber}</span>
                                  <span>&bull;</span>
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-teal-50 text-teal-800 font-semibold text-[9px] border border-teal-200 truncate max-w-[110px]">
                                    <Building2 className="w-2.5 h-2.5 text-teal-600 shrink-0" />
                                    <span className="truncate">{item.branchName}</span>
                                  </span>
                                </div>
                              </td>

                              <td className="py-2 px-2.5 text-center text-[10px] text-slate-600 font-semibold border-r border-slate-200">
                                {item.isCurrentlyActive ? (
                                  <span>{item.stayDurationMonths} / {item.contractMonths} Bln</span>
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[9px] border border-slate-300">OUT</span>
                                )}
                              </td>

                              {/* 12 Months Blocks */}
                              {monthsList.map(m => {
                                const mStart = new Date(selectedCalendarYear, m.num, 1, 0, 0, 0);
                                const mEnd = new Date(selectedCalendarYear, m.num + 1, 0, 23, 59, 59);

                                const isMonthActive = item.inDate <= mEnd && (item.outDate || item.contractEndDate) >= mStart;
                                const isMonthCheckIn = item.inDate.getFullYear() === selectedCalendarYear && item.inDate.getMonth() === m.num;
                                const isMonthCheckOut = !item.isCurrentlyActive && item.outDate && item.outDate.getFullYear() === selectedCalendarYear && item.outDate.getMonth() === m.num;
                                const isMonthContractEnd = item.contractEndDate.getFullYear() === selectedCalendarYear && item.contractEndDate.getMonth() === m.num;
                                const isCurrentRealMonth = today.getFullYear() === selectedCalendarYear && today.getMonth() === m.num;

                                return (
                                  <td
                                    key={m.num}
                                    className={`p-1 text-center border-r border-slate-100 ${isCurrentRealMonth ? 'bg-indigo-50/20' : ''}`}
                                  >
                                    {isMonthActive ? (
                                      <div
                                        className={`w-full py-1.5 rounded-lg text-[9px] font-bold transition flex items-center justify-center gap-1 ${
                                          isMonthCheckOut
                                            ? 'bg-slate-800 text-white font-black ring-1 ring-slate-600'
                                            : isMonthContractEnd && item.isExpiringSoon
                                            ? 'bg-amber-500 text-white animate-pulse'
                                            : isMonthCheckIn
                                            ? 'bg-blue-600 text-white font-black'
                                            : item.isExpired
                                            ? 'bg-rose-500 text-white'
                                            : 'bg-emerald-500 text-white'
                                        }`}
                                        title={`${m.full} ${selectedCalendarYear}: ${item.name} (${item.roomNumber} - ${item.branchName})`}
                                      >
                                        {isMonthCheckIn ? 'IN' : isMonthCheckOut ? 'OUT' : isMonthContractEnd ? 'END' : '✓'}
                                      </div>
                                    ) : (
                                      <div className="text-slate-300 text-xs">-</div>
                                    )}
                                  </td>
                                );
                              })}

                              <td
                                className="py-2 px-3 sticky right-0 z-10 bg-white group-hover:bg-slate-50 text-right border-l border-slate-200"
                                onClick={e => e.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  onClick={() => setSelectedBlockTenant(item)}
                                  className="px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[10px] border border-indigo-200 transition cursor-pointer"
                                >
                                  Kelola
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}

            {/* VIEW 3: MATRIKS BLOK SEWA & SISA KONTRAK (Gantt-Style Matrix) */}
            {calendarViewMode === 'matrix' && (
              <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[10px] font-black uppercase">
                        Matriks & Gantt
                      </span>
                      <h4 className="font-extrabold text-sm text-slate-900 font-heading">
                        Matriks Durasi Kontrak, Sisa Masa Sewa & Estimasi LTV
                      </h4>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Daftar individual seluruh penghuni kos dengan durasi berjalan, progress bar sewa, tanggal penagihan, dan aksi cepat perpanjangan kontrak.
                    </p>
                  </div>

                  <span className="text-xs text-slate-500 font-medium">
                    Menampilkan {filteredCalendarRecords.length} dari {tenantCalendarRecords.length} Penyewa
                  </span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-xs text-left border-collapse min-w-[850px]">
                    <thead>
                      <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                        <th className="py-3 px-3.5 w-10 text-center">No</th>
                        <th className="py-3 px-3.5">Penghuni & Kamar</th>
                        <th className="py-3 px-3.5">Periode Kontrak</th>
                        <th className="py-3 px-3.5">Progress Durasi Kontrak</th>
                        <th className="py-3 px-3.5 text-center">Sisa Waktu</th>
                        <th className="py-3 px-3.5">Total Kontribusi (LTV)</th>
                        <th className="py-3 px-3.5 text-center">Status</th>
                        <th className="py-3 px-3.5 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredCalendarRecords.map((item, index) => (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-3 text-center font-bold text-slate-400">
                            {index + 1}
                          </td>

                          <td className="py-3 px-3.5">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={
                                  item.avatarUrl ||
                                  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
                                }
                                alt={item.name}
                                className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                              />
                              <div>
                                <div className="font-extrabold text-slate-900 font-heading">
                                  {item.name}
                                </div>
                                <div className="text-[11px] text-slate-500 flex items-center gap-1 flex-wrap mt-0.5">
                                  <span className="font-bold text-indigo-700">{item.roomNumber}</span>
                                  <span>&bull;</span>
                                  <span>{item.roomType}</span>
                                  <span>&bull;</span>
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-teal-50 text-teal-800 font-semibold text-[9px] border border-teal-200">
                                    <Building2 className="w-2.5 h-2.5 text-teal-600 shrink-0" />
                                    <span>{item.branchName}</span>
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-3.5">
                            <div className="font-semibold text-slate-800">
                              {formatIndonesianDate(item.inDateStr)} &rarr; {formatIndonesianDate(item.contractEndDateStr)}
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              Durasi: {item.contractMonths} Bulan (Jatuh tempo tgl {item.billingDueDay})
                              {item.outDateStr && !item.isCurrentlyActive && (
                                <span className="text-rose-600 font-bold ml-1">
                                  • Keluar/OUT: {formatIndonesianDate(item.outDateStr)}
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-3 px-3.5 max-w-xs">
                            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 mb-1">
                              <span>Bulan ke-{item.stayDurationMonths} dari {item.contractMonths} Bln</span>
                              <span className="text-slate-500">{item.progressPct}%</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  !item.isCurrentlyActive
                                    ? 'bg-slate-400'
                                    : item.isExpired
                                    ? 'bg-rose-500'
                                    : item.isExpiringSoon
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500'
                                }`}
                                style={{ width: `${item.progressPct}%` }}
                              />
                            </div>
                          </td>

                          <td className="py-3 px-3.5 text-center font-semibold">
                            {item.isCurrentlyActive ? (
                              item.remainingDays <= 0 ? (
                                <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold text-[10px]">
                                  Kontrak Berakhir
                                </span>
                              ) : item.remainingDays <= 30 ? (
                                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px] animate-pulse">
                                  Sisa {item.remainingDays} Hari
                                </span>
                              ) : (
                                <span className="text-slate-700 font-medium text-[11px]">
                                  Sisa {item.remainingDays} Hari
                                </span>
                              )
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300 font-bold text-[10px]">
                                OUT (Selesai Sewa)
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-3.5 font-mono font-black text-slate-900">
                            {formatRupiah(item.totalLtv)}
                          </td>

                          <td className="py-3 px-3.5 text-center">
                            {item.calendarStatus === 'active' && (
                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px]">
                                Aktif Menghuni
                              </span>
                            )}
                            {item.calendarStatus === 'expiring' && (
                              <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[10px]">
                                Perlu Follow-up
                              </span>
                            )}
                            {item.calendarStatus === 'expired' && (
                              <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-bold text-[10px]">
                                Lewat Kontrak
                              </span>
                            )}
                            {item.calendarStatus === 'checkout' && (
                              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300 font-bold text-[10px]">
                                OUT (Selesai)
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {item.phone && (
                                <button
                                  type="button"
                                  onClick={() => handleSendReminderWA(item, item.isExpiringSoon ? 'perpanjang' : 'sapaan')}
                                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition inline-flex items-center gap-1 cursor-pointer ${
                                    item.isExpiringSoon
                                      ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-2xs animate-bounce'
                                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                                  }`}
                                  title="Chat WhatsApp"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                  <span>{item.isExpiringSoon ? 'Tanya Perpanjang' : 'Chat WA'}</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setSelectedBlockTenant(item)}
                                className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 transition cursor-pointer"
                              >
                                Detail
                              </button>
                            </div>
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
      </div>

      {/* ================= MODAL: DETAIL BLOK KALENDER & PERPANJANGAN SEWA ================= */}
      {selectedBlockTenant && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base font-heading">
                    Detail Blok Sewa & Masa Tinggal
                  </h3>
                  <p className="text-xs text-slate-300">
                    {selectedBlockTenant.name} &bull; {selectedBlockTenant.roomNumber}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedBlockTenant(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-4 text-xs">
              {/* Tenant & Room Profile Card */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                <img
                  src={
                    selectedBlockTenant.avatarUrl ||
                    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
                  }
                  alt={selectedBlockTenant.name}
                  className="w-12 h-12 rounded-full object-cover border border-slate-300 shadow-2xs shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-extrabold text-slate-900 text-sm truncate">
                    {selectedBlockTenant.name}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    NIK: {selectedBlockTenant.identityNumber || '-'} &bull; {selectedBlockTenant.phone}
                  </div>
                  <div className="text-[11px] text-indigo-700 font-semibold mt-0.5 flex items-center gap-1.5 flex-wrap">
                    <span>{selectedBlockTenant.roomNumber} ({selectedBlockTenant.roomType})</span>
                    <span>&bull;</span>
                    <span>{formatRupiah(selectedBlockTenant.roomPrice)}/bln</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 font-bold text-[10px] border border-teal-200">
                      <Building2 className="w-3 h-3 text-teal-600" />
                      <span>Cabang: {selectedBlockTenant.branchName}</span>
                    </span>
                    <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                      selectedBlockTenant.isCurrentlyActive 
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                        : 'bg-slate-100 text-slate-700 border border-slate-300'
                    }`}>
                      {selectedBlockTenant.isCurrentlyActive ? '🟢 Aktif Menghuni' : '⚪ Status OUT (Selesai Sewa)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Timeline Status Box */}
              <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/50 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">Periode Kontrak Sewa:</span>
                  <span className="font-extrabold text-indigo-900">
                    {selectedBlockTenant.contractMonths} Bulan
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block text-[10px]">Mulai Check-In:</span>
                    <strong className="text-slate-800">{formatIndonesianDate(selectedBlockTenant.inDateStr)}</strong>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block text-[10px]">
                      {selectedBlockTenant.isCurrentlyActive ? 'Batas Akhir Kontrak:' : 'Tanggal Selesai (OUT):'}
                    </span>
                    <strong className="text-slate-800">
                      {formatIndonesianDate(selectedBlockTenant.outDateStr || selectedBlockTenant.contractEndDateStr)}
                    </strong>
                  </div>
                </div>

                {/* Progress Bar & Days Remaining */}
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between text-[11px] font-semibold">
                    <span className="text-slate-600">Durasi Berjalan: Bulan ke-{selectedBlockTenant.stayDurationMonths}</span>
                    <span className={selectedBlockTenant.isExpiringSoon ? 'text-rose-600 font-bold animate-pulse' : 'text-slate-700'}>
                      {selectedBlockTenant.remainingDays <= 0
                        ? 'Kontrak Berakhir'
                        : `Sisa ${selectedBlockTenant.remainingDays} Hari`}
                    </span>
                  </div>
                  <div className="w-full bg-white h-2 rounded-full overflow-hidden border border-slate-200">
                    <div
                      className={`h-full rounded-full transition-all ${
                        selectedBlockTenant.isExpiringSoon ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${selectedBlockTenant.progressPct}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Quick Contract Extension Controls */}
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Perpanjang Masa Kontrak Sewa</span>
                  </span>
                  <span className="text-[10px] text-emerald-700 font-semibold">Otomatis Simpan Cloud</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {[1, 3, 6, 12].map(num => (
                    <button
                      key={num}
                      type="button"
                      disabled={isExtendingLoading}
                      onClick={() => handleExtendContract(String(selectedBlockTenant.id), num)}
                      className="py-2 rounded-lg bg-white hover:bg-emerald-600 hover:text-white text-emerald-900 border border-emerald-300 font-bold text-xs transition cursor-pointer shadow-2xs text-center disabled:opacity-50"
                    >
                      +{num} Bulan
                    </button>
                  ))}
                </div>
              </div>

              {/* WhatsApp Quick Actions */}
              <div className="space-y-2">
                <div className="font-bold text-slate-700 text-xs">
                  Kirim Pengingat & Follow-up via WhatsApp:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSendReminderWA(selectedBlockTenant, 'perpanjang')}
                    className="p-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold text-xs flex items-center gap-2 transition cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="text-left">Pengingat Perpanjangan</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSendReminderWA(selectedBlockTenant, 'tagihan')}
                    className="p-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 font-bold text-xs flex items-center gap-2 transition cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="text-left">Pengingat Tagihan Sewa</span>
                  </button>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedBlockTenant(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
              <h4 className="font-bold text-sm text-center text-slate-900">Hapus Status Berjalan Sewa?</h4>
              <p className="text-center text-slate-500 text-[11px]">
                Data status berjalan sewa ini akan dihapus dari daftar. Tindakan ini tidak dapat dibatalkan.
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
      {/* Calendar Conflict Detector & Resolution Engine Modal */}
      <CalendarConflictDetectorModal
        isOpen={isConflictDetectorOpen}
        onClose={() => setIsConflictDetectorOpen(false)}
        conflicts={calendarConflicts}
      />
    </div>
  );
};

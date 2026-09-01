'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useKost } from '../context/KostContext';
import { AppUser, UserRole, AccountStatus, EnterpriseBranch } from '../types';
import { formatRupiah, formatIndonesianDate } from '../utils/formatters';
import { generateRoomsForBranch } from '../data/initialData';
import {
  ShieldCheck,
  Users,
  UserCheck,
  UserX,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  KeyRound,
  RotateCcw,
  Sparkles,
  Lock,
  Unlock,
  Mail,
  Phone,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  CreditCard,
  Building,
  Check,
  X,
  MessageSquare,
  Shield,
  Activity,
  Layers,
  Settings,
  LogOut,
  SlidersHorizontal,
  User,
  Globe,
  Home,
} from 'lucide-react';

interface EnterprisePortalViewProps {
  onGoToPortal?: (role: UserRole) => void;
  onGoToLanding?: () => void;
  onLogout?: () => void;
  hideHeader?: boolean;
}

export const EnterprisePortalView: React.FC<EnterprisePortalViewProps> = ({
  onGoToPortal,
  onGoToLanding,
  onLogout,
  hideHeader = false,
}) => {
  const router = useRouter();
  const {
    users,
    branches,
    auditLogs,
    rooms,
    allRooms,
    activeAppUser,
    setActiveAppUser,
    logoutAppUser,
    addAuditLog,
    clearAuditLogs,
    approveUser,
    rejectUser,
    updateUserStatus,
    updateUserRole,
    updateUser,
    deleteUser,
    addBranch,
    updateBranch,
    deleteBranch,
    selectedBranchId,
    setSelectedBranchId,
    setRole,
  } = useKost();

  const [activeTab, setActiveTab] = useState<'approvals' | 'users' | 'branches' | 'audit'>('approvals');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals state
  const [selectedUserForApproval, setSelectedUserForApproval] = useState<AppUser | null>(null);
  const [assignRoomId, setAssignRoomId] = useState<number>(1);
  const [assignRole, setAssignRole] = useState<UserRole>('penghuni');
  const [assignBranch, setAssignBranch] = useState<string>('Kost Griya Harmoni 8');

  const [selectedUserForReject, setSelectedUserForReject] = useState<AppUser | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('Data identitas / KTP tidak valid atau tidak lengkap.');

  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState<boolean>(false);
  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'penghuni' as UserRole,
    status: 'active' as AccountStatus,
    assignedRoomId: 1,
    kostBranch: 'Kost Griya Harmoni 8',
    password: 'password123',
    notes: 'Dibuat langsung oleh Super Admin',
  });

  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [isAddBranchModalOpen, setIsAddBranchModalOpen] = useState<boolean>(false);
  const [branchToDelete, setBranchToDelete] = useState<EnterpriseBranch | null>(null);
  const [selectedBranchForDetails, setSelectedBranchForDetails] = useState<EnterpriseBranch | null>(null);
  const [newBranchData, setNewBranchData] = useState({
    name: '',
    code: '',
    address: '',
    city: 'Jakarta Selatan',
    totalRooms: 10,
    occupiedRooms: 0,
    managerName: '',
    managerPhone: '',
    monthlyRevenue: 0,
    status: 'active' as const,
  });

  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  // Metrics
  const pendingUsers = users.filter(u => u.status === 'pending_approval');
  const activeUsers = users.filter(u => u.status === 'active');
  const totalBranchesCount = branches.length;
  const totalEnterpriseRevenue = branches.reduce((sum, b) => sum + b.monthlyRevenue, 0);

  // Helper to retrieve rooms for a specific branch (by branch name, code, or ID)
  const getRoomsForBranch = (branchNameOrId: string) => {
    const matchedBranch = branches.find(b => 
      b.name.toLowerCase() === branchNameOrId.toLowerCase() || 
      b.id === branchNameOrId ||
      b.code.toLowerCase() === branchNameOrId.toLowerCase()
    ) || branches[0];

    if (!matchedBranch) return rooms;

    const branchRooms = allRooms.filter(r => (r.branchId || 'branch-01') === matchedBranch.id);
    if (branchRooms.length > 0) return branchRooms;

    return generateRoomsForBranch(matchedBranch);
  };

  // Filtered Users List
  const filteredUsers = users.filter(user => {
    const matchSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone.includes(searchQuery);

    const matchRole = roleFilter === 'all' || user.role === roleFilter;
    const matchStatus = statusFilter === 'all' || user.status === statusFilter;

    return matchSearch && matchRole && matchStatus;
  });

  // Handle Approve Sign-Up
  const handleConfirmApproval = async () => {
    if (!selectedUserForApproval) return;
    await approveUser(selectedUserForApproval.id, assignRoomId, assignRole, assignBranch);
    showNotification(`Akun ${selectedUserForApproval.name} berhasil disetujui untuk ${assignBranch}!`);
    setSelectedUserForApproval(null);
  };

  // Handle Reject Sign-Up
  const handleConfirmRejection = async () => {
    if (!selectedUserForReject) return;
    await rejectUser(selectedUserForReject.id, rejectReason);
    showNotification(`Permohonan akun ${selectedUserForReject.name} telah ditolak.`, 'error');
    setSelectedUserForReject(null);
  };

  // Handle Create User directly
  const handleCreateUserDirectly = async (e: React.FormEvent) => {
    e.preventDefault();
    const existing = users.find(u => u.email.toLowerCase() === newUserData.email.toLowerCase());
    if (existing) {
      showNotification('Email sudah terdaftar.', 'error');
      return;
    }

    const created: AppUser = {
      id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: newUserData.name,
      email: newUserData.email.toLowerCase(),
      phone: newUserData.phone,
      role: newUserData.role,
      status: newUserData.status,
      assignedRoomId: newUserData.role === 'penghuni' ? newUserData.assignedRoomId : undefined,
      kostBranch: newUserData.kostBranch,
      password: newUserData.password,
      createdAt: new Date().toISOString().split('T')[0],
      approvedAt: new Date().toISOString().split('T')[0],
      approvedBy: activeAppUser?.name || 'Super Admin',
      notes: newUserData.notes,
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    };

    await updateUser(created);
    setIsAddUserModalOpen(false);
    showNotification(`Pengguna ${created.name} berhasil ditambahkan!`);
    setNewUserData({
      name: '',
      email: '',
      phone: '',
      role: 'penghuni',
      status: 'active',
      assignedRoomId: 1,
      kostBranch: 'Kost Griya Harmoni 8',
      password: 'password123',
      notes: 'Dibuat langsung oleh Super Admin',
    });
  };

  // Handle Edit User
  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    await updateUser(editingUser);
    setEditingUser(null);
    showNotification(`Data akun ${editingUser.name} berhasil diperbarui!`);
  };

  // Handle Create Branch
  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    await addBranch(newBranchData);
    setIsAddBranchModalOpen(false);
    showNotification(`Cabang properti ${newBranchData.name} berhasil ditambahkan!`);
    setNewBranchData({
      name: '',
      code: '',
      address: '',
      city: 'Jakarta Selatan',
      totalRooms: 10,
      occupiedRooms: 0,
      managerName: '',
      managerPhone: '',
      monthlyRevenue: 0,
      status: 'active',
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-600 selection:text-white">
      {/* 1. TOP ENTERPRISE HEADER (Only shown on standalone /enterprise page) */}
      {/* 1. TOP ENTERPRISE HEADER (Only shown on standalone /enterprise page) */}
      {!hideHeader && (
        <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white shadow-md w-full">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 w-full">
            <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
              {/* Enterprise Logo (Clickable to go to Landing Page) */}
              <button
                type="button"
                onClick={() => {
                  if (onGoToLanding) onGoToLanding();
                  else router.push('/');
                }}
                className="flex items-center gap-2 sm:gap-3 text-left group cursor-pointer min-w-0"
                title="Buka Halaman Landing Page"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-amber-500 via-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-lg group-hover:scale-105 transition-transform shrink-0">
                  <Shield className="w-4 h-4 sm:w-6 sm:h-6 text-slate-950" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="font-extrabold text-base sm:text-lg tracking-tight text-white font-heading group-hover:text-emerald-300 transition-colors whitespace-nowrap">
                      KostHub Enterprise
                    </span>
                    <span className="hidden md:inline-flex px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider whitespace-nowrap">
                      Super Admin
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 hidden sm:block leading-tight">
                    Pusat Pengelolaan Akun, Verifikasi & Multi-Properti
                  </p>
                </div>
              </button>

              {/* Header Right Actions */}
              <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
                {/* Direct Jump to Landing Page */}
                <button
                  type="button"
                  id="enterprise-landing-btn"
                  onClick={() => {
                    if (onGoToLanding) {
                      onGoToLanding();
                    } else if (typeof window !== 'undefined') {
                      window.location.href = '/';
                    } else {
                      router.push('/');
                    }
                  }}
                  className="px-2 sm:px-3 py-1.5 rounded-xl border border-emerald-500/40 bg-emerald-950/50 hover:bg-emerald-900/70 text-emerald-300 hover:text-emerald-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer hover:border-emerald-400 active:scale-95 shadow-xs"
                  title="Buka Halaman Landing Page Utama (Tampilan Tamu / Pengunjung)"
                >
                  <Globe className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="hidden sm:inline">Landing Page</span>
                </button>

                {/* Ganti Akun (Switch Account Selector) */}
                <div className="flex items-center gap-1 sm:gap-1.5 bg-slate-800/90 border border-slate-700 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl shadow-xs text-xs">
                  <User className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="text-slate-400 font-medium hidden md:inline">Akun:</span>
                  <select
                    value={activeAppUser?.id || 'usr-admin-01'}
                    onChange={(e) => {
                      const targetUser = users.find(u => u.id === e.target.value);
                      if (targetUser) {
                        setActiveAppUser(targetUser);
                        setRole(targetUser.role === 'superadmin' ? 'pemilik' : targetUser.role);
                        showNotification(`Beralih ke akun ${targetUser.name} (${targetUser.role.toUpperCase()})`);
                        if (targetUser.role === 'penghuni') {
                          if (onGoToPortal) onGoToPortal('penghuni');
                        } else if (targetUser.role === 'pemilik') {
                          if (onGoToPortal) onGoToPortal('pemilik');
                        }
                      }
                    }}
                    className="bg-slate-900 text-amber-300 font-bold border-0 rounded-lg px-1 sm:px-2 py-0.5 text-[11px] sm:text-xs focus:outline-none cursor-pointer max-w-[95px] xs:max-w-[120px] sm:max-w-[180px] truncate"
                    title="Ganti Akun Pengguna Aktif"
                  >
                    {users
                      .filter(u => u.status === 'active')
                      .map(u => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.role.toUpperCase()}{u.assignedRoomId ? ` - K0${u.assignedRoomId}` : ''})
                        </option>
                      ))}
                  </select>
                </div>

                {/* Quick Jump to Portal Pemilik */}
                <div className="hidden lg:flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
                  <button
                    onClick={() => {
                      setRole('pemilik');
                      if (onGoToPortal) onGoToPortal('pemilik');
                    }}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-700 transition flex items-center gap-1 cursor-pointer"
                    title="Buka Dashboard Operasional Kosan (Pemilik)"
                  >
                    <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Portal Pemilik</span>
                  </button>
                </div>

                {/* Logout Button */}
                <button
                  type="button"
                  id="enterprise-logout-btn"
                  onClick={() => {
                    if (onLogout) {
                      onLogout();
                    } else {
                      logoutAppUser();
                      if (typeof window !== 'undefined') {
                        window.location.href = '/login';
                      }
                    }
                  }}
                  className="px-2 sm:px-3 py-1.5 rounded-xl border border-rose-900/50 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer hover:border-rose-700 active:scale-95"
                  title="Keluar dari Akun Super Admin & Masuk ke Halaman Login"
                >
                  <LogOut className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline">Keluar</span>
                </button>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-3 sm:px-6 lg:px-8 sticky top-14 sm:top-16 z-20 backdrop-blur-md">
        <nav
          aria-label="Navigasi Super Admin"
          className="max-w-7xl mx-auto flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-2 sm:py-2.5 no-scrollbar scroll-smooth text-xs"
        >
          <button
            onClick={() => setActiveTab('approvals')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl font-bold transition whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'approvals'
                ? 'bg-amber-500 text-slate-950 shadow-md ring-1 ring-amber-400'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>Antrian Sign-Up</span>
            {pendingUsers.length > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === 'approvals' ? 'bg-slate-950 text-amber-400' : 'bg-amber-500 text-slate-950 animate-pulse'
              }`}>
                {pendingUsers.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl font-bold transition whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'users'
                ? 'bg-emerald-500 text-slate-950 shadow-md ring-1 ring-emerald-400'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>Pengguna ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('branches')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl font-bold transition whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'branches'
                ? 'bg-teal-500 text-slate-950 shadow-md ring-1 ring-teal-400'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>Cabang ({branches.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl font-bold transition whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'audit'
                ? 'bg-blue-500 text-slate-950 shadow-md ring-1 ring-blue-400'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>Log Audit</span>
          </button>
        </nav>
      </div>

      {/* 2. MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Notification Alert */}
        {feedbackMsg && (
          <div
            className={`p-4 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-3 animate-in fade-in duration-200 border ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200'
                : 'bg-rose-950/80 border-rose-500/40 text-rose-200'
            }`}
          >
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        {/* Top 4 KPI Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-sm">
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">
              Antrian Persetujuan
            </span>
            <div className="text-2xl font-black text-amber-400 font-mono mt-1 flex items-center justify-between">
              <span>{pendingUsers.length} Akun</span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Menunggu review & aktivasi
            </span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-sm">
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">
              Total Pengguna Aktif
            </span>
            <div className="text-2xl font-black text-emerald-400 font-mono mt-1 flex items-center justify-between">
              <span>{activeUsers.length} User</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <UserCheck className="w-5 h-5" />
              </div>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Super Admin, Pemilik & Penghuni
            </span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-sm">
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">
              Cabang / Properti Kos
            </span>
            <div className="text-2xl font-black text-teal-400 font-mono mt-1 flex items-center justify-between">
              <span>{totalBranchesCount} Lokasi</span>
              <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
                <Building2 className="w-5 h-5" />
              </div>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Total 36 pintu kamar terintegrasi
            </span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-sm">
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">
              Estimasi Revenue Enterprise
            </span>
            <div className="text-xl sm:text-2xl font-black text-white font-mono mt-1 flex items-center justify-between">
              <span>{formatRupiah(totalEnterpriseRevenue)}</span>
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <span className="text-[11px] text-emerald-400 font-semibold mt-1 block">
              Dari seluruh unit aktif
            </span>
          </div>
        </div>

        {/* ================= TAB 1: ANTRIAN APPROVAL SIGN-UP ================= */}
        {activeTab === 'approvals' && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold mb-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Verifikasi Registrasi Pengguna Baru</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white font-heading">
                    Antrian Persetujuan Pendaftaran Akun
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Pengguna baru yang mendaftar melalui halaman Sign Up tidak dapat mengakses sistem sebelum Anda menyetujuinya.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium">Total Menunggu:</span>
                  <span className="px-3 py-1 rounded-xl bg-amber-500 text-slate-950 font-black text-xs">
                    {pendingUsers.length} Permohonan
                  </span>
                </div>
              </div>

              {pendingUsers.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-base text-white">Semua Pendaftaran Telah Ditinjau!</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Tidak ada antrian persetujuan akun baru saat ini. Akun yang mendaftar di halaman depan akan otomatis muncul di sini.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  {pendingUsers.map(user => (
                    <div
                      key={user.id}
                      className="bg-slate-950 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-5 space-y-4 transition shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                            alt={user.name}
                            className="w-12 h-12 rounded-2xl object-cover border border-amber-500/40"
                          />
                          <div>
                            <h4 className="font-bold text-sm text-white">{user.name}</h4>
                            <span className="text-xs text-slate-400 block">{user.email}</span>
                            <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 text-emerald-400" />
                              {user.phone}
                            </span>
                          </div>
                        </div>

                        <span className={`px-2.5 py-1 rounded-xl text-[11px] font-bold uppercase tracking-wider ${
                          user.role === 'pemilik'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        }`}>
                          {user.role === 'pemilik' ? 'Mitra Pemilik' : 'Penghuni Kos'}
                        </span>
                      </div>

                      <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs space-y-1.5">
                        <div className="flex items-center justify-between text-slate-400 text-[11px]">
                          <span>Waktu Mendaftar:</span>
                          <span className="font-mono text-slate-200">{formatIndonesianDate(user.createdAt)}</span>
                        </div>
                        {user.assignedRoomId && (
                          <div className="flex items-center justify-between text-slate-400 text-[11px]">
                            <span>Permohonan Unit Kamar:</span>
                            <span className="font-bold text-emerald-400">Kamar 0{user.assignedRoomId}</span>
                          </div>
                        )}
                        {user.kostBranch && (
                          <div className="flex items-center justify-between text-slate-400 text-[11px]">
                            <span>Cabang Properti:</span>
                            <span className="text-slate-200">{user.kostBranch}</span>
                          </div>
                        )}
                        {user.notes && (
                          <div className="pt-1 text-[11px] text-slate-400 border-t border-slate-800">
                            <em>"{user.notes}"</em>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => {
                            const targetBranchName = user.kostBranch || (branches[0] ? branches[0].name : 'Kost Griya Harmoni 8');
                            const branchRooms = getRoomsForBranch(targetBranchName);
                            const matchedRoom = branchRooms.find(r => r.id === user.assignedRoomId) || 
                                                branchRooms.find(r => !r.tenant && !users.some(u => u.role === 'penghuni' && u.assignedRoomId === r.id && u.status === 'active')) || 
                                                branchRooms[0];

                            setSelectedUserForApproval(user);
                            setAssignBranch(targetBranchName);
                            setAssignRole(user.role);
                            setAssignRoomId(matchedRoom ? matchedRoom.id : 1);
                          }}
                          className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          <Check className="w-4 h-4" />
                          <span>Setujui Akun</span>
                        </button>

                        <button
                          onClick={() => {
                            setSelectedUserForReject(user);
                            setRejectReason('Data identitas / KTP tidak valid atau tidak lengkap.');
                          }}
                          className="py-2.5 px-3.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-bold text-xs transition flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                          <span>Tolak</span>
                        </button>

                        <a
                          href={`https://wa.me/${user.phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-emerald-400 transition flex items-center justify-center cursor-pointer"
                          title="Chat WhatsApp Calon Pengguna"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 2: SEMUA PENGGUNA & MANAJEMEN AKUN ================= */}
        {activeTab === 'users' && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white font-heading">
                    Direktori & Manajemen Pengguna
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Kelola peran (Role), status akses aktif/suspend, dan kredensial seluruh akun.
                  </p>
                </div>

                <button
                  onClick={() => setIsAddUserModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Pengguna Baru</span>
                </button>
              </div>

              {/* Filter & Search Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
                <div className="sm:col-span-6 relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Cari berdasarkan nama, email, atau nomor HP..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>

                <div className="sm:col-span-3">
                  <select
                    value={roleFilter}
                    onChange={e => setRoleFilter(e.target.value)}
                    className="w-full py-2.5 px-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-semibold focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="all">Semua Peran (Role)</option>
                    <option value="superadmin">Super Admin Enterprise</option>
                    <option value="pemilik">Mitra Pemilik Kos</option>
                    <option value="penghuni">Penghuni Kamar</option>
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="w-full py-2.5 px-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-semibold focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="all">Semua Status Akun</option>
                    <option value="active">Aktif (Approved)</option>
                    <option value="pending_approval">Menunggu Persetujuan</option>
                    <option value="suspended">Dinonaktifkan (Suspended)</option>
                    <option value="rejected">Ditolak</option>
                  </select>
                </div>
              </div>

              {/* Users Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-800">
                    <tr>
                      <th className="py-3.5 px-4">Pengguna</th>
                      <th className="py-3.5 px-4">Peran (Role)</th>
                      <th className="py-3.5 px-4">Status Akun</th>
                      <th className="py-3.5 px-4">Unit / Properti</th>
                      <th className="py-3.5 px-4">Terdaftar</th>
                      <th className="py-3.5 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-200">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500">
                          Tidak ditemukan akun yang cocok dengan filter pencarian.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map(user => (
                        <tr key={user.id} className="hover:bg-slate-800/40 transition">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                                alt={user.name}
                                className="w-9 h-9 rounded-xl object-cover border border-slate-700"
                              />
                              <div>
                                <div className="font-bold text-white flex items-center gap-1.5">
                                  <span>{user.name}</span>
                                  {user.id === activeAppUser?.id && (
                                    <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                                      Anda
                                    </span>
                                  )}
                                </div>
                                <span className="text-[11px] text-slate-400 block">{user.email}</span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-1 rounded-xl text-[11px] font-bold ${
                              user.role === 'superadmin'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : user.role === 'pemilik'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            }`}>
                              {user.role === 'superadmin' ? 'Super Admin' : user.role === 'pemilik' ? 'Pemilik Kos' : 'Penghuni'}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1 w-fit ${
                              user.status === 'active'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : user.status === 'pending_approval'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                                : user.status === 'suspended'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : 'bg-slate-700 text-slate-300'
                            }`}>
                              {user.status === 'active' && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                              {user.status === 'pending_approval' && <Clock className="w-3 h-3 text-amber-400" />}
                              {user.status === 'suspended' && <Lock className="w-3 h-3 text-rose-400" />}
                              <span>
                                {user.status === 'active'
                                  ? 'Aktif'
                                  : user.status === 'pending_approval'
                                  ? 'Menunggu Review'
                                  : user.status === 'suspended'
                                  ? 'Suspended'
                                  : 'Ditolak'}
                              </span>
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-slate-300">
                            <div className="space-y-0.5">
                              {user.assignedRoomId ? (
                                <>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-emerald-400 font-mono text-xs">
                                      Kamar 0{user.assignedRoomId}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                                    <Building2 className="w-3 h-3 text-teal-400 shrink-0" />
                                    <span className="truncate max-w-[180px] font-medium text-slate-300">
                                      {user.kostBranch || 'Kost Griya Harmoni 8'}
                                    </span>
                                  </div>
                                </>
                              ) : (
                                <span className="text-xs font-semibold text-slate-300">
                                  {user.role === 'superadmin' ? 'Semua Cabang' : 'Non-Kamar (Pengelola)'}
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">
                            {user.createdAt}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {user.status === 'pending_approval' ? (
                                <button
                                  onClick={() => {
                                    const targetBranchName = user.kostBranch || (branches[0] ? branches[0].name : 'Kost Griya Harmoni 8');
                                    const branchRooms = getRoomsForBranch(targetBranchName);
                                    const matchedRoom = branchRooms.find(r => r.id === user.assignedRoomId) || 
                                                        branchRooms.find(r => !r.tenant && !users.some(u => u.role === 'penghuni' && u.assignedRoomId === r.id && u.status === 'active')) || 
                                                        branchRooms[0];
                                    setSelectedUserForApproval(user);
                                    setAssignBranch(targetBranchName);
                                    setAssignRole(user.role);
                                    setAssignRoomId(matchedRoom ? matchedRoom.id : (branchRooms[0]?.id || 1));
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-bold cursor-pointer"
                                >
                                  Review
                                </button>
                              ) : (
                                <>
                                  <button
                                    onClick={() => setEditingUser(user)}
                                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                                    title="Edit Pengguna"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>

                                  {user.status === 'active' ? (
                                    <button
                                      onClick={() => {
                                        updateUserStatus(user.id, 'suspended');
                                        showNotification(`Akun ${user.name} dinonaktifkan sementara.`, 'error');
                                      }}
                                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition cursor-pointer"
                                      title="Suspend Akun"
                                    >
                                      <Lock className="w-3.5 h-3.5" />
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        updateUserStatus(user.id, 'active');
                                        showNotification(`Akun ${user.name} telah diaktifkan kembali.`);
                                      }}
                                      className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition cursor-pointer"
                                      title="Aktifkan Akun"
                                    >
                                      <Unlock className="w-3.5 h-3.5" />
                                    </button>
                                  )}

                                  {user.id !== activeAppUser?.id && (
                                    <button
                                      onClick={() => {
                                        if (confirm(`Hapus akun ${user.name} secara permanen?`)) {
                                          deleteUser(user.id);
                                          showNotification(`Akun ${user.name} berhasil dihapus.`);
                                        }
                                      }}
                                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/30 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                                      title="Hapus Akun"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: MULTI-CABANG / ENTERPRISE BRANCHES ================= */}
        {activeTab === 'branches' && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white font-heading">
                    Manajemen Multi-Cabang Properti Kos
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Kelola seluruh properti kos di bawah jaringan Enterprise Anda.
                  </p>
                </div>

                <button
                  onClick={() => setIsAddBranchModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Cabang Properti</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {branches.map(branch => {
                  // Associated users/tenants for this branch
                  const branchUsers = users.filter(
                    u => u.kostBranch === branch.name || u.kostBranch === branch.id || (!u.kostBranch && branch.id === 'branch-01')
                  );
                  const branchTenants = branchUsers.filter(u => u.role === 'penghuni');
                  const branchManagers = branchUsers.filter(u => u.role === 'pemilik' || u.role === 'superadmin');

                  return (
                    <div
                      key={branch.id}
                      className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm hover:border-teal-500/40 transition flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/30 flex items-center justify-center">
                            <Building2 className="w-5 h-5" />
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-lg bg-slate-800 font-mono text-[10px] text-slate-300 font-bold">
                              {branch.code}
                            </span>
                            {/* Delete Branch Button */}
                            <button
                              type="button"
                              onClick={() => setBranchToDelete(branch)}
                              className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-500/30 transition cursor-pointer"
                              title={`Hapus Cabang ${branch.name}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-extrabold text-base text-white font-heading">{branch.name}</h3>
                            {branch.id === selectedBranchId && (
                              <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-black uppercase">
                                Aktif
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">{branch.address}, {branch.city}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                          <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800/80">
                            <span className="text-[10px] text-slate-400 font-semibold block">Total Kamar</span>
                            <span className="text-sm font-bold text-white font-mono">{branch.totalRooms} Pintu</span>
                          </div>
                          <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800/80">
                            <span className="text-[10px] text-slate-400 font-semibold block">Pendapatan / Bln</span>
                            <span className="text-xs font-bold text-emerald-400 font-mono">{formatRupiah(branch.monthlyRevenue)}</span>
                          </div>
                        </div>

                        <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 text-xs space-y-1">
                          <div className="text-[11px] text-slate-400">Pengelola Cabang:</div>
                          <div className="font-bold text-slate-200">{branch.managerName} ({branch.managerPhone})</div>
                        </div>

                        {/* Tenant / Account Association Tracking */}
                        <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-800/60 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-teal-400" />
                              <span>Akun & Penghuni Terdaftar</span>
                            </span>
                            <span className="px-1.5 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20 text-[10px] font-bold font-mono">
                              {branchUsers.length} Akun
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {branchUsers.slice(0, 3).map(u => (
                              <span
                                key={u.id}
                                className={`px-2 py-0.8 rounded-lg text-[10px] font-semibold border flex items-center gap-1 ${
                                  u.role === 'superadmin' || u.role === 'pemilik'
                                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                                    : 'bg-blue-500/10 text-blue-300 border-blue-500/20'
                                }`}
                              >
                                <span>{u.name.split(' ')[0]}</span>
                                {u.assignedRoomId && (
                                  <span className="opacity-70 text-[9px] font-mono">(K0{u.assignedRoomId})</span>
                                )}
                              </span>
                            ))}
                            {branchUsers.length > 3 && (
                              <button
                                type="button"
                                onClick={() => setSelectedBranchForDetails(branch)}
                                className="px-1.5 py-0.8 rounded-lg text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                              >
                                +{branchUsers.length - 3} lainnya
                              </button>
                            )}
                            {branchUsers.length === 0 && (
                              <span className="text-[11px] text-slate-500 italic">Belum ada akun terhubung</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedBranchForDetails(branch)}
                          className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span>Daftar Akun</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedBranchId(branch.id);
                            setRole('pemilik');
                            if (onGoToPortal) onGoToPortal('pemilik');
                          }}
                          className="flex-1 py-2 px-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-slate-950 font-black text-xs transition flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Kelola Unit</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 4: AUDIT LOG & KEAMANAN SISTEM ================= */}
        {activeTab === 'audit' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Header Banner */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-500/30 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-blue-400" />
                    <span>Real-Time Security Feed</span>
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Total: <strong className="text-white">{auditLogs.length} Catatan</strong>
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white font-heading">
                  Log Audit Keamanan & Riwayat Sistem
                </h2>
                <p className="text-xs text-slate-400 max-w-2xl">
                  Pencatatan rekam jejak otomatis atas setiap aksi Super Admin, persetujuan pendaftaran kamar, perubahan hak akses, verifikasi QRIS, dan status firewall keamanan.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    addAuditLog({
                      actorName: activeAppUser?.name || 'Super Admin Enterprise',
                      actorEmail: activeAppUser?.email || 'admin@kosthub.com',
                      actorRole: 'superadmin',
                      action: 'system_sync',
                      title: 'Pemeriksaan Integritas Sistem Manual',
                      description: 'Super Admin menjalankan verifikasi manual terhadap seluruh database kamar dan akun pengguna.',
                      status: 'success',
                    });
                    showNotification('Log audit manual berhasil dicatat.');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Uji Catat Log</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Apakah Anda yakin ingin mengosongkan riwayat audit log?')) {
                      clearAuditLogs();
                      showNotification('Seluruh riwayat log audit telah dibersihkan.');
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl border border-slate-700 hover:border-rose-700 bg-slate-950 hover:bg-rose-950/30 text-slate-300 hover:text-rose-300 font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Bersihkan Log</span>
                </button>
              </div>
            </div>

            {/* Metric Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-4.5 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Log Tercatat</span>
                  <span className="text-2xl font-black text-white font-mono mt-1 block">{auditLogs.length}</span>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Aktivitas keseluruhan</span>
                </div>
                <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <Activity className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4.5 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Persetujuan Akun</span>
                  <span className="text-2xl font-black text-emerald-400 font-mono mt-1 block">
                    {auditLogs.filter(l => l.action === 'approve_user').length}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Tenant & Owner disetujui</span>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4.5 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Autentikasi & Sesi</span>
                  <span className="text-2xl font-black text-amber-400 font-mono mt-1 block">
                    {auditLogs.filter(l => l.action === 'login' || l.action === 'logout').length}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Log masuk / keluar</span>
                </div>
                <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <KeyRound className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4.5 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Peringatan Keamanan</span>
                  <span className="text-2xl font-black text-rose-400 font-mono mt-1 block">
                    {auditLogs.filter(l => l.status === 'warning' || l.status === 'danger' || l.action === 'security_alert').length}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Anomali terdeteksi</span>
                </div>
                <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Audit Logs List Table */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Linimasa Aktivitas Terbaru</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Menampilkan {auditLogs.length} entri riwayat sistem
                </div>
              </div>

              <div className="space-y-3">
                {auditLogs.map((log, idx) => {
                  const isSuccess = log.status === 'success';
                  const isWarning = log.status === 'warning';
                  const isDanger = log.status === 'danger';

                  return (
                    <div
                      key={log.id ? `${log.id}-${idx}` : `log-${idx}`}
                      className="p-4 bg-slate-950 rounded-2xl border border-slate-800/90 hover:border-slate-700 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-start gap-3.5 flex-1">
                        <div
                          className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                            isSuccess
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : isWarning
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {log.action === 'login' && <KeyRound className="w-4 h-4" />}
                          {log.action === 'logout' && <LogOut className="w-4 h-4" />}
                          {log.action === 'approve_user' && <CheckCircle2 className="w-4 h-4" />}
                          {log.action === 'reject_user' && <UserX className="w-4 h-4" />}
                          {log.action === 'delete_user' && <Trash2 className="w-4 h-4" />}
                          {log.action === 'create_user' && <UserCheck className="w-4 h-4" />}
                          {log.action === 'update_role' && <SlidersHorizontal className="w-4 h-4" />}
                          {log.action === 'system_sync' && <Building2 className="w-4 h-4" />}
                          {log.action === 'security_alert' && <AlertCircle className="w-4 h-4" />}
                          {!['login', 'logout', 'approve_user', 'reject_user', 'delete_user', 'create_user', 'update_role', 'system_sync', 'security_alert'].includes(log.action) && (
                            <Activity className="w-4 h-4" />
                          )}
                        </div>

                        <div className="space-y-1 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-white text-sm font-heading">{log.title}</span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                isSuccess
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : isWarning
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              }`}
                            >
                              {log.action.replace('_', ' ')}
                            </span>
                          </div>

                          <p className="text-slate-300 leading-relaxed">{log.description}</p>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 pt-1">
                            <span>
                              Pelaksana: <strong className="text-slate-300">{log.actorName}</strong> ({log.actorEmail})
                            </span>
                            {log.targetUser && (
                              <span>
                                Target: <strong className="text-amber-300/90">{log.targetUser}</strong>
                              </span>
                            )}
                            {log.ipAddress && (
                              <span className="font-mono">
                                IP: <span className="text-slate-400">{log.ipAddress}</span>
                              </span>
                            )}
                            {log.device && (
                              <span className="hidden md:inline">
                                Perangkat: <span className="text-slate-400">{log.device}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Timestamp on Right */}
                      <div className="sm:text-right shrink-0 pl-11 sm:pl-0">
                        <span className="text-[11px] font-mono font-semibold text-slate-400 block bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                          {log.timestamp}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ================= MODAL: APPROVE SIGN-UP ================= */}
      {selectedUserForApproval && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-5 text-slate-100 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Setujui Pendaftaran Akun</h3>
                  <p className="text-xs text-slate-400">{selectedUserForApproval.name}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUserForApproval(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <div className="text-slate-400">Email: <strong className="text-white">{selectedUserForApproval.email}</strong></div>
                <div className="text-slate-400">Nomor HP: <strong className="text-white">{selectedUserForApproval.phone}</strong></div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Tetapkan Cabang Properti Kos:</label>
                <select
                  value={assignBranch}
                  onChange={e => {
                    const newBranchName = e.target.value;
                    setAssignBranch(newBranchName);
                    const branchRooms = getRoomsForBranch(newBranchName);
                    if (branchRooms.length > 0) {
                      const firstAvailable = branchRooms.find(r => 
                        !r.tenant && 
                        !users.some(u => u.role === 'penghuni' && u.assignedRoomId === r.id && u.status === 'active' && u.id !== selectedUserForApproval.id)
                      ) || branchRooms[0];
                      setAssignRoomId(firstAvailable.id);
                    }
                  }}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-teal-300 font-bold focus:outline-none focus:border-teal-500 cursor-pointer"
                >
                  {branches.map(b => (
                    <option key={b.id} value={b.name}>
                      {b.name} ({b.code} - {b.city}) • {b.totalRooms} Kamar
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Tetapkan Peran (Role):</label>
                <select
                  value={assignRole}
                  onChange={e => setAssignRole(e.target.value as UserRole)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-semibold focus:outline-none"
                >
                  <option value="penghuni">Penghuni Kamar (Tenant)</option>
                  <option value="pemilik">Mitra Pemilik / Pengelola (Owner)</option>
                  <option value="superadmin">Super Admin Enterprise</option>
                </select>
              </div>

              {assignRole === 'penghuni' && (
                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    Tetapkan Unit Kamar ({getRoomsForBranch(assignBranch).length} Kamar Terdaftar):
                  </label>
                  {(() => {
                    const currentBranchRooms = getRoomsForBranch(assignBranch);
                    const selectedRoomObj = currentBranchRooms.find(r => r.id === assignRoomId);
                    const isSelectedOccupied = !!(
                      selectedRoomObj?.tenant ||
                      users.some(u => u.role === 'penghuni' && u.assignedRoomId === assignRoomId && u.status === 'active' && u.id !== selectedUserForApproval.id)
                    );

                    return (
                      <select
                        value={assignRoomId}
                        onChange={e => setAssignRoomId(Number(e.target.value))}
                        className={`w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl font-bold focus:outline-none ${
                          isSelectedOccupied ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        {currentBranchRooms.map(r => {
                          const activeUser = users.find(
                            u => u.role === 'penghuni' && u.assignedRoomId === r.id && u.status === 'active' && u.id !== selectedUserForApproval.id
                          );
                          const isOccupied = !!r.tenant || !!activeUser;
                          const occupantName = r.tenant?.name || activeUser?.name || 'Terisi';

                          return (
                            <option
                              key={r.id}
                              value={r.id}
                              className={isOccupied ? 'text-rose-400 font-bold bg-slate-950' : 'text-emerald-400 font-bold bg-slate-950'}
                              style={{
                                color: isOccupied ? '#f87171' : '#34d399',
                                backgroundColor: '#020617',
                              }}
                            >
                              {r.roomNumber} - {r.type} (Rp {r.basePrice.toLocaleString('id-ID')}/bln) - {isOccupied ? `[Terisi: ${occupantName}]` : '[Kosong / Siap Huni]'}
                            </option>
                          );
                        })}
                      </select>
                    );
                  })()}
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedUserForApproval(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white border border-slate-700"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmApproval}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md cursor-pointer"
              >
                Konfirmasi Persetujuan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: REJECT SIGN-UP ================= */}
      {selectedUserForReject && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-5 text-slate-100 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
                  <UserX className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Tolak Pendaftaran Akun</h3>
                  <p className="text-xs text-slate-400">{selectedUserForReject.name}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUserForReject(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-400">
                Akun yang ditolak tidak akan dapat login ke sistem. Anda dapat menyertakan alasan penolakan di bawah:
              </p>
              <div>
                <label className="block font-bold text-slate-300 mb-1">Alasan Penolakan:</label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedUserForReject(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white border border-slate-700"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmRejection}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md cursor-pointer"
              >
                Tolak Pendaftaran
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD USER DIRECTLY ================= */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 space-y-5 text-slate-100 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Tambah Pengguna Baru</h3>
                  <p className="text-xs text-slate-400">Buat akun langsung dengan status aktif</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddUserModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUserDirectly} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Nama Lengkap *</label>
                  <input
                    id="enterprise-user-name-input"
                    name="enterprise_user_name"
                    type="text"
                    required
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    data-lpignore="true"
                    data-form-type="other"
                    value={newUserData.name}
                    onChange={e => setNewUserData({ ...newUserData, name: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white"
                    placeholder="Nama Pengguna"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Nomor WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    value={newUserData.phone}
                    onChange={e => setNewUserData({ ...newUserData, phone: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white"
                    placeholder="08123456789"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Alamat Email *</label>
                  <input
                    type="email"
                    required
                    value={newUserData.email}
                    onChange={e => setNewUserData({ ...newUserData, email: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white"
                    placeholder="nama@email.com"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Kata Sandi Awal *</label>
                  <input
                    type="text"
                    required
                    value={newUserData.password}
                    onChange={e => setNewUserData({ ...newUserData, password: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Peran (Role) *</label>
                  <select
                    value={newUserData.role}
                    onChange={e => setNewUserData({ ...newUserData, role: e.target.value as UserRole })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  >
                    <option value="penghuni">Penghuni Kamar</option>
                    <option value="pemilik">Mitra Pemilik Kos</option>
                    <option value="superadmin">Super Admin Enterprise</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Status Akun *</label>
                  <select
                    value={newUserData.status}
                    onChange={e => setNewUserData({ ...newUserData, status: e.target.value as AccountStatus })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  >
                    <option value="active">Aktif Langsung</option>
                    <option value="pending_approval">Masuk Antrian Review</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Cabang Properti Terdaftar:</label>
                <select
                  value={newUserData.kostBranch}
                  onChange={e => {
                    const newBranchName = e.target.value;
                    const branchRooms = getRoomsForBranch(newBranchName);
                    const firstAvailable = branchRooms.find(r => 
                      !r.tenant && 
                      !users.some(u => u.role === 'penghuni' && u.assignedRoomId === r.id && u.status === 'active')
                    ) || branchRooms[0];
                    setNewUserData({
                      ...newUserData,
                      kostBranch: newBranchName,
                      assignedRoomId: firstAvailable ? firstAvailable.id : 1,
                    });
                  }}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-teal-300 font-bold focus:outline-none focus:border-teal-500 cursor-pointer"
                >
                  {branches.map(b => (
                    <option key={b.id} value={b.name}>
                      {b.name} ({b.code} - {b.city}) • {b.totalRooms} Kamar
                    </option>
                  ))}
                </select>
              </div>

              {newUserData.role === 'penghuni' && (
                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    Unit Kamar ({getRoomsForBranch(newUserData.kostBranch).length} Kamar Terdaftar):
                  </label>
                  {(() => {
                    const currentBranchRooms = getRoomsForBranch(newUserData.kostBranch);
                    const selectedRoomObj = currentBranchRooms.find(r => r.id === newUserData.assignedRoomId);
                    const isSelectedOccupied = !!(
                      selectedRoomObj?.tenant ||
                      users.some(u => u.role === 'penghuni' && u.assignedRoomId === newUserData.assignedRoomId && u.status === 'active')
                    );

                    return (
                      <select
                        value={newUserData.assignedRoomId}
                        onChange={e => setNewUserData({ ...newUserData, assignedRoomId: Number(e.target.value) })}
                        className={`w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl font-bold ${
                          isSelectedOccupied ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        {currentBranchRooms.map(r => {
                          const activeUser = users.find(
                            u => u.role === 'penghuni' && u.assignedRoomId === r.id && u.status === 'active'
                          );
                          const isOccupied = !!r.tenant || !!activeUser;
                          const occupantName = r.tenant?.name || activeUser?.name || 'Terisi';

                          return (
                            <option
                              key={r.id}
                              value={r.id}
                              className={isOccupied ? 'text-rose-400 font-bold bg-slate-950' : 'text-emerald-400 font-bold bg-slate-950'}
                              style={{
                                color: isOccupied ? '#f87171' : '#34d399',
                                backgroundColor: '#020617',
                              }}
                            >
                              {r.roomNumber} - {r.type} (Rp {r.basePrice.toLocaleString('id-ID')}/bln) - {isOccupied ? `[Terisi: ${occupantName}]` : '[Kosong / Siap Huni]'}
                            </option>
                          );
                        })}
                      </select>
                    );
                  })()}
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white border border-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-md cursor-pointer"
                >
                  Simpan Pengguna
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT USER ================= */}
      {editingUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-5 text-slate-100 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Edit Data Pengguna</h3>
                  <p className="text-xs text-slate-400">{editingUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={editingUser.name}
                  onChange={e => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Peran (Role)</label>
                  <select
                    value={editingUser.role}
                    onChange={e => setEditingUser({ ...editingUser, role: e.target.value as UserRole })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  >
                    <option value="superadmin">Super Admin</option>
                    <option value="pemilik">Pemilik Kos</option>
                    <option value="penghuni">Penghuni</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Status Akun</label>
                  <select
                    value={editingUser.status}
                    onChange={e => setEditingUser({ ...editingUser, status: e.target.value as AccountStatus })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  >
                    <option value="active">Aktif</option>
                    <option value="pending_approval">Pending</option>
                    <option value="suspended">Suspended</option>
                    <option value="rejected">Ditolak</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Cabang Properti Terdaftar:</label>
                <select
                  value={editingUser.kostBranch || (branches[0] ? branches[0].name : 'Kost Griya Harmoni 8')}
                  onChange={e => {
                    const newBranchName = e.target.value;
                    const branchRooms = getRoomsForBranch(newBranchName);
                    const firstAvailable = branchRooms.find(r => 
                      !r.tenant && 
                      !users.some(u => u.role === 'penghuni' && u.assignedRoomId === r.id && u.status === 'active' && u.id !== editingUser.id)
                    ) || branchRooms[0];
                    setEditingUser({
                      ...editingUser,
                      kostBranch: newBranchName,
                      assignedRoomId: firstAvailable ? firstAvailable.id : editingUser.assignedRoomId,
                    });
                  }}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-teal-300 font-bold focus:outline-none focus:border-teal-500 cursor-pointer"
                >
                  {branches.map(b => (
                    <option key={b.id} value={b.name}>
                      {b.name} ({b.code} - {b.city}) • {b.totalRooms} Kamar
                    </option>
                  ))}
                </select>
              </div>

              {editingUser.role === 'penghuni' && (
                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    Unit Kamar ({getRoomsForBranch(editingUser.kostBranch || branches[0]?.name || '').length} Kamar Terdaftar):
                  </label>
                  {(() => {
                    const currentBranchRooms = getRoomsForBranch(editingUser.kostBranch || branches[0]?.name || '');
                    const selectedRoomObj = currentBranchRooms.find(r => r.id === editingUser.assignedRoomId);
                    const isSelectedOccupied = !!(
                      selectedRoomObj?.tenant ||
                      users.some(u => u.role === 'penghuni' && u.assignedRoomId === editingUser.assignedRoomId && u.status === 'active' && u.id !== editingUser.id)
                    );

                    return (
                      <select
                        value={editingUser.assignedRoomId || (currentBranchRooms[0]?.id ?? 1)}
                        onChange={e => setEditingUser({ ...editingUser, assignedRoomId: Number(e.target.value) })}
                        className={`w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl font-bold ${
                          isSelectedOccupied ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        {currentBranchRooms.map(r => {
                          const activeUser = users.find(
                            u => u.role === 'penghuni' && u.assignedRoomId === r.id && u.status === 'active' && u.id !== editingUser.id
                          );
                          const isOccupied = !!r.tenant || !!activeUser;
                          const occupantName = r.tenant?.name || activeUser?.name || 'Terisi';

                          return (
                            <option
                              key={r.id}
                              value={r.id}
                              className={isOccupied ? 'text-rose-400 font-bold bg-slate-950' : 'text-emerald-400 font-bold bg-slate-950'}
                              style={{
                                color: isOccupied ? '#f87171' : '#34d399',
                                backgroundColor: '#020617',
                              }}
                            >
                              {r.roomNumber} - {r.type} (Rp {r.basePrice.toLocaleString('id-ID')}/bln) - {isOccupied ? `[Terisi: ${occupantName}]` : '[Kosong / Siap Huni]'}
                            </option>
                          );
                        })}
                      </select>
                    );
                  })()}
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-300 mb-1">Reset Kata Sandi</label>
                <input
                  type="text"
                  value={editingUser.password || ''}
                  onChange={e => setEditingUser({ ...editingUser, password: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                  placeholder="Masukkan kata sandi baru"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white border border-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold shadow-md cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD BRANCH ================= */}
      {isAddBranchModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-5 text-slate-100 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-500/20 text-teal-400">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Tambah Cabang Properti</h3>
                  <p className="text-xs text-slate-400">Integrasikan unit properti baru ke jaringan Enterprise</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddBranchModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBranch} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Nama Cabang / Properti *</label>
                <input
                  type="text"
                  required
                  value={newBranchData.name}
                  onChange={e => setNewBranchData({ ...newBranchData, name: e.target.value })}
                  placeholder="Contoh: Harmoni Pavilion Senayan"
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Kode Cabang *</label>
                  <input
                    type="text"
                    required
                    value={newBranchData.code}
                    onChange={e => setNewBranchData({ ...newBranchData, code: e.target.value.toUpperCase() })}
                    placeholder="HPS-SNY"
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Jumlah Kamar *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newBranchData.totalRooms}
                    onChange={e => setNewBranchData({ ...newBranchData, totalRooms: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Alamat Properti *</label>
                <input
                  type="text"
                  required
                  value={newBranchData.address}
                  onChange={e => setNewBranchData({ ...newBranchData, address: e.target.value })}
                  placeholder="Jl. Asia Afrika No. 12"
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Nama Pengelola *</label>
                  <input
                    type="text"
                    required
                    value={newBranchData.managerName}
                    onChange={e => setNewBranchData({ ...newBranchData, managerName: e.target.value })}
                    placeholder="Ratna Dewi"
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">WhatsApp Pengelola *</label>
                  <input
                    type="tel"
                    required
                    value={newBranchData.managerPhone}
                    onChange={e => setNewBranchData({ ...newBranchData, managerPhone: e.target.value })}
                    placeholder="081755667788"
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddBranchModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white border border-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold shadow-md cursor-pointer"
                >
                  Simpan Cabang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: DELETE BRANCH CONFIRMATION ================= */}
      {branchToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-5 text-slate-100 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-400 border-b border-slate-800 pb-3">
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-white font-heading">Konfirmasi Hapus Cabang</h3>
                <p className="text-xs text-slate-400">Tindakan ini permanen pada cabang properti</p>
              </div>
            </div>

            <div className="p-4 bg-rose-950/20 border border-rose-800/40 rounded-2xl space-y-2 text-xs">
              <p className="text-slate-200">
                Apakah Anda yakin ingin menghapus cabang properti <strong className="text-white font-bold">{branchToDelete.name}</strong> ({branchToDelete.code})?
              </p>
              <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800 space-y-1 text-[11px] text-slate-400">
                <div className="flex items-center justify-between">
                  <span>Lokasi:</span>
                  <span className="text-slate-200 font-semibold">{branchToDelete.city}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Total Kamar:</span>
                  <span className="text-slate-200 font-semibold">{branchToDelete.totalRooms} Pintu</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Pengelola:</span>
                  <span className="text-slate-200 font-semibold">{branchToDelete.managerName}</span>
                </div>
              </div>
              <p className="text-[11px] text-amber-300 flex items-start gap-1.5 pt-1">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>Seluruh akun penyewa dan pengelola yang terhubung dengan cabang ini akan dilepas asosiasinya dengan aman.</span>
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setBranchToDelete(null)}
                className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white border border-slate-700 font-bold text-xs cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  const targetName = branchToDelete.name;
                  await deleteBranch(branchToDelete.id);
                  setBranchToDelete(null);
                  showNotification(`Cabang properti "${targetName}" berhasil dihapus.`, 'error');
                }}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-900/30 cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Hapus Cabang Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: BRANCH ACCOUNTS & TENANTS DETAILS ================= */}
      {selectedBranchForDetails && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl p-6 space-y-5 text-slate-100 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base text-white font-heading">{selectedBranchForDetails.name}</h3>
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 font-mono text-[10px] text-slate-300 font-bold">
                      {selectedBranchForDetails.code}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{selectedBranchForDetails.address}, {selectedBranchForDetails.city}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedBranchForDetails(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List of associated accounts */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Daftar Akun Terdaftar di Cabang Ini
                </h4>
                <span className="px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20 text-xs font-bold font-mono">
                  {users.filter(u => u.kostBranch === selectedBranchForDetails.name || u.kostBranch === selectedBranchForDetails.id || (!u.kostBranch && selectedBranchForDetails.id === 'branch-01')).length} Pengguna
                </span>
              </div>

              <div className="max-h-72 overflow-y-auto space-y-2 pr-1 no-scrollbar">
                {users.filter(u => u.kostBranch === selectedBranchForDetails.name || u.kostBranch === selectedBranchForDetails.id || (!u.kostBranch && selectedBranchForDetails.id === 'branch-01')).length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-xs bg-slate-950/50 rounded-2xl border border-slate-800/80">
                    Belum ada akun penghuni atau staf yang ditautkan ke cabang ini.
                  </div>
                ) : (
                  users
                    .filter(u => u.kostBranch === selectedBranchForDetails.name || u.kostBranch === selectedBranchForDetails.id || (!u.kostBranch && selectedBranchForDetails.id === 'branch-01'))
                    .map(user => (
                      <div
                        key={user.id}
                        className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-white text-xs shrink-0">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-sm">{user.name}</span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                  user.role === 'superadmin'
                                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                    : user.role === 'pemilik'
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                    : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                }`}
                              >
                                {user.role === 'superadmin' ? 'Super Admin' : user.role === 'pemilik' ? 'Pengelola' : 'Penghuni'}
                              </span>
                            </div>
                            <div className="text-slate-400 text-[11px] flex items-center gap-2 mt-0.5">
                              <span>{user.email}</span>
                              <span>&bull;</span>
                              <span>{user.phone}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          {user.assignedRoomId ? (
                            <span className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono text-[11px] font-bold">
                              Kamar 0{user.assignedRoomId}
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-500 italic">Non-Kamar</span>
                          )}
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setSelectedBranchId(selectedBranchForDetails.id);
                  setSelectedBranchForDetails(null);
                  setRole('pemilik');
                  if (onGoToPortal) onGoToPortal('pemilik');
                }}
                className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-slate-950 font-black text-xs transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Buka & Kelola Cabang Ini</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedBranchForDetails(null)}
                className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white border border-slate-700 font-bold text-xs"
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

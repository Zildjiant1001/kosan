import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useKost } from '../context/KostContext';
import {
  X,
  ShieldCheck,
  UserCheck,
  LogOut,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Lock,
  Mail,
  User,
  KeyRound,
  Building2,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { UserRole } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: UserRole;
  onSuccessRedirect?: (role: UserRole) => void;
}

export const GoogleAuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultRole = 'pemilik',
  onSuccessRedirect,
}) => {
  const {
    currentUser,
    isAuthLoading,
    authError,
    signInWithGoogleAuth,
    signOutGoogleAuth,
    clearAuthError,
    role,
    setRole,
    settings,
    rooms,
    allRooms,
    selectedTenantRoomId,
    setSelectedTenantRoomId,
    activeAppUser,
    logoutAppUser,
  } = useKost();

  const router = useRouter();

  const [selectedRoleTab, setSelectedRoleTab] = useState<UserRole>(defaultRole);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Tenant access via Room selection / NIK
  const [tenantRoomId, setTenantRoomId] = useState<number>(selectedTenantRoomId);
  const [tenantNikInput, setTenantNikInput] = useState<string>('');
  const [tenantError, setTenantError] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentRoom = (rooms && rooms.find(r => r.id === tenantRoomId)) || 
                      (allRooms && allRooms.find(r => r.id === tenantRoomId)) || 
                      (rooms && rooms[0]) || 
                      (allRooms && allRooms[0]) || 
                      null;

  const handleGoogleSignIn = async (targetRole: UserRole) => {
    setIsSigningIn(true);
    setSuccessMsg(null);
    clearAuthError();
    try {
      const user = await signInWithGoogleAuth(targetRole);
      if (user) {
        setRole(targetRole);
        setSuccessMsg(`Berhasil masuk sebagai ${targetRole === 'pemilik' ? 'Pemilik Kos' : 'Penghuni Kos'}!`);
        setTimeout(() => {
          if (onSuccessRedirect) {
            onSuccessRedirect(targetRole);
          }
          onClose();
        }, 1000);
      }
    } catch (err: any) {
      // Error is caught and displayed via authError or err.message
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleTenantDirectAccess = (e: React.FormEvent) => {
    e.preventDefault();
    setTenantError(null);

    const room = rooms.find(r => r.id === tenantRoomId);
    if (!room) {
      setTenantError('Kamar tidak ditemukan.');
      return;
    }

    // Set role to penghuni & active room
    setSelectedTenantRoomId(tenantRoomId);
    setRole('penghuni');
    setSuccessMsg(`Masuk ke Portal ${room.roomNumber} (${room.tenant ? room.tenant.name : 'Penghuni'})`);
    
    setTimeout(() => {
      if (onSuccessRedirect) {
        onSuccessRedirect('penghuni');
      }
      onClose();
    }, 800);
  };

  const handleSignOut = async () => {
    try {
      logoutAppUser();
      setSuccessMsg('Berhasil keluar dari akun.');
      onClose();
      router.push('/login');
    } catch (err) {
      // handled
    }
  };

  const currentDomain = typeof window !== 'undefined' ? window.location.hostname : '';

  return (
    <div
      id="unified-auth-modal"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
    >
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-sm text-white">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-white font-heading">
                Pintu Masuk Akun
              </h3>
              <p className="text-xs text-slate-300">
                {settings.kostName} &bull; Pilih akses yang sesuai
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection: Pemilik vs Penghuni */}
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => setSelectedRoleTab('pemilik')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                selectedRoleTab === 'pemilik'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Akun Pemilik</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRoleTab('penghuni')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                selectedRoleTab === 'penghuni'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Portal Penghuni</span>
            </button>
          </div>

          {/* Feedback messages */}
          {authError && (
            <div
              className={`rounded-2xl p-3.5 text-xs flex items-start gap-2.5 border ${
                authError.includes('antrian') || authError.includes('peninjauan')
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {authError.includes('antrian') || authError.includes('peninjauan') ? (
                <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <p className="font-semibold">{authError}</p>
                {authError.includes('Authorized Domains') && (
                  <div className="text-[11px] text-rose-700 mt-1 space-y-1">
                    <p>
                      Domain: <code className="bg-white px-1 py-0.5 rounded font-mono font-bold">{currentDomain}</code>
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {tenantError && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 text-xs text-rose-800 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <p className="font-semibold text-rose-900">{tenantError}</p>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 text-xs text-emerald-800 flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <p className="font-semibold text-emerald-900">{successMsg}</p>
            </div>
          )}

          {/* ================= 1. TAB PEMILIK (OWNER AUTH) ================= */}
          {selectedRoleTab === 'pemilik' && (
            <div className="space-y-4">
              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 text-xs text-emerald-950 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5 text-emerald-900">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Akses Penuh Pengelola & Pemilik</span>
                </div>
                <p className="text-emerald-800 text-[11px] leading-relaxed">
                  Akses dashboard 8 kamar, validasi pembayaran QRIS, pencatatan pengeluaran, laporan keuangan, dan tiket perbaikan.
                </p>
              </div>

              {currentUser ? (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    {currentUser.photoURL ? (
                      <img
                        src={currentUser.photoURL}
                        alt={currentUser.displayName || 'Google Profile'}
                        className="w-12 h-12 rounded-full border-2 border-emerald-500 object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-emerald-600 text-white font-bold text-lg flex items-center justify-center">
                        {currentUser.displayName ? currentUser.displayName[0] : 'P'}
                      </div>
                    )}
                    <div className="overflow-hidden flex-1">
                      <div className="font-bold text-sm text-slate-900 truncate">
                        {currentUser.displayName || 'Pengelola Kos'}
                      </div>
                      <div className="text-xs text-slate-500 truncate">{currentUser.email}</div>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setRole('pemilik');
                        if (onSuccessRedirect) onSuccessRedirect('pemilik');
                        onClose();
                      }}
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Masuk ke Dashboard Pemilik</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="w-full py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Keluar dari Akun Google</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => handleGoogleSignIn('pemilik')}
                    disabled={isSigningIn || isAuthLoading}
                    className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold text-xs sm:text-sm transition flex items-center justify-center gap-3 shadow-xs hover:shadow-sm cursor-pointer"
                  >
                    {isSigningIn ? (
                      <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                    )}
                    <span>Masuk Google sebagai Pemilik</span>
                  </button>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-left text-[11px] text-slate-600 space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Sinkronisasi database Firestore Realtime</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Otentikasi aman berbasis OAuth Google</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= 2. TAB PENGHUNI (TENANT ACCESS) ================= */}
          {selectedRoleTab === 'penghuni' && (
            <div className="space-y-4">
              <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 text-xs text-blue-950 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5 text-blue-900">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  <span>Portal Khusus Penghuni Kamar</span>
                </div>
                <p className="text-blue-800 text-[11px] leading-relaxed">
                  Cek tagihan sewa bulanan, scan QRIS instan, dapatkan kuitansi digital, dan kirim tiket keluhan fasilitas kamar Anda.
                </p>
              </div>

              {currentUser || activeAppUser ? (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    {currentUser?.photoURL || activeAppUser?.avatarUrl ? (
                      <img
                        src={currentUser?.photoURL || activeAppUser?.avatarUrl}
                        alt="Profile"
                        className="w-12 h-12 rounded-full border-2 border-blue-500 object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-bold text-lg flex items-center justify-center">
                        {(currentUser?.displayName || activeAppUser?.name || 'P')[0]}
                      </div>
                    )}
                    <div className="overflow-hidden flex-1">
                      <div className="font-bold text-sm text-slate-900 truncate">
                        {currentUser?.displayName || activeAppUser?.name || 'Penghuni Kos'}
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        {currentUser?.email || activeAppUser?.email}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col gap-2">
                    <button
                      type="button"
                      id="btn-direct-tenant-portal-login"
                      onClick={() => {
                        setRole('penghuni');
                        setSuccessMsg('Masuk ke Portal Penghuni...');
                        setTimeout(() => {
                          if (onSuccessRedirect) onSuccessRedirect('penghuni');
                          onClose();
                        }, 500);
                      }}
                      className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Buka Portal Penghuni</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="w-full py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Keluar dari Akun</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Disabled Button with Notice */}
                  <button
                    type="button"
                    disabled={true}
                    className="w-full py-3 px-4 rounded-2xl bg-slate-200 text-slate-400 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-not-allowed border border-slate-300"
                    title="Silakan masuk dengan akun Google terlebih dahulu"
                  >
                    <Lock className="w-4 h-4 text-slate-400" />
                    <span>Buka Portal Penghuni (Harus Masuk Akun)</span>
                  </button>

                  <p className="text-[11px] text-center text-slate-500">
                    Silakan masuk dengan akun Google terdaftar untuk membuka portal penghuni Anda:
                  </p>

                  <button
                    type="button"
                    onClick={() => handleGoogleSignIn('penghuni')}
                    disabled={isSigningIn || isAuthLoading}
                    className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold text-xs sm:text-sm transition flex items-center justify-center gap-3 shadow-xs hover:shadow-sm cursor-pointer"
                  >
                    {isSigningIn ? (
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                    )}
                    <span>Masuk Akun Google Penghuni</span>
                  </button>

                  <div className="pt-2 text-center">
                    <a
                      href="/login"
                      className="text-xs text-blue-600 hover:text-blue-700 font-semibold underline"
                    >
                      Atau masuk dengan Email & Kata Sandi
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer note */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Lock className="w-3 h-3 text-slate-400" />
              Sesi terenkripsi aman
            </span>
            <span>{settings.kostName}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useKost } from '../context/KostContext';
import { UserRole, AppUser } from '../types';
import {
  Building2,
  ShieldCheck,
  UserCheck,
  Lock,
  Mail,
  Phone,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  KeyRound,
  ChevronRight,
  Shield,
  HelpCircle,
  Layers,
  Zap,
} from 'lucide-react';

interface AuthPageProps {
  initialMode?: 'login' | 'signup';
  defaultRole?: UserRole;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  initialMode = 'login',
  defaultRole = 'penghuni',
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    loginWithCredentials,
    signUpUser,
    signInWithGoogleAuth,
    rooms,
    users,
    settings,
  } = useKost();

  const [mode, setMode] = useState<'login' | 'signup'>(
    searchParams.get('mode') === 'signup' ? 'signup' : initialMode
  );

  // Form states - explicitly empty upon landing
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Clear fields on mount and when mode changes (e.g. freshly logged out)
  useEffect(() => {
    setEmail('');
    setPassword('');
    setErrorMsg(null);
    setPendingApprovalAlert(null);
  }, [mode]);

  // Sign up extra fields
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<UserRole>(defaultRole);
  const [selectedRoomId, setSelectedRoomId] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');

  // Auto-pick first available vacant room
  useEffect(() => {
    const firstVacantRoom = rooms.find(r => {
      const activeUser = users.find(
        u => u.role === 'penghuni' && u.assignedRoomId === r.id && u.status === 'active'
      );
      return !r.tenant && !activeUser && r.status === 'kosong';
    });
    if (firstVacantRoom) {
      setSelectedRoomId(firstVacantRoom.id);
    }
  }, [rooms, users]);

  // Status & Feedback
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pendingApprovalAlert, setPendingApprovalAlert] = useState<{ name: string; email: string } | null>(null);
  const [signUpSuccessUser, setSignUpSuccessUser] = useState<AppUser | null>(null);

  // Quick fill demo credentials
  const handleQuickFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMsg(null);
    setPendingApprovalAlert(null);
  };

  // Handle Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setPendingApprovalAlert(null);
    setIsLoading(true);

    try {
      const res = await loginWithCredentials(email, password);
      if (!res.success) {
        if (res.user && res.user.status === 'pending_approval') {
          setPendingApprovalAlert({ name: res.user.name, email: res.user.email });
        } else {
          setErrorMsg(res.message);
        }
        setIsLoading(false);
        return;
      }

      // Success Login
      const role = res.user?.role || 'penghuni';
      if (role === 'superadmin') {
        router.push('/enterprise');
      } else {
        router.push(`/portal?role=${role}`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal login ke sistem.');
      setIsLoading(false);
    }
  };

  // Handle Sign Up Submit
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const res = await signUpUser({
        name,
        email,
        phone,
        role: selectedRole,
        password,
        notes: notes || `Pendaftaran akun baru ${selectedRole} via web portal. Menunggu peninjauan dan penetapan kamar oleh Super Admin.`,
      });

      if (!res.success) {
        setErrorMsg(res.message);
        setIsLoading(false);
        return;
      }

      setSignUpSuccessUser(res.user || null);
      setIsLoading(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal melakukan pendaftaran akun.');
      setIsLoading(false);
    }
  };

  // Handle Google Auth
  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const user = await signInWithGoogleAuth();
      if (user) {
        router.push('/portal');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Login dengan Google gagal.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-8 selection:bg-emerald-600 selection:text-white relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-0 -left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-5xl bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative z-10 backdrop-blur-xl">
        {/* ================= LEFT SIDE HERO BRANDING (5 Cols) ================= */}
        <div className="lg:col-span-5 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 p-6 sm:p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800 relative">
          <div className="space-y-6">
            {/* Logo */}
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push('/')}>
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 via-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-lg">
                <Building2 className="w-6 h-6 text-slate-950" />
              </div>
              <div>
                <h2 className="font-black text-lg text-white font-heading tracking-tight">
                  {settings.kostName}
                </h2>
                <span className="text-xs text-emerald-400 font-bold">Enterprise Cloud Portal</span>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl sm:text-2xl font-black text-white font-heading leading-tight">
                Sistem Terpadu Manajemen Kos & Akun Terpusat
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Kelola kamar, tagihan QRIS instan, tiket pemeliharaan, serta persetujuan akun penghuni & pengelola dalam satu platform aman.
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
                <div className="p-1.5 rounded-xl bg-amber-500/10 text-amber-400 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-white">Verifikasi Admin Enterprise</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Setiap pendaftaran baru diverifikasi oleh Super Admin untuk keamanan maksimal.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
                <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-white">QRIS & Notifikasi Real-time</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Pembayaran sewa otomatis tersinkronisasi dengan kuitansi digital instan.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Demo Credentials Switcher */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 space-y-2">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-bold block">
              ⚡ Akun Demo Siap Pakai (1-Klik):
            </span>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={() => handleQuickFill('admin@kosthub.com', 'admin')}
                className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold transition text-left cursor-pointer"
              >
                👑 Super Admin
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('owner@kosthub.com', 'owner')}
                className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold transition text-left cursor-pointer"
              >
                🏢 Pemilik Kos
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('penghuni@kosthub.com', 'user')}
                className="p-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 font-bold transition text-left cursor-pointer"
              >
                🏠 Penghuni Kamar
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('sarah.wijaya@gmail.com', 'user')}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-medium transition text-left cursor-pointer"
                title="Contoh Akun yang masih Pending Approval Admin"
              >
                ⏳ Akun Pending
              </button>
            </div>
          </div>
        </div>

        {/* ================= RIGHT SIDE FORM (7 Cols) ================= */}
        <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
          <div>
            {/* Tab Switcher: Masuk vs Daftar */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-2xl border border-slate-800 mb-6">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg(null);
                  setPendingApprovalAlert(null);
                  setSignUpSuccessUser(null);
                }}
                className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  mode === 'login'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Lock className="w-4 h-4" />
                <span>Masuk (Login)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setErrorMsg(null);
                  setPendingApprovalAlert(null);
                  setSignUpSuccessUser(null);
                }}
                className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  mode === 'signup'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>Daftar Akun Baru</span>
              </button>
            </div>

            {/* ERROR ALERT */}
            {errorMsg && (
              <div className="mb-4 bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs font-semibold p-3.5 rounded-2xl flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* PENDING APPROVAL ALERT */}
            {pendingApprovalAlert && (
              <div className="mb-4 bg-amber-950/90 border border-amber-500/50 p-4 rounded-2xl space-y-2 animate-in fade-in">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>Akun Anda Masih Menunggu Persetujuan Admin</span>
                </div>
                <p className="text-xs text-amber-200/90 leading-relaxed">
                  Halo <strong>{pendingApprovalAlert.name}</strong>, pendaftaran akun Anda ({pendingApprovalAlert.email}) telah kami terima dan saat ini sedang menunggu persetujuan (approval) oleh <strong>Super Admin Enterprise</strong>.
                </p>
                <div className="text-[11px] text-amber-300/80 pt-1 border-t border-amber-500/30 flex items-center justify-between">
                  <span>Hubungi pengelola kos: {settings.ownerPhone}</span>
                  <button
                    onClick={() => handleQuickFill('admin@kosthub.com', 'admin')}
                    className="underline hover:text-white font-bold cursor-pointer"
                  >
                    Masuk Super Admin untuk Approve
                  </button>
                </div>
              </div>
            )}

            {/* SUCCESS SIGN UP CARD */}
            {signUpSuccessUser ? (
              <div className="bg-slate-950 border border-emerald-500/40 p-6 rounded-3xl text-center space-y-4 animate-in zoom-in-95">
                <div className="w-14 h-14 rounded-3xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white font-heading">
                    Pendaftaran Berhasil Dikirim!
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 max-w-sm mx-auto">
                    Akun atas nama <strong>{signUpSuccessUser.name}</strong> ({signUpSuccessUser.email}) telah masuk ke antrian verifikasi <strong>Super Admin Enterprise</strong>.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-900 rounded-2xl border border-slate-800 text-xs text-slate-400 text-left space-y-1">
                  <div>Status: <span className="font-bold text-amber-400">Menunggu Persetujuan (Pending)</span></div>
                  <div>Peran: <strong className="text-white uppercase">{signUpSuccessUser.role}</strong></div>
                  {signUpSuccessUser.assignedRoomId && (
                    <div>Kamar Unit: <strong className="text-emerald-400">Kamar 0{signUpSuccessUser.assignedRoomId}</strong></div>
                  )}
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <button
                    onClick={() => {
                      setMode('login');
                      setEmail(signUpSuccessUser.email);
                      setPassword('');
                      setSignUpSuccessUser(null);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition cursor-pointer shadow-md"
                  >
                    Kembali ke Halaman Masuk
                  </button>
                </div>
              </div>
            ) : mode === 'login' ? (
              /* ================= 1. FORM LOGIN ================= */
              <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs" autoComplete="off">
                <div>
                  <label className="block font-bold text-slate-300 mb-1.5">
                    Alamat Email <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="login-email-input"
                      name="auth_login_email_field"
                      type="email"
                      required
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck={false}
                      data-lpignore="true"
                      data-form-type="other"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="nama@email.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-medium focus:outline-none focus:border-emerald-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>Kata Sandi <span className="text-rose-400">*</span></span>
                    <a href="#forgot" onClick={(e) => { e.preventDefault(); alert(`Untuk reset kata sandi, hubungi Super Admin di ${settings.ownerEmail}`); }} className="text-emerald-400 hover:underline text-[11px]">
                      Lupa sandi?
                    </a>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="login-password-input"
                      name="auth_login_password_field"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      autoCorrect="off"
                      spellCheck={false}
                      data-lpignore="true"
                      data-form-type="other"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Masukkan kata sandi Anda"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-medium focus:outline-none focus:border-emerald-500 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm transition shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Masuk ke Akun</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Google Sign In Divider */}
                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-slate-800" />
                  <span className="flex-shrink mx-3 text-[11px] text-slate-500">atau opsi cepat</span>
                  <div className="flex-grow border-t border-slate-800" />
                </div>

                <button
                  type="button"
                  onClick={handleGoogleAuth}
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold text-xs transition flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Masuk dengan Akun Google</span>
                </button>
              </form>
            ) : (
              /* ================= 2. FORM SIGN UP ================= */
              <form onSubmit={handleSignUpSubmit} className="space-y-3.5 text-xs" autoComplete="off">
                {/* Dummy hidden inputs to absorb browser password generator heuristics */}
                <input type="text" name="fake_user_name_trap" tabIndex={-1} className="hidden" aria-hidden="true" style={{ display: 'none' }} />
                <input type="password" name="fake_password_trap" tabIndex={-1} className="hidden" aria-hidden="true" style={{ display: 'none' }} />

                {/* Information Notice */}
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-[11px] text-amber-300 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    Pendaftaran akan diverifikasi langsung oleh <strong>Super Admin Enterprise</strong> sebelum Anda diberikan akses login.
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    Nama Lengkap <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="signup-name-input"
                      name="full_applicant_name"
                      type="text"
                      required
                      readOnly
                      onFocus={(e) => { e.currentTarget.readOnly = false; }}
                      autoComplete="one-time-code"
                      autoCorrect="off"
                      spellCheck={false}
                      data-lpignore="true"
                      data-1p-ignore="true"
                      data-bwignore="true"
                      data-form-type="other"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Masukkan nama lengkap Anda"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">
                      Alamat Email <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="signup-email-input"
                        name="email"
                        type="email"
                        required
                        autoComplete="email"
                        autoCorrect="off"
                        spellCheck={false}
                        data-lpignore="true"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="nama@email.com"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">
                      Nomor WhatsApp <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="signup-phone-input"
                        name="tel"
                        type="tel"
                        required
                        autoComplete="tel"
                        autoCorrect="off"
                        spellCheck={false}
                        data-lpignore="true"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="08123456789"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">
                      Daftar Sebagai (Peran) <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={selectedRole}
                      onChange={e => setSelectedRole(e.target.value as UserRole)}
                      className="w-full py-2.5 px-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-semibold focus:outline-none focus:border-emerald-500"
                    >
                      <option value="penghuni">Penghuni Kamar Kos</option>
                      <option value="pemilik">Mitra Pemilik / Pengelola</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">
                      Kata Sandi <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="signup-password-input"
                        name="new-password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        autoComplete="new-password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Minimal 6 karakter"
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>



                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm transition shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-3"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Kirim Pendaftaran ke Admin</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 mt-6">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Terenkripsi & Diawasi Super Admin
            </span>
            <button
              onClick={() => router.push('/')}
              className="text-slate-400 hover:text-white transition cursor-pointer font-semibold"
            >
              Kembali ke Beranda Iklan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

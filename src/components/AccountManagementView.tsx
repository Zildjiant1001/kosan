import React, { useState } from 'react';
import { useKost } from '../context/KostContext';
import { formatIndonesianDate } from '../utils/formatters';
import {
  User,
  Mail,
  Phone,
  Camera,
  CheckCircle2,
  AlertCircle,
  Lock,
  Eye,
  EyeOff,
  Bell,
  ShieldCheck,
  Building2,
  Calendar,
  Sparkles,
  Save,
  KeyRound,
  Check,
  Layers,
  Smartphone,
} from 'lucide-react';

export const AccountManagementView: React.FC = () => {
  const {
    role,
    rooms,
    allRooms,
    selectedTenantRoomId,
    currentUser,
    activeAppUser,
    settings,
    updateRoom,
  } = useKost();

  const currentRoom = (rooms && rooms.find(r => r.id === selectedTenantRoomId)) || 
                      (allRooms && allRooms.find(r => r.id === selectedTenantRoomId)) || 
                      (rooms && rooms[0]) || 
                      (allRooms && allRooms[0]) || 
                      null;

  const tenant = currentRoom?.tenant;

  // 1. Profile state
  const [name, setName] = useState<string>(
    role === 'pemilik'
      ? (activeAppUser?.name || currentUser?.displayName || settings.ownerName || 'Pengelola Kos')
      : (activeAppUser?.name || tenant?.name || 'Penghuni Kos')
  );
  const [email, setEmail] = useState<string>(
    role === 'pemilik'
      ? (activeAppUser?.email || currentUser?.email || settings.ownerEmail || 'pengelola@koshub.com')
      : (activeAppUser?.email || tenant?.email || 'penghuni@koshub.com')
  );
  const [phone, setPhone] = useState<string>(
    role === 'pemilik' 
      ? (activeAppUser?.phone || settings.ownerPhone || '081234567890') 
      : (activeAppUser?.phone || tenant?.phone || '081234567890')
  );
  const [avatarUrl, setAvatarUrl] = useState<string>(
    role === 'pemilik'
      ? (activeAppUser?.avatarUrl || currentUser?.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80')
      : (activeAppUser?.avatarUrl || tenant?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80')
  );
  const [isProfileSaved, setIsProfileSaved] = useState<boolean>(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);

  // 2. Security & Password state
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showCurrentPass, setShowCurrentPass] = useState<boolean>(false);
  const [showNewPass, setShowNewPass] = useState<boolean>(false);
  const [showConfirmPass, setShowConfirmPass] = useState<boolean>(false);
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);
  const [isUpdatingPass, setIsUpdatingPass] = useState<boolean>(false);

  // 3. Notification Preferences state
  const [notifyBillWa, setNotifyBillWa] = useState<boolean>(true);
  const [notifyBillEmail, setNotifyBillEmail] = useState<boolean>(true);
  const [notifyAnnouncement, setNotifyAnnouncement] = useState<boolean>(true);
  const [notifyMaintenance, setNotifyMaintenance] = useState<boolean>(true);
  const [prefSuccess, setPrefSuccess] = useState<boolean>(false);

  // Avatar upload simulation
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fakeUrl = URL.createObjectURL(file);
      setAvatarUrl(fakeUrl);
      setProfileSuccessMsg('Foto profil berhasil dipilih. Klik "Simpan Perubahan" untuk menyimpan.');
    }
  };

  // Save profile changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccessMsg(null);

    if (role === 'penghuni' && tenant) {
      const updatedTenant = {
        ...tenant,
        name,
        email,
        phone,
        avatarUrl,
      };
      await updateRoom({
        ...currentRoom,
        tenant: updatedTenant,
      });
    }

    setIsProfileSaved(true);
    setProfileSuccessMsg('Perubahan data profil Anda berhasil disimpan!');
    setTimeout(() => {
      setIsProfileSaved(false);
      setProfileSuccessMsg(null);
    }, 3500);
  };

  // Password validation & update
  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(null);

    if (!currentPassword) {
      setPassError('Harap masukkan kata sandi saat ini.');
      return;
    }
    if (newPassword.length < 6) {
      setPassError('Kata sandi baru minimal harus 6 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassError('Konfirmasi kata sandi tidak cocok dengan kata sandi baru.');
      return;
    }

    setIsUpdatingPass(true);
    setTimeout(() => {
      setIsUpdatingPass(false);
      setPassSuccess('Kata sandi Anda berhasil diperbarui dengan aman!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPassSuccess(null), 4000);
    }, 800);
  };

  // Handle preference toggle
  const handleSavePreferences = () => {
    setPrefSuccess(true);
    setTimeout(() => setPrefSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150 max-w-6xl mx-auto">
      {/* 1. Standardized Header Container */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 flex items-center gap-1.5 shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{role === 'pemilik' ? 'Akun Pemilik / Pengelola' : 'Akun Penghuni Kos'}</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 text-xs font-bold border border-teal-200 flex items-center gap-1 shadow-2xs">
              <Building2 className="w-3 h-3" />
              <span>{activeAppUser?.kostBranch || settings.kostName || 'Cabang Kosan'}</span>
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-heading tracking-tight">
            Pengaturan Akun & Profil Pengguna
          </h1>
          <p className="text-xs text-slate-500">
            Kelola informasi identitas pribadi, keamanan kredensial login, dan preferensi saluran notifikasi tagihan Anda.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 flex items-center gap-2 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <div className="text-xs">
              <span className="text-slate-500 font-medium">Status Akun: </span>
              <strong className="text-emerald-700 font-bold">Aktif & Terverifikasi</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Layout 2 Kolom untuk Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* KOLOM KIRI (7 Kolom): Profil & Detail Unit */}
        <div className="lg:col-span-7 space-y-6">
          {/* ================= BAGIAN 1: INFORMASI PROFIL PENGGUNA ================= */}
          <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-md hover:shadow-lg transition-all space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-extrabold text-base sm:text-lg text-slate-900 font-heading">
                    Informasi Profil Pengguna
                  </h2>
                  <p className="text-xs text-slate-500">
                    Perbarui nama, kontak WhatsApp, dan foto profil Anda.
                  </p>
                </div>
              </div>
            </div>

            {profileSuccessMsg && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold p-3.5 rounded-2xl flex items-center gap-2.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{profileSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-5">
              {/* Foto Profil & Upload Avatar */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="relative group">
                  <img
                    src={avatarUrl}
                    alt={name}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-emerald-500 shadow-xs"
                  />
                  <label
                    htmlFor="avatar-upload"
                    className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white shadow-md cursor-pointer transition flex items-center justify-center"
                    title="Ubah Foto Profil"
                  >
                    <Camera className="w-4 h-4" />
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="space-y-1 text-center sm:text-left flex-1">
                  <h4 className="font-bold text-sm text-slate-900">{name || 'Nama Pengguna'}</h4>
                  <p className="text-xs text-slate-500">
                    Format yang didukung: JPG, PNG atau WebP (Maksimal 2 MB).
                  </p>
                  <label
                    htmlFor="avatar-upload"
                    className="inline-block mt-2 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-white border border-emerald-200 hover:bg-emerald-50 px-3 py-1.5 rounded-xl cursor-pointer transition shadow-2xs"
                  >
                    Pilih Foto Baru
                  </label>
                </div>
              </div>

              {/* Field Form Input */}
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Nama Lengkap <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="account-profile-fullname"
                      name="account_profile_fullname"
                      type="text"
                      required
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck={false}
                      data-lpignore="true"
                      data-form-type="other"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Masukkan nama lengkap Anda"
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition shadow-2xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span>Alamat Email <span className="text-rose-500">*</span></span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" /> Terverifikasi
                    </span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="nama@email.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition shadow-2xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Nomor WhatsApp / HP Aktif <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="Contoh: 081234567890"
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition shadow-2xs"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-sm hover:shadow cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan Profil</span>
                </button>
              </div>
            </form>
          </div>

          {/* ================= BAGIAN 2: INFORMASI DETAIL KAMAR / LANGGANAN ================= */}
          <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-md hover:shadow-lg transition-all space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-extrabold text-base sm:text-lg text-slate-900 font-heading">
                    {role === 'pemilik' ? 'Status Kepemilikan Unit Kos' : 'Informasi Kamar & Sewa'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {role === 'pemilik'
                      ? 'Properti kos 8 pintu yang dikelola secara aktif'
                      : 'Rincian unit kamar yang sedang Anda sewa'}
                  </p>
                </div>
              </div>

              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {role === 'pemilik' ? 'Pengelola Aktif' : 'Penghuni Aktif'}
              </span>
            </div>

            {role === 'penghuni' ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider block">Nomor Unit Kamar</span>
                  <div className="text-base font-extrabold text-slate-900 font-heading">
                    {currentRoom.roomNumber}
                  </div>
                  <span className="text-[11px] text-slate-500 block">Lantai {currentRoom.floor} &bull; {currentRoom.size}</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider block">Tipe & Fasilitas</span>
                  <div className="text-base font-extrabold text-emerald-700 font-heading">
                    {currentRoom.type}
                  </div>
                  <span className="text-[11px] text-slate-500 block">
                    {currentRoom.electricityType === 'token_mandiri' ? 'Token Listrik Mandiri' : 'Listrik Termasuk'}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider block">Mulai Menempati</span>
                  <div className="text-base font-extrabold text-slate-900 font-mono">
                    {tenant ? formatIndonesianDate(tenant.checkInDate) : '2026-01-01'}
                  </div>
                  <span className="text-[11px] text-blue-600 font-semibold block">
                    Kontrak {tenant?.contractDurationMonths || 1} Bulan
                  </span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider block">Nama Properti</span>
                  <div className="text-base font-extrabold text-slate-900 font-heading">{settings.kostName}</div>
                  <span className="text-[11px] text-slate-500 block">Total 8 Pintu Kamar</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider block">Integrasi QRIS</span>
                  <div className="text-base font-extrabold text-emerald-700 font-mono">NMID Aktif</div>
                  <span className="text-[11px] text-slate-500 block">{settings.qrisMerchantName}</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider block">Lokasi Kos</span>
                  <div className="text-xs font-extrabold text-slate-900 line-clamp-1">{settings.address}</div>
                  <span className="text-[11px] text-slate-500 block">{settings.city}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* KOLOM KANAN (5 Kolom): Keamanan & Preferensi Notifikasi */}
        <div className="lg:col-span-5 space-y-6">
          {/* ================= BAGIAN 3: KEAMANAN & GANTI KATA SANDI ================= */}
          <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-md hover:shadow-lg transition-all space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-extrabold text-base sm:text-lg text-slate-900 font-heading">
                  Keamanan & Kata Sandi
                </h2>
                <p className="text-xs text-slate-500">
                  Ubah kata sandi untuk melindungi akun Anda.
                </p>
              </div>
            </div>

            {passError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold p-3.5 rounded-2xl flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{passError}</span>
              </div>
            )}

            {passSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold p-3.5 rounded-2xl flex items-center gap-2.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{passSuccess}</span>
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Kata Sandi Saat Ini
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    placeholder="Masukkan kata sandi lama"
                    className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Kata Sandi Baru
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Konfirmasi Kata Sandi Baru
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi kata sandi baru"
                    className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isUpdatingPass}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition shadow-sm hover:shadow flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isUpdatingPass ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  )}
                  <span>Perbarui Kata Sandi</span>
                </button>
              </div>
            </form>
          </div>

          {/* ================= BAGIAN 4: PENGATURAN NOTIFIKASI & PREFERENSI ================= */}
          <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-md hover:shadow-lg transition-all space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center font-bold">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-extrabold text-base sm:text-lg text-slate-900 font-heading">
                    Notifikasi & Preferensi
                  </h2>
                  <p className="text-xs text-slate-500">
                    Atur saluran pemberitahuan yang ingin Anda terima.
                  </p>
                </div>
              </div>
            </div>

            {prefSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold p-3 rounded-xl flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Preferensi notifikasi berhasil diperbarui!</span>
              </div>
            )}

            <div className="space-y-4 text-xs">
              {/* Toggle 1: WhatsApp Bill Notification */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="space-y-0.5 pr-3">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Notifikasi Tagihan WhatsApp</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Terima link invoice QRIS dan pengingat jatuh tempo via WhatsApp.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setNotifyBillWa(!notifyBillWa);
                    handleSavePreferences();
                  }}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                    notifyBillWa ? 'bg-emerald-600' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      notifyBillWa ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Toggle 2: Email Receipt Notification */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="space-y-0.5 pr-3">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-blue-600" />
                    <span>Kuitansi Digital via Email</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Otomatis kirim salinan kuitansi PDF resmi saat pembayaran diverifikasi.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setNotifyBillEmail(!notifyBillEmail);
                    handleSavePreferences();
                  }}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                    notifyBillEmail ? 'bg-emerald-600' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      notifyBillEmail ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Toggle 3: Announcement / Pengumuman */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="space-y-0.5 pr-3">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Pengumuman & Info Pengelola</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Pemberitahuan pemeliharaan rutin, jadwal kebersihan, dan aturan baru.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setNotifyAnnouncement(!notifyAnnouncement);
                    handleSavePreferences();
                  }}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                    notifyAnnouncement ? 'bg-emerald-600' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      notifyAnnouncement ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

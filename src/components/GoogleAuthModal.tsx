import React, { useState } from 'react';
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
  ExternalLink,
  Mail,
  User,
  Database,
  Building,
} from 'lucide-react';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({ isOpen, onClose }) => {
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
  } = useKost();

  const [isSigningIn, setIsSigningIn] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    setSuccessMsg(null);
    clearAuthError();
    try {
      await signInWithGoogleAuth();
      setSuccessMsg('Berhasil masuk dengan Akun Google!');
    } catch (err) {
      // Error handled by KostContext
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutGoogleAuth();
      setSuccessMsg('Berhasil keluar dari akun.');
    } catch (err) {
      // handled
    }
  };

  const currentDomain = typeof window !== 'undefined' ? window.location.hostname : '';

  return (
    <div
      id="google-auth-modal"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
    >
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
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
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900 font-heading">
                Google Authentication
              </h3>
              <p className="text-xs text-slate-500">
                Firebase Auth &bull; Project: <span className="font-mono text-slate-700 font-bold">kosan-d844c</span>
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

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* Notification / Feedback alerts */}
          {authError && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-xs text-rose-800 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-rose-900">{authError}</p>
                {authError.includes('Authorized Domains') && (
                  <div className="text-[11px] text-rose-700 mt-1 space-y-1">
                    <p>
                      Domain saat ini: <code className="bg-white/80 px-1 py-0.5 rounded font-mono font-bold text-rose-950">{currentDomain}</code>
                    </p>
                    <p>
                      Tambahkan domain di atas ke{' '}
                      <strong>Firebase Console &gt; Authentication &gt; Settings &gt; Authorized domains</strong> agar Google Sign-In aktif sempurna.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-800 flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <p className="font-semibold text-emerald-900">{successMsg}</p>
            </div>
          )}

          {/* User Profile View (Logged in) */}
          {currentUser ? (
            <div className="space-y-4">
              {/* Profile Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center gap-3.5">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'Google User'}
                    className="w-14 h-14 rounded-full border-2 border-emerald-400 object-cover shadow-xs shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xl flex items-center justify-center border-2 border-emerald-300 shrink-0">
                    {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}

                <div className="overflow-hidden flex-1">
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-extrabold text-sm text-slate-900 truncate">
                      {currentUser.displayName || 'Pengguna Google'}
                    </h4>
                    <span className="px-1.5 py-0.2 text-[10px] font-bold rounded bg-blue-100 text-blue-700">
                      Google
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 flex items-center gap-1 truncate mt-0.5">
                    <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{currentUser.email}</span>
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono truncate mt-0.5">
                    UID: {currentUser.uid}
                  </p>
                </div>
              </div>

              {/* Status & Access */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-emerald-50/60 border border-emerald-200/80 p-2.5 rounded-xl">
                  <div className="text-[11px] text-emerald-700 font-medium">Status Akun</div>
                  <div className="font-bold text-emerald-900 flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Terverifikasi Google</span>
                  </div>
                </div>

                <div className="bg-slate-100 border border-slate-200 p-2.5 rounded-xl">
                  <div className="text-[11px] text-slate-500 font-medium">Role Aktif</div>
                  <div className="font-bold text-slate-900 flex items-center gap-1 mt-0.5">
                    {role === 'pemilik' ? (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Pemilik Kos</span>
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                        <span>Penghuni Kos</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={isAuthLoading}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                >
                  <LogOut className="w-4 h-4 text-slate-500" />
                  <span>Keluar dari Akun Google</span>
                </button>
              </div>
            </div>
          ) : (
            /* Login Screen */
            <div className="space-y-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 mx-auto flex items-center justify-center shadow-xs">
                <Lock className="w-7 h-7" />
              </div>

              <div>
                <h4 className="font-extrabold text-base text-slate-900 font-heading">
                  Masuk dengan Akun Google
                </h4>
                <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto">
                  Hubungkan akun Google Anda untuk mengakses seluruh data kosan, sinkronisasi real-time cloud, dan keamanan data pengelola.
                </p>
              </div>

              {/* Sign In Button */}
              <button
                type="button"
                id="btn-google-signin-action"
                onClick={handleGoogleSignIn}
                disabled={isSigningIn || isAuthLoading}
                className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold text-xs sm:text-sm transition flex items-center justify-center gap-3 shadow-xs hover:shadow-sm cursor-pointer"
              >
                {isSigningIn || isAuthLoading ? (
                  <div className="w-4 h-4 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
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
                <span>Lanjutkan dengan Google</span>
              </button>

              {/* Benefits list */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-left text-xs space-y-2">
                <div className="flex items-center gap-2 text-slate-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Sinkronisasi otomatis dengan Firebase Firestore</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Data keuangan & verifikasi sewa tersimpan aman</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Terintegrasi langsung dengan profil pengelola kos</span>
                </div>
              </div>
            </div>
          )}

          {/* Footer note */}
          <div className="pt-2 border-t border-slate-200 text-center">
            <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Didukung oleh Firebase Authentication resmi</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

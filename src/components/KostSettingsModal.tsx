import React, { useState } from 'react';
import { useKost } from '../context/KostContext';
import { KostSettings, BankAccount } from '../types';
import {
  X,
  Settings,
  QrCode,
  Building,
  CreditCard,
  Wifi,
  ShieldCheck,
  Plus,
  Trash2,
  Save,
} from 'lucide-react';

interface KostSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KostSettingsModal: React.FC<KostSettingsModalProps> = ({ isOpen, onClose }) => {
  const {
    settings,
    updateSettings,
    currentUser,
    signInWithGoogleAuth,
    signOutGoogleAuth,
    isAuthLoading,
  } = useKost();

  const [formSettings, setFormSettings] = useState<KostSettings>({ ...settings });
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([...settings.bankAccounts]);
  const [rules, setRules] = useState<string[]>([...settings.rules]);
  const [newRule, setNewRule] = useState('');

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      ...formSettings,
      bankAccounts,
      rules,
    });
    alert('Pengaturan kos dan konfigurasi QRIS berhasil disimpan!');
    onClose();
  };

  const handleAddBankAccount = () => {
    setBankAccounts(prev => [
      ...prev,
      { bank: 'BCA', accountNumber: '1234567890', accountHolder: formSettings.ownerName },
    ]);
  };

  const handleRemoveBankAccount = (index: number) => {
    setBankAccounts(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddRule = () => {
    if (newRule.trim()) {
      setRules(prev => [...prev, newRule.trim()]);
      setNewRule('');
    }
  };

  const handleRemoveRule = (index: number) => {
    setRules(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div id="kost-settings-modal" className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-slate-900 font-heading">
                Pengaturan Properti Kos & Pembayaran QRIS
              </h3>
              <p className="text-xs text-slate-500">
                Konfigurasi identitas kos, nomor QRIS NMID, rekening bank & tata tertib
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

        {/* Form Container */}
        <form onSubmit={handleSave} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs">
          {/* Section 0: Google Authentication Status */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-2xs">
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
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 text-xs">Akun Pengelola Terhubung:</span>
                  {currentUser ? (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      Aktif Terverifikasi
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] font-bold">
                      Belum Terhubung
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {currentUser ? currentUser.email : 'Login Google untuk sinkronisasi Firebase data.'}
                </p>
              </div>
            </div>

            {currentUser ? (
              <button
                type="button"
                onClick={() => signOutGoogleAuth()}
                disabled={isAuthLoading}
                className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-200/70 text-slate-700 font-semibold text-[11px] transition cursor-pointer self-start sm:self-auto"
              >
                Keluar Google
              </button>
            ) : (
              <button
                type="button"
                onClick={() => signInWithGoogleAuth()}
                disabled={isAuthLoading}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] shadow-2xs transition cursor-pointer self-start sm:self-auto"
              >
                Masuk dengan Google
              </button>
            )}
          </div>

          {/* Section 1: Identitas Kos */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-emerald-700 flex items-center gap-1.5 uppercase tracking-wide">
              <Building className="w-4 h-4" />
              <span>Identitas & Informasi Properti</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nama Kos *</label>
                <input
                  type="text"
                  required
                  value={formSettings.kostName}
                  onChange={e => setFormSettings({ ...formSettings, kostName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nama Pemilik / Pengelola *</label>
                <input
                  type="text"
                  required
                  value={formSettings.ownerName}
                  onChange={e => setFormSettings({ ...formSettings, ownerName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nomor WhatsApp Pengelola *</label>
                <input
                  type="text"
                  required
                  value={formSettings.ownerPhone}
                  onChange={e => setFormSettings({ ...formSettings, ownerPhone: e.target.value })}
                  placeholder="081234567890"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Kota / Lokasi</label>
                <input
                  type="text"
                  value={formSettings.city}
                  onChange={e => setFormSettings({ ...formSettings, city: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-700 font-semibold mb-1">Alamat Lengkap</label>
                <input
                  type="text"
                  value={formSettings.address}
                  onChange={e => setFormSettings({ ...formSettings, address: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* Section 2: QRIS & Rekening Bank */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <h4 className="font-bold text-sm text-emerald-700 flex items-center gap-1.5 uppercase tracking-wide">
              <QrCode className="w-4 h-4" />
              <span>Konfigurasi QRIS & Rekening Transfer</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">QRIS Merchant Name *</label>
                <input
                  type="text"
                  required
                  value={formSettings.qrisMerchantName}
                  onChange={e => setFormSettings({ ...formSettings, qrisMerchantName: e.target.value })}
                  placeholder="GRIYA HARMONI 8 KOST"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 uppercase font-mono shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">QRIS NMID (National Merchant ID) *</label>
                <input
                  type="text"
                  required
                  value={formSettings.qrisNmid}
                  onChange={e => setFormSettings({ ...formSettings, qrisNmid: e.target.value })}
                  placeholder="ID1020088998877"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono shadow-2xs"
                />
              </div>
            </div>

            {/* Bank Accounts List */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-700 font-semibold">Daftar Rekening Bank & E-Wallet:</span>
                <button
                  type="button"
                  onClick={handleAddBankAccount}
                  className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Rekening</span>
                </button>
              </div>

              {bankAccounts.map((acc, idx) => (
                <div key={idx} className="grid grid-cols-3 gap-2 items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <input
                    type="text"
                    value={acc.bank}
                    onChange={e => {
                      const updated = [...bankAccounts];
                      updated[idx].bank = e.target.value;
                      setBankAccounts(updated);
                    }}
                    placeholder="Bank (BCA/Mandiri/GoPay)"
                    className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-900 text-xs shadow-2xs"
                  />
                  <input
                    type="text"
                    value={acc.accountNumber}
                    onChange={e => {
                      const updated = [...bankAccounts];
                      updated[idx].accountNumber = e.target.value;
                      setBankAccounts(updated);
                    }}
                    placeholder="Nomor Rekening"
                    className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-900 text-xs font-mono shadow-2xs"
                  />
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={acc.accountHolder}
                      onChange={e => {
                        const updated = [...bankAccounts];
                        updated[idx].accountHolder = e.target.value;
                        setBankAccounts(updated);
                      }}
                      placeholder="Atas Nama"
                      className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-900 text-xs w-full shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveBankAccount(idx)}
                      className="text-rose-600 hover:text-rose-700 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: WiFi Credentials */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <h4 className="font-bold text-sm text-emerald-700 flex items-center gap-1.5 uppercase tracking-wide">
              <Wifi className="w-4 h-4" />
              <span>Akses WiFi Properti</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nama WiFi (SSID)</label>
                <input
                  type="text"
                  value={formSettings.wifiSsid}
                  onChange={e => setFormSettings({ ...formSettings, wifiSsid: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Password WiFi</label>
                <input
                  type="text"
                  value={formSettings.wifiPass}
                  onChange={e => setFormSettings({ ...formSettings, wifiPass: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Rules & Regulations */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <h4 className="font-bold text-sm text-emerald-700 flex items-center gap-1.5 uppercase tracking-wide">
              <ShieldCheck className="w-4 h-4" />
              <span>Tata Tertib & Peraturan Bersama Kos</span>
            </h4>

            <div className="space-y-2">
              {rules.map((rule, idx) => (
                <div key={idx} className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="text-slate-700">{idx + 1}. {rule}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveRule(idx)}
                    className="text-rose-600 hover:text-rose-700 p-1 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={newRule}
                  onChange={e => setNewRule(e.target.value)}
                  placeholder="Ketik peraturan kos baru..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
                />
                <button
                  type="button"
                  onClick={handleAddRule}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer shadow-xs"
                >
                  Tambah
                </button>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Semua Pengaturan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

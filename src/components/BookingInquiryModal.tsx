import React, { useState } from 'react';
import { Room, KostSettings } from '../types';
import { useKost } from '../context/KostContext';
import { formatRupiah } from '../utils/formatters';
import {
  X,
  Send,
  Calendar,
  User,
  Phone,
  Mail,
  Briefcase,
  Clock,
  Sparkles,
  CheckCircle2,
  Building2,
  ShieldCheck,
  MessageSquare,
} from 'lucide-react';

interface BookingInquiryModalProps {
  room: Room | null;
  settings: KostSettings;
  isOpen: boolean;
  onClose: () => void;
}

export const BookingInquiryModal: React.FC<BookingInquiryModalProps> = ({
  room,
  settings,
  isOpen,
  onClose,
}) => {
  const { addBooking } = useKost();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [occupation, setOccupation] = useState('Karyawan');
  const [targetMoveDate, setTargetMoveDate] = useState('');
  const [duration, setDuration] = useState('1');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen || !room) return null;

  const handleSendWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Save booking inquiry to Firestore
    try {
      await addBooking({
        roomId: room.id,
        roomNumber: room.roomNumber,
        roomType: room.type,
        name: name || 'Calon Penyewa',
        phone: phone || '-',
        occupation,
        targetMoveDate: targetMoveDate || 'Segera',
        durationMonths: parseInt(duration) || 1,
        notes: notes || 'Permohonan survey / minat sewa dari website',
      });
    } catch (err) {
      console.warn('Booking saved with local notice:', err);
    }

    const formattedOwnerPhone = settings.ownerPhone.replace(/\D/g, '');
    const cleanPhone = formattedOwnerPhone.startsWith('0')
      ? '62' + formattedOwnerPhone.slice(1)
      : formattedOwnerPhone.startsWith('62')
      ? formattedOwnerPhone
      : '62' + formattedOwnerPhone;

    const messageText = `Halo Pengelola ${settings.kostName} (${settings.ownerName}),%0A%0ASaya ingin bertanya / booking kamar kos:%0A- *Kamar:* ${room.roomNumber} (${room.type})%0A- *Harga:* ${formatRupiah(room.basePrice)}/bulan%0A- *Nama Calon Penghuni:* ${name || 'Calon Penyewa'}%0A- *No. WhatsApp:* ${phone || '-'}%0A- *Pekerjaan/Status:* ${occupation}%0A- *Rencana Masuk / Survey:* ${targetMoveDate || 'Segera'}%0A- *Durasi Sewa Rencana:* ${duration} Bulan%0A- *Catatan:* ${notes || 'Mohon info ketersediaan & jadwal survey.'}%0A%0ATerima kasih!`;

    const waUrl = `https://wa.me/${cleanPhone}?text=${messageText}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
    setSubmitted(true);
  };

  return (
    <div
      id="booking-inquiry-modal"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
    >
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg font-heading">
                Formulir Minat & Survey Kamar
              </h3>
              <p className="text-xs text-slate-300">
                {settings.kostName} &bull; {room.roomNumber} ({room.type})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* Room Summary Preview */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-emerald-950 text-sm">{room.roomNumber}</span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-bold">
                  {room.type}
                </span>
                <span className="text-xs text-slate-500">Lt. {room.floor}</span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">Ukuran: {room.size} &bull; {room.facilities.slice(0, 3).join(', ')}</p>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-slate-500">Harga Sewa</div>
              <div className="font-extrabold text-emerald-700 text-sm sm:text-base">
                {formatRupiah(room.basePrice)}
                <span className="text-[10px] font-normal text-slate-500">/bln</span>
              </div>
            </div>
          </div>

          {submitted ? (
            <div className="py-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-900 text-base">Pesan Terhubung ke WhatsApp!</h4>
              <p className="text-xs text-slate-600 max-w-sm mx-auto">
                WhatsApp pemilik kos telah dibuka. Anda dapat langsung melanjutkan percakapan dengan pengelola untuk menentukan jadwal survey atau booking kamar.
              </p>
              <div className="pt-2 flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl"
                >
                  Kirim Ulang
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs"
                >
                  Selesai
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSendWhatsApp} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap Anda *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Rian Anggara"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">No. WhatsApp Aktif *</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      required
                      placeholder="0812xxxxxxx"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pekerjaan / Status *</label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <select
                      value={occupation}
                      onChange={(e) => setOccupation(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-800 bg-white"
                    >
                      <option value="Karyawan / Profesional">Karyawan / Profesional</option>
                      <option value="Mahasiswa / Pelajar">Mahasiswa / Pelajar</option>
                      <option value="Freelancer / Remote Worker">Freelancer / Remote Worker</option>
                      <option value="Wiraswasta / Bisnis">Wiraswasta / Bisnis</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Rencana Tanggal Survey / Masuk</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="date"
                      value={targetMoveDate}
                      onChange={(e) => setTargetMoveDate(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Rencana Durasi Sewa</label>
                  <div className="relative">
                    <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <select
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-800 bg-white"
                    >
                      <option value="1">1 Bulan (Bulanan)</option>
                      <option value="3">3 Bulan (Triwulan)</option>
                      <option value="6">6 Bulan (Semester)</option>
                      <option value="12">12 Bulan (1 Tahun - Promo Diskon)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Pertanyaan / Catatan Tambahan (Opsional)</label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Apakah ada parkir motor? Bisa survey besok siang jam 2?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-800"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Kirim Minat Langsung ke WhatsApp Pemilik</span>
                </button>
                <p className="text-[11px] text-slate-400 text-center mt-2">
                  Pesan akan otomatis diformat dan dikirimkan ke nomor WhatsApp pengelola ({settings.ownerPhone}).
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

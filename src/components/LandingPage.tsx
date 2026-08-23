import React, { useState } from 'react';
import { useKost } from '../context/KostContext';
import { Room } from '../types';
import { formatRupiah } from '../utils/formatters';
import { BookingInquiryModal } from './BookingInquiryModal';
import {
  Building2,
  Sparkles,
  ShieldCheck,
  Wifi,
  Tv,
  CheckCircle2,
  MapPin,
  Phone,
  MessageSquare,
  ChevronRight,
  ArrowRight,
  Clock,
  Car,
  Coffee,
  Key,
  Flame,
  Droplets,
  Zap,
  Star,
  HelpCircle,
  ChevronDown,
  User,
  Users,
  CreditCard,
  LogIn,
  ExternalLink,
  Calendar,
  Check,
  SlidersHorizontal,
  Home,
  Bath,
  Maximize2,
  Lock,
} from 'lucide-react';

interface LandingPageProps {
  onEnterPortal: (targetRole?: 'pemilik' | 'penghuni') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterPortal }) => {
  const { rooms, settings } = useKost();

  const [selectedFilter, setSelectedFilter] = useState<'all' | 'available' | 'deluxe' | 'superior' | 'standard'>('all');
  const [selectedRoomForBooking, setSelectedRoomForBooking] = useState<Room | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState<boolean>(false);

  // Calculator State
  const [calcRoomType, setCalcRoomType] = useState<string>('deluxe');
  const [calcDuration, setCalcDuration] = useState<number>(1);
  const [calcWithParking, setCalcWithParking] = useState<boolean>(false);

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Stats calculation
  const totalRooms = rooms.length;
  const availableRooms = rooms.filter((r) => r.status === 'kosong').length;
  const occupiedRooms = rooms.filter((r) => r.status === 'terisi').length;

  // Filtered rooms
  const filteredRooms = rooms.filter((room) => {
    if (selectedFilter === 'available') return room.status === 'kosong';
    if (selectedFilter === 'deluxe') return room.type.toLowerCase().includes('deluxe');
    if (selectedFilter === 'superior') return room.type.toLowerCase().includes('superior');
    if (selectedFilter === 'standard') return room.type.toLowerCase().includes('standard');
    return true;
  });

  const handleOpenBooking = (room: Room) => {
    setSelectedRoomForBooking(room);
    setIsBookingModalOpen(true);
  };

  const handleQuickWhatsApp = () => {
    const formattedOwnerPhone = settings.ownerPhone.replace(/\D/g, '');
    const cleanPhone = formattedOwnerPhone.startsWith('0')
      ? '62' + formattedOwnerPhone.slice(1)
      : formattedOwnerPhone.startsWith('62')
      ? formattedOwnerPhone
      : '62' + formattedOwnerPhone;

    const messageText = `Halo Pengelola ${settings.kostName}, saya tertarik untuk menanyakan info ketersediaan kamar dan jadwal survey kos. Terima kasih!`;
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  // Calculator logic
  const getBasePriceForCalc = () => {
    if (calcRoomType === 'deluxe') return 1750000;
    if (calcRoomType === 'superior') return 1550000;
    return 1200000;
  };

  const calculateTotalEstimate = () => {
    const monthlyRate = getBasePriceForCalc();
    const baseTotal = monthlyRate * calcDuration;
    const parkingTotal = calcWithParking ? 50000 * calcDuration : 0;
    
    // Discount for 6 months (3%) or 12 months (5%)
    let discount = 0;
    if (calcDuration === 6) discount = baseTotal * 0.03;
    if (calcDuration === 12) discount = baseTotal * 0.05;

    return {
      monthlyRate,
      baseTotal,
      parkingTotal,
      discount,
      grandTotal: baseTotal + parkingTotal - discount,
    };
  };

  const calcResult = calculateTotalEstimate();

  const faqs = [
    {
      q: 'Bagaimana cara melakukan survey lokasi kamar kos?',
      a: 'Anda dapat menghubungi pengelola langsung melalui tombol WhatsApp untuk membuat janji temu survey. Survey dapat dilakukan setiap hari mulai pukul 09.00 - 18.00 WIB.',
    },
    {
      q: 'Apa saja syarat untuk menyewa kamar di sini?',
      a: 'Cukup melampirkan foto KTP/identitas aktif, nomor kontak darurat (keluarga), dan melakukan pembayaran deposit sewa awal. Proses cepat dan dapat langsung tanda tangan serah terima kunci.',
    },
    {
      q: 'Bagaimana metode pembayaran uang sewa bulanan?',
      a: 'Kami telah terintegrasi dengan sistem QRIS Dinamis (GoPay, OVO, Dana, BCA, Mandiri, BRI, ShopeePay, dll) serta Transfer Bank resmi. Setiap transaksi langsung menghasilkan kuitansi digital terverifikasi.',
    },
    {
      q: 'Apakah biaya listrik sudah termasuk dalam uang sewa?',
      a: 'Untuk tipe Kamar Deluxe AC & Superior AC menggunakan sistem Listrik Token Mandiri (2.200W per kamar) sehingga pemakaian Anda sangat transparan dan hemat. Untuk tipe Standard Fan, biaya listrik sudah termasuk dalam uang sewa.',
    },
    {
      q: 'Apakah tersedia fasilitas dapur bersama & tempat parkir?',
      a: 'Ya! Tersedia Dapur Bersama lengkap dengan kompor gas, kulkas bersama, wastafel, dan dispenser air minum RO gratis. Area parkir motor tertutup dan diawasi CCTV 24 jam.',
    },
  ];

  // Curated aesthetic room photos
  const roomPhotos = [
    {
      url: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&auto=format&fit=crop&q=80',
      title: 'Kamar Deluxe AC Luas',
      subtitle: 'Springbed Queen, Smart TV, & Meja Kerja',
    },
    {
      url: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800&auto=format&fit=crop&q=80',
      title: 'Kamar Mandi Bersih & Water Heater',
      subtitle: 'Sanitasi terawat dan air hangat 24 jam',
    },
    {
      url: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=800&auto=format&fit=crop&q=80',
      title: 'Area Santai & Dapur Bersama',
      subtitle: 'Nyaman, asri, dengan sirkulasi udara optimal',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-emerald-600 selection:text-white">
      {/* 1. TOP STICKY NAVBAR */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-700 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-slate-900 text-base sm:text-lg font-heading tracking-tight">
                  {settings.kostName}
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  Eksklusif 8 Pintu
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden md:block">
                {settings.tagline}
              </p>
            </div>
          </div>

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-600">
            <a href="#kamar" className="hover:text-emerald-700 transition">
              Daftar Kamar
            </a>
            <a href="#fasilitas" className="hover:text-emerald-700 transition">
              Fasilitas
            </a>
            <a href="#kalkulator" className="hover:text-emerald-700 transition">
              Kalkulator Biaya
            </a>
            <a href="#lokasi" className="hover:text-emerald-700 transition">
              Lokasi
            </a>
            <a href="#faq" className="hover:text-emerald-700 transition">
              FAQ
            </a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleQuickWhatsApp}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition cursor-pointer shadow-2xs"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>WhatsApp</span>
            </button>

            {/* Enter Portal Button */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onEnterPortal('penghuni')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer shadow-xs"
              >
                <User className="w-3.5 h-3.5 text-emerald-400" />
                <span>Portal Penghuni</span>
              </button>

              <button
                onClick={() => onEnterPortal('pemilik')}
                className="hidden md:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition cursor-pointer"
                title="Login khusus pemilik / pengelola kos"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                <span>Pengelola</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 2. HERO ADVERTISING SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-950 via-slate-900 to-slate-950 text-white py-12 sm:py-20 lg:py-24">
        {/* Background Glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Badges */}
              <div className="inline-flex flex-wrap items-center justify-center lg:justify-start gap-2">
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {availableRooms > 0
                    ? `Tersedia ${availableRooms} Kamar Siap Huni!`
                    : 'Semua Kamar Saat Ini Penuh'}
                </span>
                <span className="px-3 py-1 rounded-full bg-white/10 text-slate-200 border border-white/15 text-xs font-medium">
                  {settings.city}
                </span>
              </div>

              {/* Title & Tagline */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black font-heading tracking-tight leading-tight sm:leading-tight">
                Kost Eksklusif 8 Pintu,{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200">
                  Tenang, Bersih & Nyaman
                </span>
              </h1>

              <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto lg:mx-0 leading-relaxed font-body">
                Hunian idaman untuk profesional muda & mahasiswa. Dilengkapi AC dingin, kamar mandi dalam dengan water heater, WiFi fiber 100 Mbps, dapur bersama, dan keamanan CCTV 24 jam di lokasi super strategis {settings.address}.
              </p>

              {/* Feature Highlights Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
                <div className="bg-white/5 backdrop-blur-xs border border-white/10 p-2.5 rounded-xl text-left">
                  <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 w-fit mb-1.5">
                    <Wifi className="w-4 h-4" />
                  </div>
                  <div className="font-bold text-white">WiFi 100 Mbps</div>
                  <div className="text-[10px] text-slate-400">Fiber Optic Cepat</div>
                </div>

                <div className="bg-white/5 backdrop-blur-xs border border-white/10 p-2.5 rounded-xl text-left">
                  <div className="p-1.5 rounded-lg bg-teal-500/20 text-teal-400 w-fit mb-1.5">
                    <Droplets className="w-4 h-4" />
                  </div>
                  <div className="font-bold text-white">Water Heater</div>
                  <div className="text-[10px] text-slate-400">Air Panas 24 Jam</div>
                </div>

                <div className="bg-white/5 backdrop-blur-xs border border-white/10 p-2.5 rounded-xl text-left">
                  <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 w-fit mb-1.5">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="font-bold text-white">CCTV & Gate</div>
                  <div className="text-[10px] text-slate-400">Aman & Terjaga</div>
                </div>

                <div className="bg-white/5 backdrop-blur-xs border border-white/10 p-2.5 rounded-xl text-left">
                  <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 w-fit mb-1.5">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div className="font-bold text-white">QRIS & Online</div>
                  <div className="text-[10px] text-slate-400">Bayar Praktis</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
                <a
                  href="#kamar"
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/25 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Lihat Pilihan Kamar & Promo</span>
                  <ArrowRight className="w-4 h-4" />
                </a>

                <button
                  type="button"
                  onClick={handleQuickWhatsApp}
                  className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-sm transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <span>Jadwalkan Survey Lokasi</span>
                </button>
              </div>

              {/* Pricing teaser */}
              <p className="text-xs text-slate-400 flex items-center justify-center lg:justify-start gap-1.5 pt-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Harga mulai dari <strong>Rp 1.200.000</strong> hingga <strong>Rp 1.750.000</strong> per bulan. Tanpa biaya tersembunyi.</span>
              </p>
            </div>

            {/* Right Hero Image Card Showcase */}
            <div className="lg:col-span-5 space-y-4">
              <div className="relative rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl group">
                <img
                  src="https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&auto=format&fit=crop&q=80"
                  alt="Suasana Kamar Deluxe Kost Griya Harmoni 8"
                  className="w-full h-72 sm:h-80 object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent flex flex-col justify-end p-5 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="px-2.5 py-0.5 rounded bg-emerald-500 text-slate-950 font-extrabold text-[10px] uppercase tracking-wide">
                        Paling Diminati
                      </span>
                      <h4 className="font-extrabold text-lg mt-1">Kamar Deluxe AC</h4>
                      <p className="text-xs text-slate-300">Springbed Queen, Water Heater, Balkon & Meja Kerja</p>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-slate-300">Mulai dari</div>
                      <div className="text-lg font-black text-emerald-300 font-heading">
                        Rp 1.750.000<span className="text-xs font-normal text-slate-300">/bln</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Secondary Visual Strip */}
              <div className="grid grid-cols-2 gap-3">
                <div className="relative rounded-xl overflow-hidden border border-white/10 h-28 group">
                  <img
                    src="https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&auto=format&fit=crop&q=80"
                    alt="Kamar Mandi Bersih"
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute inset-0 bg-slate-950/60 flex items-end p-2.5 text-white">
                    <span className="text-[11px] font-bold">Kamar Mandi Dalam</span>
                  </div>
                </div>

                <div className="relative rounded-xl overflow-hidden border border-white/10 h-28 group">
                  <img
                    src="https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=400&auto=format&fit=crop&q=80"
                    alt="Dapur Bersama"
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute inset-0 bg-slate-950/60 flex items-end p-2.5 text-white">
                    <span className="text-[11px] font-bold">Dapur Bersama Lengkap</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. PROMO & STATS STRIP */}
      <section className="bg-white border-y border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-3">
              <div className="text-2xl sm:text-3xl font-black text-emerald-700 font-heading">8 Pintu</div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">Total Kamar Eksklusif</div>
            </div>
            <div className="p-3">
              <div className="text-2xl sm:text-3xl font-black text-slate-900 font-heading">100%</div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">Kamar Mandi Dalam*</div>
            </div>
            <div className="p-3">
              <div className="text-2xl sm:text-3xl font-black text-emerald-700 font-heading">100 Mbps</div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">Kecepatan WiFi Fiber</div>
            </div>
            <div className="p-3">
              <div className="text-2xl sm:text-3xl font-black text-slate-900 font-heading">4.9 / 5.0</div>
              <div className="text-xs text-slate-500 font-medium mt-0.5 flex items-center justify-center gap-1">
                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                <span>Kepuasan Penghuni</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. KATALOG & IKLAN PILIHAN KAMAR (ROOM SHOWCASE) */}
      <section id="kamar" className="py-14 sm:py-20 bg-slate-50 scroll-mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold uppercase tracking-wide">
              Katalog Kamar
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 font-heading">
              Pilihan Tipe Kamar Siap Huni
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Setiap kamar didesain dengan sirkulasi udara baik, perabotan lengkap berkualitas, dan suasana hening yang mendukung istirahat maupun fokus bekerja/belajar.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => setSelectedFilter('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Semua Kamar ({rooms.length})
            </button>
            <button
              onClick={() => setSelectedFilter('available')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                selectedFilter === 'available'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
              <span>Kamar Kosong / Siap Huni ({availableRooms})</span>
            </button>
            <button
              onClick={() => setSelectedFilter('deluxe')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedFilter === 'deluxe'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Deluxe AC
            </button>
            <button
              onClick={() => setSelectedFilter('superior')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedFilter === 'superior'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Superior AC
            </button>
            <button
              onClick={() => setSelectedFilter('standard')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedFilter === 'standard'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Standard Fan
            </button>
          </div>

          {/* Rooms Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {filteredRooms.map((room) => {
              const isAvailable = room.status === 'kosong';
              return (
                <div
                  key={room.id}
                  className={`bg-white rounded-2xl border transition duration-200 shadow-xs hover:shadow-md flex flex-col justify-between overflow-hidden group ${
                    isAvailable
                      ? 'border-emerald-300 ring-2 ring-emerald-500/20'
                      : 'border-slate-200'
                  }`}
                >
                  <div>
                    {/* Card Image Banner */}
                    <div className="relative h-44 bg-slate-100 overflow-hidden">
                      <img
                        src={
                          room.type.includes('Deluxe')
                            ? 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=500&auto=format&fit=crop&q=80'
                            : room.type.includes('Superior')
                            ? 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=500&auto=format&fit=crop&q=80'
                            : 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=500&auto=format&fit=crop&q=80'
                        }
                        alt={`${room.roomNumber} - ${room.type}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      
                      {/* Top Badges */}
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-950/80 backdrop-blur-xs text-white text-[11px] font-black">
                          {room.roomNumber}
                        </span>
                        <span className="px-2 py-0.5 rounded-lg bg-white/90 backdrop-blur-xs text-slate-800 text-[10px] font-bold">
                          Lt. {room.floor}
                        </span>
                      </div>

                      <div className="absolute top-2.5 right-2.5">
                        {isAvailable ? (
                          <span className="px-2 py-0.5 rounded-lg bg-emerald-600 text-white text-[10px] font-bold shadow-xs flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            Siap Huni
                          </span>
                        ) : room.status === 'menunggu_pembayaran' ? (
                          <span className="px-2 py-0.5 rounded-lg bg-amber-500 text-white text-[10px] font-bold shadow-xs">
                            Booking Proses
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-lg bg-slate-800/85 text-slate-200 text-[10px] font-semibold">
                            Terisi
                          </span>
                        )}
                      </div>

                      {/* Bottom Type Overlay */}
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/80 to-transparent p-3 text-white">
                        <div className="font-bold text-xs">{room.type}</div>
                        <div className="text-[10px] text-slate-300">Ukuran: {room.size}</div>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-4 space-y-3">
                      {/* Price */}
                      <div className="flex items-baseline justify-between">
                        <div>
                          <div className="text-[10px] text-slate-400 uppercase font-semibold">Biaya Sewa</div>
                          <div className="font-black text-base sm:text-lg text-emerald-700 font-heading">
                            {formatRupiah(room.basePrice)}
                            <span className="text-[10px] font-normal text-slate-500">/bln</span>
                          </div>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                          {room.electricityType === 'token_mandiri' ? 'Listrik Token' : 'Listrik Termasuk'}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                        {room.description}
                      </p>

                      {/* Facilities list */}
                      <div className="space-y-1 pt-1 border-t border-slate-100">
                        <div className="text-[10px] font-bold text-slate-500 uppercase">Fasilitas Kamar:</div>
                        <div className="flex flex-wrap gap-1">
                          {room.facilities.map((fac, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.5 rounded bg-slate-50 border border-slate-200 text-[10px] text-slate-700"
                            >
                              {fac}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Button */}
                  <div className="p-4 pt-0">
                    <button
                      type="button"
                      onClick={() => handleOpenBooking(room)}
                      className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        isAvailable
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{isAvailable ? 'Pesan / Survey Kamar Ini' : 'Tanya Jadwal Kamar Ini'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. FASILITAS & KEUNGGULAN LENGKAP */}
      <section id="fasilitas" className="py-14 sm:py-20 bg-white border-t border-slate-200 scroll-mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="px-3 py-1 rounded-full bg-teal-100 text-teal-800 text-xs font-extrabold uppercase tracking-wide">
              Fasilitas Prima
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 font-heading">
              Semua Kebutuhan Hunian Sudah Tersedia
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Tinggal bawa koper dan pakaian. Kami menyiapkan seluruh fasilitas pendukung agar keseharian Anda tetap produktif dan bebas repot.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 text-xs">
            {/* Card 1 */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Wifi className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-sm text-slate-900">WiFi Dedicated 100 Mbps</h3>
              <p className="text-slate-600 leading-relaxed">
                Jaringan internet fiber optic kencang tanpa lag, ideal untuk WFH, video conference, streaming 4K, maupun kuliah online.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                <Droplets className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-sm text-slate-900">Water Heater Ariston</h3>
              <p className="text-slate-600 leading-relaxed">
                Kamar mandi dalam dengan shower air panas/dingin stabil untuk kesegaran setelah seharian beraktivitas di luar.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
                <Coffee className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-sm text-slate-900">Dapur & Dispenser Gratis</h3>
              <p className="text-slate-600 leading-relaxed">
                Dilengkapi kompor gas, kulkas bersama, wastafel cuci piring, dan dispenser air minum RO yang bebas diisi ulang gratis.
              </p>
            </div>

            {/* Card 4 */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-sm text-slate-900">Keamanan CCTV 24 Jam</h3>
              <p className="text-slate-600 leading-relaxed">
                Kamera pengawas di area publik, lorong, dan area parkir, serta akses kunci gerbang mandiri yang aman dan tertib.
              </p>
            </div>

            {/* Card 5 */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <Car className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-sm text-slate-900">Parkir Motor Berkanopi</h3>
              <p className="text-slate-600 leading-relaxed">
                Area parkir motor dalam pagar terlindung dari panas dan hujan, dengan penerangan otomatis di malam hari.
              </p>
            </div>

            {/* Card 6 */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-sm text-slate-900">Pembersihan Area Bersama</h3>
              <p className="text-slate-600 leading-relaxed">
                Petugas kebersihan rutin membersihkan lorong, dapur, dan membuang sampah sentral setiap hari untuk menjaga higienitas.
              </p>
            </div>

            {/* Card 7 */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-sm text-slate-900">Portal Sewa & QRIS Otomatis</h3>
              <p className="text-slate-600 leading-relaxed">
                Pembayaran sewa bulanan praktis menggunakan QRIS atau transfer bank dengan kuitansi digital langsung tersimpan di portal.
              </p>
            </div>

            {/* Card 8 */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Home className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-sm text-slate-900">Lingkungan Tenang & Nyaman</h3>
              <p className="text-slate-600 leading-relaxed">
                Hanya 8 pintu eksklusif, tidak berisik, dan tata tertib terjaga untuk menjamin privasi dan istirahat maksimal para penghuni.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. KALKULATOR BIAYA & SIMULASI DISKON SEWA */}
      <section id="kalkulator" className="py-14 sm:py-20 bg-slate-900 text-white scroll-mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Info */}
            <div className="lg:col-span-6 space-y-4 text-center lg:text-left">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                Kalkulator Transparan
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black font-heading tracking-tight">
                Hitung Estimasi Biaya & Diskon Sewa Anda
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Dapatkan potongan harga khusus untuk pembayaran per 6 bulan (diskon 3%) atau per 1 tahun (diskon 5%). Tidak ada biaya tersembunyi.
              </p>

              <div className="space-y-2 pt-2 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Free WiFi Fiber 100 Mbps tanpa biaya langganan tambahan</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Air minum dispenser RO & kebersihan area bersama gratis</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Metode pembayaran QRIS & kuitansi resmi instan</span>
                </div>
              </div>
            </div>

            {/* Right Interactive Calculator Card */}
            <div className="lg:col-span-6 bg-slate-800/90 border border-slate-700 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 text-xs">
              <h3 className="font-extrabold text-base text-white border-b border-slate-700 pb-3 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
                <span>Simulasi Biaya Sewa</span>
              </h3>

              <div className="space-y-4">
                {/* 1. Pilih Tipe Kamar */}
                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">Pilih Tipe Kamar:</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setCalcRoomType('deluxe')}
                      className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                        calcRoomType === 'deluxe'
                          ? 'border-emerald-400 bg-emerald-500/20 text-white font-bold'
                          : 'border-slate-700 bg-slate-900/50 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="text-[11px]">Deluxe AC</div>
                      <div className="text-[10px] text-emerald-300 mt-0.5">Rp 1,75jt/bln</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCalcRoomType('superior')}
                      className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                        calcRoomType === 'superior'
                          ? 'border-emerald-400 bg-emerald-500/20 text-white font-bold'
                          : 'border-slate-700 bg-slate-900/50 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="text-[11px]">Superior AC</div>
                      <div className="text-[10px] text-emerald-300 mt-0.5">Rp 1,55jt/bln</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCalcRoomType('standard')}
                      className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                        calcRoomType === 'standard'
                          ? 'border-emerald-400 bg-emerald-500/20 text-white font-bold'
                          : 'border-slate-700 bg-slate-900/50 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="text-[11px]">Standard Fan</div>
                      <div className="text-[10px] text-emerald-300 mt-0.5">Rp 1,20jt/bln</div>
                    </button>
                  </div>
                </div>

                {/* 2. Pilih Durasi Sewa */}
                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">Durasi Sewa Rencana:</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { val: 1, label: '1 Bulan' },
                      { val: 3, label: '3 Bulan' },
                      { val: 6, label: '6 Bulan (-3%)' },
                      { val: 12, label: '1 Tahun (-5%)' },
                    ].map((d) => (
                      <button
                        key={d.val}
                        type="button"
                        onClick={() => setCalcDuration(d.val)}
                        className={`py-2 px-1 rounded-xl border text-center transition cursor-pointer text-[11px] ${
                          calcDuration === d.val
                            ? 'border-emerald-400 bg-emerald-500/20 text-white font-bold'
                            : 'border-slate-700 bg-slate-900/50 text-slate-400 hover:text-white'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Fasilitas Tambahan */}
                <div className="pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={calcWithParking}
                      onChange={(e) => setCalcWithParking(e.target.checked)}
                      className="rounded text-emerald-500 focus:ring-emerald-400 w-4 h-4"
                    />
                    <span>Tambah Parkir Khusus (+Rp 50.000/bln)</span>
                  </label>
                </div>

                {/* Output Calculation Result */}
                <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-4 space-y-2 mt-3">
                  <div className="flex justify-between text-slate-400">
                    <span>Sewa Pokok ({calcDuration} Bulan):</span>
                    <span>{formatRupiah(calcResult.baseTotal)}</span>
                  </div>

                  {calcResult.parkingTotal > 0 && (
                    <div className="flex justify-between text-slate-400">
                      <span>Biaya Parkir Tambahan:</span>
                      <span>+{formatRupiah(calcResult.parkingTotal)}</span>
                    </div>
                  )}

                  {calcResult.discount > 0 && (
                    <div className="flex justify-between text-emerald-400 font-semibold">
                      <span>Potongan Promo Durasi:</span>
                      <span>-{formatRupiah(calcResult.discount)}</span>
                    </div>
                  )}

                  <div className="border-t border-slate-700 pt-2 flex items-baseline justify-between text-white">
                    <span className="font-extrabold text-sm">Estimasi Total:</span>
                    <span className="font-black text-xl text-emerald-300 font-heading">
                      {formatRupiah(calcResult.grandTotal)}
                    </span>
                  </div>
                </div>

                {/* Direct CTA */}
                <button
                  type="button"
                  onClick={handleQuickWhatsApp}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Ambil Penawaran & Booking via WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. LOKASI STRATEGIS & AKSES SEKITAR */}
      <section id="lokasi" className="py-14 sm:py-20 bg-white border-t border-slate-200 scroll-mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-extrabold uppercase tracking-wide">
              Lokasi Strategis
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 font-heading">
              Dekat ke Mana Saja & Bebas Macet
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Beralamat di <strong className="text-slate-800">{settings.address}, {settings.city}</strong>. Akses sangat mudah dijangkau transportasi umum maupun ojek online.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900">3 Menit ke Stasiun MRT</h4>
                <p className="text-slate-500 mt-0.5">Akses cepat ke koridor Blok M, Senayan, Sudirman, dan Bundaran HI.</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-teal-100 text-teal-700 shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900">7 Menit ke SCBD & Sudirman</h4>
                <p className="text-slate-500 mt-0.5">Sangat ideal untuk karyawan dan ekspatriat yang bekerja di perkantoran sentral.</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-blue-100 text-blue-700 shrink-0">
                <Coffee className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900">1 Menit ke Kuliner & Mart</h4>
                <p className="text-slate-500 mt-0.5">Indomaret 24 Jam, Alfamart, ATM Center, cafe, warteg, dan apotek terdekat.</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-purple-100 text-purple-700 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900">Lingkungan Asri & Tenang</h4>
                <p className="text-slate-500 mt-0.5">Berada di dalam kawasan perumahan aman, bebas banjir dan tidak bising jalan raya.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. TESTIMONI PENGHUNI */}
      <section className="py-14 sm:py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-extrabold uppercase tracking-wide">
              Ulasan Penghuni
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 font-heading">
              Apa Kata Mereka yang Tinggal di Sini?
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Kenyamanan dan kepuasan penghuni adalah prioritas utama pengelola kami.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex text-amber-500 gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-500" />
                  ))}
                </div>
                <p className="text-slate-700 italic leading-relaxed">
                  &ldquo;Sudah tinggal di Kamar 01 hampir 1 tahun. Internetnya beneran kencang 100 Mbps buat kerjaan software engineer saya. Suasananya tenang banget, pemiliknya Pak Bambang & Bu Ratna sangat ramah dan responsif kalau ada keluhan.&rdquo;
                </p>
              </div>
              <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                  alt="Dimas Prasetyo"
                  className="w-9 h-9 rounded-full object-cover border border-emerald-400"
                />
                <div>
                  <div className="font-extrabold text-slate-900">Dimas Prasetyo, S.Kom</div>
                  <div className="text-[10px] text-slate-500">Penghuni Kamar 01 &bull; Software Engineer</div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex text-amber-500 gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-500" />
                  ))}
                </div>
                <p className="text-slate-700 italic leading-relaxed">
                  &ldquo;Kamar mandinya bersih, water heater nyala lancar, dan kamar ber-AC dingin. Bayar uang sewa tiap bulan praktis banget tinggal scan QRIS dari HP langsung dapat kuitansi digital.&rdquo;
                </p>
              </div>
              <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                <img
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80"
                  alt="Anindya Putri"
                  className="w-9 h-9 rounded-full object-cover border border-emerald-400"
                />
                <div>
                  <div className="font-extrabold text-slate-900">Anindya Putri Saraswati</div>
                  <div className="text-[10px] text-slate-500">Penghuni Kamar 02 &bull; Brand Designer</div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex text-amber-500 gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-500" />
                  ))}
                </div>
                <p className="text-slate-700 italic leading-relaxed">
                  &ldquo;Dapur bersama sangat membantu kalau mau masak sarapan atau seduh kopi. Air galon gratis selalu tersedia. Parkiran motor aman karena ada gerbang dan CCTV 24 jam.&rdquo;
                </p>
              </div>
              <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                <img
                  src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80"
                  alt="Fauzan Hakim"
                  className="w-9 h-9 rounded-full object-cover border border-emerald-400"
                />
                <div>
                  <div className="font-extrabold text-slate-900">Fauzan Hakim, S.T.</div>
                  <div className="text-[10px] text-slate-500">Penghuni Kamar 06 &bull; Civil Engineer</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. TATA TERTIB & FAQ (ACCORDION) */}
      <section id="faq" className="py-14 sm:py-20 bg-white border-t border-slate-200 scroll-mt-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2">
            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-extrabold uppercase tracking-wide">
              Bantuan & Regulasi
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-heading">
              Pertanyaan yang Sering Diajukan (FAQ)
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Informasi lengkap seputar aturan sewa, fasilitas, dan keamanan properti.
            </p>
          </div>

          <div className="space-y-3 text-xs">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/60 transition"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full px-5 py-4 text-left font-bold text-slate-900 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-100/80 transition"
                  >
                    <span className="text-sm">{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-500 transition-transform duration-200 shrink-0 ${
                        isOpen ? 'rotate-180 text-emerald-600' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 text-slate-600 leading-relaxed border-t border-slate-200/60 pt-3 animate-in fade-in duration-150">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Tata Tertib Ringkas */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-5 space-y-2 text-xs">
            <h4 className="font-extrabold text-emerald-950 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Tata Tertib Utama {settings.kostName}:</span>
            </h4>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-emerald-900/90 pt-1">
              {settings.rules.map((rule, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 10. CALL TO ACTION & DIRECT PORTAL ACCESS */}
      <section className="py-14 bg-gradient-to-r from-emerald-800 to-teal-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black font-heading">
            Tertarik Menjadi Bagian dari Hunian Eksklusif Ini?
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100 max-w-xl mx-auto leading-relaxed">
            Hubungi kami sekarang untuk mendapatkan penawaran spesial atau langsung masuk ke portal jika Anda sudah menjadi penghuni aktif.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={handleQuickWhatsApp}
              className="px-6 py-3.5 rounded-xl bg-white text-emerald-900 font-extrabold text-xs sm:text-sm hover:bg-emerald-50 transition shadow-lg flex items-center gap-2 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span>Chat WhatsApp Pemilik ({settings.ownerName})</span>
            </button>

            <button
              onClick={() => onEnterPortal('penghuni')}
              className="px-6 py-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-white font-extrabold text-xs sm:text-sm border border-white/20 transition flex items-center gap-2 cursor-pointer"
            >
              <User className="w-4 h-4 text-emerald-400" />
              <span>Masuk Portal Penghuni Aktif</span>
            </button>

            <button
              onClick={() => onEnterPortal('pemilik')}
              className="px-4 py-3.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-950 text-emerald-200 text-xs font-semibold border border-emerald-700/50 transition cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 inline mr-1" />
              <span>Login Pengelola Kos</span>
            </button>
          </div>
        </div>
      </section>

      {/* 11. FOOTER */}
      <footer className="bg-slate-950 text-slate-400 text-xs py-10 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
                  8
                </div>
                <span className="font-extrabold text-white text-sm">{settings.kostName}</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Hunian eksklusif 8 pintu dengan fasilitas lengkap, kamar mandi dalam, water heater, internet cepat, dan lingkungan nyaman di {settings.city}.
              </p>
            </div>

            <div>
              <div className="font-bold text-white mb-2 text-xs">Alamat & Lokasi</div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {settings.address}
                <br />
                {settings.city}
              </p>
            </div>

            <div>
              <div className="font-bold text-white mb-2 text-xs">Kontak Pengelola</div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Pemilik: <strong className="text-slate-200">{settings.ownerName}</strong>
                <br />
                WhatsApp: <span className="text-emerald-400">{settings.ownerPhone}</span>
                <br />
                Email: {settings.ownerEmail}
              </p>
            </div>

            <div>
              <div className="font-bold text-white mb-2 text-xs">Akses Sistem Portal</div>
              <div className="space-y-1.5">
                <button
                  onClick={() => onEnterPortal('penghuni')}
                  className="block text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
                >
                  &rarr; Portal Penghuni (Bayar QRIS & Kuitansi)
                </button>
                <button
                  onClick={() => onEnterPortal('pemilik')}
                  className="block text-slate-300 hover:text-white cursor-pointer"
                >
                  &rarr; Dashboard Pengelola 8 Pintu
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800/80 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
            <p>&copy; {new Date().getFullYear()} {settings.kostName}. Hak Cipta Dilindungi.</p>
            <p>Terintegrasi Cloud Firestore &bull; QRIS Nasional &bull; Google Auth</p>
          </div>
        </div>
      </footer>

      {/* Booking / Inquiry Modal */}
      <BookingInquiryModal
        room={selectedRoomForBooking}
        settings={settings}
        isOpen={isBookingModalOpen}
        onClose={() => {
          setIsBookingModalOpen(false);
          setSelectedRoomForBooking(null);
        }}
      />
    </div>
  );
};

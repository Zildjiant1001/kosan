'use client';

import React, { useState } from 'react';
import { useKost } from '../context/KostContext';
import { Room } from '../types';
import { formatRupiah } from '../utils/formatters';
import { BookingInquiryModal } from './BookingInquiryModal';
import { LandingPageEditorModal } from './LandingPageEditorModal';
import { initialLandingPageContent } from '../data/initialData';
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
  Shield,
  Layers,
  Heart,
  Compass,
  Navigation,
  CheckCheck,
  X,
  Edit3,
  Pencil,
  Sliders,
  Settings as SettingsIcon,
} from 'lucide-react';

interface LandingPageProps {
  onEnterPortal: (targetRole?: 'pemilik' | 'penghuni') => void;
  onOpenLoginModal?: (targetRole?: 'pemilik' | 'penghuni') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterPortal, onOpenLoginModal }) => {
  const { rooms, settings, activeAppUser, role } = useKost();

  const isSuperAdmin = activeAppUser?.role === 'superadmin' || role === 'superadmin';
  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);
  const [editorInitialTab, setEditorInitialTab] = useState<'branding' | 'hero' | 'features' | 'location' | 'testimonials' | 'faq' | 'whatsapp'>('branding');
  const [isInlineEditMode, setIsInlineEditMode] = useState(true);

  // Dynamic Landing Page content from settings with fallback
  const lp = settings.landingPageContent || initialLandingPageContent;

  const handleOpenEditor = (tab?: 'branding' | 'hero' | 'features' | 'location' | 'testimonials' | 'faq' | 'whatsapp') => {
    setEditorInitialTab(tab || 'branding');
    setIsEditorModalOpen(true);
  };

  const [selectedFilter, setSelectedFilter] = useState<'all' | 'lt1' | 'lt2' | 'deluxe' | 'superior' | 'standard'>('all');
  const [selectedRoomForBooking, setSelectedRoomForBooking] = useState<Room | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState<boolean>(false);

  // Gallery active preview
  const [activeGalleryIndex, setActiveGalleryIndex] = useState<number>(0);
  const [galleryCategory, setGalleryCategory] = useState<'semua' | 'kamar' | 'fasilitas' | 'lingkungan'>('semua');

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Filtered rooms
  const filteredRooms = rooms.filter((room) => {
    if (selectedFilter === 'lt1') return room.floor === 1;
    if (selectedFilter === 'lt2') return room.floor === 2;
    if (selectedFilter === 'deluxe') return room.type.toLowerCase().includes('deluxe');
    if (selectedFilter === 'superior') return room.type.toLowerCase().includes('superior');
    if (selectedFilter === 'standard') return room.type.toLowerCase().includes('standard');
    return true;
  });

  const availableRoomsCount = rooms.filter((r) => r.status === 'kosong').length;

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

    const messageText = lp.customWhatsappMessage || `Halo Pengelola ${settings.kostName}, saya tertarik untuk menanyakan info ketersediaan kamar dan jadwal survey kos. Terima kasih!`;
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const galleryItems = [
    {
      url: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=1000&auto=format&fit=crop&q=80',
      category: 'kamar',
      title: 'Kamar Deluxe AC Lantai 2',
      subtitle: 'Springbed Queen, Smart TV, AC Daikin & Meja Kerja',
    },
    {
      url: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=1000&auto=format&fit=crop&q=80',
      category: 'fasilitas',
      title: 'Kamar Mandi Dalam & Water Heater',
      subtitle: 'Sanitasi terawat, shower hangat 24 jam & ventilasi bersih',
    },
    {
      url: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=1000&auto=format&fit=crop&q=80',
      category: 'fasilitas',
      title: 'Dapur Bersama & Area Bersantai',
      subtitle: 'Dilengkapi kulkas, dispenser air minum & kompor gas',
    },
    {
      url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1000&auto=format&fit=crop&q=80',
      category: 'kamar',
      title: 'Kamar Superior AC Lantai 1',
      subtitle: 'Sirkulasi udara sejuk alami dengan pencahayaan optimal',
    },
    {
      url: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1000&auto=format&fit=crop&q=80',
      category: 'lingkungan',
      title: 'Area Parkir Motor Aman & CCTV 24 Jam',
      subtitle: 'Akses gerbang kartu keamanan & pencahayaan terang malam hari',
    },
  ];

  const filteredGallery = galleryCategory === 'semua'
    ? galleryItems
    : galleryItems.filter(g => g.category === galleryCategory);

  const faqs = [
    {
      q: 'Bagaimana cara melakukan survey lokasi kamar kos?',
      a: 'Anda dapat menghubungi pengelola langsung melalui tombol WhatsApp atau klik "Pesan / Jadwalkan Survey". Survey dapat dilakukan setiap hari mulai pukul 09.00 - 18.00 WIB.',
    },
    {
      q: 'Apa saja syarat untuk menyewa kamar di sini?',
      a: 'Cukup melampirkan foto KTP/identitas aktif, nomor kontak darurat (keluarga/kantor), dan menyelesaikan pembayaran awal. Anda akan langsung menerima kunci dan akses portal penghuni resmi.',
    },
    {
      q: 'Bagaimana metode pembayaran uang sewa bulanan?',
      a: 'Kami telah terintegrasi dengan sistem QRIS Dinamis (GoPay, OVO, DANA, BCA, Mandiri, BRI, ShopeePay, dll) serta Transfer Bank resmi. Setiap transaksi langsung menghasilkan kuitansi digital otomatis.',
    },
    {
      q: 'Apakah biaya listrik sudah termasuk dalam uang sewa?',
      a: 'Untuk tipe Kamar Deluxe AC & Superior AC menggunakan sistem Listrik Token Mandiri sehingga pemakaian Anda sangat transparan dan hemat. Untuk tipe Standard Fan, biaya listrik sudah termasuk (inklusif).',
    },
    {
      q: 'Apakah ada jam malam untuk penghuni kos?',
      a: 'Tidak ada jam malam ketat, setiap penghuni diberikan kunci akses gerbang mandiri. Namun, demi kenyamanan bersama, batas waktu bertamu adalah pukul 22.00 WIB.',
    },
  ];

  const testimonials = [
    {
      name: 'Dimas Prasetyo',
      role: 'Software Engineer (SCBD)',
      room: 'Penghuni Kamar 05 (Deluxe AC)',
      rating: 5,
      comment: 'WiFi-nya kencang dan stabil buat WFH. Lokasi strategis banget, ke MRT Blok M tinggal jalan kaki 5 menit. Suasana tenang dan kamarnya bersih terawat.',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    },
    {
      name: 'Anisa Rahmawati',
      role: 'Mahasiswi Pascasarjana',
      room: 'Penghuni Kamar 02 (Superior AC)',
      rating: 5,
      comment: 'Pengelolanya sangat ramah dan responsif. Kalau ada keluhan fasilitas langsung ditangani lewat tiket portal. Pembayaran sewa bulanan via QRIS sangat praktis!',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    },
    {
      name: 'Budi Santoso',
      role: 'Konsultan Keuangan',
      room: 'Penghuni Kamar 01 (Deluxe AC)',
      rating: 5,
      comment: 'Bangunannya kokoh, parkir motor aman berkanopi dan ada CCTV 24 jam. Paling suka balkon pribadinya buat santai sore setelah kerja.',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    },
  ];

  // Header dropdown and mobile menu state
  const [isLoginDropdownOpen, setIsLoginDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Lightbox Modal State
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Grouped Categories Configuration
  const categoryConfigs = [
    {
      id: 'deluxe',
      type: 'Deluxe AC',
      price: 1750000,
      size: '3.5 x 4 m',
      tag: 'Paling Populer',
      tagColor: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
      description: 'Kamar luas eksklusif dengan kasur Springbed Queen, AC Daikin 1/2 PK, Water Heater, dan opsi balkon pribadi lantai 2.',
      images: [
        'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=900&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=900&auto=format&fit=crop&q=80',
      ],
      specs: [
        { label: 'Ukuran', value: '3.5 x 4 m' },
        { label: 'Pendingin', value: 'AC Daikin 1/2 PK' },
        { label: 'Kamar Mandi', value: 'Dalam + Water Heater' },
        { label: 'Listrik', value: 'Token Mandiri 2200W' },
      ],
      features: ['Kasur Springbed Queen', 'Smart TV 32"', 'Meja Kerja & Kursi', 'Lemari 2 Pintu', 'WiFi 100 Mbps', 'Balkon Pribadi (Lt 2)'],
    },
    {
      id: 'superior',
      type: 'Superior AC',
      price: 1550000,
      size: '3 x 4 m',
      tag: 'Kenyamanan Optimal',
      tagColor: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
      description: 'Kamar nyaman dan tenang dengan pencahayaan alami, AC Daikin sejuk, kamar mandi dalam, dan akses dekat dapur.',
      images: [
        'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=900&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=900&auto=format&fit=crop&q=80',
      ],
      specs: [
        { label: 'Ukuran', value: '3 x 4 m' },
        { label: 'Pendingin', value: 'AC Daikin 1/2 PK' },
        { label: 'Kamar Mandi', value: 'Dalam' },
        { label: 'Listrik', value: 'Token Mandiri 2200W' },
      ],
      features: ['Kasur Single Comfort', 'Kamar Mandi Dalam', 'Meja Belajar', 'Lemari Pakaian', 'WiFi 100 Mbps', 'Sirkulasi Udara Bersih'],
    },
    {
      id: 'standard',
      type: 'Standard Fan',
      price: 1200000,
      size: '3 x 3.5 m',
      tag: 'Pilihan Hemat',
      tagColor: 'bg-teal-500/10 text-teal-500 border-teal-500/30',
      description: 'Solusi hunian terjangkau dengan exhaust fan sirkulasi segar, kamar mandi luar terawat, dan biaya listrik gratis/inklusif.',
      images: [
        'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=900&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=900&auto=format&fit=crop&q=80',
      ],
      specs: [
        { label: 'Ukuran', value: '3 x 3.5 m' },
        { label: 'Pendingin', value: 'Exhaust & Kipas Dinding' },
        { label: 'Kamar Mandi', value: 'Luar Bersih Terawat' },
        { label: 'Listrik', value: 'Sudah Termasuk Sewa' },
      ],
      features: ['Kasur Single Foam Super', 'Listrik Sudah Termasuk', 'Lemari Pakaian', 'Meja Belajar', 'WiFi 100 Mbps', 'Area Bersama Luas'],
    },
  ];

  // Helper to compute room units matching category & floor filter
  const getCategoryRoomUnits = (typeStr: string) => {
    let categoryRooms = rooms.filter(r => r.type.toLowerCase().includes(typeStr.toLowerCase().split(' ')[0]));
    if (selectedFilter === 'lt1') categoryRooms = categoryRooms.filter(r => r.floor === 1);
    if (selectedFilter === 'lt2') categoryRooms = categoryRooms.filter(r => r.floor === 2);
    return categoryRooms;
  };

  // Filtered categories based on selected filter
  const filteredCategories = categoryConfigs.filter(cat => {
    const units = getCategoryRoomUnits(cat.type);
    return units.length > 0;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-emerald-600 selection:text-white relative">
      {/* ================= 0. SUPER ADMIN EDIT CONTROL BAR ================= */}
      {isSuperAdmin && (
        <aside aria-label="Super Admin Control Bar" className="bg-slate-950 text-white border-b border-emerald-500/40 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs z-50 sticky top-0 shadow-lg backdrop-blur-md">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-[10px] tracking-wide flex items-center gap-1 shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>SUPER ADMIN</span>
            </span>
            <span className="text-slate-300 font-medium hidden sm:inline">
              Mode Kelola Landing Page: Edit teks, headline, fasilitas & testimoni secara langsung.
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setIsInlineEditMode(!isInlineEditMode)}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                isInlineEditMode
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-2xs'
                  : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
              }`}
              title="Tampilkan / sembunyikan tombol edit cepat pada setiap bagian"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tombol Edit Cepat:</span> <span>{isInlineEditMode ? 'Aktif' : 'Off'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenEditor('branding')}
              className="px-3.5 py-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs transition shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Konten Landing Page</span>
            </button>

            <a
              href="/enterprise"
              className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition flex items-center gap-1.5"
            >
              <Building2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Portal Enterprise</span>
            </a>
          </div>
        </aside>
      )}

      {/* ================= 1. REFACTORED CLEAN & MINIMAL HEADER ================= */}
      <header className={`sticky ${isSuperAdmin ? 'top-[42px]' : 'top-0'} z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/70 transition-all duration-200`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Left Section: Brand Logo, brand name, and Tagline */}
          <div className="flex items-center gap-3">
            <a href="#" className="flex items-center gap-3 group">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform duration-200 shrink-0">
                <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-extrabold text-slate-900 text-lg sm:text-xl font-heading tracking-tight leading-tight">
                  {lp.brandName || 'loktuan'}
                </span>
                <span className="text-[10px] text-slate-500 font-medium leading-none mt-0.5 hidden sm:block">
                  {lp.brandTagline || 'Hunian Nyaman, Tenang & Strategis'}
                </span>
              </div>
            </a>

            {isSuperAdmin && isInlineEditMode && (
              <button
                type="button"
                onClick={() => handleOpenEditor('branding')}
                title="Edit Nama Brand & Tagline"
                className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition border border-emerald-200 shadow-2xs cursor-pointer"
              >
                <Pencil className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Center Section: Essential 4 Links Only (Desktop) */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a
              href="#kamar"
              className="hover:text-emerald-600 transition-colors duration-150 relative py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-emerald-600 hover:after:w-full after:transition-all after:duration-200"
            >
              Kamar
            </a>
            <a
              href="#fasilitas"
              className="hover:text-emerald-600 transition-colors duration-150 relative py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-emerald-600 hover:after:w-full after:transition-all after:duration-200"
            >
              Fasilitas
            </a>
            <a
              href="#lokasi"
              className="hover:text-emerald-600 transition-colors duration-150 relative py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-emerald-600 hover:after:w-full after:transition-all after:duration-200"
            >
              Lokasi
            </a>
            <a
              href="#faq"
              className="hover:text-emerald-600 transition-colors duration-150 relative py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-emerald-600 hover:after:w-full after:transition-all after:duration-200"
            >
              FAQ
            </a>
          </nav>

          {/* Right Section: Direct Unified Masuk Action & WhatsApp */}
          <div className="flex items-center gap-2 sm:gap-3">
            {isSuperAdmin && (
              <button
                type="button"
                onClick={() => handleOpenEditor('branding')}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 text-xs font-bold transition cursor-pointer shadow-2xs"
              >
                <Edit3 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Edit Konten</span>
              </button>
            )}

            {/* Secondary Button: WhatsApp / Hubungi Kami */}
            <button
              onClick={handleQuickWhatsApp}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all duration-150 shadow-2xs hover:border-slate-300 cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>Hubungi Kami</span>
            </button>

            {/* Direct 'Masuk' Button to route directly to /login */}
            <a
              id="btn-landing-login-direct"
              href="/login"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all duration-150 shadow-xs cursor-pointer hover:shadow-md transform hover:-translate-y-0.5"
            >
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <span>Masuk</span>
            </a>

            {/* Mobile Hamburger Toggle Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              aria-label="Menu"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200/80 bg-white/95 backdrop-blur-md px-4 py-4 space-y-3 animate-in slide-in-from-top-2 duration-150">
            <nav className="flex flex-col space-y-2 text-sm font-semibold text-slate-700">
              <a
                href="#kamar"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl hover:bg-slate-100 hover:text-emerald-600 transition"
              >
                Kamar
              </a>
              <a
                href="#fasilitas"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl hover:bg-slate-100 hover:text-emerald-600 transition"
              >
                Fasilitas
              </a>
              <a
                href="#lokasi"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl hover:bg-slate-100 hover:text-emerald-600 transition"
              >
                Lokasi
              </a>
              <a
                href="#faq"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl hover:bg-slate-100 hover:text-emerald-600 transition"
              >
                FAQ
              </a>
            </nav>

            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
              {isSuperAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleOpenEditor('branding');
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 text-white text-xs font-bold transition flex items-center justify-center gap-2"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Konten Landing Page</span>
                </button>
              )}

              <a
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <User className="w-3.5 h-3.5 text-emerald-400" />
                <span>Masuk ke Akun</span>
              </a>

              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleQuickWhatsApp();
                }}
                className="w-full py-2.5 px-3 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 text-xs font-bold transition flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span>Hubungi via WhatsApp</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ================= 2. HERO ADVERTISING SECTION ================= */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white py-14 sm:py-20 lg:py-24">
        {/* Inline Edit Trigger for Hero Section */}
        {isSuperAdmin && isInlineEditMode && (
          <div className="absolute top-4 right-4 z-20">
            <button
              type="button"
              onClick={() => handleOpenEditor('hero')}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-emerald-400 hover:text-emerald-300 border border-emerald-500/50 backdrop-blur-md text-xs font-bold flex items-center gap-1.5 shadow-xl transition cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit Bagian Hero</span>
            </button>
          </div>
        )}

        {/* Glowing Ambient Particle Orbs */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Hero Column (7 Cols) */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Floating Live Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-bold animate-float-slow backdrop-blur-md shadow-lg">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="w-2 h-2 rounded-full bg-emerald-400 -ml-4" />
                <span>{availableRoomsCount > 0 ? `Tersedia ${availableRoomsCount} Kamar Siap Huni` : 'Kamar Terisi Penuh'}</span>
                <span className="text-emerald-400/50">&bull;</span>
                <span className="text-white font-medium">{lp.heroBadge || 'Bebas Biaya Survey'}</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black font-heading leading-tight tracking-tight text-white">
                {lp.heroHeadline || 'Hunian Kos Modern,'}{' '}
                <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                  {lp.heroHighlightText || 'Tenang & Strategis'}
                </span>{' '}
                {lp.heroHeadlineEnd || 'di Jantung Kota'}
              </h1>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                {lp.heroDescription ||
                  'Nikmati kenyamanan eksklusif kos 8 pintu dengan fasilitas lengkap: AC Daikin, Springbed Queen, Kamar Mandi Dalam & Water Heater, WiFi 100 Mbps, serta kemudahan bayar sewa via QRIS instan.'}
              </p>

              {/* Key Amenities Badges Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 max-w-xl mx-auto lg:mx-0 text-xs relative group">
                {(lp.features && lp.features.length > 0 ? lp.features : initialLandingPageContent.features || []).map((feat, idx) => (
                  <div key={idx} className="p-3 bg-slate-900/90 border border-slate-800 rounded-2xl flex items-center gap-3 backdrop-blur-sm card-hover-effect">
                    <div className={`p-2 rounded-xl shrink-0 ${
                      idx === 0 ? 'bg-emerald-500/10 text-emerald-400' :
                      idx === 1 ? 'bg-blue-500/10 text-blue-400' :
                      idx === 2 ? 'bg-teal-500/10 text-teal-400' :
                      'bg-amber-500/10 text-amber-400'
                    }`}>
                      {idx === 0 ? <Wifi className="w-4 h-4" /> :
                       idx === 1 ? <Zap className="w-4 h-4" /> :
                       idx === 2 ? <Droplets className="w-4 h-4" /> :
                       <ShieldCheck className="w-4 h-4" />}
                    </div>
                    <div className="text-left min-w-0">
                      <div className="font-bold text-white leading-tight">{feat.title}</div>
                      <span className="text-[11px] text-slate-300 font-medium">{feat.subtitle}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Call To Action Button with glowing hover */}
              <div className="pt-3 flex flex-col sm:flex-row items-center justify-center lg:justify-start">
                <a
                  href="#kamar"
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm sm:text-base transition-all duration-300 shadow-lg hover:shadow-[0_0_25px_rgba(16,185,129,0.45)] flex items-center justify-center gap-2.5 cursor-pointer transform hover:-translate-y-0.5"
                >
                  <Home className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Lihat Pilihan Kamar</span>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </a>
              </div>
            </div>

            {/* Right Hero Column (5 Cols) - Interactive Card & Media */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-3xl overflow-hidden border border-slate-700/80 shadow-2xl bg-slate-900 group">
                <img
                  src={lp.heroImageUrl || "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=900&auto=format&fit=crop&q=80"}
                  alt="Interior Kamar Kos Eksklusif"
                  className="w-full h-80 sm:h-96 object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                {/* Floating Satisfaction Badge */}
                <div className="absolute top-4 right-4 bg-slate-900/90 border border-slate-700/90 backdrop-blur-md px-3.5 py-2 rounded-2xl text-xs font-bold text-white flex items-center gap-2 shadow-lg animate-float-gentle">
                  <div className="flex text-amber-400">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                  </div>
                  <span>{lp.heroRatingText || '4.9 / 5.0'}</span>
                </div>

                {/* Card Bottom Meta */}
                <div className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl bg-slate-950/90 border border-slate-800 backdrop-blur-md space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Mulai dari</span>
                      <div className="text-xl font-black text-white font-mono">
                        Rp {lp.heroStartingPrice || '1.200.000'} <span className="text-xs font-normal text-slate-400">/ bulan</span>
                      </div>
                    </div>
                    <div className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                      Siap Huni Langsung
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                    <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span className="truncate">{settings.address}, {settings.city}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 3. INFINITE AMENITIES MARQUEE ================= */}
      <div className="bg-slate-900 border-y border-slate-800 py-3 overflow-hidden text-xs text-slate-300 select-none">
        <div className="animate-marquee flex items-center gap-8 whitespace-nowrap font-semibold">
          <span className="flex items-center gap-2"><Wifi className="w-4 h-4 text-emerald-400" /> WiFi 100 Mbps Dedicated</span>
          <span className="text-slate-600">&bull;</span>
          <span className="flex items-center gap-2"><Zap className="w-4 h-4 text-amber-400" /> Listrik Token Mandiri 2.200W</span>
          <span className="text-slate-600">&bull;</span>
          <span className="flex items-center gap-2"><Droplets className="w-4 h-4 text-blue-400" /> Water Heater Air Hangat 24 Jam</span>
          <span className="text-slate-600">&bull;</span>
          <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-400" /> CCTV 24 Jam & Smart Key</span>
          <span className="text-slate-600">&bull;</span>
          <span className="flex items-center gap-2"><Coffee className="w-4 h-4 text-amber-400" /> Dapur Bersama & Kulkas Lengkap</span>
          <span className="text-slate-600">&bull;</span>
          <span className="flex items-center gap-2"><Car className="w-4 h-4 text-teal-400" /> Area Parkir Motor Luas & Tertutup</span>
          <span className="text-slate-600">&bull;</span>
          <span className="flex items-center gap-2"><CreditCard className="w-4 h-4 text-purple-400" /> Pembayaran QRIS Dinamis Instan</span>
          <span className="text-slate-600">&bull;</span>
          <span className="flex items-center gap-2"><Navigation className="w-4 h-4 text-rose-400" /> 5 Menit ke Stasiun MRT & Halte Busway</span>
          <span className="text-slate-600">&bull;</span>
          {/* Loop duplicates */}
          <span className="flex items-center gap-2"><Wifi className="w-4 h-4 text-emerald-400" /> WiFi 100 Mbps Dedicated</span>
          <span className="text-slate-600">&bull;</span>
          <span className="flex items-center gap-2"><Zap className="w-4 h-4 text-amber-400" /> Listrik Token Mandiri 2.200W</span>
          <span className="text-slate-600">&bull;</span>
          <span className="flex items-center gap-2"><Droplets className="w-4 h-4 text-blue-400" /> Water Heater Air Hangat 24 Jam</span>
          <span className="text-slate-600">&bull;</span>
        </div>
      </div>

      {/* ================= 4. KATALOG KAMAR 3 KATEGORI UTAMA ================= */}
      <section id="kamar" className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold mb-2">
              <Home className="w-3.5 h-3.5" />
              <span>Pilihan Tipe Kamar Eksklusif</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-heading tracking-tight">
              Kategori & Spesifikasi Kamar
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Pilih tipe kamar yang sesuai kebutuhan Anda. Seluruh unit siap huni langsung dan terawat.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-bold">
            <button
              onClick={() => setSelectedFilter('all')}
              className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
                selectedFilter === 'all'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Semua Lantai (8 Unit)
            </button>
            <button
              onClick={() => setSelectedFilter('lt1')}
              className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
                selectedFilter === 'lt1'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Lantai 1
            </button>
            <button
              onClick={() => setSelectedFilter('lt2')}
              className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
                selectedFilter === 'lt2'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Lantai 2
            </button>
          </div>
        </div>

        {/* Grouped 3 Category Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {filteredCategories.map((cat) => {
            const catRooms = getCategoryRoomUnits(cat.type);
            const availableUnits = catRooms.filter(r => r.status === 'kosong');
            const occupiedUnits = catRooms.filter(r => r.status === 'terisi');
            const representativeRoom = catRooms.find(r => r.status === 'kosong') || catRooms[0];

            return (
              <div
                key={cat.id}
                className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group card-hover-effect"
              >
                <div>
                  {/* Category Image Preview with Tag */}
                  <div className="relative h-56 overflow-hidden bg-slate-100">
                    <img
                      src={cat.images[0]}
                      alt={cat.type}
                      className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out cursor-pointer"
                      onClick={() => {
                        const idx = galleryItems.findIndex(g => g.title.toLowerCase().includes(cat.id));
                        setLightboxIndex(idx >= 0 ? idx : 0);
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent" />

                    {/* Tag Badge */}
                    <div className="absolute top-3.5 left-3.5">
                      <span className={`px-3 py-1 rounded-xl text-xs font-bold border backdrop-blur-md ${cat.tagColor}`}>
                        {cat.tag}
                      </span>
                    </div>

                    {/* Quick Lightbox Hint */}
                    <button
                      type="button"
                      onClick={() => {
                        const idx = galleryItems.findIndex(g => g.title.toLowerCase().includes(cat.id));
                        setLightboxIndex(idx >= 0 ? idx : 0);
                      }}
                      className="absolute top-3.5 right-3.5 p-2 rounded-xl bg-slate-900/80 text-white hover:bg-slate-900 transition backdrop-blur-md cursor-pointer"
                      title="Lihat Foto Fullscreen"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Price Tag Overlay */}
                    <div className="absolute bottom-3.5 left-3.5 right-3.5 flex items-end justify-between text-white">
                      <div>
                        <h3 className="font-extrabold text-xl font-heading">{cat.type}</h3>
                        <span className="text-xs text-slate-300 font-medium">Dimensi {cat.size}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-black font-mono text-emerald-400">
                          {formatRupiah(cat.price)}
                        </div>
                        <span className="text-[10px] text-slate-300">/ bulan</span>
                      </div>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-6 space-y-4">
                    {/* Dynamic Available Room Numbers Badge */}
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Status Unit ({catRooms.length} Kamar):</span>
                        </span>
                        <span className="font-semibold text-emerald-700 text-[11px]">
                          {availableUnits.length} Siap Huni
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {catRooms.map((r) => {
                          const isUnitAvailable = r.status === 'kosong';
                          return (
                            <span
                              key={r.id}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                                isUnitAvailable
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : 'bg-slate-200/80 text-slate-500 border border-slate-300'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${isUnitAvailable ? 'bg-emerald-600' : 'bg-slate-400'}`} />
                              <span>{r.roomNumber} (Lt {r.floor})</span>
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {cat.description}
                    </p>

                    {/* Specification Specs List */}
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 text-xs">
                      {cat.specs.map((sp, idx) => (
                        <div key={idx} className="p-2 rounded-xl bg-slate-50/80 border border-slate-100">
                          <span className="text-[10px] text-slate-400 font-medium block">{sp.label}</span>
                          <span className="font-bold text-slate-800 text-[11px] truncate block">{sp.value}</span>
                        </div>
                      ))}
                    </div>

                    {/* Facility Tags List */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {cat.features.map((f, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[10px] font-semibold"
                        >
                          &bull; {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Action Button */}
                <div className="p-6 pt-0">
                  <button
                    type="button"
                    onClick={() => handleOpenBooking(representativeRoom)}
                    className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-xs hover:shadow-md cursor-pointer transform hover:-translate-y-0.5"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Pesan / Survey Tipe Ini</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ================= 5. VIRTUAL TOUR & GALLERY ================= */}
      <section id="galeri" className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">
            <Compass className="w-3.5 h-3.5" />
            <span>Tur Visual Fasilitas Real</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-heading">
            Galeri Suasana & Fasilitas Kos
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Klik foto mana saja untuk membuka tampilan layar penuh (Lightbox).
          </p>
        </div>

        {/* Gallery Category Tabs */}
        <div className="flex items-center justify-center gap-2 text-xs font-bold">
          {[
            { id: 'semua', label: 'Semua Foto' },
            { id: 'kamar', label: 'Kamar Tidur' },
            { id: 'fasilitas', label: 'Fasilitas & Dapur' },
            { id: 'lingkungan', label: 'Parkir & Keamanan' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setGalleryCategory(tab.id as any);
                setActiveGalleryIndex(0);
              }}
              className={`px-4 py-2 rounded-xl transition cursor-pointer ${
                galleryCategory === tab.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Hero Gallery Preview */}
        {filteredGallery.length > 0 && (
          <div className="space-y-4">
            <div
              onClick={() => setLightboxIndex(activeGalleryIndex)}
              className="relative rounded-3xl overflow-hidden shadow-xl border border-slate-200 bg-slate-900 h-72 sm:h-96 md:h-[420px] group cursor-pointer"
            >
              <img
                src={filteredGallery[activeGalleryIndex]?.url || filteredGallery[0].url}
                alt="Galeri Kos"
                className="w-full h-full object-cover transform group-hover:scale-103 transition-transform duration-500 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

              {/* Lightbox Trigger Badge */}
              <div className="absolute top-4 right-4 bg-slate-900/80 border border-slate-700/80 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 backdrop-blur-md group-hover:bg-emerald-600 transition">
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Perbesar Foto</span>
              </div>

              <div className="absolute bottom-6 left-6 right-6 text-white space-y-1">
                <h3 className="text-xl sm:text-2xl font-black font-heading">
                  {filteredGallery[activeGalleryIndex]?.title || filteredGallery[0].title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-200">
                  {filteredGallery[activeGalleryIndex]?.subtitle || filteredGallery[0].subtitle}
                </p>
              </div>
            </div>

            {/* Thumbnail Carousel */}
            <div className="grid grid-cols-5 gap-3">
              {filteredGallery.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setActiveGalleryIndex(idx);
                  }}
                  className={`relative rounded-2xl overflow-hidden border-2 transition h-16 sm:h-24 cursor-pointer ${
                    activeGalleryIndex === idx ? 'border-emerald-600 scale-103 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={item.url} alt={item.title} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ================= 6. FASILITAS UNGGULAN & AKSES LOKASI ================= */}
      <section id="fasilitas" className="py-16 bg-slate-100/80 border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Section 1: Fasilitas Grid */}
          <div className="space-y-6">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Kenyamanan Terjamin</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-heading">
                Semua Fasilitas Termasuk
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Fasilitas lengkap untuk mendukung produktivitas kerja dan kenyamanan istirahat Anda.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-2 card-hover-effect">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Wifi className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">WiFi 100 Mbps Dedicated</h4>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Koneksi internet serat optik stabil dengan router terpisah tiap lantai untuk WFH lancar.
                </p>
              </div>

              <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-2 card-hover-effect">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Droplets className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Water Heater Kamar Mandi</h4>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Pemanas air otomatis 24 jam dengan debit air kencang dan sanitasi bersih terawat.
                </p>
              </div>

              <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-2 card-hover-effect">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <Coffee className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Dapur Bersama Lengkap</h4>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Dilengkapi kulkas 2 pintu, dispenser air minum gratis, kompor gas, dan wastafel cuci piring.
                </p>
              </div>

              <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-2 card-hover-effect">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Keamanan Smart Access</h4>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Gerbang kartu akses pintar, CCTV 24 jam di seluruh sudut luar, dan bebas banjir.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Lokasi & Jarak Tempuh */}
          <div id="lokasi" className="pt-6 border-t border-slate-200 space-y-6 relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs text-emerald-700 font-bold uppercase tracking-wider">Akses Sangat Dekat</span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-heading mt-0.5">
                  Lokasi Strategis Dekat Transportasi & Pusat Kota
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {settings.address}, {settings.city}
                </p>
              </div>

              {isSuperAdmin && isInlineEditMode && (
                <button
                  type="button"
                  onClick={() => handleOpenEditor('location')}
                  className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-slate-900 text-emerald-400 hover:bg-slate-800 text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Edit Alamat & Titik Akses</span>
                </button>
              )}
            </div>

            {/* Direct Embedded Google Map */}
            <div className="space-y-3">
              <div className="w-full h-80 sm:h-96 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl border border-slate-700/60 relative bg-slate-900">
                <iframe
                  title="Peta Lokasi Kos Griya Harmoni 8"
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(
                    `${settings.kostName || 'Kost Griya Harmoni 8'}, ${settings.address || 'Jl. Melati Indah No. 8, Kebayoran Baru'}, ${settings.city || 'Jakarta Selatan'}`
                  )}&ll=-6.2443,106.7998&t=&z=16&ie=UTF8&iwloc=&output=embed`}
                  className="w-full h-full border-0"
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>

              {/* Action Button Row */}
              <div className="flex justify-end pt-1">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                    `${settings.address || 'Jl. Melati Indah No. 8, Kebayoran Baru'}, ${settings.city || 'Jakarta Selatan'}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Buka Petunjuk Arah di Google Maps</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 text-xs">
              {(lp.nearbyPlaces && lp.nearbyPlaces.length > 0 ? lp.nearbyPlaces : initialLandingPageContent.nearbyPlaces || []).map((place, idx) => (
                <div key={idx} className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    {idx === 0 ? <Navigation className="w-3.5 h-3.5 text-emerald-600" /> :
                     idx === 1 ? <Car className="w-3.5 h-3.5 text-blue-600" /> :
                     idx === 2 ? <Building2 className="w-3.5 h-3.5 text-amber-600" /> :
                     <Coffee className="w-3.5 h-3.5 text-teal-600" />}
                    <span>{place.title}</span>
                  </div>
                  <div className={`font-bold ${
                    idx === 0 ? 'text-emerald-700' :
                    idx === 1 ? 'text-blue-700' :
                    idx === 2 ? 'text-amber-700' :
                    'text-teal-700'
                  }`}>{place.time}</div>
                  <p className="text-[11px] text-slate-500">{place.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================= 8. RESIDENT TESTIMONIALS ================= */}
      <section className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              <span>Pengalaman Nyata Penghuni</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-heading">
              Apa Kata Mereka yang Tinggal di Sini?
            </h2>
          </div>

          {isSuperAdmin && isInlineEditMode && (
            <button
              type="button"
              onClick={() => handleOpenEditor('testimonials')}
              className="self-center sm:self-auto px-3.5 py-1.5 rounded-xl bg-slate-900 text-emerald-400 hover:bg-slate-800 text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit Testimoni</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(lp.testimonials && lp.testimonials.length > 0 ? lp.testimonials : initialLandingPageContent.testimonials || []).map((t, idx) => (
            <div
              key={idx}
              className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-4 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between card-hover-effect"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(t.rating || 5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic">
                  "{t.comment}"
                </p>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                <img
                  src={t.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                  alt={t.name}
                  className="w-11 h-11 rounded-2xl object-cover border border-slate-200"
                />
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900">{t.name}</h4>
                  <span className="text-[11px] text-slate-500 block">{t.role}</span>
                  <span className="text-[10px] text-emerald-700 font-bold block">{t.room}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================= 9. FAQ ACCORDION ================= */}
      <section id="faq" className="py-16 bg-slate-100/70 border-t border-slate-200 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1 text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Pertanyaan Populer</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-heading">
                Pertanyaan yang Sering Diajukan
              </h2>
            </div>

            {isSuperAdmin && isInlineEditMode && (
              <button
                type="button"
                onClick={() => handleOpenEditor('faq')}
                className="self-center sm:self-auto px-3.5 py-1.5 rounded-xl bg-slate-900 text-emerald-400 hover:bg-slate-800 text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Edit Pertanyaan FAQ</span>
              </button>
            )}
          </div>

          <div className="space-y-3 pt-2">
            {(lp.faqs && lp.faqs.length > 0 ? lp.faqs : initialLandingPageContent.faqs || []).map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs transition-all duration-200"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 cursor-pointer font-bold text-xs sm:text-sm text-slate-900 hover:text-emerald-700 transition"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 shrink-0 transform transition-transform duration-300 ${
                        isOpen ? 'rotate-180 text-emerald-600' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-5 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100 animate-in fade-in duration-200">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= 10. BOTTOM BANNER CTA ================= */}
      <section className="bg-gradient-to-tr from-emerald-800 via-teal-700 to-emerald-900 text-white py-14 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-5 relative z-10">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black font-heading tracking-tight">
            Tertarik Menempati Kamar Idaman Anda?
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100 max-w-xl mx-auto leading-relaxed">
            Unit kamar sangat terbatas (hanya 8 pintu). Hubungi kami sekarang untuk konfirmasi ketersediaan dan survey lokasi tanpa dipungut biaya!
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleQuickWhatsApp}
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-white text-emerald-900 hover:bg-emerald-50 font-black text-sm transition shadow-lg flex items-center justify-center gap-2 cursor-pointer hover:scale-103"
            >
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span>Hubungi Pengelola via WhatsApp</span>
            </button>
          </div>
        </div>
      </section>

      {/* ================= 11. FOOTER ================= */}
      <footer className="bg-slate-950 text-slate-400 py-10 border-t border-slate-900 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-white text-sm">{settings.kostName}</span>
              <p className="text-[11px] text-slate-500">&copy; 2026 {settings.kostName}. Hak Cipta Dilindungi.</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <a href="/login" className="hover:text-emerald-400 transition">Portal Masuk</a>
            <a href="/portal?role=pemilik" className="hover:text-emerald-400 transition">Portal Pemilik</a>
            <a href="/portal?role=penghuni" className="hover:text-emerald-400 transition">Portal Penghuni</a>
            <a href="/enterprise" className="hover:text-emerald-400 transition">Enterprise</a>
          </div>
        </div>
      </footer>

      {/* ================= 12. FLOATING WHATSAPP ACTION BUTTON ================= */}
      <div className="fixed bottom-6 right-6 z-50 group">
        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-2.5 hidden sm:group-hover:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 text-white text-xs font-bold shadow-xl border border-slate-700/80 whitespace-nowrap backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Chat Pengelola / Survey</span>
        </div>

        {/* Floating Button with Glassmorphism & Pulse Beacon */}
        <button
          type="button"
          onClick={handleQuickWhatsApp}
          className="relative p-4 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-2xl hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] transition-all duration-300 transform hover:scale-110 active:scale-95 flex items-center justify-center cursor-pointer border border-emerald-400/40"
          aria-label="Chat WhatsApp"
        >
          {/* Ambient Glow Aura */}
          <span className="absolute -inset-1 rounded-full bg-emerald-500/30 animate-pulse pointer-events-none" />
          <MessageSquare className="w-6 h-6 relative z-10" />
        </button>
      </div>

      {/* ================= 13. FULL-SCREEN GALLERY LIGHTBOX MODAL ================= */}
      {lightboxIndex !== null && (
        <div
          id="gallery-lightbox-modal"
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Close Button */}
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            className="absolute top-5 right-5 p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-white transition backdrop-blur-md cursor-pointer border border-slate-700 shadow-xl"
            aria-label="Tutup Lightbox"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Lightbox Content Container */}
          <div
            className="max-w-5xl w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative max-h-[75vh] sm:max-h-[80vh] flex items-center justify-center bg-black/40">
              <img
                src={galleryItems[lightboxIndex]?.url || galleryItems[0].url}
                alt={galleryItems[lightboxIndex]?.title || 'Foto Galeri'}
                className="w-full h-full max-h-[75vh] sm:max-h-[80vh] object-contain"
              />

              {/* Prev Button */}
              <button
                type="button"
                onClick={() =>
                  setLightboxIndex((prev) =>
                    prev !== null && prev > 0 ? prev - 1 : galleryItems.length - 1
                  )
                }
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-white transition backdrop-blur-md cursor-pointer border border-slate-700"
                aria-label="Foto Sebelumnya"
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>

              {/* Next Button */}
              <button
                type="button"
                onClick={() =>
                  setLightboxIndex((prev) =>
                    prev !== null && prev < galleryItems.length - 1 ? prev + 1 : 0
                  )
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-white transition backdrop-blur-md cursor-pointer border border-slate-700"
                aria-label="Foto Selanjutnya"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Lightbox Footer Meta */}
            <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-4 text-white">
              <div>
                <h4 className="font-bold text-sm sm:text-base font-heading">
                  {galleryItems[lightboxIndex]?.title}
                </h4>
                <p className="text-xs text-slate-400">
                  {galleryItems[lightboxIndex]?.subtitle}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs font-mono text-slate-400">
                  {lightboxIndex + 1} / {galleryItems.length}
                </span>
                <button
                  type="button"
                  onClick={handleQuickWhatsApp}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-xs"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Tanya Unit Ini</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Booking Inquiry Modal */}
      <BookingInquiryModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        room={selectedRoomForBooking}
        settings={settings}
      />

      {/* Super Admin Landing Page Editor Modal */}
      {isSuperAdmin && (
        <LandingPageEditorModal
          isOpen={isEditorModalOpen}
          onClose={() => setIsEditorModalOpen(false)}
          initialTab={editorInitialTab}
        />
      )}
    </div>
  );
};

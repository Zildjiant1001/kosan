import React, { useState, useEffect } from 'react';
import { useKost } from '../context/KostContext';
import { LandingPageContent, LandingTestimonial, LandingFaq, LandingNearbyPlace, LandingPageFeature } from '../types';
import { initialLandingPageContent } from '../data/initialData';
import {
  X,
  Sparkles,
  Save,
  RotateCcw,
  Layout,
  MessageSquare,
  MapPin,
  HelpCircle,
  Heart,
  Zap,
  CheckCircle2,
  Plus,
  Trash2,
  ExternalLink,
  Sliders,
  Image as ImageIcon,
  Star,
  Building2,
  Eye,
  ShieldCheck,
} from 'lucide-react';

interface LandingPageEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'branding' | 'hero' | 'features' | 'location' | 'testimonials' | 'faq' | 'whatsapp';
}

export const LandingPageEditorModal: React.FC<LandingPageEditorModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'branding',
}) => {
  const { settings, updateSettings } = useKost();

  const [activeTab, setActiveTab] = useState<'branding' | 'hero' | 'features' | 'location' | 'testimonials' | 'faq' | 'whatsapp'>(initialTab);

  // Synchronize activeTab if initialTab changes on open
  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Form State
  const [content, setContent] = useState<LandingPageContent>(() => {
    return settings.landingPageContent || initialLandingPageContent;
  });

  const [generalAddress, setGeneralAddress] = useState(settings.address || '');
  const [generalCity, setGeneralCity] = useState(settings.city || '');
  const [ownerPhone, setOwnerPhone] = useState(settings.ownerPhone || '');
  const [ownerEmail, setOwnerEmail] = useState(settings.ownerEmail || '');
  const [kostName, setKostName] = useState(settings.kostName || '');
  const [isSavedToast, setIsSavedToast] = useState(false);

  // Sync state whenever settings change or modal opens
  useEffect(() => {
    if (isOpen) {
      setContent(settings.landingPageContent || initialLandingPageContent);
      setGeneralAddress(settings.address || '');
      setGeneralCity(settings.city || '');
      setOwnerPhone(settings.ownerPhone || '');
      setOwnerEmail(settings.ownerEmail || '');
      setKostName(settings.kostName || '');
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const updatedSettings = {
      ...settings,
      kostName: kostName || settings.kostName,
      address: generalAddress || settings.address,
      city: generalCity || settings.city,
      ownerPhone: ownerPhone || settings.ownerPhone,
      ownerEmail: ownerEmail || settings.ownerEmail,
      tagline: content.brandTagline || settings.tagline,
      landingPageContent: {
        ...content,
      },
    };

    await updateSettings(updatedSettings);
    setIsSavedToast(true);
    setTimeout(() => {
      setIsSavedToast(false);
      onClose();
    }, 900);
  };

  const handleResetToDefault = () => {
    if (window.confirm('Kembalikan semua teks & konten Landing Page ke template bawaan (default)?')) {
      setContent(initialLandingPageContent);
      setKostName('Kost Griya Harmoni 8');
      setGeneralAddress('Jl. Melati Indah No. 8, Kebayoran Baru');
      setGeneralCity('Jakarta Selatan 12140');
      setOwnerPhone('6281234567890');
    }
  };

  // Helper updates for arrays
  const updateFeature = (index: number, field: keyof LandingPageFeature, value: string) => {
    const current = [...(content.features || initialLandingPageContent.features || [])];
    if (current[index]) {
      current[index] = { ...current[index], [field]: value };
      setContent(prev => ({ ...prev, features: current }));
    }
  };

  const updateNearbyPlace = (index: number, field: keyof LandingNearbyPlace, value: string) => {
    const current = [...(content.nearbyPlaces || initialLandingPageContent.nearbyPlaces || [])];
    if (current[index]) {
      current[index] = { ...current[index], [field]: value };
      setContent(prev => ({ ...prev, nearbyPlaces: current }));
    }
  };

  // Testimonials Helpers
  const handleAddTestimonial = () => {
    const newT: LandingTestimonial = {
      name: 'Penghuni Baru',
      role: 'Karyawan / Mahasiswa',
      room: 'Penghuni Kamar 04 (Deluxe AC)',
      rating: 5,
      comment: 'Kamar sangat nyaman dan bersih, fasilitas sesuai deskripsi dan lingkungan tenang.',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    };
    setContent(prev => ({
      ...prev,
      testimonials: [...(prev.testimonials || initialLandingPageContent.testimonials || []), newT],
    }));
  };

  const updateTestimonial = (index: number, field: keyof LandingTestimonial, value: any) => {
    const current = [...(content.testimonials || initialLandingPageContent.testimonials || [])];
    if (current[index]) {
      current[index] = { ...current[index], [field]: value };
      setContent(prev => ({ ...prev, testimonials: current }));
    }
  };

  const handleRemoveTestimonial = (index: number) => {
    setContent(prev => ({
      ...prev,
      testimonials: (prev.testimonials || []).filter((_, i) => i !== index),
    }));
  };

  // FAQ Helpers
  const handleAddFaq = () => {
    const newFaq: LandingFaq = {
      q: 'Pertanyaan baru mengenai sewa kos?',
      a: 'Tuliskan jawaban atau petunjuk informatif di sini untuk calon penyewa.',
    };
    setContent(prev => ({
      ...prev,
      faqs: [...(prev.faqs || initialLandingPageContent.faqs || []), newFaq],
    }));
  };

  const updateFaq = (index: number, field: keyof LandingFaq, value: string) => {
    const current = [...(content.faqs || initialLandingPageContent.faqs || [])];
    if (current[index]) {
      current[index] = { ...current[index], [field]: value };
      setContent(prev => ({ ...prev, faqs: current }));
    }
  };

  const handleRemoveFaq = (index: number) => {
    setContent(prev => ({
      ...prev,
      faqs: (prev.faqs || []).filter((_, i) => i !== index),
    }));
  };

  return (
    <div
      id="landing-page-editor-modal"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-5"
    >
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header with Super Admin Badge */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-bold shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg font-heading tracking-tight">
                  Editor Konten Landing Page
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Khusus Super Admin</span>
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Kelola teks headline, fasilitas, testimoni, alamat maps, dan narasi promosi secara real-time.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            aria-label="Tutup Editor"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation Menu */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-6 flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0 py-2.5">
          <button
            type="button"
            onClick={() => setActiveTab('branding')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'branding'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>1. Brand & Header</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('hero')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'hero'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Layout className="w-3.5 h-3.5" />
            <span>2. Hero Banner</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('features')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'features'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>3. Fitur Utama</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('location')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'location'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>4. Lokasi & Akses</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('testimonials')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'testimonials'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>5. Testimoni</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('faq')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'faq'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>6. FAQ</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('whatsapp')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'whatsapp'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>7. Kontak WhatsApp</span>
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-6 flex-1 text-xs text-slate-800">
          {/* TAB 1: BRANDING & HEADER */}
          {activeTab === 'branding' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="border-b border-slate-200 pb-2 flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">Identitas Brand & Header</h4>
                  <p className="text-slate-500 text-[11px]">
                    Nama yang ditampilkan di logo navbar atas, tagline, dan footer website.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Nama Brand / Logo (Header)</label>
                  <input
                    type="text"
                    value={content.brandName || ''}
                    onChange={e => setContent(prev => ({ ...prev, brandName: e.target.value }))}
                    placeholder="Contoh: loktuan"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-bold"
                  />
                  <span className="text-[10px] text-slate-400 block">
                    Teks utama di sebelah logo ikon hijau (Navbar kiri atas).
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Tagline Header Brand</label>
                  <input
                    type="text"
                    value={content.brandTagline || ''}
                    onChange={e => setContent(prev => ({ ...prev, brandTagline: e.target.value }))}
                    placeholder="Contoh: Hunian Nyaman, Tenang & Strategis"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-[10px] text-slate-400 block">
                    Teks deskripsi mini tepat di bawah nama brand logo.
                  </span>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="font-bold text-slate-700">Nama Resmi Properti Kos</label>
                  <input
                    type="text"
                    value={kostName}
                    onChange={e => setKostName(e.target.value)}
                    placeholder="Contoh: Kost Griya Harmoni 8"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-semibold"
                  />
                  <span className="text-[10px] text-slate-400 block">
                    Digunakan pada invoice, title SEO, hak cipta footer, dan chat pesan booking.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: HERO BANNER */}
          {activeTab === 'hero' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="border-b border-slate-200 pb-2">
                <h4 className="font-extrabold text-sm text-slate-900">Hero Banner Utama</h4>
                <p className="text-slate-500 text-[11px]">
                  Bagian pembuka paling atas yang pertama kali dilihat pengunjung landing page.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Headline Awalan</label>
                  <input
                    type="text"
                    value={content.heroHeadline || ''}
                    onChange={e => setContent(prev => ({ ...prev, heroHeadline: e.target.value }))}
                    placeholder="Contoh: Hunian Kos Modern,"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-emerald-700">Teks Sorotan (Gradient Hijau)</label>
                  <input
                    type="text"
                    value={content.heroHighlightText || ''}
                    onChange={e => setContent(prev => ({ ...prev, heroHighlightText: e.target.value }))}
                    placeholder="Contoh: Tenang & Strategis"
                    className="w-full px-3.5 py-2 rounded-xl border border-emerald-400 bg-emerald-50/40 focus:ring-2 focus:ring-emerald-500 font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Headline Akhiran</label>
                  <input
                    type="text"
                    value={content.heroHeadlineEnd || ''}
                    onChange={e => setContent(prev => ({ ...prev, heroHeadlineEnd: e.target.value }))}
                    placeholder="Contoh: di Jantung Kota"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-semibold"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-3">
                  <label className="font-bold text-slate-700">Deskripsi Ringkas Hero</label>
                  <textarea
                    rows={3}
                    value={content.heroDescription || ''}
                    onChange={e => setContent(prev => ({ ...prev, heroDescription: e.target.value }))}
                    placeholder="Tuliskan deskripsi ringkas kos..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 leading-relaxed"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Teks Badge Ketersediaan</label>
                  <input
                    type="text"
                    value={content.heroBadge || ''}
                    onChange={e => setContent(prev => ({ ...prev, heroBadge: e.target.value }))}
                    placeholder="Bebas Biaya Survey"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Harga Awal Kartu Hero</label>
                  <input
                    type="text"
                    value={content.heroStartingPrice || ''}
                    onChange={e => setContent(prev => ({ ...prev, heroStartingPrice: e.target.value }))}
                    placeholder="1.200.000"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Rating Badge Kepuasan</label>
                  <input
                    type="text"
                    value={content.heroRatingText || ''}
                    onChange={e => setContent(prev => ({ ...prev, heroRatingText: e.target.value }))}
                    placeholder="4.9 / 5.0"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-bold"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-3">
                  <label className="font-bold text-slate-700">URL Gambar Hero Utama</label>
                  <input
                    type="text"
                    value={content.heroImageUrl || ''}
                    onChange={e => setContent(prev => ({ ...prev, heroImageUrl: e.target.value }))}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-[11px] font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FITUR UTAMA */}
          {activeTab === 'features' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="border-b border-slate-200 pb-2">
                <h4 className="font-extrabold text-sm text-slate-900">4 Badge Keunggulan di Hero</h4>
                <p className="text-slate-500 text-[11px]">
                  Empat kotak fitur penting yang tampil langsung di bawah teks hero banner.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(content.features || initialLandingPageContent.features || []).map((feat, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-slate-700">Kotak Fitur #{idx + 1}</span>
                      <span className="text-[10px] text-slate-400 font-mono">Item {idx + 1}</span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-600">Judul Fitur</label>
                      <input
                        type="text"
                        value={feat.title}
                        onChange={e => updateFeature(idx, 'title', e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-bold text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-600">Subteks / Keterangan</label>
                      <input
                        type="text"
                        value={feat.subtitle}
                        onChange={e => updateFeature(idx, 'subtitle', e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: LOKASI & AKSES */}
          {activeTab === 'location' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="border-b border-slate-200 pb-2">
                <h4 className="font-extrabold text-sm text-slate-900">Alamat & Titik Akses Strategis</h4>
                <p className="text-slate-500 text-[11px]">
                  Informasi alamat Google Maps dan 4 titik transportasi/kuliner terdekat.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Alamat Lengkap Kos</label>
                  <input
                    type="text"
                    value={generalAddress}
                    onChange={e => setGeneralAddress(e.target.value)}
                    placeholder="Jl. Melati Indah No. 8, Kebayoran Baru"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Kota & Kode Pos</label>
                  <input
                    type="text"
                    value={generalCity}
                    onChange={e => setGeneralCity(e.target.value)}
                    placeholder="Jakarta Selatan 12140"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>
              </div>

              <div className="pt-2">
                <h5 className="font-extrabold text-xs text-slate-900 mb-2">4 Titik Jarak Tempuh Transportasi:</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(content.nearbyPlaces || initialLandingPageContent.nearbyPlaces || []).map((place, idx) => (
                    <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700">Titik #{idx + 1}</span>
                      </div>
                      <input
                        type="text"
                        value={place.title}
                        onChange={e => updateNearbyPlace(idx, 'title', e.target.value)}
                        placeholder="Nama tempat / stasiun"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-bold text-xs"
                      />
                      <input
                        type="text"
                        value={place.time}
                        onChange={e => updateNearbyPlace(idx, 'time', e.target.value)}
                        placeholder="Waktu tempuh (e.g. 5 Menit Jalan Kaki)"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-emerald-700 font-bold text-xs"
                      />
                      <input
                        type="text"
                        value={place.desc}
                        onChange={e => updateNearbyPlace(idx, 'desc', e.target.value)}
                        placeholder="Keterangan rute"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-600 text-[11px]"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: TESTIMONI */}
          {activeTab === 'testimonials' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="border-b border-slate-200 pb-2 flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">Ulasan & Testimoni Penghuni</h4>
                  <p className="text-slate-500 text-[11px]">
                    Tambahkan atau sesuaikan pengalaman nyata dari penghuni kos untuk meningkatkan kepercayaan calon penyewa.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddTestimonial}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Ulasan</span>
                </button>
              </div>

              <div className="space-y-4">
                {(content.testimonials || initialLandingPageContent.testimonials || []).map((t, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 relative group">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5">
                        <Heart className="w-3.5 h-3.5 text-rose-500" />
                        <span>Ulasan #{idx + 1}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTestimonial(idx)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Hapus Ulasan Ini"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-600">Nama Penghuni</label>
                        <input
                          type="text"
                          value={t.name}
                          onChange={e => updateTestimonial(idx, 'name', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-bold text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-600">Profesi / Pekerjaan</label>
                        <input
                          type="text"
                          value={t.role}
                          onChange={e => updateTestimonial(idx, 'role', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-600">Kamar Dihuni</label>
                        <input
                          type="text"
                          value={t.room}
                          onChange={e => updateTestimonial(idx, 'room', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-emerald-800"
                        />
                      </div>

                      <div className="space-y-1 sm:col-span-3">
                        <label className="text-[11px] font-bold text-slate-600">Isi Kutipan Ulasan</label>
                        <textarea
                          rows={2}
                          value={t.comment}
                          onChange={e => updateTestimonial(idx, 'comment', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs italic"
                        />
                      </div>

                      <div className="space-y-1 sm:col-span-2">
                        <label className="text-[11px] font-bold text-slate-600">URL Foto Profil / Avatar</label>
                        <input
                          type="text"
                          value={t.avatar}
                          onChange={e => updateTestimonial(idx, 'avatar', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-[11px] font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-600">Rating Bintang (1-5)</label>
                        <select
                          value={t.rating}
                          onChange={e => updateTestimonial(idx, 'rating', Number(e.target.value))}
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-bold text-xs"
                        >
                          <option value={5}>⭐⭐⭐⭐⭐ (5 Bintang)</option>
                          <option value={4}>⭐⭐⭐⭐ (4 Bintang)</option>
                          <option value={3}>⭐⭐⭐ (3 Bintang)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: FAQ */}
          {activeTab === 'faq' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="border-b border-slate-200 pb-2 flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">FAQ (Pertanyaan Populer)</h4>
                  <p className="text-slate-500 text-[11px]">
                    Pertanyaan yang sering diajukan calon penyewa seputar survey, pembayaran sewa, dan aturan.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddFaq}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah FAQ</span>
                </button>
              </div>

              <div className="space-y-3">
                {(content.faqs || initialLandingPageContent.faqs || []).map((faq, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-slate-800">FAQ #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFaq(idx)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Hapus FAQ Ini"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600">Pertanyaan (Question)</label>
                      <input
                        type="text"
                        value={faq.q}
                        onChange={e => updateFaq(idx, 'q', e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-bold text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600">Jawaban (Answer)</label>
                      <textarea
                        rows={2}
                        value={faq.a}
                        onChange={e => updateFaq(idx, 'a', e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs leading-relaxed"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: KONTAK & WHATSAPP */}
          {activeTab === 'whatsapp' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="border-b border-slate-200 pb-2">
                <h4 className="font-extrabold text-sm text-slate-900">Kontak WhatsApp & Pemilik</h4>
                <p className="text-slate-500 text-[11px]">
                  Nomor kontak WhatsApp yang dihubungi oleh pengunjung dari tombol chat, floating WhatsApp, dan pemesanan.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Nomor WhatsApp Pengelola (Format 62...)</label>
                  <input
                    type="text"
                    value={ownerPhone}
                    onChange={e => setOwnerPhone(e.target.value)}
                    placeholder="6281234567890"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-mono font-bold text-xs"
                  />
                  <span className="text-[10px] text-slate-400 block">
                    Gunakan awalan 62 atau 08... Otomatis terhubung dengan tombol WA.
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Email Pengelola</label>
                  <input
                    type="email"
                    value={ownerEmail}
                    onChange={e => setOwnerEmail(e.target.value)}
                    placeholder="griya.harmoni8@gmail.com"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-xs"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="font-bold text-slate-700">Template Pesan WhatsApp Otomatis</label>
                  <textarea
                    rows={3}
                    value={content.customWhatsappMessage || ''}
                    onChange={e => setContent(prev => ({ ...prev, customWhatsappMessage: e.target.value }))}
                    placeholder="Halo Pengelola Kost, saya tertarik untuk menanyakan info ketersediaan kamar..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-xs leading-relaxed"
                  />
                  <span className="text-[10px] text-slate-400 block">
                    Teks ini akan otomatis terisi saat calon penyewa mengklik tombol WhatsApp di halaman landing page.
                  </span>
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Footer Actions */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="text-xs font-semibold text-slate-500 hover:text-rose-600 transition flex items-center gap-1.5 cursor-pointer py-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset ke Template Default</span>
          </button>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {isSavedToast && (
              <span className="text-emerald-700 font-bold text-xs flex items-center gap-1 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Tersimpan ke Cloud!</span>
              </span>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition cursor-pointer"
            >
              Batal
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

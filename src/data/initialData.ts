import {
  Room,
  Invoice,
  Expense,
  MaintenanceTicket,
  KostSettings,
  RentalBooking,
  Tenant,
  AppUser,
  EnterpriseBranch,
  AuditLog,
  LandingPageContent,
} from '../types';

export const initialLandingPageContent: LandingPageContent = {
  brandName: 'loktuan',
  brandTagline: 'Hunian Nyaman, Tenang & Strategis',
  heroBadge: 'Bebas Biaya Survey',
  heroHeadline: 'Hunian Kos Modern,',
  heroHighlightText: 'Tenang & Strategis',
  heroHeadlineEnd: 'di Jantung Kota',
  heroDescription:
    'Nikmati kenyamanan eksklusif kos 8 pintu dengan fasilitas lengkap: AC Daikin, Springbed Queen, Kamar Mandi Dalam & Water Heater, WiFi 100 Mbps, serta kemudahan bayar sewa via QRIS instan.',
  heroStartingPrice: '1.200.000',
  heroRatingText: '4.9 / 5.0',
  heroImageUrl:
    'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=900&auto=format&fit=crop&q=80',
  marqueeItems: [
    'WiFi 100 Mbps Dedicated',
    'Listrik Token Mandiri 2.200W',
    'Water Heater Air Hangat 24 Jam',
    'CCTV 24 Jam & Smart Key',
    'Dapur Bersama & Kulkas Lengkap',
    'Area Parkir Motor Luas & Tertutup',
    'Pembayaran QRIS Dinamis Instan',
    '5 Menit ke Stasiun MRT & Halte Busway',
  ],
  features: [
    { title: 'WiFi 100M', subtitle: 'Dedicated' },
    { title: 'Listrik Token', subtitle: 'Mandiri 2200W' },
    { title: 'Water Heater', subtitle: 'Air Hangat 24 Jam' },
    { title: 'CCTV 24 Jam', subtitle: 'Aman & Terpantau' },
  ],
  nearbyPlaces: [
    { title: 'Stasiun MRT Terdekat', time: '5 Menit (Jalan Kaki)', desc: 'Akses langsung ke koridor MRT Blok M & Senayan' },
    { title: 'Halte TransJakarta', time: '3 Menit (200 Meter)', desc: 'Rute utama koridor busway cepat' },
    { title: 'SCBD & Sudirman', time: '10 Menit Berkendara', desc: 'Pusat perkantoran dan bisnis Jakarta' },
    { title: 'Kuliner & Minimarket', time: '1 Menit (Depan Gang)', desc: 'Indomaret, Alfamart, & warung makan 24 jam' },
  ],
  testimonials: [
    {
      name: 'Dimas Prasetyo',
      role: 'Software Engineer di SCBD',
      room: 'Penghuni Kamar 02 (Deluxe AC)',
      rating: 5,
      comment: 'Suasananya sangat tenang untuk WFH. WiFi super kencang dan fasilitasnya persis seperti di foto. Lokasi ke kantor cuma 10 menit naik MRT.',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    },
    {
      name: 'Nabila Putri',
      role: 'Karyawan Swasta',
      room: 'Penghuni Kamar 05 (Superior AC)',
      rating: 5,
      comment: 'Keamanan sangat terjamin dengan smart key dan CCTV. Pengelola sangat responsif jika ada kendala dan pembayaran pakai QRIS sangat praktis!',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    },
    {
      name: 'Rian Hidayat',
      role: 'Konsultan Keuangan',
      room: 'Penghuni Kamar 01 (Deluxe AC)',
      rating: 5,
      comment: 'Kamar mandinya bersih dengan water heater mantap. Dapur bersamanya lengkap dan lingkungan kos bebas dari kebisingan jalan raya.',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    },
  ],
  faqs: [
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
      q: 'Apakah biaya sewa sudah termasuk tagihan listrik?',
      a: 'Setiap kamar dilengkapi meteran listrik token mandiri sehingga Anda dapat mengontrol pemakaian listrik harian secara fleksibel sesuai kebutuhan.',
    },
    {
      q: 'Bagaimana fasilitas parkir kendaraan?',
      a: 'Tersedia area parkir motor luas, tertutup, dan terlindung dari hujan di area dalam gerbang kos yang dipantau CCTV 24 jam.',
    },
  ],
  customWhatsappMessage: 'Halo Pengelola Kost, saya tertarik untuk menanyakan info ketersediaan kamar dan jadwal survey kos. Terima kasih!',
};

export const initialKostSettings: KostSettings = {
  kostName: 'Kost Griya Harmoni 8',
  tagline: 'Hunian Nyaman, Tenang & Strategis 8 Pintu',
  address: 'Jl. Melati Indah No. 8, Kebayoran Baru',
  city: 'Jakarta Selatan 12140',
  ownerName: 'Pengelola Kost Harmoni',
  ownerPhone: '6281234567890',
  ownerEmail: 'griya.harmoni8@gmail.com',
  qrisNmid: 'ID1020088998877',
  qrisMerchantName: 'GRIYA HARMONI 8 KOST',
  bankAccounts: [
    { bank: 'BCA', accountNumber: '8820491823', accountHolder: 'PENGELOLA KOST' },
    { bank: 'Bank Mandiri', accountNumber: '1370019283741', accountHolder: 'PENGELOLA KOST' },
    { bank: 'BRI', accountNumber: '012901009823504', accountHolder: 'PENGELOLA KOST' },
    { bank: 'GoPay / DANA / OVO', accountNumber: '081234567890', accountHolder: 'Griya Harmoni Kost' },
  ],
  wifiSsid: 'GriyaHarmoni_5G',
  wifiPass: 'harmoni8aman',
  rules: [
    'Jam berkunjung tamu maksimal pukul 22.00 WIB di area ruang tamu bersama.',
    'Dilarang merokok di dalam kamar ber-AC.',
    'Menjaga ketenangan bersama di atas pukul 23.00 WIB.',
    'Pembayaran sewa kamar jatuh tempo setiap tanggal 05 setiap bulannya.',
    'Kunci gerbang dan akses pintu depan wajib dikunci kembali setelah keluar/masuk.',
    'Sampah harian harap dibuang di tempat sampah sentral di lorong bawah.',
  ],
  paymentDueDay: 5,
  lateFeePerDay: 15000,
  landingPageContent: initialLandingPageContent,
};

export const initialRooms: Room[] = [
  {
    id: 1,
    branchId: 'branch-01',
    roomNumber: 'Kamar 01',
    floor: 1,
    type: 'Deluxe AC',
    size: '3.5 x 4 m',
    basePrice: 1750000,
    status: 'kosong',
    electricityType: 'token_mandiri',
    facilities: ['AC 1/2 PK', 'Kamar Mandi Dalam', 'Water Heater', 'Kasur Springbed Queen', 'Lemari 2 Pintu', 'Meja Kerja & Kursi', 'Smart TV 32 inch', 'WiFi 100Mbps'],
    description: 'Kamar lantai 1 pojok depan dengan sirkulasi udara segar dan jendela menghadap taman mini. Siap huni.',
  },
  {
    id: 2,
    branchId: 'branch-01',
    roomNumber: 'Kamar 02',
    floor: 1,
    type: 'Deluxe AC',
    size: '3.5 x 4 m',
    basePrice: 1750000,
    status: 'kosong',
    electricityType: 'token_mandiri',
    facilities: ['AC 1/2 PK', 'Kamar Mandi Dalam', 'Water Heater', 'Kasur Springbed Queen', 'Lemari 2 Pintu', 'Meja Kerja & Kursi', 'WiFi 100Mbps'],
    description: 'Kamar lantai 1 dengan pencahayaan alami optimal dan ventilasi luas. Siap huni.',
  },
  {
    id: 3,
    branchId: 'branch-01',
    roomNumber: 'Kamar 03',
    floor: 1,
    type: 'Superior AC',
    size: '3 x 4 m',
    basePrice: 1550000,
    status: 'kosong',
    electricityType: 'token_mandiri',
    facilities: ['AC 1/2 PK', 'Kamar Mandi Dalam', 'Kasur Single Comfort', 'Lemari Pakaian', 'Meja Belajar', 'WiFi 100Mbps'],
    description: 'Kamar tenang di area tengah lantai 1, dekat dengan dapur bersama. Siap huni.',
  },
  {
    id: 4,
    branchId: 'branch-01',
    roomNumber: 'Kamar 04',
    floor: 1,
    type: 'Superior AC',
    size: '3 x 4 m',
    basePrice: 1550000,
    status: 'kosong',
    electricityType: 'token_mandiri',
    facilities: ['AC 1/2 PK', 'Kamar Mandi Dalam', 'Kasur Single Comfort', 'Lemari Pakaian', 'Meja Belajar', 'WiFi 100Mbps'],
    description: 'Kamar lantai 1 dengan akses dekat ke area parkir motor dan dispenser air. Siap huni.',
  },
  {
    id: 5,
    branchId: 'branch-01',
    roomNumber: 'Kamar 05',
    floor: 2,
    type: 'Deluxe AC',
    size: '3.5 x 4 m',
    basePrice: 1750000,
    status: 'kosong',
    electricityType: 'token_mandiri',
    facilities: ['AC 1/2 PK', 'Kamar Mandi Dalam', 'Water Heater', 'Balkon Pribadi', 'Kasur Springbed Queen', 'Lemari 2 Pintu', 'Meja Kerja & Kursi', 'WiFi 100Mbps'],
    description: 'Kamar lantai 2 favorit dengan balkon pribadi, pemandangan terbuka, baru dicat dan siap huni langsung.',
  },
  {
    id: 6,
    branchId: 'branch-01',
    roomNumber: 'Kamar 06',
    floor: 2,
    type: 'Superior AC',
    size: '3 x 4 m',
    basePrice: 1550000,
    status: 'kosong',
    electricityType: 'token_mandiri',
    facilities: ['AC 1/2 PK', 'Kamar Mandi Dalam', 'Kasur Single Comfort', 'Lemari Pakaian', 'Meja Belajar', 'WiFi 100Mbps'],
    description: 'Kamar lantai 2 dengan pencahayaan sinar matahari pagi yang menyehatkan. Siap huni.',
  },
  {
    id: 7,
    branchId: 'branch-01',
    roomNumber: 'Kamar 07',
    floor: 2,
    type: 'Superior AC',
    size: '3 x 4 m',
    basePrice: 1550000,
    status: 'kosong',
    electricityType: 'token_mandiri',
    facilities: ['AC 1/2 PK', 'Kamar Mandi Dalam', 'Kasur Single Comfort', 'Lemari Pakaian', 'Meja Belajar', 'WiFi 100Mbps'],
    description: 'Kamar lantai 2 samping area jemuran pakaian tertutup. Siap huni.',
  },
  {
    id: 8,
    branchId: 'branch-01',
    roomNumber: 'Kamar 08',
    floor: 2,
    type: 'Standard Fan',
    size: '3 x 3.5 m',
    basePrice: 1200000,
    status: 'kosong',
    electricityType: 'termasuk_sewa',
    facilities: ['Exhaust Fan & Kipas Dinding', 'Kamar Mandi Luar Khusus', 'Kasur Single Foam Super', 'Lemari Pakaian', 'Meja Belajar', 'Listrik Sudah Termasuk', 'WiFi 100Mbps'],
    description: 'Kamar hemat lantai 2 dengan sirkulasi angin sejuk alami dan biaya listrik gratis/inklusif. Siap huni.',
  },
];

export const generateRoomsForBranch = (branch: EnterpriseBranch): Room[] => {
  const count = branch.totalRooms && branch.totalRooms > 0 ? branch.totalRooms : 8;
  return Array.from({ length: count }, (_, idx) => {
    const roomNum = idx + 1;
    const roomNumberStr = `Kamar ${roomNum < 10 ? '0' + roomNum : roomNum}`;
    const floor = roomNum <= Math.ceil(count / 2) ? 1 : 2;
    const type = roomNum % 3 === 1 ? 'Deluxe AC' : roomNum % 3 === 2 ? 'Superior AC' : 'Standard Fan';
    const basePrice = type === 'Deluxe AC' ? 1750000 : type === 'Superior AC' ? 1550000 : 1250000;

    let roomId = roomNum;
    if (branch.id !== 'branch-01') {
      const branchHash = Math.abs(branch.id.split('').reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0)) % 900 + 100;
      roomId = branchHash * 100 + roomNum;
    }

    return {
      id: roomId,
      branchId: branch.id,
      roomNumber: roomNumberStr,
      floor,
      type,
      size: type === 'Deluxe AC' ? '3.5 x 4 m' : type === 'Superior AC' ? '3 x 4 m' : '3 x 3.5 m',
      basePrice,
      status: 'kosong',
      electricityType: type === 'Standard Fan' ? 'termasuk_sewa' : 'token_mandiri',
      facilities: type === 'Deluxe AC'
        ? ['AC 1/2 PK', 'Kamar Mandi Dalam', 'Water Heater', 'Kasur Springbed Queen', 'Lemari 2 Pintu', 'Meja Kerja & Kursi', 'WiFi 100Mbps']
        : type === 'Superior AC'
        ? ['AC 1/2 PK', 'Kamar Mandi Dalam', 'Kasur Single Comfort', 'Lemari Pakaian', 'Meja Belajar', 'WiFi 100Mbps']
        : ['Exhaust Fan & Kipas Dinding', 'Kamar Mandi Luar Khusus', 'Kasur Single Foam Super', 'Lemari Pakaian', 'Meja Belajar', 'WiFi 100Mbps'],
      description: `Kamar lantai ${floor} unit ${roomNumberStr} di ${branch.name}. Siap huni dan bersih.`,
    };
  });
};

// Clean initial collections with zero dummy data
export const initialTenants: Tenant[] = [];
export const initialInvoices: Invoice[] = [];
export const initialExpenses: Expense[] = [];
export const initialTickets: MaintenanceTicket[] = [];
export const initialBookings: RentalBooking[] = [];

export const initialUsers: AppUser[] = [
  {
    id: 'usr-admin-01',
    email: 'admin@kosthub.com',
    name: 'Super Admin Enterprise',
    phone: '081122334455',
    role: 'superadmin',
    status: 'active',
    password: 'admin',
    createdAt: '2026-01-01',
    approvedAt: '2026-01-01',
    approvedBy: 'System',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    notes: 'Akun Super Admin Utama Enterprise untuk kelola seluruh akun dan cabang kos.',
  },
  {
    id: 'usr-owner-01',
    email: 'owner@kosthub.com',
    name: 'Pengelola Kost Harmoni (Owner)',
    phone: '6281234567890',
    role: 'pemilik',
    status: 'active',
    password: 'owner',
    createdAt: '2026-01-10',
    approvedAt: '2026-01-10',
    approvedBy: 'Super Admin Enterprise',
    kostBranch: 'Kost Griya Harmoni 8',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    notes: 'Pengelola utama Kost Griya Harmoni 8.',
  },
];

export const initialBranches: EnterpriseBranch[] = [
  {
    id: 'branch-01',
    name: 'Kost Griya Harmoni 8',
    code: 'GH8-KBY',
    address: 'Jl. Melati Indah No. 8, Kebayoran Baru',
    city: 'Jakarta Selatan',
    totalRooms: 8,
    occupiedRooms: 0,
    managerName: 'Pengelola Kost Harmoni',
    managerPhone: '6281234567890',
    monthlyRevenue: 0,
    status: 'active',
  },
];

export const initialAuditLogs: AuditLog[] = [
  {
    id: 'log-101',
    timestamp: '2026-08-23 16:45:10',
    actorName: 'Super Admin Enterprise',
    actorEmail: 'admin@kosthub.com',
    actorRole: 'superadmin',
    action: 'login',
    title: 'Autentikasi Sesi Super Admin Berhasil',
    description: 'Super Admin melakukan login ke Enterprise Portal dengan hak akses penuh tingkat sistem.',
    ipAddress: '180.252.164.21',
    device: 'Chrome 128 (Windows 11)',
    status: 'success',
  },
  {
    id: 'log-102',
    timestamp: '2026-08-23 15:30:22',
    actorName: 'Super Admin Enterprise',
    actorEmail: 'admin@kosthub.com',
    actorRole: 'superadmin',
    action: 'approve_user',
    title: 'Persetujuan Pendaftaran Akun Penghuni',
    description: 'Menyetujui pendaftaran Sarah Wijaya dan menetapkan kamar K01 (Deluxe Suite).',
    targetUser: 'Sarah Wijaya (sarah.w@gmail.com)',
    ipAddress: '180.252.164.21',
    device: 'Chrome 128 (Windows 11)',
    status: 'success',
  },
  {
    id: 'log-103',
    timestamp: '2026-08-23 14:12:05',
    actorName: 'Pengelola Kost Harmoni (Owner)',
    actorEmail: 'owner@kosthub.com',
    actorRole: 'pemilik',
    action: 'system_sync',
    title: 'Verifikasi Pembayaran QRIS Dinamis',
    description: 'Memverifikasi bukti transfer dan pelunasan invoice INV/202608/K01 sebesar Rp 1.525.000.',
    targetUser: 'Sarah Wijaya (Kamar 01)',
    ipAddress: '114.122.38.109',
    device: 'Safari Mobile (iOS 18)',
    status: 'success',
  },
  {
    id: 'log-104',
    timestamp: '2026-08-23 11:05:40',
    actorName: 'Sistem Keamanan Firewall',
    actorEmail: 'system-security@kosthub.com',
    actorRole: 'superadmin',
    action: 'security_alert',
    title: 'Deteksi Percobaan Login Berulang',
    description: 'Terdeteksi 3x kegagalan kata sandi dari IP asing. Sesi diamankan dengan rate limiting.',
    targetUser: 'unknown@external.net',
    ipAddress: '103.147.185.12',
    device: 'Python-requests / Bot',
    status: 'warning',
  },
  {
    id: 'log-105',
    timestamp: '2026-08-22 09:20:15',
    actorName: 'Super Admin Enterprise',
    actorEmail: 'admin@kosthub.com',
    actorRole: 'superadmin',
    action: 'update_role',
    title: 'Pembaruan Hak Akses Pengguna',
    description: 'Mengubah hak akses akun Hendra Kusuma menjadi Penghuni Kamar 02.',
    targetUser: 'Hendra Kusuma (hendra.k@gmail.com)',
    ipAddress: '180.252.164.21',
    device: 'Chrome 128 (Windows 11)',
    status: 'success',
  },
];

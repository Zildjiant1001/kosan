export type UserRole = 'superadmin' | 'pemilik' | 'penghuni';

export type AccountStatus = 'active' | 'pending_approval' | 'suspended' | 'rejected';

export interface AppUser {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  status: AccountStatus;
  assignedRoomId?: number;
  kostBranch?: string;
  password?: string;
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
  avatarUrl?: string;
  notes?: string;
  rejectionReason?: string;
  lastLoginAt?: string;
}

export type AuditActionType =
  | 'login'
  | 'logout'
  | 'approve_user'
  | 'reject_user'
  | 'update_role'
  | 'update_status'
  | 'create_user'
  | 'delete_user'
  | 'create_branch'
  | 'delete_branch'
  | 'system_sync'
  | 'security_alert';

export interface AuditLog {
  id: string;
  timestamp: string;
  actorName: string;
  actorEmail: string;
  actorRole: UserRole;
  action: AuditActionType;
  title: string;
  description: string;
  targetUser?: string;
  ipAddress?: string;
  device?: string;
  status: 'success' | 'warning' | 'danger';
}

export interface EnterpriseBranch {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  totalRooms: number;
  occupiedRooms: number;
  managerName: string;
  managerPhone: string;
  monthlyRevenue: number;
  status: 'active' | 'maintenance';
}

export type RoomStatus = 'terisi' | 'kosong' | 'perbaikan' | 'menunggu_pembayaran';

export interface Tenant {
  id: string;
  roomId: number;
  branchId?: string;
  name: string;
  phone: string;
  email?: string;
  identityNumber: string; // NIK / KTP
  occupation: string; // Mahasiswa, Karyawan Swasta, PNS, Freelancer
  checkInDate: string;
  checkOutDate?: string;
  contractDurationMonths: number;
  status?: 'active' | 'checked_out';
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  notes?: string;
  avatarUrl?: string;
}

export interface Room {
  id: number; // 1 to 8
  branchId?: string;
  roomNumber: string; // "Kamar 01" to "Kamar 08"
  floor: number; // 1 or 2
  type: 'Deluxe AC' | 'Superior AC' | 'Standard Fan';
  size: string; // "3 x 4 m"
  basePrice: number; // e.g. 1500000
  status: RoomStatus;
  facilities: string[];
  tenant?: Tenant;
  electricityType: 'token_mandiri' | 'termasuk_sewa';
  description: string;
}

export type PaymentStatus = 'lunas' | 'belum_bayar' | 'menunggu_verifikasi' | 'ditolak' | 'verifikasi_ditolak';
export type PaymentMethod = 'qris' | 'transfer_bank' | 'tunai';

export interface AdditionalFee {
  id: string;
  name: string;
  amount: number;
}

export interface Invoice {
  id: string;
  branchId?: string;
  invoiceNumber: string; // INV-202608-K01
  roomId: number;
  roomNumber: string;
  tenantName: string;
  tenantPhone?: string;
  month: string; // "2026-08"
  baseAmount: number;
  additionalFees: AdditionalFee[];
  totalAmount: number;
  dueDate: string; // YYYY-MM-DD
  paidDate?: string;
  status: PaymentStatus;
  paymentMethod?: PaymentMethod;
  proofImageUrl?: string;
  qrisRef?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  rejectionReason?: string;
  notes?: string;
}

export type ExpenseCategory = 
  | 'listrik'
  | 'air_pdam'
  | 'wifi_internet'
  | 'kebersihan_sampah'
  | 'maintenance_ac'
  | 'perbaikan_fasilitas'
  | 'gaji_pengelola'
  | 'lain_lain';

export interface Expense {
  id: string;
  branchId?: string;
  date: string; // YYYY-MM-DD
  month: string; // YYYY-MM
  category: ExpenseCategory;
  title: string;
  amount: number;
  notes?: string;
  paidTo?: string;
  recordedBy?: string;
  proofImageUrl?: string;
}

export type TicketCategory = 'ac' | 'plumbing' | 'kelistrikan' | 'kebersihan' | 'kunci_pintu' | 'fasilitas_kamar' | 'lainnya';
export type TicketPriority = 'rendah' | 'sedang' | 'tinggi' | 'darurat';
export type TicketStatus = 'menunggu' | 'diproses' | 'selesai';

export interface MaintenanceTicket {
  id: string;
  branchId?: string;
  ticketNumber: string;
  roomId: number;
  roomNumber: string;
  tenantName: string;
  tenantPhone?: string;
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  cost?: number;
  actionNotes?: string;
  technicianName?: string;
  technicianPhone?: string;
  scheduledDate?: string;
  completionDate?: string;
  autoRecordExpense?: boolean;
}

export type BookingStatus = 'pending' | 'survey_dijadwalkan' | 'disetujui' | 'ditolak' | 'selesai_checkin';

export interface RentalBooking {
  id: string;
  branchId?: string;
  roomId: number;
  roomNumber: string;
  roomType: string;
  name: string;
  phone: string;
  email?: string;
  occupation: string;
  targetMoveDate?: string;
  durationMonths: number;
  notes?: string;
  status: BookingStatus;
  createdAt: string;
}

export interface BankAccount {
  bank: string;
  accountNumber: string;
  accountHolder: string;
}

export interface LandingPageFeature {
  title: string;
  subtitle: string;
}

export interface LandingNearbyPlace {
  title: string;
  time: string;
  desc: string;
}

export interface LandingFaq {
  q: string;
  a: string;
}

export interface LandingTestimonial {
  name: string;
  role: string;
  room: string;
  rating: number;
  comment: string;
  avatar: string;
}

export interface LandingPageContent {
  brandName?: string;
  brandTagline?: string;
  heroBadge?: string;
  heroHeadline?: string;
  heroHighlightText?: string;
  heroHeadlineEnd?: string;
  heroDescription?: string;
  heroStartingPrice?: string;
  heroRatingText?: string;
  heroImageUrl?: string;
  marqueeItems?: string[];
  features?: LandingPageFeature[];
  nearbyPlaces?: LandingNearbyPlace[];
  testimonials?: LandingTestimonial[];
  faqs?: LandingFaq[];
  customWhatsappMessage?: string;
}

export interface KostSettings {
  kostName: string;
  tagline: string;
  address: string;
  city: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  qrisNmid: string;
  qrisMerchantName: string;
  bankAccounts: BankAccount[];
  wifiSsid: string;
  wifiPass: string;
  rules: string[];
  paymentDueDay: number; // e.g. 5 (date 5 every month)
  lateFeePerDay: number;
  landingPageContent?: LandingPageContent;
}

'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  UserRole,
  Room,
  Invoice,
  Expense,
  MaintenanceTicket,
  KostSettings,
  Tenant,
  RentalBooking,
  BookingStatus,
  TicketStatus,
  ExpenseCategory,
  AppUser,
  EnterpriseBranch,
  AccountStatus,
  AuditLog,
} from '../types';
import {
  initialKostSettings,
  initialRooms,
  initialInvoices,
  initialExpenses,
  initialTickets,
  initialBookings,
  initialTenants,
  initialUsers,
  initialBranches,
  initialAuditLogs,
  generateRoomsForBranch,
} from '../data/initialData';
import {
  db,
  auth,
  signInWithGoogle,
  signOutUser,
  onAuthStateChanged,
  User,
  handleFirestoreError,
  OperationType,
  testFirestoreConnection,
  firebaseConfig,
} from '../lib/firebase';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';

/**
 * Strips undefined properties recursively so Firestore never throws
 * "Unsupported field value: undefined".
 */
function cleanForFirestore<T>(data: T): any {
  if (data === null || data === undefined) {
    return null;
  }
  if (Array.isArray(data)) {
    return data.map(item => cleanForFirestore(item)).filter(item => item !== undefined);
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        result[key] = cleanForFirestore(value);
      }
    }
    return result;
  }
  return data;
}

export interface BranchPerformanceSummary {
  branchId: string;
  branchName: string;
  branchCode: string;
  city: string;
  managerName: string;
  totalRooms: number;
  occupiedRooms: number;
  occupancyRate: number;
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  unpaidAmount: number;
}

export interface MonthlySummary {
  month: string;
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  occupancyCount: number;
  totalRooms: number;
  occupancyRate: number;
  paidInvoicesCount: number;
  unpaidInvoicesCount: number;
  unpaidOccupiedRoomsCount: number;
  pendingInvoicesCount: number;
  totalUnpaidAmount: number;
  expensesByCategory: Record<ExpenseCategory, number>;
  roomRevenues: {
    roomId: number;
    roomNumber: string;
    branchId?: string;
    branchName?: string;
    tenantName: string;
    amount: number;
    status: string;
    method?: string;
  }[];
  branchBreakdowns?: BranchPerformanceSummary[];
}

interface KostContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  selectedTenantRoomId: number;
  setSelectedTenantRoomId: (roomId: number) => void;
  rooms: Room[];
  allRooms: Room[];
  tenants: Tenant[];
  bookings: RentalBooking[];
  allBookings: RentalBooking[];
  invoices: Invoice[];
  allInvoices: Invoice[];
  expenses: Expense[];
  allExpenses: Expense[];
  tickets: MaintenanceTicket[];
  allTickets: MaintenanceTicket[];
  settings: KostSettings;
  activeReportMonth: string;
  setActiveReportMonth: (month: string) => void;
  isCloudConnected: boolean;
  firebaseProjectId: string;
  activeBranch?: EnterpriseBranch;
  
  // Google Auth
  currentUser: User | null;
  isAuthLoading: boolean;
  authError: string | null;
  signInWithGoogleAuth: (targetRole?: UserRole) => Promise<User | null>;
  signOutGoogleAuth: () => Promise<void>;
  clearAuthError: () => void;
  
  // Enterprise User Accounts Management & Audit Logs
  users: AppUser[];
  branches: EnterpriseBranch[];
  selectedBranchId: string;
  setSelectedBranchId: (branchId: string) => void;
  auditLogs: AuditLog[];
  activeAppUser: AppUser | null;
  setActiveAppUser: (user: AppUser | null) => void;
  addAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => Promise<void>;
  clearAuditLogs: () => Promise<void>;
  signUpUser: (data: {
    name: string;
    email: string;
    phone: string;
    role: UserRole;
    password?: string;
    assignedRoomId?: number;
    kostBranch?: string;
    notes?: string;
  }) => Promise<{ success: boolean; message: string; user?: AppUser }>;
  loginWithCredentials: (
    email: string,
    password?: string
  ) => Promise<{ success: boolean; message: string; user?: AppUser }>;
  logoutAppUser: () => void;
  approveUser: (
    userId: string,
    assignedRoomId?: number,
    assignedRole?: UserRole,
    branchIdOrName?: string
  ) => Promise<void>;
  rejectUser: (userId: string, reason?: string) => Promise<void>;
  updateUserStatus: (userId: string, status: AccountStatus) => Promise<void>;
  updateUserRole: (userId: string, role: UserRole) => Promise<void>;
  updateUser: (user: AppUser) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  
  // Multi-Property Enterprise Branches Management
  addBranch: (branchData: Omit<EnterpriseBranch, 'id'>) => Promise<void>;
  updateBranch: (branch: EnterpriseBranch) => Promise<void>;
  deleteBranch: (branchId: string) => Promise<void>;

  // Actions
  updateRoom: (room: Room) => Promise<void>;
  checkInTenant: (roomId: number, tenant: Tenant, autoGenerateInvoice?: boolean) => Promise<void>;
  checkOutTenant: (roomId: number) => Promise<void>;
  deleteTenant: (tenantId: string) => Promise<void>;
  addBooking: (booking: Omit<RentalBooking, 'id' | 'createdAt' | 'status'>) => Promise<string>;
  updateBookingStatus: (bookingId: string, status: BookingStatus) => Promise<void>;
  deleteBooking: (bookingId: string) => Promise<void>;
  addInvoice: (invoice: Omit<Invoice, 'id' | 'invoiceNumber'>) => Promise<void>;
  updateInvoice: (invoice: Invoice) => Promise<void>;
  deleteInvoice: (invoiceId: string) => Promise<void>;
  verifyPayment: (invoiceId: string, status: 'lunas' | 'ditolak', notes?: string) => Promise<void>;
  submitTenantPayment: (
    invoiceId: string,
    proofImageUrl: string,
    method: 'qris' | 'transfer_bank',
    qrisRef?: string
  ) => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  updateExpense: (expense: Expense) => Promise<void>;
  deleteExpense: (expenseId: string) => Promise<void>;
  createTicket: (ticket: Omit<MaintenanceTicket, 'id' | 'ticketNumber' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTicketStatus: (ticketId: string, status: TicketStatus, cost?: number, actionNotes?: string) => Promise<void>;
  processTicket: (
    ticketId: string,
    data: {
      status: TicketStatus;
      technicianName?: string;
      technicianPhone?: string;
      scheduledDate?: string;
      cost?: number;
      actionNotes?: string;
      completionDate?: string;
      autoRecordExpense?: boolean;
    }
  ) => Promise<void>;
  deleteTicket: (ticketId: string) => Promise<void>;
  updateSettings: (settings: KostSettings) => Promise<void>;
  resetToDefaultData: () => Promise<void>;
  clearAllDummyData: () => Promise<void>;
  
  // Computations
  getMonthlySummary: (month: string, branchFilter?: string) => MonthlySummary;
  availableMonths: string[];
}

const KostContext = createContext<KostContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'KOSTHUB_PROD_CLEAN_V1';

export const KostProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Auto-cleanup stale legacy localStorage dummy data from previous development builds
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const legacyKeys: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && !k.startsWith('KOSTHUB_PROD_CLEAN_V1')) {
            legacyKeys.push(k);
          }
        }
        legacyKeys.forEach(k => localStorage.removeItem(k));
      } catch (e) {
        console.warn('Storage cleanup notice:', e);
      }
    }
  }, []);

  const [role, setRole] = useState<UserRole>('pemilik');
  const [selectedTenantRoomId, setSelectedTenantRoomId] = useState<number>(1);
  const [activeReportMonth, setActiveReportMonth] = useState<string>(() => {
    const d = new Date();
    const mm = (d.getMonth() + 1).toString().padStart(2, '0');
    return `${d.getFullYear()}-${mm}`;
  });
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(false);
  const isInitialSyncDone = useRef(false);

  // Core Enterprise Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    if (typeof window === 'undefined') return initialAuditLogs;
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_AUDIT_LOGS`);
      if (!saved) return initialAuditLogs;
      const parsed: AuditLog[] = JSON.parse(saved);
      if (!Array.isArray(parsed)) return initialAuditLogs;
      // Deduplicate by ID and ensure every item has a unique key
      const seenIds = new Set<string>();
      return parsed.map((item, idx) => {
        let itemId = item.id || `log-${Date.now()}-${idx}`;
        if (seenIds.has(itemId)) {
          itemId = `${itemId}-${idx}-${Math.random().toString(36).substring(2, 6)}`;
        }
        seenIds.add(itemId);
        return { ...item, id: itemId };
      });
    } catch {
      return initialAuditLogs;
    }
  });

  const addAuditLog = async (logData: Omit<AuditLog, 'id' | 'timestamp'>) => {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const newLog: AuditLog = {
      ...logData,
      id: `log-${uniqueSuffix}`,
      timestamp: now,
      ipAddress: logData.ipAddress || (typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1'),
      device: logData.device || (typeof navigator !== 'undefined' ? `${navigator.userAgent.includes('Mobile') ? 'Mobile Browser' : 'Chrome 128 / Windows'}` : 'Web Client'),
    };
    setAuditLogs(prev => [newLog, ...prev]);
    try {
      await setDoc(doc(db, 'audit_logs', newLog.id), cleanForFirestore(newLog));
    } catch (e) {
      console.warn('Audit log write notice:', e);
    }
  };

  const clearAuditLogs = async () => {
    setAuditLogs([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`${LOCAL_STORAGE_KEY}_AUDIT_LOGS`);
    }
  };

  // Sync auditLogs with LocalStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_AUDIT_LOGS`, JSON.stringify(auditLogs));
    }
  }, [auditLogs]);

  // Google Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      user => {
        setCurrentUser(user);
        setIsAuthLoading(false);
      },
      err => {
        console.error('Auth state change error:', err);
        setIsAuthLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const signInWithGoogleAuth = async (targetRole: UserRole = 'penghuni') => {
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      const user = await signInWithGoogle();
      if (user && user.email) {
        setCurrentUser(user);
        const normalizedEmail = user.email.toLowerCase();
        let existingAppUser = users.find(u => u.email.toLowerCase() === normalizedEmail);

        if (!existingAppUser) {
          // Register new Google account as pending_approval
          const todayStr = new Date().toISOString().split('T')[0];
          const newAppUser: AppUser = {
            id: `usr-g-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            name: user.displayName || 'Pengguna Google',
            email: normalizedEmail,
            phone: user.phoneNumber || '081234567890',
            role: targetRole,
            status: 'pending_approval',
            createdAt: todayStr,
            avatarUrl: user.photoURL || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
            notes: `Masuk via Google Auth sebagai ${targetRole}. Menunggu persetujuan Admin Enterprise.`,
          };

          setUsers(prev => [newAppUser, ...prev]);
          try {
            await setDoc(doc(db, 'users', newAppUser.id), cleanForFirestore(newAppUser));
          } catch (e) {
            console.warn('Firestore Google sign-up notice:', e);
          }

          const msg = 'Akun Google Anda telah didaftarkan dan masuk ke antrian peninjauan Admin Enterprise. Silakan tunggu persetujuan Super Admin.';
          setAuthError(msg);
          throw new Error(msg);
        }

        if (existingAppUser.status === 'pending_approval') {
          const msg = 'Akun Anda masih dalam antrian peninjauan oleh Admin Enterprise. Anda baru dapat masuk setelah disetujui.';
          setAuthError(msg);
          throw new Error(msg);
        }

        if (existingAppUser.status === 'suspended') {
          const msg = 'Akun Anda telah dinonaktifkan sementara oleh Admin Enterprise.';
          setAuthError(msg);
          throw new Error(msg);
        }

        if (existingAppUser.status === 'rejected') {
          const msg = `Pendaftaran akun Anda ditolak oleh Admin. Alasan: ${existingAppUser.rejectionReason || 'Tidak memenuhi syarat.'}`;
          setAuthError(msg);
          throw new Error(msg);
        }

        // Active account
        setActiveAppUser(existingAppUser);
        setRole(existingAppUser.role);
        if (existingAppUser.assignedRoomId) {
          setSelectedTenantRoomId(existingAppUser.assignedRoomId);
        }

        // Record Audit Log for Google Login
        addAuditLog({
          actorName: existingAppUser.name,
          actorEmail: existingAppUser.email,
          actorRole: existingAppUser.role,
          action: 'login',
          title: `Login Akun (${existingAppUser.role === 'superadmin' ? 'Super Admin' : existingAppUser.role === 'pemilik' ? 'Pemilik' : 'Penghuni'}) Berhasil`,
          description: `${existingAppUser.name} berhasil login via Google OAuth sebagai ${existingAppUser.role}.`,
          status: 'success',
        });
      }
      return user;
    } catch (err: any) {
      if (!authError) {
        setAuthError(err.message || 'Gagal login dengan akun Google.');
      }
      throw err;
    } finally {
      setIsAuthLoading(false);
    }
  };

  const signOutGoogleAuth = async () => {
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      if (activeAppUser) {
        addAuditLog({
          actorName: activeAppUser.name,
          actorEmail: activeAppUser.email,
          actorRole: activeAppUser.role,
          action: 'logout',
          title: `Logout Sesi Pengguna`,
          description: `${activeAppUser.name} (${activeAppUser.email}) telah keluar dari sistem.`,
          status: 'success',
        });
      }
      await signOutUser();
    } catch (err: any) {
      console.warn('Sign out google error:', err);
    } finally {
      setCurrentUser(null);
      setActiveAppUser(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`${LOCAL_STORAGE_KEY}_ACTIVE_USER`);
      }
      setIsAuthLoading(false);
    }
  };

  const clearAuthError = () => {
    setAuthError(null);
  };

  // Core Data loaded from localStorage or initial clean state
  const [branches, setBranches] = useState<EnterpriseBranch[]>(() => {
    if (typeof window === 'undefined') return initialBranches;
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_BRANCHES`);
      return saved ? JSON.parse(saved) : initialBranches;
    } catch {
      return initialBranches;
    }
  });

  const [selectedBranchId, setSelectedBranchId] = useState<string>(() => {
    if (typeof window === 'undefined') return 'branch-01';
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_ACTIVE_BRANCH_ID`);
      return saved || 'branch-01';
    } catch {
      return 'branch-01';
    }
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_ACTIVE_BRANCH_ID`, selectedBranchId);
    }
  }, [selectedBranchId]);

  // Robust deduplication to prevent double room entries per branch and enforce branch room count
  const sanitizeAndDeduplicateRooms = (roomsList: Room[]): Room[] => {
    const seenKeys = new Map<string, Room>();
    
    // Sort so rooms with tenant / occupied status or custom edits take priority
    const sorted = [...roomsList].sort((a, b) => {
      const aOccupied = a.status === 'terisi' || !!a.tenant;
      const bOccupied = b.status === 'terisi' || !!b.tenant;
      if (aOccupied && !bOccupied) return -1;
      if (!aOccupied && bOccupied) return 1;
      return a.id - b.id;
    });

    sorted.forEach(room => {
      const branchKey = room.branchId || 'branch-01';
      // Normalize room number: e.g. "Kamar 01" -> "kamar_1", "Kamar 1" -> "kamar_1"
      const numMatch = room.roomNumber.match(/\d+/);
      const roomNumKey = numMatch ? `kamar_${parseInt(numMatch[0], 10)}` : room.roomNumber.trim().toLowerCase().replace(/\s+/g, '_');
      const uniqueKey = `${branchKey}_${roomNumKey}`;
      
      if (!seenKeys.has(uniqueKey)) {
        seenKeys.set(uniqueKey, room);
      } else {
        const existing = seenKeys.get(uniqueKey)!;
        // Keep the one with tenant, or the one with custom updated attributes
        if (!existing.tenant && room.tenant) {
          seenKeys.set(uniqueKey, { ...existing, ...room, id: existing.id });
        } else if (room.basePrice !== 1750000 && existing.basePrice === 1750000) {
          seenKeys.set(uniqueKey, { ...existing, ...room, id: existing.id });
        }
      }
    });

    return Array.from(seenKeys.values()).sort((a, b) => a.id - b.id);
  };

  const [allRooms, setAllRooms] = useState<Room[]>(() => {
    if (typeof window === 'undefined') return sanitizeAndDeduplicateRooms(initialRooms);
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_ROOMS`);
      if (saved) {
        const parsed: Room[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const map = new Map<number, Room>();
          parsed.forEach((r: Room) => {
            if (r && typeof r.id === 'number') {
              map.set(r.id, { ...r, branchId: r.branchId || 'branch-01' });
            }
          });
          // Ensure initial rooms exist
          initialRooms.forEach(init => {
            if (!map.has(init.id)) {
              map.set(init.id, init);
            }
          });
          const fullList = Array.from(map.values());
          return sanitizeAndDeduplicateRooms(fullList);
        }
      }
    } catch (e) {
      console.warn('Failed parsing rooms from localStorage:', e);
    }
    return sanitizeAndDeduplicateRooms(initialRooms);
  });

  // Ensure rooms exist ONLY for branches in the registered branches state and match branch.totalRooms exactly
  useEffect(() => {
    const validBranchIds = new Set(branches.map(b => b.id));
    
    // 1. Filter out orphaned dummy rooms whose branch is no longer registered in branches
    let updated = allRooms.filter(r => validBranchIds.has(r.branchId || 'branch-01'));
    let hasChanges = updated.length !== allRooms.length;

    // 2. Ensure each existing branch has EXACTLY its registered totalRooms
    branches.forEach(branch => {
      const targetCount = branch.totalRooms && branch.totalRooms > 0 ? branch.totalRooms : 8;
      const branchRooms = updated.filter(r => (r.branchId || 'branch-01') === branch.id);
      
      if (branchRooms.length === 0) {
        const generated = generateRoomsForBranch(branch);
        updated = [...updated, ...generated];
        hasChanges = true;
      } else if (branchRooms.length > targetCount) {
        // Trim excess rooms beyond registered totalRooms (keeping occupied rooms first)
        const sortedBranchRooms = [...branchRooms].sort((a, b) => {
          const aOcc = a.status === 'terisi' || !!a.tenant;
          const bOcc = b.status === 'terisi' || !!b.tenant;
          if (aOcc && !bOcc) return -1;
          if (!aOcc && bOcc) return 1;
          return a.id - b.id;
        });
        const keepIds = new Set(sortedBranchRooms.slice(0, targetCount).map(r => r.id));
        updated = updated.filter(r => (r.branchId || 'branch-01') !== branch.id || keepIds.has(r.id));
        hasChanges = true;
      } else if (branchRooms.length < targetCount) {
        const generated = generateRoomsForBranch(branch);
        const existingKeys = new Set(branchRooms.map(r => {
          const m = r.roomNumber.match(/\d+/);
          return m ? parseInt(m[0], 10) : r.roomNumber.toLowerCase().trim();
        }));
        
        generated.forEach(genRoom => {
          const m = genRoom.roomNumber.match(/\d+/);
          const key = m ? parseInt(m[0], 10) : genRoom.roomNumber.toLowerCase().trim();
          if (!existingKeys.has(key) && updated.filter(r => (r.branchId || 'branch-01') === branch.id).length < targetCount) {
            updated.push(genRoom);
            existingKeys.add(key);
            hasChanges = true;
          }
        });
      }
    });

    updated = sanitizeAndDeduplicateRooms(updated);

    if (hasChanges || updated.length !== allRooms.length) {
      setAllRooms(updated);
    }
  }, [branches]);

  // Active Branch resolution
  const isAllBranchesSelected = selectedBranchId === 'all';
  const activeBranch = branches.find(b => b.id === selectedBranchId) || (!isAllBranchesSelected ? (branches[0] || initialBranches[0]) : undefined);

  // Derived rooms strictly filtered to currently registered branches in super admin
  const validBranchIds = new Set(branches.map(b => b.id));
  const validAllRooms = allRooms.filter(r => validBranchIds.has(r.branchId || 'branch-01'));

  const activeBranchRooms = isAllBranchesSelected
    ? validAllRooms
    : validAllRooms.filter(r => (r.branchId || 'branch-01') === selectedBranchId);

  const rooms = isAllBranchesSelected
    ? validAllRooms
    : (activeBranchRooms.length > 0 ? activeBranchRooms : (activeBranch ? generateRoomsForBranch(activeBranch) : validAllRooms));

  const [tenants, setTenants] = useState<Tenant[]>(() => {
    if (typeof window === 'undefined') return initialTenants;
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_TENANTS`);
      return saved ? JSON.parse(saved) : initialTenants;
    } catch {
      return initialTenants;
    }
  });

  const [allBookings, setAllBookings] = useState<RentalBooking[]>(() => {
    if (typeof window === 'undefined') return initialBookings;
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_BOOKINGS`);
      return saved ? JSON.parse(saved) : initialBookings;
    } catch {
      return initialBookings;
    }
  });

  const [allInvoices, setAllInvoices] = useState<Invoice[]>(() => {
    if (typeof window === 'undefined') return initialInvoices;
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_INVOICES`);
      return saved ? JSON.parse(saved) : initialInvoices;
    } catch {
      return initialInvoices;
    }
  });

  const [allExpenses, setAllExpenses] = useState<Expense[]>(() => {
    if (typeof window === 'undefined') return initialExpenses;
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_EXPENSES`);
      return saved ? JSON.parse(saved) : initialExpenses;
    } catch {
      return initialExpenses;
    }
  });

  const [allTickets, setAllTickets] = useState<MaintenanceTicket[]>(() => {
    if (typeof window === 'undefined') return initialTickets;
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_TICKETS`);
      return saved ? JSON.parse(saved) : initialTickets;
    } catch {
      return initialTickets;
    }
  });

  // Derived collections isolated to active branch (or all registered branches if 'all' selected)
  const branchRoomIdsSet = new Set(rooms.map(r => r.id));
  const invoices = isAllBranchesSelected 
    ? allInvoices.filter(i => validBranchIds.has(i.branchId || 'branch-01') || branchRoomIdsSet.has(i.roomId))
    : allInvoices.filter(i => (i.branchId || 'branch-01') === selectedBranchId || branchRoomIdsSet.has(i.roomId));
  const expenses = isAllBranchesSelected 
    ? allExpenses.filter(e => validBranchIds.has(e.branchId || 'branch-01'))
    : allExpenses.filter(e => (e.branchId || 'branch-01') === selectedBranchId || (!e.branchId && selectedBranchId === 'branch-01'));
  const tickets = isAllBranchesSelected 
    ? allTickets.filter(t => validBranchIds.has(t.branchId || 'branch-01') || branchRoomIdsSet.has(t.roomId))
    : allTickets.filter(t => (t.branchId || 'branch-01') === selectedBranchId || branchRoomIdsSet.has(t.roomId) || (!t.branchId && selectedBranchId === 'branch-01'));
  const bookings = isAllBranchesSelected 
    ? allBookings.filter(b => validBranchIds.has(b.branchId || 'branch-01') || branchRoomIdsSet.has(b.roomId))
    : allBookings.filter(b => (b.branchId || 'branch-01') === selectedBranchId || branchRoomIdsSet.has(b.roomId) || (!b.branchId && selectedBranchId === 'branch-01'));

  const [settings, setSettings] = useState<KostSettings>(() => {
    if (typeof window === 'undefined') return initialKostSettings;
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_SETTINGS`);
      return saved ? JSON.parse(saved) : initialKostSettings;
    } catch {
      return initialKostSettings;
    }
  });

  // Enterprise Users and Branches state
  const [users, setUsers] = useState<AppUser[]>(() => {
    if (typeof window === 'undefined') return initialUsers;
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_USERS`);
      if (saved) {
        const parsed: AppUser[] = JSON.parse(saved);
        // Ensure default system accounts (usr-admin-01 & usr-owner-01) are always present
        const mergedMap = new Map<string, AppUser>();
        initialUsers.forEach(u => mergedMap.set(u.id, u));
        parsed.forEach(u => mergedMap.set(u.id, u));
        return Array.from(mergedMap.values());
      }
      return initialUsers;
    } catch {
      return initialUsers;
    }
  });

  const [activeAppUser, setActiveAppUser] = useState<AppUser | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_ACTIVE_USER`);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (activeAppUser) {
        localStorage.setItem(`${LOCAL_STORAGE_KEY}_ACTIVE_USER`, JSON.stringify(activeAppUser));
      } else {
        localStorage.removeItem(`${LOCAL_STORAGE_KEY}_ACTIVE_USER`);
      }
    }
  }, [activeAppUser]);

  // Auto sync tenant's registered room and branch when logged in as tenant
  useEffect(() => {
    if (activeAppUser && activeAppUser.role === 'penghuni') {
      if (activeAppUser.assignedRoomId) {
        setSelectedTenantRoomId(activeAppUser.assignedRoomId);
        const matchingRoom = allRooms.find(r => r.id === activeAppUser.assignedRoomId);
        if (matchingRoom && matchingRoom.branchId && matchingRoom.branchId !== selectedBranchId) {
          setSelectedBranchId(matchingRoom.branchId);
        }
      }
    }
  }, [activeAppUser, allRooms]);

  // Sync with LocalStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_ROOMS`, JSON.stringify(allRooms));
    }
  }, [allRooms]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_TENANTS`, JSON.stringify(tenants));
    }
  }, [tenants]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_BOOKINGS`, JSON.stringify(allBookings));
    }
  }, [allBookings]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_INVOICES`, JSON.stringify(allInvoices));
    }
  }, [allInvoices]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_EXPENSES`, JSON.stringify(allExpenses));
    }
  }, [allExpenses]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_TICKETS`, JSON.stringify(allTickets));
    }
  }, [allTickets]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_SETTINGS`, JSON.stringify(settings));
    }
  }, [settings]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_USERS`, JSON.stringify(users));
    }
  }, [users]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_BRANCHES`, JSON.stringify(branches));
    }
  }, [branches]);

  // Firestore Real-time Listeners and Auto-Seed
  useEffect(() => {
    let unsubscribeRooms = () => {};
    let unsubscribeTenants = () => {};
    let unsubscribeBookings = () => {};
    let unsubscribeInvoices = () => {};
    let unsubscribeExpenses = () => {};
    let unsubscribeTickets = () => {};
    let unsubscribeSettings = () => {};
    let unsubscribeUsers = () => {};
    let unsubscribeBranches = () => {};

    const setupFirestore = async () => {
      try {
        await testFirestoreConnection();

        // 1. Listen to Rooms
        const roomsRef = collection(db, 'rooms');
        unsubscribeRooms = onSnapshot(
          roomsRef,
          snapshot => {
            const loadedRoomsMap = new Map<number, Room>();
            if (!snapshot.empty) {
              snapshot.forEach(docSnap => {
                const r = docSnap.data() as Room;
                if (r && typeof r.id === 'number') {
                  loadedRoomsMap.set(r.id, { ...r, branchId: r.branchId || 'branch-01' });
                }
              });
            }

            // Always guarantee initialRooms exist
            initialRooms.forEach(initRoom => {
              if (!loadedRoomsMap.has(initRoom.id)) {
                loadedRoomsMap.set(initRoom.id, initRoom);
                setDoc(doc(db, 'rooms', `room-${initRoom.id}`), cleanForFirestore(initRoom)).catch(() => {});
              }
            });

            const completeRooms = Array.from(loadedRoomsMap.values());
            completeRooms.sort((a, b) => a.id - b.id);
            setAllRooms(completeRooms);
            setIsCloudConnected(true);
          },
          err => {
            handleFirestoreError(err, OperationType.LIST, 'rooms');
          }
        );

        // 2. Listen to Tenants
        const tenantsRef = collection(db, 'tenants');
        unsubscribeTenants = onSnapshot(
          tenantsRef,
          snapshot => {
            if (!snapshot.empty) {
              const loadedTenants: Tenant[] = [];
              snapshot.forEach(docSnap => {
                loadedTenants.push(docSnap.data() as Tenant);
              });
              setTenants(loadedTenants);
              setIsCloudConnected(true);
            } else {
              setTenants([]);
            }
          },
          err => {
            handleFirestoreError(err, OperationType.LIST, 'tenants');
          }
        );

        // 3. Listen to Bookings (Permohonan Sewa)
        const bookingsRef = collection(db, 'bookings');
        unsubscribeBookings = onSnapshot(
          bookingsRef,
          snapshot => {
            if (!snapshot.empty) {
              const loadedBookings: RentalBooking[] = [];
              snapshot.forEach(docSnap => {
                loadedBookings.push(docSnap.data() as RentalBooking);
              });
              loadedBookings.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
              setAllBookings(loadedBookings);
              setIsCloudConnected(true);
            } else {
              setAllBookings([]);
            }
          },
          err => {
            handleFirestoreError(err, OperationType.LIST, 'bookings');
          }
        );

        // 4. Listen to Invoices
        const invoicesRef = collection(db, 'invoices');
        unsubscribeInvoices = onSnapshot(
          invoicesRef,
          snapshot => {
            if (!snapshot.empty) {
              const loadedInvoices: Invoice[] = [];
              snapshot.forEach(docSnap => {
                loadedInvoices.push(docSnap.data() as Invoice);
              });
              loadedInvoices.sort((a, b) => b.id.localeCompare(a.id));
              setAllInvoices(loadedInvoices);
              setIsCloudConnected(true);
            } else {
              setAllInvoices([]);
            }
          },
          err => {
            handleFirestoreError(err, OperationType.LIST, 'invoices');
          }
        );

        // 5. Listen to Expenses
        const expensesRef = collection(db, 'expenses');
        unsubscribeExpenses = onSnapshot(
          expensesRef,
          snapshot => {
            if (!snapshot.empty) {
              const loadedExpenses: Expense[] = [];
              snapshot.forEach(docSnap => {
                loadedExpenses.push(docSnap.data() as Expense);
              });
              loadedExpenses.sort((a, b) => b.date.localeCompare(a.date));
              setAllExpenses(loadedExpenses);
              setIsCloudConnected(true);
            } else {
              setAllExpenses([]);
            }
          },
          err => {
            handleFirestoreError(err, OperationType.LIST, 'expenses');
          }
        );

        // 6. Listen to Tickets
        const ticketsRef = collection(db, 'tickets');
        unsubscribeTickets = onSnapshot(
          ticketsRef,
          snapshot => {
            if (!snapshot.empty) {
              const loadedTickets: MaintenanceTicket[] = [];
              snapshot.forEach(docSnap => {
                loadedTickets.push(docSnap.data() as MaintenanceTicket);
              });
              loadedTickets.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
              setAllTickets(loadedTickets);
              setIsCloudConnected(true);
            } else {
              setAllTickets([]);
            }
          },
          err => {
            handleFirestoreError(err, OperationType.LIST, 'tickets');
          }
        );

        // 7. Listen to Settings
        const settingsDocRef = doc(db, 'settings', 'kostSettings');
        unsubscribeSettings = onSnapshot(
          settingsDocRef,
          docSnap => {
            if (docSnap.exists()) {
              setSettings(docSnap.data() as KostSettings);
              setIsCloudConnected(true);
            } else if (!isInitialSyncDone.current) {
              setDoc(settingsDocRef, initialKostSettings).catch(e =>
                handleFirestoreError(e, OperationType.WRITE, 'settings/kostSettings')
              );
            }
          },
          err => {
            handleFirestoreError(err, OperationType.GET, 'settings/kostSettings');
          }
        );

        // 8. Listen to Users
        const usersRef = collection(db, 'users');
        unsubscribeUsers = onSnapshot(
          usersRef,
          snapshot => {
            const userMap = new Map<string, AppUser>();
            initialUsers.forEach(u => userMap.set(u.id, u));

            if (!snapshot.empty) {
              snapshot.forEach(docSnap => {
                const uData = docSnap.data() as AppUser;
                if (uData && uData.id) {
                  userMap.set(uData.id, uData);
                }
              });
            }

            setUsers(Array.from(userMap.values()));
            setIsCloudConnected(true);
          },
          err => {
            handleFirestoreError(err, OperationType.LIST, 'users');
          }
        );

        // 9. Listen to Branches
        const branchesRef = collection(db, 'branches');
        unsubscribeBranches = onSnapshot(
          branchesRef,
          snapshot => {
            if (!snapshot.empty) {
              const loadedBranches: EnterpriseBranch[] = [];
              snapshot.forEach(docSnap => {
                loadedBranches.push(docSnap.data() as EnterpriseBranch);
              });
              setBranches(loadedBranches);
              setIsCloudConnected(true);
            }
          },
          err => {
            handleFirestoreError(err, OperationType.LIST, 'branches');
          }
        );

        isInitialSyncDone.current = true;
      } catch (err) {
        console.warn('Firestore initialization notice:', err);
      }
    };

    setupFirestore();

    return () => {
      unsubscribeRooms();
      unsubscribeTenants();
      unsubscribeBookings();
      unsubscribeInvoices();
      unsubscribeExpenses();
      unsubscribeTickets();
      unsubscribeSettings();
      unsubscribeUsers();
      unsubscribeBranches();
    };
  }, []);

  // Actions with Firestore Sync
  const updateRoom = async (updatedRoom: Room) => {
    const targetBranchId = updatedRoom.branchId || (selectedBranchId !== 'all' ? selectedBranchId : 'branch-01');
    const roomWithBranch: Room = {
      ...updatedRoom,
      branchId: targetBranchId,
    };
    
    setAllRooms(prev => {
      let isReplaced = false;
      const updatedList = prev.map(r => {
        const isSameId = r.id === updatedRoom.id;
        const isSameBranchAndNumber = (r.branchId || 'branch-01') === targetBranchId &&
          r.roomNumber.trim().toLowerCase() === updatedRoom.roomNumber.trim().toLowerCase();
        
        if (isSameId || isSameBranchAndNumber) {
          isReplaced = true;
          return { ...r, ...roomWithBranch, id: r.id };
        }
        return r;
      });

      if (!isReplaced) {
        updatedList.push(roomWithBranch);
      }

      return sanitizeAndDeduplicateRooms(updatedList);
    });

    try {
      await setDoc(doc(db, 'rooms', `room-${updatedRoom.id}`), cleanForFirestore(roomWithBranch), { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `rooms/room-${updatedRoom.id}`);
    }
  };

  const checkInTenant = async (roomId: number, tenant: Tenant, autoGenerateInvoice = true) => {
    const targetRoom = allRooms.find(r => r.id === roomId);
    if (!targetRoom) return;

    // If this room was occupied by a different tenant, archive them
    const previousTenant = targetRoom.tenant;
    if (previousTenant && previousTenant.id !== tenant.id) {
      const archivedPrev: Tenant = {
        ...previousTenant,
        status: 'checked_out',
        checkOutDate: new Date().toISOString().split('T')[0],
      };
      setTenants(prev => prev.map(t => (t.id === archivedPrev.id ? archivedPrev : t)));
      try {
        await setDoc(doc(db, 'tenants', archivedPrev.id), cleanForFirestore(archivedPrev), { merge: true });
      } catch (e) {
        console.warn('Archived previous tenant:', e);
      }
    }

    const tenantRecord: Tenant = {
      ...tenant,
      roomId,
      id: tenant.id || `t-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      status: 'active',
      branchId: targetRoom.branchId || selectedBranchId || 'branch-01',
    };

    const newRoomData: Room = {
      ...targetRoom,
      status: 'terisi',
      tenant: tenantRecord,
    };

    // Update Room state & Firestore
    setAllRooms(prev => prev.map(r => (r.id === roomId ? newRoomData : r)));
    try {
      await setDoc(doc(db, 'rooms', `room-${roomId}`), cleanForFirestore(newRoomData));
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `rooms/room-${roomId}`);
    }

    // Save Tenant into Firestore `tenants` collection
    setTenants(prev => {
      const exists = prev.some(t => t.id === tenantRecord.id);
      return exists ? prev.map(t => (t.id === tenantRecord.id ? tenantRecord : t)) : [tenantRecord, ...prev];
    });
    try {
      await setDoc(doc(db, 'tenants', tenantRecord.id), cleanForFirestore(tenantRecord), { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `tenants/${tenantRecord.id}`);
    }

    // Auto-generate current month invoice if enabled and not existing
    if (autoGenerateInvoice) {
      const existing = allInvoices.find(inv => inv.roomId === roomId && inv.month === activeReportMonth);
      if (!existing) {
        const invNum = `INV/${activeReportMonth.replace('-', '')}/K0${roomId}`;
        const newInvoice: Invoice = {
          id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          invoiceNumber: invNum,
          roomId,
          roomNumber: targetRoom.roomNumber,
          tenantName: tenant.name,
          tenantPhone: tenant.phone,
          month: activeReportMonth,
          baseAmount: targetRoom.basePrice,
          additionalFees: [{ id: `f-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, name: 'Iuran Kebersihan & Sampah', amount: 25000 }],
          totalAmount: targetRoom.basePrice + 25000,
          dueDate: `${activeReportMonth}-05`,
          status: 'belum_bayar',
          notes: `Tagihan sewa bulan pertama (${activeReportMonth}) saat check-in.`,
          branchId: targetRoom.branchId || selectedBranchId || 'branch-01',
        };
        setAllInvoices(prev => [newInvoice, ...prev]);
        try {
          await setDoc(doc(db, 'invoices', newInvoice.id), cleanForFirestore(newInvoice));
        } catch (e) {
          handleFirestoreError(e, OperationType.CREATE, `invoices/${newInvoice.id}`);
        }
      }
    }
  };

  const checkOutTenant = async (roomId: number) => {
    const room = allRooms.find(r => r.id === roomId);
    if (room) {
      const previousTenant = room.tenant;
      const updatedRoom: Room = {
        ...room,
        status: 'kosong',
      };
      delete updatedRoom.tenant;

      setAllRooms(prev => {
        const next = prev.map(r => (r.id === roomId ? updatedRoom : r));
        try {
          localStorage.setItem(`${LOCAL_STORAGE_KEY}_ROOMS`, JSON.stringify(next));
        } catch (e) {
          console.warn('LocalStorage error on room checkout:', e);
        }
        return next;
      });

      try {
        await setDoc(doc(db, 'rooms', `room-${roomId}`), cleanForFirestore(updatedRoom));
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `rooms/room-${roomId}`);
      }

      // SYNCHRONIZED ACTION: Remove corresponding AppUser account if present
      const matchingAppUser = users.find(u => 
        u.assignedRoomId === roomId ||
        (previousTenant?.email && u.email && u.email.toLowerCase() === previousTenant.email.toLowerCase()) ||
        (previousTenant?.name && u.name && u.name.toLowerCase() === previousTenant.name.toLowerCase()) ||
        (previousTenant?.id && u.id === previousTenant.id)
      );
      if (matchingAppUser && matchingAppUser.role === 'penghuni') {
        setUsers(prev => prev.filter(u => u.id !== matchingAppUser.id));
        try {
          await deleteDoc(doc(db, 'users', matchingAppUser.id));
        } catch (e) {
          console.warn('Delete matching AppUser on checkout notice:', e);
        }
      }

      if (previousTenant) {
        const checkOutDateStr = new Date().toISOString().split('T')[0];
        const archivedTenant: Tenant = {
          ...previousTenant,
          checkOutDate: checkOutDateStr,
          status: 'checked_out',
        };
        setTenants(prev => {
          const next = prev.map(t => {
            if (t.id === previousTenant.id) {
              return archivedTenant;
            }
            return t;
          });
          try {
            localStorage.setItem(`${LOCAL_STORAGE_KEY}_TENANTS`, JSON.stringify(next));
          } catch (e) {
            console.warn('LocalStorage error on tenant checkout:', e);
          }
          return next;
        });

        try {
          await setDoc(doc(db, 'tenants', previousTenant.id), cleanForFirestore(archivedTenant), { merge: true });
        } catch (e) {
          console.warn('Could not update checkout status for tenant in Firestore:', e);
        }
      }
    }
  };

  const deleteTenant = async (tenantId: string) => {
    // 1. Remove from local tenants state & localStorage
    setTenants(prev => {
      const next = prev.filter(t => t.id !== tenantId);
      try {
        localStorage.setItem(`${LOCAL_STORAGE_KEY}_TENANTS`, JSON.stringify(next));
      } catch (e) {
        console.warn('LocalStorage error on delete tenant:', e);
      }
      return next;
    });

    // 2. If tenant is currently assigned to a room, remove them and set room to 'kosong'
    setAllRooms(prev => {
      let changed = false;
      const next = prev.map(r => {
        if (r.tenant && r.tenant.id === tenantId) {
          changed = true;
          const updated: Room = { ...r, status: 'kosong' };
          delete updated.tenant;
          setDoc(doc(db, 'rooms', `room-${r.id}`), cleanForFirestore(updated)).catch(() => {});
          return updated;
        }
        return r;
      });
      if (changed) {
        try {
          localStorage.setItem(`${LOCAL_STORAGE_KEY}_ROOMS`, JSON.stringify(next));
        } catch (e) {
          console.warn('LocalStorage error on room update after tenant delete:', e);
        }
      }
      return next;
    });

    // 3. Remove corresponding AppUser if matching
    setUsers(prev => {
      const targetUser = prev.find(u => u.id === tenantId || (u.role === 'penghuni' && u.id === tenantId));
      if (targetUser) {
        deleteDoc(doc(db, 'users', targetUser.id)).catch(() => {});
        return prev.filter(u => u.id !== targetUser.id);
      }
      return prev;
    });

    // 4. Delete from Firestore 'tenants' collection
    try {
      await deleteDoc(doc(db, 'tenants', tenantId));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `tenants/${tenantId}`);
    }
  };

  // Booking / Permohonan Sewa Actions
  const addBooking = async (bookingData: Omit<RentalBooking, 'id' | 'createdAt' | 'status'>): Promise<string> => {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const bookingId = `book-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newBooking: RentalBooking = {
      ...bookingData,
      id: bookingId,
      status: 'pending',
      createdAt: now,
      branchId: bookingData.branchId || selectedBranchId || 'branch-01',
    };

    setAllBookings(prev => [newBooking, ...prev]);
    try {
      await setDoc(doc(db, 'bookings', bookingId), cleanForFirestore(newBooking));
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `bookings/${bookingId}`);
    }
    return bookingId;
  };

  const updateBookingStatus = async (bookingId: string, status: BookingStatus) => {
    setAllBookings(prev => prev.map(b => (b.id === bookingId ? { ...b, status } : b)));
    try {
      await setDoc(doc(db, 'bookings', bookingId), { status }, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `bookings/${bookingId}`);
    }
  };

  const deleteBooking = async (bookingId: string) => {
    setAllBookings(prev => prev.filter(b => b.id !== bookingId));
    try {
      await deleteDoc(doc(db, 'bookings', bookingId));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `bookings/${bookingId}`);
    }
  };

  const addInvoice = async (invoiceData: Omit<Invoice, 'id' | 'invoiceNumber'>) => {
    const invNum = `INV/${invoiceData.month.replace('-', '')}/K0${invoiceData.roomId}-${Date.now().toString().slice(-4)}`;
    const newInvoice: Invoice = {
      ...invoiceData,
      id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      invoiceNumber: invNum,
      branchId: invoiceData.branchId || selectedBranchId || 'branch-01',
    };
    setAllInvoices(prev => [newInvoice, ...prev]);
    try {
      await setDoc(doc(db, 'invoices', newInvoice.id), cleanForFirestore(newInvoice));
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `invoices/${newInvoice.id}`);
    }
  };

  const updateInvoice = async (updatedInvoice: Invoice) => {
    setAllInvoices(prev => prev.map(inv => (inv.id === updatedInvoice.id ? updatedInvoice : inv)));
    try {
      await setDoc(doc(db, 'invoices', updatedInvoice.id), cleanForFirestore(updatedInvoice), { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `invoices/${updatedInvoice.id}`);
    }
  };

  const deleteInvoice = async (invoiceId: string) => {
    setAllInvoices(prev => prev.filter(i => i.id !== invoiceId));
    try {
      await deleteDoc(doc(db, 'invoices', invoiceId));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `invoices/${invoiceId}`);
    }
  };

  const verifyPayment = async (invoiceId: string, status: 'lunas' | 'ditolak', notes?: string) => {
    const now = new Date();
    const verifiedDateStr = now.toISOString().replace('T', ' ').substring(0, 19);

    const targetInvoice = allInvoices.find(i => i.id === invoiceId);
    if (targetInvoice) {
      const updatedInv: Invoice = {
        ...targetInvoice,
        status,
        paidDate: status === 'lunas' ? targetInvoice.paidDate || now.toISOString().split('T')[0] : undefined,
        verifiedAt: status === 'lunas' ? verifiedDateStr : undefined,
        verifiedBy: status === 'lunas' ? 'Pemilik Kos (Terverifikasi)' : undefined,
        notes: notes || (status === 'lunas' ? 'Pembayaran telah dikonfirmasi dan diverifikasi oleh pemilik.' : 'Pembayaran ditolak/bukti tidak sesuai.'),
      };

      setAllInvoices(prev => prev.map(inv => (inv.id === invoiceId ? updatedInv : inv)));

      try {
        await setDoc(doc(db, 'invoices', invoiceId), cleanForFirestore(updatedInv), { merge: true });
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `invoices/${invoiceId}`);
      }

      // If verified lunas, update room status if waiting payment
      if (status === 'lunas') {
        const room = allRooms.find(r => r.id === targetInvoice.roomId);
        if (room && room.status === 'menunggu_pembayaran') {
          const updatedRoom: Room = { ...room, status: 'terisi' };
          setAllRooms(prev => prev.map(r => (r.id === targetInvoice.roomId ? updatedRoom : r)));
          try {
            await setDoc(doc(db, 'rooms', `room-${targetInvoice.roomId}`), cleanForFirestore(updatedRoom), { merge: true });
          } catch (e) {
            handleFirestoreError(e, OperationType.UPDATE, `rooms/room-${targetInvoice.roomId}`);
          }
        }
      }
    }
  };

  const submitTenantPayment = async (
    invoiceId: string,
    proofImageUrl: string,
    method: 'qris' | 'transfer_bank',
    qrisRef?: string
  ) => {
    const today = new Date().toISOString().split('T')[0];
    const targetInvoice = allInvoices.find(i => i.id === invoiceId);
    
    if (targetInvoice) {
      const updatedInv: Invoice = {
        ...targetInvoice,
        status: 'menunggu_verifikasi',
        paymentMethod: method,
        proofImageUrl,
        qrisRef: qrisRef || `QRIS-PAY-${Date.now().toString().slice(-6)}`,
        paidDate: today,
        notes: `Pembayaran dikirim melalui ${method === 'qris' ? 'QRIS Dinamis' : 'Transfer Bank'} pada ${today}. Menunggu konfirmasi pemilik.`,
      };

      setAllInvoices(prev => prev.map(inv => (inv.id === invoiceId ? updatedInv : inv)));

      try {
        await setDoc(doc(db, 'invoices', invoiceId), cleanForFirestore(updatedInv), { merge: true });
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `invoices/${invoiceId}`);
      }
    } else {
      // If invoice was generated on the fly / fallback in the frontend
      const matchedRoom = allRooms.find(r => 
        invoiceId.includes(`K0${r.id}`) || invoiceId.includes(`K${r.id}`) || r.id === selectedTenantRoomId
      ) || rooms[0] || allRooms[0];

      const newInv: Invoice = {
        id: invoiceId,
        invoiceNumber: `INV/${activeReportMonth.replace('-', '')}/K0${matchedRoom.id}`,
        roomId: matchedRoom.id,
        roomNumber: matchedRoom.roomNumber,
        tenantName: matchedRoom.tenant?.name || 'Penghuni Kamar',
        tenantPhone: matchedRoom.tenant?.phone || '',
        month: activeReportMonth,
        baseAmount: matchedRoom.basePrice,
        additionalFees: [{ id: `f-${matchedRoom.id}`, name: 'Iuran Kebersihan & Sampah', amount: 25000 }],
        totalAmount: matchedRoom.basePrice + 25000,
        dueDate: `${activeReportMonth}-05`,
        status: 'menunggu_verifikasi',
        paymentMethod: method,
        proofImageUrl,
        qrisRef: qrisRef || `QRIS-PAY-${Date.now().toString().slice(-6)}`,
        paidDate: today,
        notes: `Pembayaran dikirim melalui ${method === 'qris' ? 'QRIS Dinamis' : 'Transfer Bank'} pada ${today}. Menunggu konfirmasi pemilik.`,
        branchId: matchedRoom.branchId || selectedBranchId || 'branch-01',
      };

      setAllInvoices(prev => [newInv, ...prev]);

      try {
        await setDoc(doc(db, 'invoices', invoiceId), cleanForFirestore(newInv));
      } catch (e) {
        handleFirestoreError(e, OperationType.CREATE, `invoices/${invoiceId}`);
      }
    }
  };

  const addExpense = async (expenseData: Omit<Expense, 'id'>) => {
    const newExpense: Expense = {
      ...expenseData,
      id: `exp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      branchId: expenseData.branchId || selectedBranchId || 'branch-01',
    };
    setAllExpenses(prev => [newExpense, ...prev]);
    try {
      await setDoc(doc(db, 'expenses', newExpense.id), cleanForFirestore(newExpense));
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `expenses/${newExpense.id}`);
    }
  };

  const updateExpense = async (updatedExpense: Expense) => {
    setAllExpenses(prev => prev.map(e => (e.id === updatedExpense.id ? updatedExpense : e)));
    try {
      await setDoc(doc(db, 'expenses', updatedExpense.id), cleanForFirestore(updatedExpense), { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `expenses/${updatedExpense.id}`);
    }
  };

  const deleteExpense = async (expenseId: string) => {
    setAllExpenses(prev => prev.filter(e => e.id !== expenseId));
    try {
      await deleteDoc(doc(db, 'expenses', expenseId));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `expenses/${expenseId}`);
    }
  };

  const createTicket = async (ticketData: Omit<MaintenanceTicket, 'id' | 'ticketNumber' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const count = allTickets.length + 1;
    const ticketNumber = `TKT-${new Date().getFullYear()}-${count.toString().padStart(3, '0')}`;
    const matchingRoom = allRooms.find(r => r.id === ticketData.roomId);
    const resolvedBranchId = ticketData.branchId || matchingRoom?.branchId || (selectedBranchId !== 'all' ? selectedBranchId : 'branch-01');
    const newTicket: MaintenanceTicket = {
      ...ticketData,
      id: `tkt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      ticketNumber,
      createdAt: now,
      updatedAt: now,
      branchId: resolvedBranchId,
    };
    setAllTickets(prev => [newTicket, ...prev]);
    try {
      await setDoc(doc(db, 'tickets', newTicket.id), cleanForFirestore(newTicket));
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `tickets/${newTicket.id}`);
    }
  };

  const updateTicketStatus = async (ticketId: string, status: TicketStatus, cost?: number, actionNotes?: string) => {
    return processTicket(ticketId, { status, cost, actionNotes });
  };

  const processTicket = async (
    ticketId: string,
    data: {
      status: TicketStatus;
      technicianName?: string;
      technicianPhone?: string;
      scheduledDate?: string;
      cost?: number;
      actionNotes?: string;
      completionDate?: string;
      autoRecordExpense?: boolean;
    }
  ) => {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const targetTicket = allTickets.find(t => t.id === ticketId);
    if (!targetTicket) return;

    const updatedTicket: MaintenanceTicket = {
      ...targetTicket,
      status: data.status,
      technicianName: data.technicianName || targetTicket.technicianName,
      technicianPhone: data.technicianPhone || targetTicket.technicianPhone,
      scheduledDate: data.scheduledDate || targetTicket.scheduledDate,
      cost: data.cost !== undefined ? data.cost : targetTicket.cost,
      actionNotes: data.actionNotes || targetTicket.actionNotes,
      completionDate: data.status === 'selesai' ? (data.completionDate || new Date().toISOString().split('T')[0]) : targetTicket.completionDate,
      updatedAt: now,
    };

    setAllTickets(prev => prev.map(t => (t.id === ticketId ? updatedTicket : t)));

    try {
      await setDoc(doc(db, 'tickets', ticketId), cleanForFirestore(updatedTicket), { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `tickets/${ticketId}`);
    }

    if (data.status === 'selesai' && data.cost && data.cost > 0 && data.autoRecordExpense !== false) {
      const roomNumStr = `K0${targetTicket.roomId}`;
      const expenseTitle = `Perbaikan Tiket #${targetTicket.ticketNumber} (${targetTicket.title}) - ${roomNumStr}`;
      
      const alreadyRecorded = allExpenses.some(e => e.notes && e.notes.includes(targetTicket.ticketNumber));
      if (!alreadyRecorded) {
        await addExpense({
          title: expenseTitle,
          category: 'perbaikan_fasilitas',
          amount: data.cost,
          date: new Date().toISOString().split('T')[0],
          month: activeReportMonth,
          recordedBy: activeAppUser?.name || 'Sistem Enterprise',
          notes: `Otomatis tercatat dari penyelesaian tiket perbaikan #${targetTicket.ticketNumber}. Teknisi: ${data.technicianName || 'Internal'}.`,
          branchId: targetTicket.branchId || selectedBranchId || 'branch-01',
        });
      }
    }
  };

  const deleteTicket = async (ticketId: string) => {
    setAllTickets(prev => prev.filter(t => t.id !== ticketId));
    try {
      await deleteDoc(doc(db, 'tickets', ticketId));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `tickets/${ticketId}`);
    }
  };

  const updateSettings = async (newSettings: KostSettings) => {
    setSettings(newSettings);
    try {
      await setDoc(doc(db, 'settings', 'kostSettings'), cleanForFirestore(newSettings), { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'settings/kostSettings');
    }
  };

  const addBranch = async (branchData: Omit<EnterpriseBranch, 'id'>) => {
    const newBranch: EnterpriseBranch = {
      ...branchData,
      id: `branch-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    };
    
    // Automatically generate rooms matching the specified totalRooms for the branch
    const newBranchRooms = generateRoomsForBranch(newBranch);

    setBranches(prev => [...prev, newBranch]);
    setAllRooms(prev => [...prev, ...newBranchRooms]);

    try {
      await setDoc(doc(db, 'branches', newBranch.id), cleanForFirestore(newBranch));
      for (const r of newBranchRooms) {
        setDoc(doc(db, 'rooms', `room-${r.id}`), cleanForFirestore(r)).catch(() => {});
      }
    } catch (e) {
      console.warn('Firestore branch add notice:', e);
    }

    addAuditLog({
      actorName: activeAppUser?.name || 'Super Admin Enterprise',
      actorEmail: activeAppUser?.email || 'admin@kosthub.com',
      actorRole: activeAppUser?.role || 'superadmin',
      action: 'create_branch',
      title: `Penambahan Cabang Properti Baru`,
      description: `Cabang properti "${newBranch.name}" (${newBranch.code}) dengan kapasitas ${newBranch.totalRooms} kamar berhasil dibuat.`,
      status: 'success',
    });
  };

  const updateBranch = async (updatedBranch: EnterpriseBranch) => {
    setBranches(prev => prev.map(b => (b.id === updatedBranch.id ? updatedBranch : b)));

    // Check if totalRooms changed, adjust rooms if necessary
    const existingRooms = allRooms.filter(r => (r.branchId || 'branch-01') === updatedBranch.id);
    if (existingRooms.length < updatedBranch.totalRooms) {
      const neededCount = updatedBranch.totalRooms - existingRooms.length;
      const additionalRooms: Room[] = Array.from({ length: neededCount }, (_, idx) => {
        const roomNum = existingRooms.length + idx + 1;
        const roomNumberStr = `Kamar ${roomNum < 10 ? '0' + roomNum : roomNum}`;
        const floor = roomNum <= Math.ceil(updatedBranch.totalRooms / 2) ? 1 : 2;
        const type = roomNum % 3 === 1 ? 'Deluxe AC' : roomNum % 3 === 2 ? 'Superior AC' : 'Standard Fan';
        const basePrice = type === 'Deluxe AC' ? 1750000 : type === 'Superior AC' ? 1550000 : 1250000;
        const branchHash = Math.abs(updatedBranch.id.split('').reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0)) % 900 + 100;
        const roomId = updatedBranch.id === 'branch-01' ? roomNum : branchHash * 100 + roomNum;
        return {
          id: roomId,
          branchId: updatedBranch.id,
          roomNumber: roomNumberStr,
          floor,
          type,
          size: type === 'Deluxe AC' ? '3.5 x 4 m' : '3 x 4 m',
          basePrice,
          status: 'kosong',
          electricityType: 'token_mandiri',
          facilities: ['AC 1/2 PK', 'Kamar Mandi Dalam', 'Kasur Single Comfort', 'Lemari Pakaian', 'Meja Belajar', 'WiFi 100Mbps'],
          description: `Kamar lantai ${floor} unit ${roomNumberStr} di ${updatedBranch.name}.`,
        };
      });
      setAllRooms(prev => [...prev, ...additionalRooms]);
      for (const r of additionalRooms) {
        setDoc(doc(db, 'rooms', `room-${r.id}`), cleanForFirestore(r)).catch(() => {});
      }
    }

    try {
      await setDoc(doc(db, 'branches', updatedBranch.id), cleanForFirestore(updatedBranch), { merge: true });
    } catch (e) {
      console.warn('Firestore branch update notice:', e);
    }
  };

  const deleteBranch = async (branchId: string) => {
    const branchToDelete = branches.find(b => b.id === branchId);
    if (!branchToDelete) return;

    // 1. Remove from branches list
    setBranches(prev => prev.filter(b => b.id !== branchId));

    // 2. Unlink users mapped to this branch
    setUsers(prev => prev.map(u => {
      if (u.kostBranch === branchToDelete.name || u.kostBranch === branchToDelete.id) {
        const unlinkedUser = { ...u };
        delete unlinkedUser.kostBranch;
        return unlinkedUser;
      }
      return u;
    }));

    // 3. Remove operational records associated specifically with this branch
    setAllRooms(prev => prev.filter(r => r.branchId !== branchId));
    setAllInvoices(prev => prev.filter(i => i.branchId !== branchId));
    setAllExpenses(prev => prev.filter(e => e.branchId !== branchId));
    setAllTickets(prev => prev.filter(t => t.branchId !== branchId));
    setAllBookings(prev => prev.filter(b => b.branchId !== branchId));

    // 4. Fallback selectedBranchId if the deleted branch was currently active
    if (selectedBranchId === branchId) {
      const remainingBranches = branches.filter(b => b.id !== branchId);
      const fallbackId = remainingBranches.length > 0 ? remainingBranches[0].id : 'branch-01';
      setSelectedBranchId(fallbackId);
    }

    try {
      await deleteDoc(doc(db, 'branches', branchId));
    } catch (e) {
      console.warn('Firestore branch delete notice:', e);
    }

    // 5. Add security audit log for deletion
    addAuditLog({
      actorName: activeAppUser?.name || 'Super Admin Enterprise',
      actorEmail: activeAppUser?.email || 'admin@kosthub.com',
      actorRole: activeAppUser?.role || 'superadmin',
      action: 'security_alert',
      title: 'Penghapusan Cabang Properti',
      description: `Cabang properti "${branchToDelete.name}" (${branchToDelete.code}) berhasil dihapus dan seluruh relasi akun telah dilepas.`,
      status: 'danger',
    });
  };

  const clearAllDummyData = async () => {
    // Clear all dummy records in local state & Firestore
    const cleanRooms = initialRooms.map(r => {
      const cleaned = { ...r, status: 'kosong' as const };
      delete cleaned.tenant;
      return cleaned;
    });
    setAllRooms(cleanRooms);
    setTenants([]);
    setAllBookings([]);
    setAllInvoices([]);
    setAllExpenses([]);
    setAllTickets([]);
    setSettings(initialKostSettings);
    setUsers(initialUsers);
    setBranches(initialBranches);

    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_ROOMS`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_TENANTS`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_BOOKINGS`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_INVOICES`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_EXPENSES`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_TICKETS`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_SETTINGS`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_USERS`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_BRANCHES`);

    try {
      cleanRooms.forEach(room => setDoc(doc(db, 'rooms', `room-${room.id}`), cleanForFirestore(room)));
      setDoc(doc(db, 'settings', 'kostSettings'), cleanForFirestore(initialKostSettings));
    } catch (e) {
      console.warn('Clear dummy data notice:', e);
    }
  };

  const resetToDefaultData = async () => {
    await clearAllDummyData();
  };

  // Available unique months sorted descending
  const currentMonthStr = (() => {
    const d = new Date();
    const mm = (d.getMonth() + 1).toString().padStart(2, '0');
    return `${d.getFullYear()}-${mm}`;
  })();

  const availableMonths = Array.from(
    new Set([
      currentMonthStr,
      '2026-08',
      '2026-07',
      ...allInvoices.map(i => i.month),
      ...allExpenses.map(e => e.month),
    ])
  ).sort((a, b) => b.localeCompare(a));

  // Compute monthly report summary dynamically (supports specific branch or 'all' for integrated/consolidated view)
  const getMonthlySummary = (month: string, branchFilter?: string): MonthlySummary => {
    const isAllBranches = branchFilter === 'all';
    const targetBranchId = branchFilter && branchFilter !== 'all' ? branchFilter : (!branchFilter ? selectedBranchId : 'all');

    const validBranchIds = new Set(branches.map(b => b.id));
    const validAllRooms = allRooms.filter(r => validBranchIds.has(r.branchId || 'branch-01'));

    const branchRooms = isAllBranches 
      ? validAllRooms 
      : validAllRooms.filter(r => (r.branchId || 'branch-01') === targetBranchId);

    const monthInvoices = isAllBranches
      ? allInvoices.filter(i => i.month === month && (validBranchIds.has(i.branchId || 'branch-01') || validAllRooms.some(r => r.id === i.roomId)))
      : allInvoices.filter(i => i.month === month && (i.branchId || 'branch-01') === targetBranchId);

    const monthExpenses = isAllBranches
      ? allExpenses.filter(e => e.month === month && validBranchIds.has(e.branchId || 'branch-01'))
      : allExpenses.filter(e => e.month === month && (e.branchId || 'branch-01') === targetBranchId);

    const paidInvoices = monthInvoices.filter(i => i.status === 'lunas');
    const unpaidInvoices = monthInvoices.filter(i => i.status === 'belum_bayar');
    const pendingInvoices = monthInvoices.filter(i => i.status === 'menunggu_verifikasi');

    const totalIncome = paidInvoices.reduce((sum, i) => sum + i.totalAmount, 0);
    const totalExpense = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalIncome - totalExpense;

    // Calculate total unpaid / overdue amount for occupied/active rooms in this month
    const totalUnpaidAmount = branchRooms.reduce((sum, room) => {
      if (room.status === 'kosong') return sum;
      const inv = monthInvoices.find(i => i.roomId === room.id);
      if (!inv || inv.status !== 'lunas') {
        const invAmount = inv ? inv.totalAmount : room.basePrice + 25000;
        return sum + invAmount;
      }
      return sum;
    }, 0);

    const targetBranch = !isAllBranches ? branches.find(b => b.id === targetBranchId) : null;
    const totalBranchRooms = isAllBranches
      ? (branches.reduce((sum, b) => sum + b.totalRooms, 0) || validAllRooms.length || 8)
      : (targetBranch?.totalRooms || branchRooms.length || 8);

    // Count rooms that are occupied (terisi or menunggu_pembayaran)
    const occupiedRoomsList = branchRooms.filter(r => r.status === 'terisi' || r.status === 'menunggu_pembayaran');
    const occupiedRooms = occupiedRoomsList.length;
    const occupancyRate = Math.round((occupiedRooms / (totalBranchRooms || 1)) * 100);

    // Count occupied rooms that are unpaid in this month
    const unpaidOccupiedRoomsCount = occupiedRoomsList.filter(room => {
      const inv = monthInvoices.find(i => i.roomId === room.id);
      return !inv || inv.status !== 'lunas';
    }).length;

    // Count rooms that are actually paid (lunas)
    const paidRoomsCount = branchRooms.filter(room => {
      const inv = monthInvoices.find(i => i.roomId === room.id);
      return inv?.status === 'lunas';
    }).length;

    const expensesByCategory: Record<ExpenseCategory, number> = {
      listrik: 0,
      air_pdam: 0,
      wifi_internet: 0,
      kebersihan_sampah: 0,
      maintenance_ac: 0,
      perbaikan_fasilitas: 0,
      gaji_pengelola: 0,
      lain_lain: 0,
    };

    monthExpenses.forEach(exp => {
      if (expensesByCategory[exp.category] !== undefined) {
        expensesByCategory[exp.category] += exp.amount;
      } else {
        expensesByCategory.lain_lain += exp.amount;
      }
    });

    const roomRevenues = branchRooms.map(room => {
      const inv = monthInvoices.find(i => i.roomId === room.id);
      const bObj = branches.find(b => b.id === (room.branchId || 'branch-01'));
      return {
        roomId: room.id,
        roomNumber: room.roomNumber,
        branchId: room.branchId || 'branch-01',
        branchName: bObj ? bObj.name : 'Kost Griya Harmoni 8',
        tenantName: room.tenant?.name || (room.status === 'kosong' ? 'Kosong' : 'Belum Ada Penyewa'),
        amount: inv ? inv.totalAmount : room.basePrice,
        status: inv ? inv.status : (room.status === 'kosong' ? 'kosong' : 'belum_bayar'),
        method: inv?.paymentMethod,
      };
    });

    // Compute branch breakdowns
    const branchBreakdowns: BranchPerformanceSummary[] = branches.map(b => {
      const bRooms = allRooms.filter(r => (r.branchId || 'branch-01') === b.id);
      const bInvoices = allInvoices.filter(i => i.month === month && (i.branchId || 'branch-01') === b.id);
      const bExpenses = allExpenses.filter(e => e.month === month && (e.branchId || 'branch-01') === b.id);
      const bPaidInvoices = bInvoices.filter(i => i.status === 'lunas');
      const bIncome = bPaidInvoices.reduce((sum, i) => sum + i.totalAmount, 0);
      const bExpense = bExpenses.reduce((sum, e) => sum + e.amount, 0);
      const bNetProfit = bIncome - bExpense;
      const bOccupied = bRooms.filter(r => r.status === 'terisi' || r.status === 'menunggu_pembayaran').length;
      const bTotal = b.totalRooms || bRooms.length || 8;
      const bRate = Math.round((bOccupied / (bTotal || 1)) * 100);
      const bUnpaid = bRooms.reduce((sum, room) => {
        if (room.status === 'kosong') return sum;
        const inv = bInvoices.find(i => i.roomId === room.id);
        if (!inv || inv.status !== 'lunas') {
          return sum + (inv ? inv.totalAmount : room.basePrice + 25000);
        }
        return sum;
      }, 0);

      return {
        branchId: b.id,
        branchName: b.name,
        branchCode: b.code,
        city: b.city,
        managerName: b.managerName,
        totalRooms: bTotal,
        occupiedRooms: bOccupied,
        occupancyRate: bRate,
        totalIncome: bIncome,
        totalExpense: bExpense,
        netProfit: bNetProfit,
        unpaidAmount: bUnpaid,
      };
    });

    return {
      month,
      totalIncome,
      totalExpense,
      netProfit,
      occupancyCount: occupiedRooms,
      totalRooms: totalBranchRooms,
      occupancyRate,
      paidInvoicesCount: paidRoomsCount,
      unpaidInvoicesCount: unpaidInvoices.length,
      unpaidOccupiedRoomsCount,
      pendingInvoicesCount: pendingInvoices.length,
      totalUnpaidAmount,
      expensesByCategory,
      roomRevenues,
      branchBreakdowns,
    };
  };

  // ================= ENTERPRISE USER MANAGEMENT HANDLERS =================
  const signUpUser = async (data: {
    name: string;
    email: string;
    phone: string;
    role: UserRole;
    password?: string;
    assignedRoomId?: number;
    notes?: string;
  }): Promise<{ success: boolean; message: string; user?: AppUser }> => {
    const existing = users.find(u => u.email.toLowerCase() === data.email.toLowerCase());
    if (existing) {
      return {
        success: false,
        message: 'Email sudah terdaftar. Silakan login atau gunakan email lain.',
      };
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const newUser: AppUser = {
      id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: data.name,
      email: data.email.toLowerCase(),
      phone: data.phone,
      role: data.role,
      status: 'pending_approval', // STRICT: Requires Admin Approval
      password: data.password || 'password123',
      assignedRoomId: data.assignedRoomId,
      notes: data.notes || `Pendaftaran akun baru sebagai ${data.role}`,
      createdAt: todayStr,
      avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
    };

    setUsers(prev => [newUser, ...prev]);

    try {
      await setDoc(doc(db, 'users', newUser.id), cleanForFirestore(newUser));
    } catch (e) {
      console.warn('Firestore user sign up save notice:', e);
    }

    return {
      success: true,
      message: 'Pendaftaran berhasil! Akun Anda telah masuk antrian persetujuan Admin Enterprise.',
      user: newUser,
    };
  };

  const loginWithCredentials = async (
    email: string,
    password?: string
  ): Promise<{ success: boolean; message: string; user?: AppUser }> => {
    const normalizedEmail = email.trim().toLowerCase();
    const foundUser = users.find(u => u.email.toLowerCase() === normalizedEmail);

    if (!foundUser) {
      return {
        success: false,
        message: 'Akun dengan email ini tidak ditemukan. Silakan lakukan pendaftaran terlebih dahulu.',
      };
    }

    if (password && foundUser.password && foundUser.password !== password) {
      return {
        success: false,
        message: 'Kata sandi yang Anda masukkan salah. Silakan periksa kembali.',
      };
    }

    // CHECK ACCOUNT APPROVAL STATUS
    if (foundUser.status === 'pending_approval') {
      return {
        success: false,
        message: 'Akun Anda sedang dalam antrian peninjauan oleh Admin Enterprise. Anda baru dapat masuk setelah akun disetujui.',
        user: foundUser,
      };
    }

    if (foundUser.status === 'suspended') {
      return {
        success: false,
        message: 'Akun Anda telah dinonaktifkan sementara oleh Admin. Hubungi pihak pengelola.',
        user: foundUser,
      };
    }

    if (foundUser.status === 'rejected') {
      return {
        success: false,
        message: `Pendaftaran akun Anda ditolak oleh Admin. Alasan: ${foundUser.rejectionReason || 'Tidak memenuhi syarat dokumen.'}`,
        user: foundUser,
      };
    }

    // Update last login
    const updatedUser = {
      ...foundUser,
      lastLoginAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    setActiveAppUser(updatedUser);
    setRole(foundUser.role);
    if (foundUser.assignedRoomId) {
      setSelectedTenantRoomId(foundUser.assignedRoomId);
    }

    setUsers(prev => prev.map(u => (u.id === foundUser.id ? updatedUser : u)));

    // Record Audit Log for successful login
    addAuditLog({
      actorName: foundUser.name,
      actorEmail: foundUser.email,
      actorRole: foundUser.role,
      action: 'login',
      title: `Login Akun (${foundUser.role === 'superadmin' ? 'Super Admin' : foundUser.role === 'pemilik' ? 'Pemilik' : 'Penghuni'}) Berhasil`,
      description: `${foundUser.name} (${foundUser.email}) berhasil masuk ke sistem dengan hak akses ${foundUser.role}.`,
      status: 'success',
    });

    return {
      success: true,
      message: `Selamat datang kembali, ${foundUser.name}!`,
      user: updatedUser,
    };
  };

  const logoutAppUser = () => {
    if (activeAppUser) {
      addAuditLog({
        actorName: activeAppUser.name,
        actorEmail: activeAppUser.email,
        actorRole: activeAppUser.role,
        action: 'logout',
        title: `Logout Sesi Pengguna`,
        description: `${activeAppUser.name} (${activeAppUser.email}) telah keluar dari sistem.`,
        status: 'success',
      });
    }
    setActiveAppUser(null);
    setCurrentUser(null);
    setRole('penghuni');
    setSelectedTenantRoomId(1);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`${LOCAL_STORAGE_KEY}_ACTIVE_USER`);
    }
    signOutGoogleAuth().catch(() => {});
  };

  const approveUser = async (
    userId: string,
    assignedRoomId?: number,
    newRole?: UserRole,
    branchIdOrName?: string
  ) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;
    const finalRoomId = assignedRoomId !== undefined ? assignedRoomId : targetUser.assignedRoomId;
    const finalRole = newRole || targetUser.role;
    const matchedBranch = branches.find(b => 
      b.id === branchIdOrName || 
      b.name.toLowerCase() === (branchIdOrName || targetUser.kostBranch || '').toLowerCase() ||
      b.code.toLowerCase() === (branchIdOrName || targetUser.kostBranch || '').toLowerCase()
    ) || branches[0] || initialBranches[0];

    const finalBranchName = matchedBranch ? matchedBranch.name : (targetUser.kostBranch || 'Kost Griya Harmoni 8');
    const finalBranchId = matchedBranch ? matchedBranch.id : 'branch-01';

    const updatedUser: AppUser = {
      ...targetUser,
      status: 'active',
      approvedAt: todayStr,
      approvedBy: activeAppUser?.name || 'Super Admin Enterprise',
      role: finalRole,
      assignedRoomId: finalRoomId,
      kostBranch: finalBranchName,
    };

    setUsers(prev => prev.map(u => (u.id === userId ? updatedUser : u)));

    // Automatically check-in the approved tenant into the room if role is penghuni and room is set
    if (finalRole === 'penghuni' && finalRoomId) {
      const targetRoom = allRooms.find(r => r.id === finalRoomId && (r.branchId || 'branch-01') === finalBranchId) ||
                         allRooms.find(r => r.id === finalRoomId);

      if (targetRoom) {
        const updatedRoom: Room = {
          ...targetRoom,
          branchId: targetRoom.branchId || finalBranchId,
          status: 'terisi',
          tenant: {
            id: String(targetUser.id),
            roomId: targetRoom.id,
            branchId: targetRoom.branchId || finalBranchId,
            name: targetUser.name,
            phone: targetUser.phone,
            email: targetUser.email,
            identityNumber: '3201' + Math.floor(100000000000 + Math.random() * 900000000000),
            occupation: 'Penyewa Terdaftar',
            checkInDate: todayStr,
            contractDurationMonths: 12,
            status: 'active',
            emergencyContact: {
              name: 'Keluarga ' + targetUser.name.split(' ')[0],
              relationship: 'Keluarga',
              phone: '0812' + Math.floor(10000000 + Math.random() * 90000000),
            },
            notes: `Akun resmi disetujui Super Admin pada ${todayStr}`,
            avatarUrl: targetUser.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
          },
        };
        await updateRoom(updatedRoom);
      }
    }

    try {
      await setDoc(doc(db, 'users', userId), cleanForFirestore(updatedUser), { merge: true });
    } catch (e) {
      console.warn('Firestore approve user notice:', e);
    }

    addAuditLog({
      actorName: activeAppUser?.name || 'Super Admin Enterprise',
      actorEmail: activeAppUser?.email || 'admin@kosthub.com',
      actorRole: activeAppUser?.role || 'superadmin',
      action: 'approve_user',
      title: 'Persetujuan Pendaftaran Akun',
      description: `Menyetujui pendaftaran ${targetUser?.name || 'Pengguna'} (${targetUser?.email}) sebagai ${finalRole}${finalRoomId ? ` pada Kamar 0${finalRoomId}` : ''}.`,
      targetUser: `${targetUser?.name} (${targetUser?.email})`,
      status: 'success',
    });
  };

  const rejectUser = async (userId: string, reason?: string) => {
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;

    const updatedUser: AppUser = {
      ...targetUser,
      status: 'rejected',
      rejectionReason: reason || 'Dokumen atau data identitas tidak sesuai.',
    };

    setUsers(prev => prev.map(u => (u.id === userId ? updatedUser : u)));

    // Release any associated room if rejected
    const targetRoom = rooms.find(r => 
      (targetUser.assignedRoomId && r.id === targetUser.assignedRoomId) ||
      (targetUser.email && r.tenant?.email?.toLowerCase() === targetUser.email.toLowerCase())
    );

    if (targetRoom) {
      const resetRoom: Room = {
        ...targetRoom,
        status: 'kosong',
      };
      delete resetRoom.tenant;
      await updateRoom(resetRoom);
    }

    try {
      await setDoc(doc(db, 'users', userId), cleanForFirestore(updatedUser), { merge: true });
    } catch (e) {
      console.warn('Firestore reject user notice:', e);
    }

    addAuditLog({
      actorName: activeAppUser?.name || 'Super Admin Enterprise',
      actorEmail: activeAppUser?.email || 'admin@kosthub.com',
      actorRole: activeAppUser?.role || 'superadmin',
      action: 'reject_user',
      title: 'Penolakan Pendaftaran Akun',
      description: `Menolak pendaftaran ${targetUser.name} (${targetUser.email}). Alasan: ${reason || 'Data tidak sesuai'}.`,
      targetUser: `${targetUser.name} (${targetUser.email})`,
      status: 'warning',
    });
  };

  const updateUserStatus = async (userId: string, status: AccountStatus) => {
    setUsers(prev =>
      prev.map(u => (u.id === userId ? { ...u, status } : u))
    );

    if (status === 'suspended' || status === 'rejected') {
      const targetUser = users.find(u => u.id === userId);
      const targetRoom = rooms.find(r => 
        (targetUser?.assignedRoomId && r.id === targetUser.assignedRoomId) ||
        (targetUser?.email && r.tenant?.email?.toLowerCase() === targetUser.email.toLowerCase())
      );
      if (targetRoom) {
        const resetRoom: Room = {
          ...targetRoom,
          status: 'kosong',
        };
        delete resetRoom.tenant;
        await updateRoom(resetRoom);
      }
    }

    try {
      await setDoc(doc(db, 'users', userId), { status }, { merge: true });
    } catch (e) {
      console.warn('Firestore status update notice:', e);
    }
  };

  const updateUserRole = async (userId: string, role: UserRole) => {
    setUsers(prev =>
      prev.map(u => (u.id === userId ? { ...u, role } : u))
    );
    try {
      await setDoc(doc(db, 'users', userId), { role }, { merge: true });
    } catch (e) {
      console.warn('Firestore role update notice:', e);
    }
  };

  const updateUser = async (updated: AppUser) => {
    setUsers(prev => prev.map(u => (u.id === updated.id ? updated : u)));
    if (activeAppUser?.id === updated.id) {
      setActiveAppUser(updated);
    }
    try {
      await setDoc(doc(db, 'users', updated.id), cleanForFirestore(updated), { merge: true });
    } catch (e) {
      console.warn('Firestore user update notice:', e);
    }
  };

  const deleteUser = async (userId: string) => {
    const userToDelete = users.find(u => u.id === userId);
    // Protect primary Super Admin account from accidental deletion
    if (userToDelete?.id === 'usr-admin-01' || userToDelete?.role === 'superadmin') {
      console.warn('Proteksi: Akun Super Admin tidak dapat dihapus.');
      return;
    }
    setUsers(prev => prev.filter(u => u.id !== userId));

    // Release any associated room in state & Firestore
    const targetRoom = allRooms.find(r => 
      (userToDelete?.assignedRoomId && r.id === userToDelete.assignedRoomId) ||
      (userToDelete?.email && r.tenant?.email?.toLowerCase() === userToDelete.email.toLowerCase()) ||
      (userToDelete?.name && r.tenant?.name?.toLowerCase() === userToDelete.name.toLowerCase()) ||
      (r.tenant?.id === userId)
    );

    if (targetRoom) {
      const resetRoom: Room = {
        ...targetRoom,
        status: 'kosong',
      };
      delete resetRoom.tenant;
      await updateRoom(resetRoom);
    }

    try {
      await deleteDoc(doc(db, 'users', userId));
    } catch (e) {
      console.warn('Firestore user delete notice:', e);
    }

    if (userToDelete) {
      addAuditLog({
        actorName: activeAppUser?.name || 'Super Admin Enterprise',
        actorEmail: activeAppUser?.email || 'admin@kosthub.com',
        actorRole: activeAppUser?.role || 'superadmin',
        action: 'delete_user',
        title: 'Penghapusan Akun Pengguna',
        description: `Menghapus akun ${userToDelete.name} (${userToDelete.email}) dari sistem Enterprise.`,
        targetUser: `${userToDelete.name} (${userToDelete.email})`,
        status: 'danger',
      });
    }
  };

  return (
    <KostContext.Provider
      value={{
        role,
        setRole,
        selectedTenantRoomId,
        setSelectedTenantRoomId,
        rooms,
        allRooms,
        tenants,
        bookings,
        allBookings,
        invoices,
        allInvoices,
        expenses,
        allExpenses,
        tickets,
        allTickets,
        settings,
        activeReportMonth,
        setActiveReportMonth,
        isCloudConnected,
        firebaseProjectId: firebaseConfig.projectId,
        currentUser,
        isAuthLoading,
        authError,
        signInWithGoogleAuth,
        signOutGoogleAuth,
        clearAuthError,
        // Enterprise Users and Branches & Audit Logs
        users,
        branches,
        activeBranch,
        selectedBranchId,
        setSelectedBranchId,
        auditLogs,
        activeAppUser,
        setActiveAppUser,
        addAuditLog,
        clearAuditLogs,
        signUpUser,
        loginWithCredentials,
        logoutAppUser,
        approveUser,
        rejectUser,
        updateUserStatus,
        updateUserRole,
        updateUser,
        deleteUser,
        addBranch,
        updateBranch,
        deleteBranch,
        updateRoom,
        checkInTenant,
        checkOutTenant,
        deleteTenant,
        addBooking,
        updateBookingStatus,
        deleteBooking,
        addInvoice,
        updateInvoice,
        deleteInvoice,
        verifyPayment,
        submitTenantPayment,
        addExpense,
        updateExpense,
        deleteExpense,
        createTicket,
        updateTicketStatus,
        processTicket,
        deleteTicket,
        updateSettings,
        resetToDefaultData,
        clearAllDummyData,
        getMonthlySummary,
        availableMonths,
      }}
    >
      {children}
    </KostContext.Provider>
  );
};

export const useKost = () => {
  const context = useContext(KostContext);
  if (!context) {
    throw new Error('useKost must be used within a KostProvider');
  }
  return context;
};


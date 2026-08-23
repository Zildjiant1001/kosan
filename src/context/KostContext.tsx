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
} from '../types';
import {
  initialKostSettings,
  initialRooms,
  initialInvoices,
  initialExpenses,
  initialTickets,
  initialBookings,
  initialTenants,
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

interface MonthlySummary {
  month: string;
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  occupancyCount: number;
  totalRooms: number;
  occupancyRate: number;
  paidInvoicesCount: number;
  unpaidInvoicesCount: number;
  pendingInvoicesCount: number;
  expensesByCategory: Record<ExpenseCategory, number>;
  roomRevenues: { roomId: number; roomNumber: string; tenantName: string; amount: number; status: string; method?: string }[];
}

interface KostContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  selectedTenantRoomId: number;
  setSelectedTenantRoomId: (roomId: number) => void;
  rooms: Room[];
  tenants: Tenant[];
  bookings: RentalBooking[];
  invoices: Invoice[];
  expenses: Expense[];
  tickets: MaintenanceTicket[];
  settings: KostSettings;
  activeReportMonth: string;
  setActiveReportMonth: (month: string) => void;
  isCloudConnected: boolean;
  firebaseProjectId: string;
  
  // Google Auth
  currentUser: User | null;
  isAuthLoading: boolean;
  authError: string | null;
  signInWithGoogleAuth: () => Promise<void>;
  signOutGoogleAuth: () => Promise<void>;
  clearAuthError: () => void;
  
  // Actions
  updateRoom: (room: Room) => Promise<void>;
  checkInTenant: (roomId: number, tenant: Tenant, autoGenerateInvoice?: boolean) => Promise<void>;
  checkOutTenant: (roomId: number) => Promise<void>;
  addBooking: (booking: Omit<RentalBooking, 'id' | 'createdAt' | 'status'>) => Promise<string>;
  updateBookingStatus: (bookingId: string, status: BookingStatus) => Promise<void>;
  deleteBooking: (bookingId: string) => Promise<void>;
  addInvoice: (invoice: Omit<Invoice, 'id' | 'invoiceNumber'>) => Promise<void>;
  updateInvoice: (invoice: Invoice) => Promise<void>;
  deleteInvoice: (invoiceId: string) => Promise<void>;
  verifyPayment: (invoiceId: string, status: 'lunas' | 'ditolak', notes?: string) => Promise<void>;
  submitTenantPayment: (invoiceId: string, proofImageUrl: string, method: 'qris' | 'transfer_bank', qrisRef?: string) => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
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
  getMonthlySummary: (month: string) => MonthlySummary;
  availableMonths: string[];
}

const KostContext = createContext<KostContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'KOSTHUB_8_STATE_V2';

export const KostProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole>('pemilik');
  const [selectedTenantRoomId, setSelectedTenantRoomId] = useState<number>(1);
  const [activeReportMonth, setActiveReportMonth] = useState<string>(() => {
    const d = new Date();
    const mm = (d.getMonth() + 1).toString().padStart(2, '0');
    return `${d.getFullYear()}-${mm}`;
  });
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(false);
  const isInitialSyncDone = useRef(false);

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

  const signInWithGoogleAuth = async () => {
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      const user = await signInWithGoogle();
      setCurrentUser(user);
    } catch (err: any) {
      setAuthError(err.message || 'Gagal login dengan akun Google.');
      throw err;
    } finally {
      setIsAuthLoading(false);
    }
  };

  const signOutGoogleAuth = async () => {
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      await signOutUser();
      setCurrentUser(null);
    } catch (err: any) {
      setAuthError(err.message || 'Gagal keluar dari akun Google.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const clearAuthError = () => {
    setAuthError(null);
  };

  // Core Data loaded from localStorage or initial clean state
  const [rooms, setRooms] = useState<Room[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_ROOMS`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const map = new Map<number, Room>();
          parsed.forEach((r: Room) => {
            if (r && typeof r.id === 'number') {
              map.set(r.id, r);
            }
          });
          // Guarantee all 8 initial rooms are present
          const fullList = initialRooms.map(init => map.get(init.id) || init);
          fullList.sort((a, b) => a.id - b.id);
          return fullList;
        }
      }
    } catch (e) {
      console.warn('Failed parsing rooms from localStorage:', e);
    }
    return initialRooms;
  });

  const [tenants, setTenants] = useState<Tenant[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_TENANTS`);
    return saved ? JSON.parse(saved) : initialTenants;
  });

  const [bookings, setBookings] = useState<RentalBooking[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_BOOKINGS`);
    return saved ? JSON.parse(saved) : initialBookings;
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_INVOICES`);
    return saved ? JSON.parse(saved) : initialInvoices;
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_EXPENSES`);
    return saved ? JSON.parse(saved) : initialExpenses;
  });

  const [tickets, setTickets] = useState<MaintenanceTicket[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_TICKETS`);
    return saved ? JSON.parse(saved) : initialTickets;
  });

  const [settings, setSettings] = useState<KostSettings>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_SETTINGS`);
    return saved ? JSON.parse(saved) : initialKostSettings;
  });

  // Sync with LocalStorage
  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_ROOMS`, JSON.stringify(rooms));
  }, [rooms]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_TENANTS`, JSON.stringify(tenants));
  }, [tenants]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_BOOKINGS`, JSON.stringify(bookings));
  }, [bookings]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_INVOICES`, JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_EXPENSES`, JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_TICKETS`, JSON.stringify(tickets));
  }, [tickets]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_SETTINGS`, JSON.stringify(settings));
  }, [settings]);

  // Firestore Real-time Listeners and Auto-Seed
  useEffect(() => {
    let unsubscribeRooms = () => {};
    let unsubscribeTenants = () => {};
    let unsubscribeBookings = () => {};
    let unsubscribeInvoices = () => {};
    let unsubscribeExpenses = () => {};
    let unsubscribeTickets = () => {};
    let unsubscribeSettings = () => {};

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
                  loadedRoomsMap.set(r.id, r);
                }
              });
            }

            // Always guarantee all 8 rooms exist
            const completeRooms: Room[] = initialRooms.map(initRoom => {
              const fromDb = loadedRoomsMap.get(initRoom.id);
              if (fromDb) {
                return fromDb;
              }
              // If not in DB yet, auto-sync it to Firestore
              setDoc(doc(db, 'rooms', `room-${initRoom.id}`), cleanForFirestore(initRoom)).catch(e =>
                handleFirestoreError(e, OperationType.WRITE, 'rooms')
              );
              return initRoom;
            });

            completeRooms.sort((a, b) => a.id - b.id);
            setRooms(completeRooms);
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
              setBookings(loadedBookings);
              setIsCloudConnected(true);
            } else {
              setBookings([]);
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
              setInvoices(loadedInvoices);
              setIsCloudConnected(true);
            } else {
              setInvoices([]);
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
              setExpenses(loadedExpenses);
              setIsCloudConnected(true);
            } else {
              setExpenses([]);
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
              setTickets(loadedTickets);
              setIsCloudConnected(true);
            } else {
              setTickets([]);
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
    };
  }, []);

  // Actions with Firestore Sync
  const updateRoom = async (updatedRoom: Room) => {
    setRooms(prev => prev.map(r => (r.id === updatedRoom.id ? updatedRoom : r)));
    try {
      await setDoc(doc(db, 'rooms', `room-${updatedRoom.id}`), cleanForFirestore(updatedRoom), { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `rooms/room-${updatedRoom.id}`);
    }
  };

  const checkInTenant = async (roomId: number, tenant: Tenant, autoGenerateInvoice = true) => {
    const targetRoom = rooms.find(r => r.id === roomId);
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
      id: tenant.id || `t-${Date.now()}`,
      status: 'active',
    };

    const newRoomData: Room = {
      ...targetRoom,
      status: 'terisi',
      tenant: tenantRecord,
    };

    // Update Room state & Firestore
    setRooms(prev => prev.map(r => (r.id === roomId ? newRoomData : r)));
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
      const existing = invoices.find(inv => inv.roomId === roomId && inv.month === activeReportMonth);
      if (!existing) {
        const invNum = `INV/${activeReportMonth.replace('-', '')}/K0${roomId}`;
        const newInvoice: Invoice = {
          id: `inv-${Date.now()}`,
          invoiceNumber: invNum,
          roomId,
          roomNumber: targetRoom.roomNumber,
          tenantName: tenant.name,
          tenantPhone: tenant.phone,
          month: activeReportMonth,
          baseAmount: targetRoom.basePrice,
          additionalFees: [{ id: `f-${Date.now()}`, name: 'Iuran Kebersihan & Sampah', amount: 25000 }],
          totalAmount: targetRoom.basePrice + 25000,
          dueDate: `${activeReportMonth}-05`,
          status: 'belum_bayar',
          notes: `Tagihan sewa bulan pertama (${activeReportMonth}) saat check-in.`,
        };
        setInvoices(prev => [newInvoice, ...prev]);
        try {
          await setDoc(doc(db, 'invoices', newInvoice.id), cleanForFirestore(newInvoice));
        } catch (e) {
          handleFirestoreError(e, OperationType.CREATE, `invoices/${newInvoice.id}`);
        }
      }
    }
  };

  const checkOutTenant = async (roomId: number) => {
    const room = rooms.find(r => r.id === roomId);
    if (room) {
      const previousTenant = room.tenant;
      const updatedRoom: Room = {
        ...room,
        status: 'kosong',
      };
      delete updatedRoom.tenant;

      setRooms(prev => {
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

  // Booking / Permohonan Sewa Actions
  const addBooking = async (bookingData: Omit<RentalBooking, 'id' | 'createdAt' | 'status'>): Promise<string> => {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const bookingId = `book-${Date.now()}`;
    const newBooking: RentalBooking = {
      ...bookingData,
      id: bookingId,
      status: 'pending',
      createdAt: now,
    };

    setBookings(prev => [newBooking, ...prev]);
    try {
      await setDoc(doc(db, 'bookings', bookingId), cleanForFirestore(newBooking));
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `bookings/${bookingId}`);
    }
    return bookingId;
  };

  const updateBookingStatus = async (bookingId: string, status: BookingStatus) => {
    setBookings(prev => prev.map(b => (b.id === bookingId ? { ...b, status } : b)));
    try {
      await setDoc(doc(db, 'bookings', bookingId), { status }, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `bookings/${bookingId}`);
    }
  };

  const deleteBooking = async (bookingId: string) => {
    setBookings(prev => prev.filter(b => b.id !== bookingId));
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
      id: `inv-${Date.now()}`,
      invoiceNumber: invNum,
    };
    setInvoices(prev => [newInvoice, ...prev]);
    try {
      await setDoc(doc(db, 'invoices', newInvoice.id), cleanForFirestore(newInvoice));
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `invoices/${newInvoice.id}`);
    }
  };

  const updateInvoice = async (updatedInvoice: Invoice) => {
    setInvoices(prev => prev.map(inv => (inv.id === updatedInvoice.id ? updatedInvoice : inv)));
    try {
      await setDoc(doc(db, 'invoices', updatedInvoice.id), cleanForFirestore(updatedInvoice), { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `invoices/${updatedInvoice.id}`);
    }
  };

  const deleteInvoice = async (invoiceId: string) => {
    setInvoices(prev => prev.filter(i => i.id !== invoiceId));
    try {
      await deleteDoc(doc(db, 'invoices', invoiceId));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `invoices/${invoiceId}`);
    }
  };

  const verifyPayment = async (invoiceId: string, status: 'lunas' | 'ditolak', notes?: string) => {
    const now = new Date();
    const verifiedDateStr = now.toISOString().replace('T', ' ').substring(0, 19);

    const targetInvoice = invoices.find(i => i.id === invoiceId);
    if (targetInvoice) {
      const updatedInv: Invoice = {
        ...targetInvoice,
        status,
        paidDate: status === 'lunas' ? targetInvoice.paidDate || now.toISOString().split('T')[0] : undefined,
        verifiedAt: status === 'lunas' ? verifiedDateStr : undefined,
        verifiedBy: status === 'lunas' ? 'Pemilik Kos (Terverifikasi)' : undefined,
        notes: notes || (status === 'lunas' ? 'Pembayaran telah dikonfirmasi dan diverifikasi oleh pemilik.' : 'Pembayaran ditolak/bukti tidak sesuai.'),
      };

      setInvoices(prev => prev.map(inv => (inv.id === invoiceId ? updatedInv : inv)));

      try {
        await setDoc(doc(db, 'invoices', invoiceId), cleanForFirestore(updatedInv), { merge: true });
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `invoices/${invoiceId}`);
      }

      // If verified lunas, update room status if waiting payment
      if (status === 'lunas') {
        const room = rooms.find(r => r.id === targetInvoice.roomId);
        if (room && room.status === 'menunggu_pembayaran') {
          const updatedRoom: Room = { ...room, status: 'terisi' };
          setRooms(prev => prev.map(r => (r.id === targetInvoice.roomId ? updatedRoom : r)));
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
    const targetInvoice = invoices.find(i => i.id === invoiceId);
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

      setInvoices(prev => prev.map(inv => (inv.id === invoiceId ? updatedInv : inv)));

      try {
        await setDoc(doc(db, 'invoices', invoiceId), cleanForFirestore(updatedInv), { merge: true });
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `invoices/${invoiceId}`);
      }
    }
  };

  const addExpense = async (expenseData: Omit<Expense, 'id'>) => {
    const newExpense: Expense = {
      ...expenseData,
      id: `exp-${Date.now()}`,
    };
    setExpenses(prev => [newExpense, ...prev]);
    try {
      await setDoc(doc(db, 'expenses', newExpense.id), cleanForFirestore(newExpense));
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `expenses/${newExpense.id}`);
    }
  };

  const deleteExpense = async (expenseId: string) => {
    setExpenses(prev => prev.filter(e => e.id !== expenseId));
    try {
      await deleteDoc(doc(db, 'expenses', expenseId));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `expenses/${expenseId}`);
    }
  };

  const createTicket = async (ticketData: Omit<MaintenanceTicket, 'id' | 'ticketNumber' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const count = tickets.length + 1;
    const ticketNumber = `TKT-${new Date().getFullYear()}-${count.toString().padStart(3, '0')}`;
    const newTicket: MaintenanceTicket = {
      ...ticketData,
      id: `tkt-${Date.now()}`,
      ticketNumber,
      createdAt: now,
      updatedAt: now,
    };
    setTickets(prev => [newTicket, ...prev]);
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
    const target = tickets.find(t => t.id === ticketId);
    if (!target) return;

    const completionDate = data.status === 'selesai' ? (data.completionDate || now) : target.completionDate;

    const updatedTicket: MaintenanceTicket = {
      ...target,
      status: data.status,
      technicianName: data.technicianName !== undefined ? data.technicianName : target.technicianName,
      technicianPhone: data.technicianPhone !== undefined ? data.technicianPhone : target.technicianPhone,
      scheduledDate: data.scheduledDate !== undefined ? data.scheduledDate : target.scheduledDate,
      cost: data.cost !== undefined ? data.cost : target.cost,
      actionNotes: data.actionNotes !== undefined ? data.actionNotes : target.actionNotes,
      completionDate,
      autoRecordExpense: data.autoRecordExpense !== undefined ? data.autoRecordExpense : target.autoRecordExpense,
      updatedAt: now,
    };

    setTickets(prev => prev.map(t => (t.id === ticketId ? updatedTicket : t)));

    try {
      await setDoc(doc(db, 'tickets', ticketId), cleanForFirestore(updatedTicket), { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `tickets/${ticketId}`);
    }

    // If cost was incurred, status resolved, and auto-record expense is enabled
    const shouldRecordExpense = data.autoRecordExpense !== false;
    const finalCost = data.cost !== undefined ? data.cost : target.cost;
    if (finalCost && finalCost > 0 && data.status === 'selesai' && shouldRecordExpense) {
      const expCategory = target.category === 'ac' ? 'maintenance_ac' : 'perbaikan_fasilitas';
      addExpense({
        date: now.split(' ')[0],
        month: now.split(' ')[0].substring(0, 7),
        category: expCategory,
        title: `Perbaikan [${target.ticketNumber}] ${target.title} (${target.roomNumber})`,
        amount: finalCost,
        paidTo: data.technicianName || target.technicianName || 'Teknisi / Tukang',
        notes: data.actionNotes || target.actionNotes || `Penanganan keluhan ${target.title}`,
      });
    }
  };

  const deleteTicket = async (ticketId: string) => {
    setTickets(prev => prev.filter(t => t.id !== ticketId));
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

  const clearAllDummyData = async () => {
    // Clear all dummy records in local state & Firestore
    const cleanRooms = initialRooms.map(r => {
      const cleaned = { ...r, status: 'kosong' as const };
      delete cleaned.tenant;
      return cleaned;
    });
    setRooms(cleanRooms);
    setTenants([]);
    setBookings([]);
    setInvoices([]);
    setExpenses([]);
    setTickets([]);
    setSettings(initialKostSettings);

    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_ROOMS`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_TENANTS`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_BOOKINGS`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_INVOICES`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_EXPENSES`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_TICKETS`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_SETTINGS`);

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
      ...invoices.map(i => i.month),
      ...expenses.map(e => e.month),
    ])
  ).sort((a, b) => b.localeCompare(a));

  // Compute monthly report summary
  const getMonthlySummary = (month: string): MonthlySummary => {
    const monthInvoices = invoices.filter(i => i.month === month);
    const monthExpenses = expenses.filter(e => e.month === month);

    const paidInvoices = monthInvoices.filter(i => i.status === 'lunas');
    const unpaidInvoices = monthInvoices.filter(i => i.status === 'belum_bayar');
    const pendingInvoices = monthInvoices.filter(i => i.status === 'menunggu_verifikasi');

    const totalIncome = paidInvoices.reduce((sum, i) => sum + i.totalAmount, 0);
    const totalExpense = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalIncome - totalExpense;

    const occupiedRooms = rooms.filter(r => r.status === 'terisi' || r.status === 'menunggu_pembayaran').length;
    const occupancyRate = Math.round((occupiedRooms / 8) * 100);

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

    const roomRevenues = rooms.map(room => {
      const inv = monthInvoices.find(i => i.roomId === room.id);
      return {
        roomId: room.id,
        roomNumber: room.roomNumber,
        tenantName: room.tenant?.name || (room.status === 'kosong' ? 'Kosong' : 'Belum Ada Penyewa'),
        amount: inv ? inv.totalAmount : room.basePrice,
        status: inv ? inv.status : (room.status === 'kosong' ? 'kosong' : 'belum_bayar'),
        method: inv?.paymentMethod,
      };
    });

    return {
      month,
      totalIncome,
      totalExpense,
      netProfit,
      occupancyCount: occupiedRooms,
      totalRooms: 8,
      occupancyRate,
      paidInvoicesCount: paidInvoices.length,
      unpaidInvoicesCount: unpaidInvoices.length,
      pendingInvoicesCount: pendingInvoices.length,
      expensesByCategory,
      roomRevenues,
    };
  };

  return (
    <KostContext.Provider
      value={{
        role,
        setRole,
        selectedTenantRoomId,
        setSelectedTenantRoomId,
        rooms,
        tenants,
        bookings,
        invoices,
        expenses,
        tickets,
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
        updateRoom,
        checkInTenant,
        checkOutTenant,
        addBooking,
        updateBookingStatus,
        deleteBooking,
        addInvoice,
        updateInvoice,
        deleteInvoice,
        verifyPayment,
        submitTenantPayment,
        addExpense,
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

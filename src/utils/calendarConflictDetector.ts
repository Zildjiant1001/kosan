import {
  Room,
  Tenant,
  RentalBooking,
  EnterpriseBranch,
  CalendarConflict,
  ConflictResolutionOption,
  ConflictType,
  ConflictSeverity,
} from '../types';

/**
 * Helper to calculate Indonesian date format
 */
const formatIndonesianDate = (dateStr?: string) => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

/**
 * Detects all calendar conflicts, double bookings, and tenant overlaps
 */
export const detectCalendarConflicts = (
  rooms: Room[],
  tenants: Tenant[],
  activeTenants: (Tenant & { roomNumber: string; roomType: string; branchId?: string; branchName?: string })[],
  allBookings: RentalBooking[],
  branches: EnterpriseBranch[] = []
): CalendarConflict[] => {
  const conflicts: CalendarConflict[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getBranchName = (branchId?: string) => {
    if (!branchId) return 'KostHub Pusat';
    const found = branches.find(b => b.id === branchId || b.name === branchId);
    return found ? found.name : branchId;
  };

  // Only consider active/pending bookings (not rejected or already fully checked in)
  const relevantBookings = allBookings.filter(
    b => b.status === 'pending' || b.status === 'survey_dijadwalkan' || b.status === 'disetujui'
  );

  // Group bookings by room
  const bookingsByRoom = new Map<number, RentalBooking[]>();
  relevantBookings.forEach(b => {
    const list = bookingsByRoom.get(b.roomId) || [];
    list.push(b);
    bookingsByRoom.set(b.roomId, list);
  });

  rooms.forEach(room => {
    const roomBranchName = getBranchName(room.branchId);
    const roomBookings = bookingsByRoom.get(room.id) || [];
    const activeTenant = activeTenants.find(at => at.roomId === room.id);

    // ----------------------------------------------------
    // 1. CHECK FOR DOUBLE BOOKINGS (Multiple Bookings on Same Room)
    // ----------------------------------------------------
    if (roomBookings.length > 1) {
      for (let i = 0; i < roomBookings.length; i++) {
        for (let j = i + 1; j < roomBookings.length; j++) {
          const b1 = roomBookings[i];
          const b2 = roomBookings[j];

          const start1 = new Date(b1.targetMoveDate || b1.createdAt.split(' ')[0] || '2026-01-01');
          const end1 = new Date(start1);
          end1.setMonth(end1.getMonth() + (b1.durationMonths || 6));

          const start2 = new Date(b2.targetMoveDate || b2.createdAt.split(' ')[0] || '2026-01-01');
          const end2 = new Date(start2);
          end2.setMonth(end2.getMonth() + (b2.durationMonths || 6));

          // Check date overlap
          if (start1 <= end2 && end1 >= start2) {
            const overlapStart = start1 > start2 ? start1 : start2;
            const overlapEnd = end1 < end2 ? end1 : end2;
            const overlapDays = Math.max(1, Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24)));

            const isOneApproved = b1.status === 'disetujui' || b2.status === 'disetujui';
            const bothApproved = b1.status === 'disetujui' && b2.status === 'disetujui';
            const severity: ConflictSeverity = bothApproved ? 'critical' : isOneApproved ? 'critical' : 'high';

            // Find vacant alternative room of same or compatible type
            const vacantAltRoom = rooms.find(
              r => r.id !== room.id && 
              r.status === 'kosong' && 
              !activeTenants.some(at => at.roomId === r.id) &&
              (!bookingsByRoom.get(r.id) || bookingsByRoom.get(r.id)!.length === 0)
            );

            // Calculate shift date for booking 2 (after booking 1 ends)
            const shiftDateObj = new Date(end1);
            shiftDateObj.setDate(shiftDateObj.getDate() + 1);
            const suggestedShiftDate = shiftDateObj.toISOString().split('T')[0];

            const daysUntilMoveIn = Math.ceil((start2.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            const isEscalated = daysUntilMoveIn <= 3 || bothApproved;

            const resolutionOptions: ConflictResolutionOption[] = [];

            // Resolution 1: Reallocate Booking 2 to alternative vacant room
            if (vacantAltRoom) {
              resolutionOptions.push({
                id: `res-realloc-${b2.id}`,
                title: `Relokasi Booking ${b2.name} ke ${vacantAltRoom.roomNumber}`,
                description: `Pindahkan pemesanan ${b2.name} ke ${vacantAltRoom.roomNumber} (${vacantAltRoom.type} - Rp${vacantAltRoom.basePrice.toLocaleString('id-ID')}/bln) yang saat ini berstatus kosong.`,
                actionType: 'REALLOCATE_ROOM',
                targetEntityId: b2.id,
                targetEntityType: 'booking',
                recommended: true,
                confidenceScore: 98,
                isAutoExecutable: true,
                suggestedRoomId: vacantAltRoom.id,
                suggestedRoomNumber: vacantAltRoom.roomNumber,
                suggestedRoomType: vacantAltRoom.type,
                whatsappRecipientPhone: b2.phone,
                whatsappRecipientName: b2.name,
                whatsappTemplate: `Halo Kak ${b2.name}, terkait permohonan sewa di KostHub (${roomBranchName}), kami telah mengalokasikan kamar ${vacantAltRoom.roomNumber} (${vacantAltRoom.type}) yang nyaman dan siap huni untuk Kakak. Mohon konfirmasi jadwal survey/check-in ya! Terima kasih.`,
              });
            }

            // Resolution 2: Prioritize Approved / First Booking & Reject Duplicate
            const priorityBooking = b1.status === 'disetujui' ? b1 : b1.createdAt <= b2.createdAt ? b1 : b2;
            const secondaryBooking = priorityBooking.id === b1.id ? b2 : b1;
            resolutionOptions.push({
              id: `res-prioritize-${priorityBooking.id}`,
              title: `Prioritaskan ${priorityBooking.name} & Batalkan ${secondaryBooking.name}`,
              description: `${priorityBooking.name} mendaftar lebih awal (${formatIndonesianDate(priorityBooking.createdAt.split(' ')[0])}). Setujui pemesanan ini dan batalkan pemesanan bentrok dengan notifikasi sopan.`,
              actionType: 'PRIORITIZE_FIRST_BOOKING',
              targetEntityId: secondaryBooking.id,
              targetEntityType: 'booking',
              recommended: !vacantAltRoom,
              confidenceScore: 88,
              isAutoExecutable: true,
              suggestedStatus: 'ditolak',
              whatsappRecipientPhone: secondaryBooking.phone,
              whatsappRecipientName: secondaryBooking.name,
              whatsappTemplate: `Halo Kak ${secondaryBooking.name}, mohon maaf untuk ${room.roomNumber} saat ini telah terisi/terkonfirmasi oleh penyewa lain. Kami akan segera menghubungi Kakak jika ada unit serupa yang kembali tersedia di ${roomBranchName}. Terima kasih atas pengertiannya.`,
            });

            // Resolution 3: Shift move-in date
            resolutionOptions.push({
              id: `res-shift-${b2.id}`,
              title: `Sesuaikan Tanggal Masuk ${b2.name} ke ${formatIndonesianDate(suggestedShiftDate)}`,
              description: `Ubah tanggal mulai sewa ${b2.name} menjadi setelah periode kontrak ${b1.name} selesai (+1 hari jeda pembersihan kamar).`,
              actionType: 'SHIFT_MOVE_IN_DATE',
              targetEntityId: b2.id,
              targetEntityType: 'booking',
              recommended: false,
              confidenceScore: 78,
              isAutoExecutable: true,
              suggestedNewDate: suggestedShiftDate,
              whatsappRecipientPhone: b2.phone,
              whatsappRecipientName: b2.name,
              whatsappTemplate: `Halo Kak ${b2.name}, untuk ${room.roomNumber}, unit siap ditempati mulai tanggal ${formatIndonesianDate(suggestedShiftDate)} setelah periode sewa sebelumnya selesai & dibersihkan. Apakah Kakak bersedia menyesuaikan tanggal masuk?`,
            });

            conflicts.push({
              id: `conflict-double-${b1.id}-${b2.id}`,
              type: 'DOUBLE_BOOKING',
              severity,
              title: `Double-Booking di ${room.roomNumber} (${b1.name} vs ${b2.name})`,
              description: `Dua pemohon sewa memesan kamar yang sama pada rentang waktu yang bertabrakan (${formatIndonesianDate(overlapStart.toISOString().split('T')[0])} s/d ${formatIndonesianDate(overlapEnd.toISOString().split('T')[0])}).`,
              roomId: room.id,
              roomNumber: room.roomNumber,
              roomType: room.type,
              branchId: room.branchId,
              branchName: roomBranchName,
              startDate: overlapStart.toISOString().split('T')[0],
              endDate: overlapEnd.toISOString().split('T')[0],
              overlapDays,
              partyA: {
                id: b1.id,
                type: 'booking',
                name: b1.name,
                phone: b1.phone,
                email: b1.email,
                status: b1.status === 'disetujui' ? 'Disetujui' : b1.status === 'survey_dijadwalkan' ? 'Survey Terjadwal' : 'Pending',
                startDate: b1.targetMoveDate || b1.createdAt.split(' ')[0],
                endDate: end1.toISOString().split('T')[0],
                durationMonths: b1.durationMonths || 6,
              },
              partyB: {
                id: b2.id,
                type: 'booking',
                name: b2.name,
                phone: b2.phone,
                email: b2.email,
                status: b2.status === 'disetujui' ? 'Disetujui' : b2.status === 'survey_dijadwalkan' ? 'Survey Terjadwal' : 'Pending',
                startDate: b2.targetMoveDate || b2.createdAt.split(' ')[0],
                endDate: end2.toISOString().split('T')[0],
                durationMonths: b2.durationMonths || 6,
              },
              isEscalated,
              escalationReason: isEscalated ? (bothApproved ? 'Kedua permohonan telah berstatus Disetujui' : 'Jadwal masuk kurang dari 3 hari') : undefined,
              resolutionOptions,
              detectedAt: new Date().toISOString(),
            });
          }
        }
      }
    }

    // ----------------------------------------------------
    // 2. CHECK FOR TENANT - BOOKING OVERLAP (Booking Overlaps with Active Tenant)
    // ----------------------------------------------------
    if (activeTenant && roomBookings.length > 0) {
      const tenantCheckIn = new Date(activeTenant.checkInDate || '2026-01-01');
      const tenantContractMonths = activeTenant.contractDurationMonths || 12;
      const tenantContractEnd = new Date(tenantCheckIn);
      tenantContractEnd.setMonth(tenantContractEnd.getMonth() + tenantContractMonths);

      roomBookings.forEach(booking => {
        const bookingStart = new Date(booking.targetMoveDate || booking.createdAt.split(' ')[0] || '2026-01-01');
        const bookingEnd = new Date(bookingStart);
        bookingEnd.setMonth(bookingEnd.getMonth() + (booking.durationMonths || 6));

        // If booking starts before tenant contract end date
        if (bookingStart < tenantContractEnd) {
          const overlapDays = Math.max(1, Math.ceil((tenantContractEnd.getTime() - bookingStart.getTime()) / (1000 * 60 * 60 * 24)));
          const isBookingApproved = booking.status === 'disetujui';
          const severity: ConflictSeverity = isBookingApproved ? 'critical' : 'high';

          const vacantAltRoom = rooms.find(
            r => r.id !== room.id && 
            r.status === 'kosong' && 
            !activeTenants.some(at => at.roomId === r.id) &&
            (!bookingsByRoom.get(r.id) || bookingsByRoom.get(r.id)!.length === 0)
          );

          const shiftDateObj = new Date(tenantContractEnd);
          shiftDateObj.setDate(shiftDateObj.getDate() + 1);
          const suggestedShiftDate = shiftDateObj.toISOString().split('T')[0];

          const daysUntilMoveIn = Math.ceil((bookingStart.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          const isEscalated = daysUntilMoveIn <= 5 || isBookingApproved;

          const resolutionOptions: ConflictResolutionOption[] = [];

          // Resolution 1: Reallocate booking to alternative vacant room
          if (vacantAltRoom) {
            resolutionOptions.push({
              id: `res-overlap-realloc-${booking.id}`,
              title: `Relokasi Booking ${booking.name} ke ${vacantAltRoom.roomNumber} (Kosong)`,
              description: `Pindahkan pemesanan ${booking.name} ke ${vacantAltRoom.roomNumber} (${vacantAltRoom.type}) karena ${room.roomNumber} masih dihuni aktif oleh ${activeTenant.name} hingga ${formatIndonesianDate(tenantContractEnd.toISOString().split('T')[0])}.`,
              actionType: 'REALLOCATE_ROOM',
              targetEntityId: booking.id,
              targetEntityType: 'booking',
              recommended: true,
              confidenceScore: 96,
              isAutoExecutable: true,
              suggestedRoomId: vacantAltRoom.id,
              suggestedRoomNumber: vacantAltRoom.roomNumber,
              suggestedRoomType: vacantAltRoom.type,
              whatsappRecipientPhone: booking.phone,
              whatsappRecipientName: booking.name,
              whatsappTemplate: `Halo Kak ${booking.name}, agar proses check-in berjalan lancar, unit sewa dialihkan ke ${vacantAltRoom.roomNumber} (${vacantAltRoom.type} - ${roomBranchName}) yang bersih dan siap huni. Fasilitas dan harga tetap sesuai. Mohon konfirmasinya ya Kak!`,
            });
          }

          // Resolution 2: Shift Move-In Date after tenant checkout
          resolutionOptions.push({
            id: `res-overlap-shift-${booking.id}`,
            title: `Geser Tanggal Masuk ke ${formatIndonesianDate(suggestedShiftDate)}`,
            description: `Tunda tanggal masuk ${booking.name} hingga masa sewa ${activeTenant.name} berakhir dan kamar selesai dibersihkan.`,
            actionType: 'SHIFT_MOVE_IN_DATE',
            targetEntityId: booking.id,
            targetEntityType: 'booking',
            recommended: !vacantAltRoom,
            confidenceScore: 82,
            isAutoExecutable: true,
            suggestedNewDate: suggestedShiftDate,
            whatsappRecipientPhone: booking.phone,
            whatsappRecipientName: booking.name,
            whatsappTemplate: `Halo Kak ${booking.name}, untuk ${room.roomNumber}, kamar saat ini masih dihuni hingga ${formatIndonesianDate(tenantContractEnd.toISOString().split('T')[0])}. Kamar siap ditempati mulai ${formatIndonesianDate(suggestedShiftDate)}. Apakah Kakak berkenan dengan tanggal tersebut?`,
          });

          // Resolution 3: Ask Current Tenant about Checkout / Renewal
          resolutionOptions.push({
            id: `res-overlap-confirm-${activeTenant.id}`,
            title: `Cek Kepastian Checkout ke Penghuni (${activeTenant.name})`,
            description: `Kirim pesan WhatsApp otomatis ke ${activeTenant.name} untuk memastikan apakah akan checkout tepat waktu pada ${formatIndonesianDate(tenantContractEnd.toISOString().split('T')[0])} atau memperpanjang sewa.`,
            actionType: 'CONFIRM_CHECKOUT_EXTENSION',
            targetEntityId: String(activeTenant.id),
            targetEntityType: 'tenant',
            recommended: false,
            confidenceScore: 75,
            isAutoExecutable: false,
            whatsappRecipientPhone: activeTenant.phone,
            whatsappRecipientName: activeTenant.name,
            whatsappTemplate: `Halo Kak ${activeTenant.name} (${room.roomNumber}), mengingatkan masa kontrak sewa berakhir pada ${formatIndonesianDate(tenantContractEnd.toISOString().split('T')[0])}. Apakah Kakak berencana memperpanjang sewa atau melakukan check-out sesuai jadwal? Terima kasih.`,
          });

          conflicts.push({
            id: `conflict-tenant-booking-${activeTenant.id}-${booking.id}`,
            type: 'TENANT_BOOKING_OVERLAP',
            severity,
            title: `Tumpang Tindih Sewa di ${room.roomNumber}: ${activeTenant.name} & ${booking.name}`,
            description: `Pemohon sewa (${booking.name}) menargetkan masuk pada ${formatIndonesianDate(bookingStart.toISOString().split('T')[0])}, namun kamar masih dihuni aktif oleh ${activeTenant.name} sampai ${formatIndonesianDate(tenantContractEnd.toISOString().split('T')[0])} (${overlapDays} hari bertabrakan).`,
            roomId: room.id,
            roomNumber: room.roomNumber,
            roomType: room.type,
            branchId: room.branchId,
            branchName: roomBranchName,
            startDate: bookingStart.toISOString().split('T')[0],
            endDate: tenantContractEnd.toISOString().split('T')[0],
            overlapDays,
            partyA: {
              id: String(activeTenant.id),
              type: 'tenant',
              name: activeTenant.name,
              phone: activeTenant.phone,
              email: activeTenant.email,
              status: 'Penghuni Aktif',
              startDate: activeTenant.checkInDate || '2026-01-01',
              endDate: tenantContractEnd.toISOString().split('T')[0],
              durationMonths: tenantContractMonths,
              avatarUrl: activeTenant.avatarUrl,
            },
            partyB: {
              id: booking.id,
              type: 'booking',
              name: booking.name,
              phone: booking.phone,
              email: booking.email,
              status: booking.status === 'disetujui' ? 'Booking Disetujui' : 'Permohonan Masuk',
              startDate: booking.targetMoveDate || booking.createdAt.split(' ')[0],
              endDate: bookingEnd.toISOString().split('T')[0],
              durationMonths: booking.durationMonths || 6,
            },
            isEscalated,
            escalationReason: isEscalated ? (isBookingApproved ? 'Booking sudah disetujui padahal kamar masih terisi' : 'Jadwal masuk mendesak (H-5)') : undefined,
            resolutionOptions,
            detectedAt: new Date().toISOString(),
          });
        }
      });
    }

    // ----------------------------------------------------
    // 3. CHECK FOR TIGHT TURNAROUND (Move-in on same day or 0-day cleaning buffer)
    // ----------------------------------------------------
    if (activeTenant && roomBookings.length > 0) {
      const tenantCheckIn = new Date(activeTenant.checkInDate || '2026-01-01');
      const tenantContractMonths = activeTenant.contractDurationMonths || 12;
      const tenantContractEnd = new Date(tenantCheckIn);
      tenantContractEnd.setMonth(tenantContractEnd.getMonth() + tenantContractMonths);

      roomBookings.forEach(booking => {
        const bookingStart = new Date(booking.targetMoveDate || booking.createdAt.split(' ')[0] || '2026-01-01');
        const diffTime = bookingStart.getTime() - tenantContractEnd.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
          const shiftDateObj = new Date(tenantContractEnd);
          shiftDateObj.setDate(shiftDateObj.getDate() + 1);
          const suggestedShiftDate = shiftDateObj.toISOString().split('T')[0];

          conflicts.push({
            id: `conflict-turnaround-${room.id}-${booking.id}`,
            type: 'TURNAROUND_TIGHT',
            severity: 'medium',
            title: `Jeda Pembersihan 0 Hari di ${room.roomNumber} (${booking.name})`,
            description: `Penghuni lama (${activeTenant.name}) checkout pada tanggal yang sama persis dengan jadwal masuk ${booking.name} (${formatIndonesianDate(booking.targetMoveDate)}). Berisiko keterlambatan serah terima kamar.`,
            roomId: room.id,
            roomNumber: room.roomNumber,
            roomType: room.type,
            branchId: room.branchId,
            branchName: roomBranchName,
            startDate: booking.targetMoveDate || '',
            endDate: booking.targetMoveDate || '',
            overlapDays: 1,
            partyA: {
              id: String(activeTenant.id),
              type: 'tenant',
              name: activeTenant.name,
              phone: activeTenant.phone,
              status: 'Penghuni Aktif (Checkout)',
              startDate: activeTenant.checkInDate || '',
              endDate: tenantContractEnd.toISOString().split('T')[0],
              durationMonths: tenantContractMonths,
              avatarUrl: activeTenant.avatarUrl,
            },
            partyB: {
              id: booking.id,
              type: 'booking',
              name: booking.name,
              phone: booking.phone,
              status: 'Permohonan Masuk',
              startDate: booking.targetMoveDate || '',
              endDate: '',
              durationMonths: booking.durationMonths || 6,
            },
            isEscalated: false,
            resolutionOptions: [
              {
                id: `res-buffer-shift-${booking.id}`,
                title: `Beri Jeda 1 Hari Pembersihan (Masuk ${formatIndonesianDate(suggestedShiftDate)})`,
                description: `Beri waktu bagi staf kebersihan untuk deep-cleaning dan cek fasilitas AC kamar sebelum penghuni baru masuk.`,
                actionType: 'SHIFT_MOVE_IN_DATE',
                targetEntityId: booking.id,
                targetEntityType: 'booking',
                recommended: true,
                confidenceScore: 92,
                isAutoExecutable: true,
                suggestedNewDate: suggestedShiftDate,
                whatsappRecipientPhone: booking.phone,
                whatsappRecipientName: booking.name,
                whatsappTemplate: `Halo Kak ${booking.name}, demi kenyamanan dan kebersihan maksimal unit ${room.roomNumber}, check-in dijadwalkan pada ${formatIndonesianDate(suggestedShiftDate)} pukul 13.00 WIB setelah tim melakukan pembersihan menyeluruh. Terima kasih!`,
              },
            ],
            detectedAt: new Date().toISOString(),
          });
        }
      });
    }

    // ----------------------------------------------------
    // 4. ROOM STATUS MISMATCH CHECK
    // ----------------------------------------------------
    if (room.status === 'kosong' && activeTenant) {
      conflicts.push({
        id: `conflict-mismatch-${room.id}`,
        type: 'ROOM_STATUS_MISMATCH',
        severity: 'medium',
        title: `Status Kamar ${room.roomNumber} Tidak Sinkron (Kosong vs Dihuni)`,
        description: `Kamar ${room.roomNumber} tercatat 'Kosong' di sistem tetapi memiliki penghuni aktif (${activeTenant.name}).`,
        roomId: room.id,
        roomNumber: room.roomNumber,
        roomType: room.type,
        branchId: room.branchId,
        branchName: roomBranchName,
        startDate: activeTenant.checkInDate || '',
        endDate: '',
        overlapDays: 0,
        partyA: {
          id: String(activeTenant.id),
          type: 'tenant',
          name: activeTenant.name,
          phone: activeTenant.phone,
          status: 'Penghuni Aktif',
          startDate: activeTenant.checkInDate || '',
          endDate: '',
          durationMonths: activeTenant.contractDurationMonths || 12,
        },
        isEscalated: false,
        resolutionOptions: [
          {
            id: `res-sync-status-${room.id}`,
            title: `Sinkronkan Status ${room.roomNumber} Menjadi 'Terisi'`,
            description: `Ubah status kamar di database agar sesuai dengan okupansi nyata penghuni.`,
            actionType: 'SYNC_ROOM_STATUS',
            targetEntityId: String(room.id),
            targetEntityType: 'room',
            recommended: true,
            confidenceScore: 99,
            isAutoExecutable: true,
            suggestedStatus: 'terisi',
          },
        ],
        detectedAt: new Date().toISOString(),
      });
    }
  });

  // Sort conflicts by severity (critical > high > medium > low) and then by start date
  const severityOrder: Record<ConflictSeverity, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };

  return conflicts.sort((a, b) => {
    if (severityOrder[a.severity] !== severityOrder[b.severity]) {
      return severityOrder[a.severity] - severityOrder[b.severity];
    }
    return a.startDate.localeCompare(b.startDate);
  });
};

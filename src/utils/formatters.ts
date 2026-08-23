/**
 * Utilities for formatting currency, dates, WhatsApp reminder messages, and QRIS payloads.
 */

export const formatRupiah = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatNumber = (amount: number): string => {
  return new Intl.NumberFormat('id-ID').format(amount);
};

export const formatIndonesianDate = (dateString: string): string => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
};

export const formatIndonesianMonthYear = (monthString: string): string => {
  if (!monthString) return '-';
  try {
    const [year, month] = monthString.split('-');
    const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
    return new Intl.DateTimeFormat('id-ID', {
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch {
    return monthString;
  }
};

export const getMonthName = (monthIndex: number): string => {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return months[monthIndex] || '';
};

export const generateWhatsAppReminderUrl = (
  tenantPhone: string,
  tenantName: string,
  roomNumber: string,
  month: string,
  totalAmount: number,
  dueDate: string,
  kostName: string,
  qrisMerchantName: string
): string => {
  // Clean phone number (replace leading 0 with 62)
  let cleanPhone = tenantPhone.replace(/[^0-9]/g, '');
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '62' + cleanPhone.slice(1);
  }

  const formattedMonth = formatIndonesianMonthYear(month);
  const formattedAmount = formatRupiah(totalAmount);
  const formattedDueDate = formatIndonesianDate(dueDate);

  const message = `Halo Kak ${tenantName} (${roomNumber}),
Semoga sehat dan beraktivitas lancar selalu 🙏

Kami dari pengelola *${kostName}* ingin menginfokan rincian tagihan sewa kos periode *${formattedMonth}*:
━━━━━━━━━━━━━━━━━━━━
🏠 *Unit:* ${roomNumber}
💰 *Total Tagihan:* ${formattedAmount}
📅 *Jatuh Tempo:* ${formattedDueDate}
━━━━━━━━━━━━━━━━━━━━
Pembayaran dapat dilakukan dengan mudah & instan melalui *QRIS (${qrisMerchantName})* atau Transfer Bank melalui aplikasi web KostHub.

Setelah melakukan pembayaran, mohon unggah bukti pembayaran di portal aplikasi / balas pesan ini. Terima kasih banyak atas kerjasamanya! 🙏✨`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
};

/**
 * Generates an EMVCo compliant-like dynamic QRIS payload string for Indonesian QR standards
 */
export const generateDynamicQRISPayload = (
  nmid: string,
  merchantName: string,
  city: string,
  amount: number,
  invoiceNo: string
): string => {
  const paddedAmount = amount.toString();
  return `00020101021226610014ID.LINKAJA.WWW01189360001000000000000215${nmid}0303UME51440014ID.CO.QRIS.WWW0215ID10200889988770303UME520458125303360540${paddedAmount.length.toString().padStart(2, '0')}${paddedAmount}5802ID59${merchantName.length.toString().padStart(2, '0')}${merchantName}60${city.length.toString().padStart(2, '0')}${city}62${(invoiceNo.length + 4).toString().padStart(2, '0')}010${invoiceNo.length.toString().padStart(2, '0')}${invoiceNo}6304ABCD`;
};

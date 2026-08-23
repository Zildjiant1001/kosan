import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import { Invoice, KostSettings } from '../types';
import { formatRupiah, formatIndonesianDate, generateDynamicQRISPayload } from '../utils/formatters';
import {
  X,
  QrCode,
  Copy,
  CheckCircle2,
  Upload,
  Clock,
  ShieldCheck,
  Building,
  ArrowRight,
  Sparkles,
  Download,
  AlertCircle,
  FileCheck,
} from 'lucide-react';

interface QRISPaymentModalProps {
  invoice: Invoice;
  settings: KostSettings;
  isOpen: boolean;
  onClose: () => void;
  onSubmitPayment: (invoiceId: string, proofUrl: string, method: 'qris' | 'transfer_bank', qrisRef?: string) => void;
}

export const QRISPaymentModal: React.FC<QRISPaymentModalProps> = ({
  invoice,
  settings,
  isOpen,
  onClose,
  onSubmitPayment,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'qris' | 'bank_transfer'>('qris');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(15 * 60); // 15 minutes
  const [step, setStep] = useState<'pay' | 'upload' | 'success'>('pay');
  const [proofImage, setProofImage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Generate QRIS payload & QR code Image
  useEffect(() => {
    if (isOpen && invoice) {
      const payload = generateDynamicQRISPayload(
        settings.qrisNmid,
        settings.qrisMerchantName,
        settings.city,
        invoice.totalAmount,
        invoice.invoiceNumber
      );

      QRCode.toDataURL(payload, {
        width: 320,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'H',
      })
        .then(url => {
          setQrDataUrl(url);
        })
        .catch(err => {
          console.error('QR code generation error:', err);
        });

      // Reset states
      setTimeLeft(15 * 60);
      setStep('pay');
      setProofImage('');
    }
  }, [isOpen, invoice, settings]);

  // Countdown timer
  useEffect(() => {
    if (!isOpen || step === 'success') return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, step]);

  if (!isOpen || !invoice) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleSimulatePaymentProof = () => {
    // Generate high quality sample transfer proof image
    const sampleProof = 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80';
    setProofImage(sampleProof);
    setStep('upload');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofImage(reader.result as string);
        setStep('upload');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitFinal = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setStep('success');

      // Trigger celebration confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#06b6d4', '#3b82f6', '#f59e0b'],
      });

      const qrisRef = `QRIS-PAY-${Date.now().toString().slice(-6)}`;
      onSubmitPayment(
        invoice.id,
        proofImage || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
        activeTab === 'qris' ? 'qris' : 'transfer_bank',
        qrisRef
      );
    }, 900);
  };

  return (
    <div id="qris-payment-modal" className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900 font-heading">
                Pembayaran Sewa & Tagihan
              </h3>
              <p className="text-xs text-slate-500">
                {invoice.roomNumber} &bull; {invoice.tenantName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === 'success' ? (
          /* Success Screen */
          <div className="p-6 sm:p-8 text-center space-y-5">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-700 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-300">
              <CheckCircle2 className="w-10 h-10 animate-bounce" />
            </div>

            <div>
              <h4 className="text-xl font-bold text-slate-900 font-heading">
                Bukti Pembayaran Berhasil Dikirim!
              </h4>
              <p className="text-sm text-slate-600 mt-1.5 max-w-md mx-auto">
                Terima kasih! Pembayaran Anda sebesar{' '}
                <span className="font-bold text-emerald-700">{formatRupiah(invoice.totalAmount)}</span>{' '}
                sedang dalam proses verifikasi otomatis oleh sistem dan pemilik kos.
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-left text-xs space-y-2 max-w-md mx-auto">
              <div className="flex justify-between">
                <span className="text-slate-500">Nomor Tagihan:</span>
                <span className="font-mono text-slate-900 font-bold">{invoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Metode:</span>
                <span className="font-semibold text-emerald-700 uppercase">{activeTab === 'qris' ? 'QRIS Standar Nasional' : 'Transfer Bank'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status Saat Ini:</span>
                <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-semibold border border-amber-200">
                  Menunggu Konfirmasi
                </span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition shadow-xs cursor-pointer"
              >
                Selesai & Tutup
              </button>
            </div>
          </div>
        ) : (
          /* Payment Screen */
          <div className="p-5 sm:p-6 space-y-5">
            {/* Method Tabs */}
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                id="tab-method-qris"
                onClick={() => setActiveTab('qris')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'qris'
                    ? 'bg-white text-emerald-700 shadow-xs border border-slate-200/80 font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <QrCode className="w-4 h-4" />
                <span>QRIS Dinamis (Instan)</span>
              </button>
              <button
                id="tab-method-bank"
                onClick={() => setActiveTab('bank_transfer')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'bank_transfer'
                    ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80 font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building className="w-4 h-4" />
                <span>Transfer Bank / E-Wallet</span>
              </button>
            </div>

            {/* Total Amount Card */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-medium text-slate-500">Total Yang Harus Dibayar</span>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium border border-emerald-200">
                  {invoice.month} &bull; Jatuh Tempo: {formatIndonesianDate(invoice.dueDate)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {formatRupiah(invoice.totalAmount)}
                </div>
                <button
                  onClick={() => copyToClipboard(invoice.totalAmount.toString(), 'amount')}
                  className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition cursor-pointer shadow-2xs"
                >
                  {copiedField === 'amount' ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Tersalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin Nominal</span>
                    </>
                  )}
                </button>
              </div>

              {/* Breakdown */}
              <div className="mt-3 pt-3 border-t border-slate-200 text-xs text-slate-500 space-y-1">
                <div className="flex justify-between">
                  <span>Sewa Pokok Kamar ({invoice.roomNumber}):</span>
                  <span className="text-slate-900 font-medium">{formatRupiah(invoice.baseAmount)}</span>
                </div>
                {invoice.additionalFees.map(fee => (
                  <div key={fee.id} className="flex justify-between">
                    <span>{fee.name}:</span>
                    <span className="text-slate-900 font-medium">{formatRupiah(fee.amount)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* QRIS View */}
            {activeTab === 'qris' && (
              <div className="space-y-4">
                {/* QRIS Card with Indonesian Standard Frame */}
                <div className="bg-white rounded-2xl p-5 text-slate-900 shadow-sm border border-slate-200 flex flex-col items-center text-center relative overflow-hidden max-w-sm mx-auto">
                  {/* Top Red Header */}
                  <div className="w-full bg-[#CC0000] text-white py-1.5 px-3 rounded-lg mb-3 flex items-center justify-between shadow-2xs">
                    <span className="font-extrabold text-xs tracking-wider">QRIS</span>
                    <span className="text-[10px] font-medium tracking-tight opacity-90">PEMBAYARAN NASIONAL</span>
                  </div>

                  <div className="text-xs font-extrabold uppercase text-slate-800 tracking-wide">
                    {settings.qrisMerchantName}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    NMID: {settings.qrisNmid}
                  </div>

                  {/* QR Image */}
                  <div className="my-3 bg-white p-2 rounded-xl border border-slate-200 shadow-2xs">
                    {qrDataUrl ? (
                      <img
                        src={qrDataUrl}
                        alt="QRIS Payment Code"
                        className="w-56 h-56 sm:w-60 sm:h-60 mx-auto object-contain"
                      />
                    ) : (
                      <div className="w-56 h-56 flex items-center justify-center text-slate-400 text-xs">
                        Membuat QRIS...
                      </div>
                    )}
                  </div>

                  {/* Merchant & App Badges */}
                  <div className="text-[11px] font-semibold text-slate-600">
                    BCA, Mandiri, BRI, BNI, GoPay, OVO, ShopeePay, DANA, LinkAja
                  </div>

                  {/* Timer */}
                  <div className="mt-2.5 flex items-center gap-1.5 text-xs text-rose-600 font-bold bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Kadaluarsa dalam: {formattedTime}</span>
                  </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p>
                    Scan QRIS di atas menggunakan aplikasi m-Banking atau E-Wallet apapun. Nominal otomatis terisi tepat{' '}
                    <strong className="text-emerald-900">{formatRupiah(invoice.totalAmount)}</strong> tanpa biaya admin tambahan.
                  </p>
                </div>
              </div>
            )}

            {/* Bank Transfer View */}
            {activeTab === 'bank_transfer' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-500">
                  Transfer tepat sesuai total tagihan ke salah satu rekening pengelola berikut:
                </p>
                <div className="space-y-2.5">
                  {settings.bankAccounts.map((acc, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {acc.bank}
                          </span>
                          <span className="text-xs text-slate-600 font-medium">{acc.accountHolder}</span>
                        </div>
                        <div className="font-mono text-base font-bold text-slate-900 mt-1">
                          {acc.accountNumber}
                        </div>
                      </div>
                      <button
                        onClick={() => copyToClipboard(acc.accountNumber, `bank-${idx}`)}
                        className="p-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs flex items-center gap-1 transition cursor-pointer shadow-2xs"
                      >
                        {copiedField === `bank-${idx}` ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700 text-[11px]">Tersalin</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span className="text-[11px]">Salin No</span>
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload / Proof of Payment Section */}
            <div className="border-t border-slate-200 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                  <span>Unggah Bukti Pembayaran / Transfer</span>
                </span>
                <span className="text-[11px] text-slate-500">JPG, PNG, PDF</span>
              </div>

              {proofImage ? (
                <div className="bg-slate-50 p-3 rounded-xl border border-emerald-300 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={proofImage}
                      alt="Bukti Transfer"
                      className="w-12 h-12 object-cover rounded-lg border border-slate-200"
                    />
                    <div>
                      <div className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Bukti Pembayaran Terlampir</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Siap diverifikasi oleh pengelola kos
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setProofImage('')}
                    className="text-xs text-rose-600 hover:text-rose-700 font-medium px-2 py-1 bg-rose-50 border border-rose-200 rounded cursor-pointer"
                  >
                    Ganti
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <label className="flex items-center justify-center gap-2 p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl cursor-pointer text-xs font-medium text-slate-700 transition shadow-2xs">
                    <Upload className="w-4 h-4 text-blue-600" />
                    <span>Pilih Foto dari Galeri / HP</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  <button
                    onClick={handleSimulatePaymentProof}
                    className="flex items-center justify-center gap-1.5 p-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-700 transition cursor-pointer shadow-2xs"
                  >
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>Gunakan Bukti Simulasi Cepat</span>
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                id="btn-submit-payment"
                type="button"
                disabled={!proofImage || isSubmitting}
                onClick={handleSubmitFinal}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                  proofImage && !isSubmitting
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                }`}
              >
                {isSubmitting ? (
                  <span>Mengirim Pembayaran...</span>
                ) : (
                  <>
                    <span>Kirim & Konfirmasi Pembayaran</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, ChevronDown, Check } from 'lucide-react';
import { formatIndonesianMonthYear } from '../utils/formatters';

interface MonthPickerPopoverProps {
  value: string; // Format: 'YYYY-MM', e.g. '2026-08'
  onChange: (monthStr: string) => void;
  label?: string; // e.g. 'Bulan:' or 'Periode:'
  align?: 'left' | 'right';
  className?: string;
  id?: string;
}

const MONTH_DATA = [
  { num: '01', shortName: 'Jan', fullName: 'Januari' },
  { num: '02', shortName: 'Feb', fullName: 'Februari' },
  { num: '03', shortName: 'Mar', fullName: 'Maret' },
  { num: '04', shortName: 'Apr', fullName: 'April' },
  { num: '05', shortName: 'Mei', fullName: 'Mei' },
  { num: '06', shortName: 'Jun', fullName: 'Juni' },
  { num: '07', shortName: 'Jul', fullName: 'Juli' },
  { num: '08', shortName: 'Agu', fullName: 'Agustus' },
  { num: '09', shortName: 'Sep', fullName: 'September' },
  { num: '10', shortName: 'Okt', fullName: 'Oktober' },
  { num: '11', shortName: 'Nov', fullName: 'November' },
  { num: '12', shortName: 'Des', fullName: 'Desember' },
];

export const MonthPickerPopover: React.FC<MonthPickerPopoverProps> = ({
  value,
  onChange,
  label = 'Bulan:',
  align = 'right',
  className = '',
  id,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse current year from value ('2026-08' -> 2026)
  const currentYear = value ? parseInt(value.split('-')[0], 10) || new Date().getFullYear() : new Date().getFullYear();
  const [viewingYear, setViewingYear] = useState<number>(currentYear);

  // Sync viewingYear when value changes externally
  useEffect(() => {
    if (value) {
      const yr = parseInt(value.split('-')[0], 10);
      if (!isNaN(yr)) {
        setViewingYear(yr);
      }
    }
  }, [value]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle month selection
  const handleSelectMonth = (monthNum: string) => {
    const formatted = `${viewingYear}-${monthNum}`;
    onChange(formatted);
    setIsOpen(false);
  };

  const currentRealMonth = new Date().toISOString().substring(0, 7); // e.g. '2026-08'

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`} id={id}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100/90 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 text-xs shadow-2xs transition-all duration-150 cursor-pointer select-none group focus:outline-none focus:ring-1 focus:ring-emerald-500"
        title="Pilih Bulan & Tahun Periode"
      >
        <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
        <span className="text-slate-600 font-semibold whitespace-nowrap">{label}</span>
        <span className="bg-white text-emerald-700 font-bold px-2 py-0.5 rounded-lg border border-slate-200 shadow-2xs whitespace-nowrap">
          {formatIndonesianMonthYear(value)}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-emerald-600' : ''
          }`}
        />
      </button>

      {/* Grid Popover Dropdown */}
      {isOpen && (
        <div
          className={`absolute top-full mt-2 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 w-72 sm:w-80 space-y-3.5 animate-in fade-in zoom-in-95 duration-150 ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {/* Header with Year Navigation */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <button
              type="button"
              onClick={() => setViewingYear(prev => prev - 1)}
              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition cursor-pointer"
              title="Tahun Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-slate-900 font-heading">
                {viewingYear}
              </span>
              {viewingYear !== new Date().getFullYear() && (
                <button
                  type="button"
                  onClick={() => setViewingYear(new Date().getFullYear())}
                  className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
                  title="Kembali ke tahun sekarang"
                >
                  Tahun Ini
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setViewingYear(prev => prev + 1)}
              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition cursor-pointer"
              title="Tahun Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* 12 Months Grid */}
          <div className="grid grid-cols-3 gap-2">
            {MONTH_DATA.map(m => {
              const monthStr = `${viewingYear}-${m.num}`;
              const isSelected = monthStr === value;
              const isCurrentRealMonth = monthStr === currentRealMonth;

              return (
                <button
                  key={m.num}
                  type="button"
                  onClick={() => handleSelectMonth(m.num)}
                  className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer flex flex-col items-center justify-center relative ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/30'
                      : isCurrentRealMonth
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100/80 font-extrabold'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200/60'
                  }`}
                  title={`${m.fullName} ${viewingYear}`}
                >
                  <span className="leading-tight">{m.shortName}</span>
                  <span className={`text-[9px] font-medium leading-none mt-0.5 ${isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>
                    {m.num}
                  </span>
                  {isSelected && (
                    <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Popover Footer Note */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <span>Terpilih: <strong className="text-slate-800 font-bold">{formatIndonesianMonthYear(value)}</strong></span>
            </span>

            <button
              type="button"
              onClick={() => {
                const now = new Date().toISOString().substring(0, 7);
                onChange(now);
                setViewingYear(new Date().getFullYear());
                setIsOpen(false);
              }}
              className="text-emerald-600 hover:text-emerald-700 font-bold hover:underline cursor-pointer"
            >
              Bulan Sekarang
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

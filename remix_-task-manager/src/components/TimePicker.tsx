import { useState, useRef, useEffect } from "react";
import { Clock } from "lucide-react";
import { convertToPersianNumbers } from "../utils/jalali";

interface TimePickerProps {
  value: string; // HH:mm
  onChange: (val: string) => void;
  disabled?: boolean;
}

export default function TimePicker({ value, onChange, disabled }: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [h, m] = value.split(":");

  const handleHourSelect = (hour: string) => {
    onChange(`${hour}:${m || "00"}`);
  };

  const handleMinuteSelect = (minute: string) => {
    onChange(`${h || "12"}:${minute}`);
  };

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'));

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-right flex items-center justify-between cursor-pointer disabled:opacity-50"
      >
        <span>{convertToPersianNumbers(value) || "انتخاب ساعت"}</span>
        <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 pointer-events-none">
          <Clock size={16} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 p-3 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 flex gap-4 animate-in fade-in zoom-in duration-200">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 mb-2 text-center">ساعت</span>
            <div className="h-48 overflow-y-auto scrollbar-none space-y-1 w-16 px-1">
              {hours.map(hour => (
                <button
                  key={hour}
                  type="button"
                  onClick={() => handleHourSelect(hour)}
                  className={`w-full py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${h === hour ? 'bg-emerald-100 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  {convertToPersianNumbers(hour)}
                </button>
              ))}
            </div>
          </div>
          
          <div className="w-px bg-slate-100" />
          
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 mb-2 text-center">دقیقه</span>
            <div className="h-48 overflow-y-auto scrollbar-none space-y-1 w-16 px-1">
              {minutes.map(minute => (
                <button
                  key={minute}
                  type="button"
                  onClick={() => {
                    handleMinuteSelect(minute);
                    setIsOpen(false);
                  }}
                  className={`w-full py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${m === minute ? 'bg-emerald-100 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  {convertToPersianNumbers(minute)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

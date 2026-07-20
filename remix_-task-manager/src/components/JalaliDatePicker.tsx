import { useState, useRef, useEffect } from "react";
import { Calendar, ChevronRight, ChevronLeft } from "lucide-react";
import {
  JALALI_MONTHS,
  WEEKDAYS_SHORT,
  getJalaliMonthDays,
  getJalaliMonthStartWeekday,
  convertToPersianNumbers
} from "../utils/jalali";

interface JalaliDatePickerProps {
  value: string; // YYYY/MM/DD
  onChange: (val: string) => void;
  id?: string;
}

export default function JalaliDatePicker({ value, onChange, id }: JalaliDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Set current year/month for navigation
  const initialParts = value.split("/");
  const initialYear = initialParts.length === 3 ? parseInt(initialParts[0], 10) : 1405;
  const initialMonth = initialParts.length === 3 ? parseInt(initialParts[1], 10) : 1;
  
  const [navYear, setNavYear] = useState(initialYear);
  const [navMonth, setNavMonth] = useState(initialMonth); // 1-indexed (1 to 12)
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update nav dates when value changes externally
  useEffect(() => {
    const parts = value.split("/");
    if (parts.length === 3) {
      setNavYear(parseInt(parts[0], 10));
      setNavMonth(parseInt(parts[1], 10));
    }
  }, [value]);

  const daysInMonth = getJalaliMonthDays(navYear, navMonth);
  const startWeekday = getJalaliMonthStartWeekday(navYear, navMonth);

  // Array of days to render
  const daysArray: (number | null)[] = [];
  
  // Empty slots before month starts
  for (let i = 0; i < startWeekday; i++) {
    daysArray.push(null);
  }
  
  // Days of month
  for (let i = 1; i <= daysInMonth; i++) {
    daysArray.push(i);
  }

  const handleDaySelect = (day: number) => {
    const mStr = navMonth < 10 ? `0${navMonth}` : navMonth.toString();
    const dStr = day < 10 ? `0${day}` : day.toString();
    onChange(`${navYear}/${mStr}/${dStr}`);
    setIsOpen(false);
  };

  const nextMonth = () => {
    if (navMonth === 12) {
      setNavMonth(1);
      setNavYear(prev => prev + 1);
    } else {
      setNavMonth(prev => prev + 1);
    }
  };

  const prevMonth = () => {
    if (navMonth === 1) {
      setNavMonth(12);
      setNavYear(prev => prev - 1);
    } else {
      setNavMonth(prev => prev - 1);
    }
  };

  return (
    <div className="relative w-full" ref={containerRef} id={id}>
      <div className="relative">
        <input
          type="text"
          readOnly
          value={convertToPersianNumbers(value)}
          onClick={() => setIsOpen(!isOpen)}
          className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-3 pr-10 text-right cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          placeholder="انتخاب تاریخ شمسی"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
          <Calendar size={18} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-2 right-0 w-80 bg-white border border-slate-100 rounded-2xl shadow-xl p-4 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={nextMonth} // Persian layout reads right-to-left: Right moves to next month (forward) or prev? Let's make it intuitive.
              className="p-1.5 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors cursor-pointer"
            >
              <ChevronRight size={18} />
            </button>
            
            <div className="flex items-center gap-2">
              <select
                value={navMonth}
                onChange={(e) => setNavMonth(parseInt(e.target.value, 10))}
                className="text-sm font-semibold text-slate-700 bg-transparent border-none focus:outline-none cursor-pointer hover:text-emerald-600"
              >
                {JALALI_MONTHS.map((m, idx) => (
                  <option key={m} value={idx + 1}>
                    {m}
                  </option>
                ))}
              </select>
              
              <select
                value={navYear}
                onChange={(e) => setNavYear(parseInt(e.target.value, 10))}
                className="text-sm font-semibold text-slate-700 bg-transparent border-none focus:outline-none cursor-pointer hover:text-emerald-600"
              >
                {Array.from({ length: 21 }, (_, i) => 1395 + i).map((y) => (
                  <option key={y} value={y}>
                    {convertToPersianNumbers(y)}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={prevMonth}
              className="p-1.5 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors cursor-pointer"
            >
              <ChevronLeft size={18} />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {WEEKDAYS_SHORT.map((day, idx) => (
              <span
                key={idx}
                className={`text-xs font-semibold py-1 ${
                  idx === 6 ? "text-rose-500" : "text-slate-400"
                }`}
              >
                {day}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {daysArray.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} />;
              }

              const mStr = navMonth < 10 ? `0${navMonth}` : navMonth.toString();
              const dStr = day < 10 ? `0${day}` : day.toString();
              const fullDateStr = `${navYear}/${mStr}/${dStr}`;
              const isSelected = value === fullDateStr;
              
              // Highlight Friday index % 7 === 6
              const isFriday = idx % 7 === 6;

              return (
                <button
                  key={`day-${day}`}
                  type="button"
                  onClick={() => handleDaySelect(day)}
                  className={`h-9 w-9 text-xs rounded-lg flex items-center justify-center font-medium transition-all cursor-pointer ${
                    isSelected
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                      : isFriday
                      ? "text-rose-500 hover:bg-rose-50"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {convertToPersianNumbers(day)}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

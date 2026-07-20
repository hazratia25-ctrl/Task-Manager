import { useState, useMemo } from "react";
import { ChevronRight, ChevronLeft, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { Task } from "../types";
import {
  JALALI_MONTHS,
  WEEKDAYS_FULL,
  getJalaliMonthDays,
  getJalaliMonthStartWeekday,
  convertToPersianNumbers,
  getTodayJalaliString,
  isTaskOverdue,
  getDaysDifference,
  formatJalaliDateFull
} from "../utils/jalali";

interface DashboardCalendarProps {
  tasks: Task[];
}

export default function DashboardCalendar({ tasks }: DashboardCalendarProps) {
  const today = getTodayJalaliString();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  
  // Set current year/month for navigation
  const initialParts = today.split("/");
  const initialYear = parseInt(initialParts[0], 10);
  const initialMonth = parseInt(initialParts[1], 10);
  
  const [navYear, setNavYear] = useState(initialYear);
  const [navMonth, setNavMonth] = useState(initialMonth); // 1 to 12

  const daysInMonth = getJalaliMonthDays(navYear, navMonth);
  const startWeekday = getJalaliMonthStartWeekday(navYear, navMonth);

  const daysArray: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) {
    daysArray.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    daysArray.push(i);
  }

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

  const getTagStyle = (tag: string) => {
    switch (tag) {
      case "کاری":
        return "text-blue-600";
      case "شخصی":
        return "text-emerald-600";
      case "فوری":
        return "text-rose-600";
      default:
        return "text-purple-600";
    }
  };

  // Determine tasks for the list
  const displayTasks = useMemo(() => {
    if (selectedDate) {
      return tasks.filter(t => t.date === selectedDate).sort((a, b) => (a.time > b.time ? 1 : -1));
    } else {
      // Upcoming and urgents first
      const uncompleted = tasks.filter(t => !t.is_completed && t.date >= today);
      return uncompleted.sort((a, b) => {
        if (a.tag === "فوری" && b.tag !== "فوری") return -1;
        if (a.tag !== "فوری" && b.tag === "فوری") return 1;
        const dateTimeA = `${a.date} ${a.time}`;
        const dateTimeB = `${b.date} ${b.time}`;
        return dateTimeA > dateTimeB ? 1 : -1;
      });
    }
  }, [tasks, selectedDate, today]);

  // Determine progress text
  const progressText = useMemo(() => {
    const targetDate = selectedDate || today;
    const targetTasks = tasks.filter(t => t.date === targetDate);
    const total = targetTasks.length;
    const completed = targetTasks.filter(t => t.is_completed).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    const parts = targetDate.split("/");
    const dStr = parseInt(parts[2], 10);
    const mStr = JALALI_MONTHS[parseInt(parts[1], 10) - 1];
    
    const prefix = targetDate === today ? "امروز" : "";
    
    let daysDiffText = "";
    if (targetDate !== today) {
      const diff = getDaysDifference(targetDate, today);
      if (diff > 0) {
        daysDiffText = ` | ${diff} روز مانده`;
      } else if (diff < 0) {
        daysDiffText = ` | ${Math.abs(diff)} روز گذشته`;
      }
    }
    
    return `${prefix} ${dStr} ${mStr} ${completed} کار از ${total} کار ${percentage} درصد${daysDiffText}`;
  }, [tasks, selectedDate, today]);

  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-xl border border-slate-100 flex flex-col mb-8 animate-in fade-in duration-300">
      {/* Top Blue Banner */}
      <div className="px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-3" style={{ backgroundColor: "#0000FF" }}>
        <h2 className="text-white font-black text-lg md:text-xl md:mb-0">
          مدیریت برنامه - {convertToPersianNumbers(formatJalaliDateFull(today))}
        </h2>
        <span className="text-white/90 text-sm font-semibold bg-black/10 px-4 py-2 rounded-xl backdrop-blur-sm text-center">
          {convertToPersianNumbers(progressText)}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
        {/* Right side: Calendar (Order 2 on LTR, RTL renders it right) */}
        <div className="p-6 md:p-8 bg-slate-50/30">
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={prevMonth}
              className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
            >
              <ChevronRight size={20} />
            </button>
            <h3 className="font-extrabold text-lg text-slate-800">
              {JALALI_MONTHS[navMonth - 1]} {convertToPersianNumbers(navYear)}
            </h3>
            <button
              onClick={nextMonth}
              className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center mb-4">
            {WEEKDAYS_FULL.map((day, idx) => (
              <div
                key={idx}
                className="text-[10px] sm:text-xs font-bold p-2"
                style={{ backgroundColor: "#0000FF", color: "white", borderRadius: "8px" }}
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-4 gap-x-2 text-center">
            {daysArray.map((day, idx) => {
              if (!day) return <div key={idx} className="p-2"></div>;

              const mStr = navMonth < 10 ? `0${navMonth}` : navMonth.toString();
              const dStr = day < 10 ? `0${day}` : day.toString();
              const dateStr = `${navYear}/${mStr}/${dStr}`;
              
              const isSelected = selectedDate === dateStr;
              const isToday = today === dateStr;

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                  className={`
                    w-10 h-10 mx-auto flex items-center justify-center rounded-xl text-sm font-bold transition-all
                    ${isSelected ? 'bg-blue-600 text-white shadow-md' : 
                      isToday ? 'border-2 border-blue-600 text-blue-700' : 
                      'text-slate-700 hover:bg-slate-100'
                    }
                  `}
                >
                  {convertToPersianNumbers(day)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Left side: Task List */}
        <div className="p-6 md:p-8 border-r border-slate-100 flex flex-col">
          <div className="mb-6">
            <h3 className="text-white font-black text-lg md:text-xl w-full px-6 py-3 rounded-xl shadow-md text-center" style={{ backgroundColor: "#0000FF" }}>
              لیست برنامه
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[350px] pr-2 space-y-4 scrollbar-thin scrollbar-thumb-slate-200">
            {displayTasks.length === 0 ? (
              <div className="text-center text-slate-400 py-10 text-sm font-semibold">
                برنامه‌ای برای نمایش وجود ندارد
              </div>
            ) : (
              displayTasks.map(task => {
                const isOverdue = !task.is_completed && isTaskOverdue(task.date, task.time);
                const isCompleted = task.is_completed;
                
                let titleColor = "text-blue-600"; // in progress
                let IconComponent = RefreshCw;
                let iconColor = "text-blue-500";
                
                if (isCompleted) {
                  titleColor = "text-emerald-600";
                  IconComponent = CheckCircle;
                  iconColor = "text-emerald-500";
                } else if (isOverdue) {
                  titleColor = "text-rose-600";
                  IconComponent = AlertCircle;
                  iconColor = "text-rose-500";
                }
                
                return (
                  <div key={task.id} className="flex items-center gap-3 py-3 border-b border-slate-100 border-dashed last:border-0">
                    <div className="flex items-center gap-2 min-w-[80px]">
                      <span className={`text-sm font-black ${getTagStyle(task.tag)}`}>
                        {task.tag || "سفارشی"}
                      </span>
                      <IconComponent size={16} className={iconColor} strokeWidth={2.5} />
                    </div>
                    <p className={`text-sm font-bold flex-1 line-clamp-1 text-right ${titleColor}`}>
                      {task.title}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

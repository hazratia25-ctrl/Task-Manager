import { useState, useEffect } from "react";
import { Search, MapPin, Clock, Edit2, Trash2, CheckCircle, Calendar, AlertCircle, Filter, RefreshCw, X, Check } from "lucide-react";
import { Task } from "../types";
import { isTaskOverdue, formatJalaliDateFull, convertToPersianNumbers, getTodayJalaliString } from "../utils/jalali";
import DashboardCalendar from "./DashboardCalendar";

interface TaskListProps {
  tasks: Task[];
  onToggleComplete: (id: string, currentStatus: boolean) => Promise<void>;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => Promise<void>;
}

export default function TaskList({ tasks, onToggleComplete, onEdit, onDelete }: TaskListProps) {
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("همه");
  const [currentTime, setCurrentTime] = useState(new Date());

  // Keep track of time to re-evaluate "overdue" status dynamically every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    // 1. Search matching
    const searchLower = search.toLowerCase().trim();
    const matchesSearch =
      !searchLower ||
      task.title.toLowerCase().includes(searchLower) ||
      (task.location && task.location.toLowerCase().includes(searchLower)) ||
      (task.description && task.description.toLowerCase().includes(searchLower));

    if (!matchesSearch) return false;

    // 2. Category matching
    if (filterCategory === "همه") return true;
    if (filterCategory === "انجام‌شده") return task.is_completed;
    if (filterCategory === "عقب‌افتاده") return !task.is_completed && isTaskOverdue(task.date, task.time);
    if (filterCategory === "در حال انجام") return !task.is_completed && !isTaskOverdue(task.date, task.time);
    
    return task.tag === filterCategory;
  });

  // Sort tasks
  // 1. Uncompleted, not overdue first, sorted by date/time ascending
  // 2. Overdue tasks, sorted by date/time ascending
  // 3. Completed tasks at the very end
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    // If one is completed and other is not, completed goes to end
    if (a.is_completed !== b.is_completed) {
      return a.is_completed ? 1 : -1;
    }
    
    // Both are either completed or uncompleted. Sort by date and time
    const dateTimeA = `${a.date} ${a.time}`;
    const dateTimeB = `${b.date} ${b.time}`;
    
    if (dateTimeA < dateTimeB) return -1;
    if (dateTimeA > dateTimeB) return 1;
    return 0;
  });

  const getTagStyle = (tag: string) => {
    switch (tag) {
      case "کاری":
        return "bg-blue-100 text-blue-600";
      case "شخصی":
        return "bg-emerald-100 text-emerald-600";
      case "فوری":
        return "bg-rose-100 text-rose-600";
      default:
        return "bg-purple-100 text-purple-600";
    }
  };

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  return (
    <div className="space-y-6" id="tasks_list_container">
      {/* Dashboard Calendar replacing the old Daily Progress */}
      <DashboardCalendar tasks={tasks} />

      {/* Controls: Search and Filter */}
      <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xl flex flex-col md:flex-row gap-4 items-center">
        {/* Search Input */}
        <div className="relative w-full md:flex-1">
          <input
            type="text"
            placeholder="جستجو در عنوان، مکان و توضیحات..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-2xl pl-4 pr-10 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-right"
          />
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 pointer-events-none">
            <Search size={18} />
          </div>
        </div>

        {/* Filter Selection */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <div className="p-2 bg-slate-50 border border-slate-100 rounded-xl text-slate-500 shrink-0">
            <Filter size={16} />
          </div>
          
          <div className="flex items-center gap-1.5 flex-wrap">
            {["همه", "کاری", "شخصی", "فوری", "سفارشی", "انجام‌شده", "در حال انجام", "عقب‌افتاده"].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all border shrink-0 cursor-pointer ${
                  filterCategory === cat
                    ? "bg-slate-800 text-white border-slate-800 shadow-sm"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Task count */}
      <div className="flex items-center justify-between px-2">
        <span className="text-xs font-bold text-slate-400">
          تعداد وظایف پیدا شده: {convertToPersianNumbers(sortedTasks.length)}
        </span>
      </div>

      {/* Grid List */}
      {sortedTasks.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center shadow-xl animate-in fade-in duration-300">
          <div className="inline-flex p-4 bg-slate-50 text-slate-400 rounded-full mb-4">
            <CheckCircle size={36} />
          </div>
          <h3 className="font-bold text-slate-700 text-sm mb-1.5">هیچ وظیفه‌ای پیدا نشد!</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            هیچ وظیفه‌ای با فیلترها و کلمات جستجو شده همخوانی ندارد. می‌توانید وظیفه جدیدی ثبت کنید یا فیلترها را ریست کنید.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {sortedTasks.map((task) => {
            const overdue = !task.is_completed && isTaskOverdue(task.date, task.time);
            
            return (
              <div
                key={task.id}
                className={`relative flex flex-row items-stretch bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow`}
              >
                {/* Status Block (Right Edge - RTL Start) */}
                {overdue && (
                  <div className="w-24 bg-red-50 text-red-500 flex flex-col items-center justify-center shrink-0 border-l border-red-100">
                    <AlertCircle size={24} className="mb-2" />
                    <span className="text-xs font-bold text-red-600">عقب‌افتاده</span>
                  </div>
                )}
                {task.is_completed && (
                  <div className="w-24 bg-emerald-50 text-emerald-600 flex flex-col items-center justify-center shrink-0 border-l border-emerald-100">
                    <CheckCircle size={24} className="mb-2" />
                    <span className="text-xs font-bold">انجام شده</span>
                  </div>
                )}
                {!overdue && !task.is_completed && (
                  <div className="w-24 flex flex-col items-center justify-center shrink-0 border-l" style={{ backgroundColor: "rgba(0,0,255,0.05)", borderColor: "rgba(0,0,255,0.1)", color: "#0000FF" }}>
                    <RefreshCw size={24} className="mb-2" />
                    <span className="text-xs font-bold">در حال انجام</span>
                  </div>
                )}

                {/* Main Content */}
                <div className="flex-1 p-4 sm:p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4 min-w-0">
                  {/* Title, Desc, Date/Time */}
                  <div className="flex flex-col space-y-2.5 min-w-0">
                    <h3 className={`text-lg font-bold truncate ${task.is_completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className={`text-sm truncate ${task.is_completed ? 'line-through text-slate-300' : 'text-slate-500'}`}>
                        {task.description}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-sm text-slate-500 mt-2">
                      <div className="flex items-center gap-2">
                        <span>{convertToPersianNumbers(formatJalaliDateFull(task.date))}</span>
                        <Calendar size={16} className="text-slate-400" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span>{convertToPersianNumbers(task.time)}</span>
                        <Clock size={16} className="text-slate-400" />
                      </div>
                    </div>
                  </div>

                  {/* Left Side: Tag, Location, Actions */}
                  <div className="flex items-center gap-4 sm:gap-8 self-end sm:self-center shrink-0 w-full sm:w-auto justify-between sm:justify-end mt-2 sm:mt-0">
                    {/* Tag & Location */}
                    <div className="flex flex-col items-start sm:items-end space-y-2">
                      {task.tag && (
                        <span className={`px-3 py-1 sm:px-4 sm:py-1.5 text-xs font-bold rounded-full ${getTagStyle(task.tag)}`}>
                          {task.tag}
                        </span>
                      )}
                      {task.location && (
                        <div className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-500 mt-1 truncate max-w-[120px] sm:max-w-[200px]">
                          <span className="truncate">{task.location}</span>
                          <MapPin size={16} className="text-slate-400 shrink-0" />
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 sm:gap-4 pl-0 sm:pl-2">
                      <button
                        onClick={() => onEdit(task)}
                        className="text-blue-500 hover:bg-blue-50 p-1.5 sm:p-2 rounded-lg transition-colors cursor-pointer shrink-0"
                        title="ویرایش"
                      >
                        <Edit2 size={18} />
                      </button>
                      
                      {confirmDeleteId === task.id ? (
                        <div className="flex items-center gap-1 bg-rose-50 border border-rose-100 rounded-lg px-2 py-1 absolute left-4 z-10">
                          <span className="text-[10px] text-rose-600 font-bold ml-1">حذف؟</span>
                          <button
                            onClick={() => {
                              onDelete(task.id);
                              setConfirmDeleteId(null);
                            }}
                            className="p-1.5 hover:bg-rose-200 text-rose-600 rounded-md transition-all cursor-pointer"
                          >
                            <CheckCircle size={14} />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="p-1.5 hover:bg-slate-200 text-slate-500 rounded-md transition-all cursor-pointer"
                          >
                            <X size={14} className="opacity-70" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(task.id)}
                          className="text-red-500 hover:bg-red-50 p-1.5 sm:p-2 rounded-lg transition-colors cursor-pointer relative shrink-0"
                          title="حذف"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                      
                      <button
                        onClick={() => onToggleComplete(task.id, task.is_completed)}
                        className={`relative w-[48px] h-[28px] rounded-full border-[2.5px] transition-colors duration-300 flex items-center px-[3px] cursor-pointer shrink-0 ${
                          task.is_completed 
                            ? 'border-blue-500 bg-blue-50 justify-end' 
                            : 'border-slate-500 bg-slate-100 justify-start'
                        }`}
                        title="تغییر وضعیت"
                      >
                        <div className="w-[18px] h-[18px] rounded-full flex items-center justify-center">
                          <Check size={16} strokeWidth={4} className={task.is_completed ? "text-blue-500" : "text-slate-500"} />
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

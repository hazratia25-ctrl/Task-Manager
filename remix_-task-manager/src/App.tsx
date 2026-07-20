import { useState, useEffect, useCallback, useRef } from "react";
import { ListTodo, Database, AlertCircle, Info, Calendar, HelpCircle, CheckCircle2 } from "lucide-react";
import SupabaseConfig from "./components/SupabaseConfig";
import Auth from "./components/Auth";
import TaskForm from "./components/TaskForm";
import TaskList from "./components/TaskList";
import QuickChecklistModal from "./components/QuickChecklistModal";
import { getSupabase } from "./lib/supabase";
import { getTodayJalaliString, formatJalaliDateFull, convertToPersianNumbers } from "./utils/jalali";
import { Task } from "./types";

export default function App() {
  const [isSupabaseActive, setIsSupabaseActive] = useState(false);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);
  const [showSQLHelp, setShowSQLHelp] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);

  // Quick Checklist State
  const [showQuickChecklist, setShowQuickChecklist] = useState(false);
  const [hasShownChecklistForSession, setHasShownChecklistForSession] = useState(false);
  
  // App Settings
  const [appFont, setAppFont] = useState(() => localStorage.getItem("app_font") || "Vazirmatn");

  useEffect(() => {
    document.documentElement.style.setProperty('--font-sans', `"${appFont}", "Inter", ui-sans-serif, system-ui, sans-serif`);
    document.body.style.fontFamily = `var(--font-sans)`;
    localStorage.setItem("app_font", appFont);
  }, [appFont]);

  // Today's date display
  const [todayString, setTodayString] = useState("");

  useEffect(() => {
    setTodayString(formatJalaliDateFull(getTodayJalaliString()));
  }, []);

  // Seed tasks helper for Local Storage mode
  const getSeedLocalTasks = (userId: string): Task[] => {
    return [
      {
        id: "seed-1",
        user_id: userId,
        title: "برگزاری جلسه معارفه تیم فنی و برنامه‌ریزی اسپرینت",
        date: getTodayJalaliString(),
        time: "10:30",
        tag: "کاری",
        location: "پلتفرم گوگل‌میت",
        description: "بررسی تسک‌های اسپرینت جدید، تخصیص وظایف به اعضای تیم توسعه وب و پاسخ به سوالات فنی.",
        is_completed: false
      },
      {
        id: "seed-2",
        user_id: userId,
        title: "خرید گل طبیعی و کتاب شعر برای هدیه تولد",
        date: getTodayJalaliString(),
        time: "17:00",
        tag: "شخصی",
        location: "کتاب‌فروشی مرکزی تجریش",
        description: "تهیه هدیه تولد به همراه یک کارت تبریک دست‌نویس زیبا.",
        is_completed: false
      },
      {
        id: "seed-3",
        user_id: userId,
        title: "تمدید سرور پشتیبان و پرداخت قسط بانک",
        date: getTodayJalaliString(),
        time: "21:00",
        tag: "فوری",
        location: "درگاه اینترنتی بانک سامان",
        description: "مهلت نهایی پرداخت صورت‌حساب ها است. حتماً قبل از ساعت دوازده شب واریز انجام شود.",
        is_completed: false
      }
    ];
  };

  // Fetch Tasks
  const fetchTasks = useCallback(async (user: any, supabaseActive: boolean) => {
    if (!user) {
      setTasks([]);
      return;
    }
    setLoadingTasks(true);
    setDbError(null);

    try {
      if (supabaseActive) {
        const client = getSupabase();
        if (client) {
          const { data, error } = await client
            .from("tasks")
            .select("*")
            .eq("user_id", user.id);

          if (error) {
            throw error;
          }
          setTasks(data || []);
        }
      } else {
        // Local storage retrieval
        const allLocalTasks = JSON.parse(localStorage.getItem("local_tasks") || "[]");
        const userLocalTasks = allLocalTasks.filter((t: Task) => t.user_id === user.id);
        
        // Seed if empty
        if (userLocalTasks.length === 0) {
          const seeds = getSeedLocalTasks(user.id);
          const updatedAllTasks = [...allLocalTasks, ...seeds];
          localStorage.setItem("local_tasks", JSON.stringify(updatedAllTasks));
          setTasks(seeds);
        } else {
          setTasks(userLocalTasks);
        }
      }
    } catch (err: any) {
      console.error("Fetch tasks error:", err);
      setDbError(
        err.message ||
          "خطا در ارتباط با پایگاه داده. لطفاً مطمئن شوید جدول tasks در پروژه Supabase شما به درستی ایجاد شده و در دسترس است."
      );
    } finally {
      setLoadingTasks(false);
    }
  }, []);

  // Fetch when user or mode changes
  useEffect(() => {
    fetchTasks(currentUser, isSupabaseActive);
    setEditTask(null);
  }, [currentUser, isSupabaseActive, fetchTasks]);

  // Handle showing Quick Checklist on login
  useEffect(() => {
    if (!currentUser) {
      setHasShownChecklistForSession(false);
      setShowQuickChecklist(false);
    } else if (currentUser && !loadingTasks && !hasShownChecklistForSession && tasks.length > 0) {
      setShowQuickChecklist(true);
      setHasShownChecklistForSession(true);
    }
  }, [currentUser, loadingTasks, hasShownChecklistForSession, tasks]);

  // Handle task insert or update
  const handleTaskSubmit = async (taskData: Omit<Task, "id" | "user_id" | "created_at">) => {
    if (!currentUser) return;
    setDbError(null);

    try {
      if (isSupabaseActive) {
        const client = getSupabase();
        if (!client) throw new Error("کلاینت Supabase در دسترس نیست.");

        if (editTask) {
          // Update
          const { error } = await client
            .from("tasks")
            .update({
              title: taskData.title,
              date: taskData.date,
              time: taskData.time,
              tag: taskData.tag,
              location: taskData.location,
              description: taskData.description,
              is_completed: taskData.is_completed,
            })
            .eq("id", editTask.id)
            .eq("user_id", currentUser.id);

          if (error) throw error;
        } else {
          // Insert
          const { error } = await client.from("tasks").insert([
            {
              ...taskData,
              user_id: currentUser.id,
            },
          ]);
          if (error) throw error;
        }
      } else {
        // Local mode
        const allLocalTasks = JSON.parse(localStorage.getItem("local_tasks") || "[]");
        
        if (editTask) {
          const idx = allLocalTasks.findIndex((t: Task) => t.id === editTask.id && t.user_id === currentUser.id);
          if (idx !== -1) {
            allLocalTasks[idx] = {
              ...allLocalTasks[idx],
              ...taskData,
            };
          }
        } else {
          const newTask: Task = {
            id: crypto.randomUUID(),
            user_id: currentUser.id,
            ...taskData,
          };
          allLocalTasks.push(newTask);
        }
        localStorage.setItem("local_tasks", JSON.stringify(allLocalTasks));
      }
      
      setEditTask(null);
      await fetchTasks(currentUser, isSupabaseActive);
    } catch (err: any) {
      console.error("Task submit error:", err);
      setDbError(err.message || "خطا در ثبت اطلاعات در دیتابیس.");
    }
  };

  // Toggle complete
  const handleToggleComplete = async (id: string, currentStatus: boolean) => {
    if (!currentUser) return;
    setDbError(null);

    try {
      if (isSupabaseActive) {
        const client = getSupabase();
        if (!client) throw new Error("کلاینت Supabase در دسترس نیست.");

        const { error } = await client
          .from("tasks")
          .update({ is_completed: !currentStatus })
          .eq("id", id)
          .eq("user_id", currentUser.id);

        if (error) throw error;
      } else {
        // Local mode
        const allLocalTasks = JSON.parse(localStorage.getItem("local_tasks") || "[]");
        const idx = allLocalTasks.findIndex((t: Task) => t.id === id && t.user_id === currentUser.id);
        if (idx !== -1) {
          allLocalTasks[idx].is_completed = !currentStatus;
          localStorage.setItem("local_tasks", JSON.stringify(allLocalTasks));
        }
      }
      
      await fetchTasks(currentUser, isSupabaseActive);
    } catch (err: any) {
      console.error("Toggle task error:", err);
      setDbError(err.message || "خطا در بروزرسانی وضعیت وظیفه.");
    }
  };

  // Batch Toggle complete
  const handleBatchUpdate = async (updatedTasks: Task[]) => {
    if (!currentUser) return;
    setDbError(null);

    const tasksToUpdate = updatedTasks.filter(ut => {
      const original = tasks.find(t => t.id === ut.id);
      return original && original.is_completed !== ut.is_completed;
    });

    if (tasksToUpdate.length === 0) return;

    try {
      if (isSupabaseActive) {
        const client = getSupabase();
        if (!client) throw new Error("کلاینت Supabase در دسترس نیست.");

        for (const task of tasksToUpdate) {
          const { error } = await client
            .from("tasks")
            .update({ is_completed: task.is_completed })
            .eq("id", task.id)
            .eq("user_id", currentUser.id);

          if (error) throw error;
        }
      } else {
        const allLocalTasks = JSON.parse(localStorage.getItem("local_tasks") || "[]");
        for (const task of tasksToUpdate) {
          const idx = allLocalTasks.findIndex((t: Task) => t.id === task.id && t.user_id === currentUser.id);
          if (idx !== -1) {
            allLocalTasks[idx].is_completed = task.is_completed;
          }
        }
        localStorage.setItem("local_tasks", JSON.stringify(allLocalTasks));
      }
      
      await fetchTasks(currentUser, isSupabaseActive);
    } catch (err: any) {
      console.error("Batch update task error:", err);
      setDbError(err.message || "خطا در بروزرسانی وضعیت وظایف.");
    }
  };

  const handleEditSubmit = async (id: string, taskData: Omit<Task, "id" | "user_id" | "created_at">) => {
    if (!currentUser) return;
    setDbError(null);
    try {
      if (isSupabaseActive) {
        const client = getSupabase();
        if (!client) throw new Error("کلاینت Supabase در دسترس نیست.");

        const { error } = await client
          .from("tasks")
          .update(taskData)
          .eq("id", id)
          .eq("user_id", currentUser.id);

        if (error) throw error;
      } else {
        const allLocalTasks = JSON.parse(localStorage.getItem("local_tasks") || "[]");
        const idx = allLocalTasks.findIndex((t: Task) => t.id === id && t.user_id === currentUser.id);
        if (idx !== -1) {
          allLocalTasks[idx] = { ...allLocalTasks[idx], ...taskData };
          localStorage.setItem("local_tasks", JSON.stringify(allLocalTasks));
        }
      }
      
      await fetchTasks(currentUser, isSupabaseActive);
    } catch (err: any) {
      console.error("Update task error:", err);
      setDbError(err.message || "خطا در بروزرسانی وظیفه.");
    }
  };

  // Delete Task
  const handleDeleteTask = async (id: string) => {
    if (!currentUser) return;
    setDbError(null);

    try {
      if (isSupabaseActive) {
        const client = getSupabase();
        if (!client) throw new Error("کلاینت Supabase در دسترس نیست.");

        const { error } = await client
          .from("tasks")
          .delete()
          .eq("id", id)
          .eq("user_id", currentUser.id);

        if (error) throw error;
      } else {
        // Local mode
        let allLocalTasks = JSON.parse(localStorage.getItem("local_tasks") || "[]");
        allLocalTasks = allLocalTasks.filter((t: Task) => !(t.id === id && t.user_id === currentUser.id));
        localStorage.setItem("local_tasks", JSON.stringify(allLocalTasks));
      }
      
      if (editTask && editTask.id === id) {
        setEditTask(null);
      }
      
      await fetchTasks(currentUser, isSupabaseActive);
    } catch (err: any) {
      console.error("Delete task error:", err);
      setDbError(err.message || "خطا در حذف وظیفه از دیتابیس.");
    }
  };

  return (
    <main className="min-h-screen bg-slate-50/50 pb-16">
      {/* Top Header Panel */}
      <header className="bg-white border-b border-slate-100 shadow-sm mb-8">
        <div className="max-w-7xl mx-auto px-4 py-6 md:py-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/10 shrink-0">
              <ListTodo size={26} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">سامانه مدیریت کارهای روزانه</h1>
              <p className="text-xs text-slate-400 mt-1 font-semibold">توسعه یافته با فریمورک React و هماهنگ با تقویم خورشیدی و دیتابیس Supabase</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-100 px-4 py-2.5 rounded-2xl text-slate-600 self-start md:self-auto shadow-sm">
            <Calendar size={15} className="text-emerald-600" />
            <span className="text-xs font-bold font-mono text-slate-700">{convertToPersianNumbers(todayString)}</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4">
        {/* Supabase / Local database config selector */}
        <SupabaseConfig onConfigChanged={setIsSupabaseActive} isSupabaseActive={isSupabaseActive} />

        {/* Global database errors */}
        {dbError && (
          <div className="bg-rose-50 border border-rose-100 p-5 rounded-3xl mb-6 shadow-sm">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-rose-600 shrink-0 mt-0.5" size={20} />
              <div className="space-y-2">
                <h4 className="font-bold text-rose-800 text-sm">خطا در پردازش دیتابیس</h4>
                <p className="text-xs text-rose-600/90 leading-relaxed">{dbError}</p>
                
                {isSupabaseActive && (
                  <button
                    onClick={() => setShowSQLHelp(!showSQLHelp)}
                    className="mt-2 text-xs font-bold text-rose-700 hover:text-rose-900 flex items-center gap-1 cursor-pointer underline"
                  >
                    <HelpCircle size={14} />
                    {showSQLHelp ? "پنهان کردن راهنمای SQL" : "مشاهده راهنمای گام‌به‌گام ساخت جدول در Supabase"}
                  </button>
                )}
              </div>
            </div>

            {/* Collapsible Supabase table creator helper */}
            {isSupabaseActive && showSQLHelp && (
              <div className="mt-5 pt-5 border-t border-rose-200/50 text-slate-700 text-xs leading-relaxed space-y-4 animate-in fade-in duration-200">
                <p className="font-semibold text-slate-800">
                  برای رفع خطا، مراحل زیر را در کنسول مدیریتی Supabase انجام دهید:
                </p>
                <ol className="list-decimal list-inside space-y-2 pr-1 font-medium text-slate-600">
                  <li>وارد پنل پروژه خود در Supabase شوید.</li>
                  <li>از سایدبار چپ، بخش <strong className="text-slate-800">SQL Editor</strong> را باز کنید.</li>
                  <li>یک کوئری جدید ایجاد کرده و کد زیر را دقیقاً کپی و اجرا (Run) کنید تا جدول تسک‌ها ساخته شود:</li>
                </ol>
                <pre dir="ltr" className="bg-slate-900 text-emerald-400 p-4 rounded-2xl font-mono text-xs overflow-x-auto text-left leading-relaxed shadow-inner">
{`create table tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  date text not null,
  time text not null,
  tag text,
  location text,
  description text,
  is_completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- فعال‌سازی دسترسی امنیتی RLS
alter table tasks enable row level security;

create policy "Users can modify their own tasks"
  on tasks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);`}
                </pre>
                <div className="p-3 bg-slate-100 rounded-xl flex items-center gap-2 text-[11px] text-slate-500">
                  <Info size={14} />
                  <span>اجرای کدهای فوق به طور کامل دسترسی‌های امنیت پایگاه داده را تنظیم و مشکل خواندن/نوشتن را برطرف می‌کند.</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Auth status panel */}
        <Auth
          isSupabaseActive={isSupabaseActive}
          currentUser={currentUser}
          onSessionChange={setCurrentUser}
          appFont={appFont}
          setAppFont={setAppFont}
        />

        {/* Quick Checklist Modal */}
        <QuickChecklistModal
          tasks={tasks}
          isOpen={showQuickChecklist}
          onClose={() => setShowQuickChecklist(false)}
          onSave={handleBatchUpdate}
          onDelete={handleDeleteTask}
          onEditSubmit={handleEditSubmit}
        />

        {/* Dashboard Panels */}
        {!currentUser ? (
          <div className="max-w-2xl mx-auto bg-white border border-slate-100 rounded-3xl p-8 md:p-12 text-center shadow-xl mt-8">
            <div className="inline-flex p-4 bg-emerald-50 text-emerald-600 rounded-full mb-5">
              <Database size={40} className="animate-pulse" />
            </div>
            <h3 className="font-extrabold text-slate-800 text-lg mb-3">سیستم مدیریت کارها غیرفعال است</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed mb-6 font-medium">
              جهت مشاهده، مدیریت، ذخیره‌سازی کارها و استفاده کامل از امکانات برنامه ابتدا در بخش بالا وارد حساب کاربری خود شوید یا حساب جدید بسازید.
            </p>
            <div className="p-4 bg-slate-50 rounded-2xl text-[11px] text-slate-500 max-w-md mx-auto flex items-center gap-2 leading-relaxed">
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
              <span>در حالت آفلاین (محلی) نیز اطلاعات در مرورگر اختصاصی شما محفوظ خواهد بود.</span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
            {/* Form Column - Right on RTL */}
            <div className="lg:col-span-4 lg:order-2">
              <TaskForm
                onSubmit={handleTaskSubmit}
                editTask={editTask}
                onCancelEdit={() => setEditTask(null)}
              />
            </div>

            {/* List Column - Left on RTL */}
            <div className="lg:col-span-8 lg:order-1">
              {loadingTasks ? (
                <div className="bg-white border border-slate-100 rounded-3xl p-16 text-center shadow-md">
                  <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-xs font-semibold text-slate-500">در حال همگام‌سازی و بارگذاری وظایف روزانه...</p>
                </div>
              ) : (
                <TaskList
                  tasks={tasks}
                  onToggleComplete={handleToggleComplete}
                  onEdit={setEditTask}
                  onDelete={handleDeleteTask}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

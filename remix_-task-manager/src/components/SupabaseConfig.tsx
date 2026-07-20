import { useState, useEffect, FormEvent } from "react";
import { Settings, CheckCircle2, AlertTriangle, Eye, EyeOff, HelpCircle } from "lucide-react";
import { loadSavedCredentials, saveCredentials, clearSavedCredentials, getSupabase } from "../lib/supabase";

interface SupabaseConfigProps {
  onConfigChanged: (isSupabaseActive: boolean) => void;
  isSupabaseActive: boolean;
}

export default function SupabaseConfig({ onConfigChanged, isSupabaseActive }: SupabaseConfigProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"local" | "supabase">("local");
  const [url, setUrl] = useState("");
  const [anonKey, setAnonKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const creds = loadSavedCredentials();
    if (creds) {
      setUrl(creds.url);
      setAnonKey(creds.anonKey);
      setMode("supabase");
      onConfigChanged(true);
      setStatus("success");
    } else {
      setMode("local");
      onConfigChanged(false);
    }
  }, []);

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    if (mode === "local") {
      clearSavedCredentials();
      onConfigChanged(false);
      setStatus("idle");
      setErrorMessage("");
      setIsOpen(false);
    } else {
      if (!url || !anonKey) {
        setStatus("error");
        setErrorMessage("لطفاً آدرس پروژه (URL) و کلید Anon را وارد کنید.");
        return;
      }
      try {
        saveCredentials(url, anonKey);
        const client = getSupabase();
        if (client) {
          setStatus("success");
          setErrorMessage("");
          onConfigChanged(true);
          setIsOpen(false);
        } else {
          throw new Error("خطا در راه‌اندازی کلاینت Supabase");
        }
      } catch (err: any) {
        setStatus("error");
        setErrorMessage(err.message || "خطایی رخ داد. تنظیمات را بررسی کنید.");
        onConfigChanged(false);
      }
    }
  };

  const handleDisconnect = () => {
    clearSavedCredentials();
    setUrl("");
    setAnonKey("");
    setMode("local");
    setStatus("idle");
    onConfigChanged(false);
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl text-slate-100 p-4 mb-6 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-800 rounded-xl text-slate-300">
            <Settings size={20} className="animate-spin-slow" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">تنظیمات دیتابیس و همگام‌سازی</h3>
            <p className="text-xs text-slate-400 mt-1">
              {isSupabaseActive
                ? "متصل به سرور ابری Supabase (اطلاعات همگام‌سازی می‌شوند)"
                : "در حال استفاده از حافظه مرورگر (آفلاین / لوکال)"}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 justify-end sm:justify-start">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
              isSupabaseActive
                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                : "bg-blue-500/15 text-blue-400 border border-blue-500/30"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isSupabaseActive ? "bg-emerald-400" : "bg-blue-400"}`} />
            {isSupabaseActive ? "دیتابیس Supabase" : "حافظه آفلاین محلی"}
          </span>
          
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium rounded-xl transition-all border border-slate-700/50 cursor-pointer"
          >
            {isOpen ? "بستن تنظیمات" : "تغییر حالت"}
          </button>
        </div>
      </div>

      {isOpen && (
        <form onSubmit={handleSave} className="mt-5 pt-5 border-t border-slate-800/80 animate-in fade-in duration-200">
          <div className="mb-4">
            <label className="block text-xs font-medium text-slate-300 mb-2">نوع دیتابیس / ذخیره‌سازی</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMode("local")}
                className={`py-3 px-4 rounded-xl text-xs font-semibold border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  mode === "local"
                    ? "bg-blue-600/10 border-blue-500 text-blue-300"
                    : "bg-slate-800/40 border-slate-700 text-slate-400 hover:bg-slate-800"
                }`}
              >
                <span>حافظه مرورگر (آفلاین)</span>
                <span className="text-[10px] opacity-80 font-normal">بدون نیاز به ثبت‌نام و اکانت</span>
              </button>
              
              <button
                type="button"
                onClick={() => setMode("supabase")}
                className={`py-3 px-4 rounded-xl text-xs font-semibold border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  mode === "supabase"
                    ? "bg-emerald-600/10 border-emerald-500 text-emerald-300"
                    : "bg-slate-800/40 border-slate-700 text-slate-400 hover:bg-slate-800"
                }`}
              >
                <span>دیتابیس Supabase (واقعی)</span>
                <span className="text-[10px] opacity-80 font-normal">ذخیره ابری با ایمیل و پسورد</span>
              </button>
            </div>
          </div>

          {mode === "supabase" && (
            <div className="space-y-4 mb-4 animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3 text-xs text-emerald-400 flex items-start gap-2 leading-relaxed">
                <HelpCircle size={16} className="mt-0.5 shrink-0" />
                <div>
                  برای استفاده از دیتابیس واقعی، یک پروژه رایگان در سایت <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="underline font-bold hover:text-emerald-300">supabase.com</a> ایجاد کنید، جدول <code className="bg-slate-800 px-1 py-0.5 rounded text-white font-mono">tasks</code> را طبق مشخصات بسازید و آدرس اتصال خود را زیر وارد کنید.
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Project URL</label>
                <input
                  type="text"
                  dir="ltr"
                  placeholder="https://your-project.supabase.co"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-sm font-mono rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-left"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Anon API Key</label>
                <div className="relative">
                  <input
                    type={showKey ? "text" : "password"}
                    dir="ltr"
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={anonKey}
                    onChange={(e) => setAnonKey(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-sm font-mono rounded-xl pl-10 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-left"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-xs flex items-center gap-2">
              <AlertTriangle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          {status === "success" && isSupabaseActive && (
            <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>کلاینت Supabase با موفقیت راه‌اندازی شد و هم‌اکنون فعال است.</span>
            </div>
          )}

          <div className="flex items-center gap-3 justify-end mt-4">
            {isSupabaseActive && (
              <button
                type="button"
                onClick={handleDisconnect}
                className="px-4 py-2 bg-rose-600/10 text-rose-400 hover:bg-rose-600/20 text-xs font-semibold rounded-xl transition-all border border-rose-500/20 cursor-pointer"
              >
                قطع اتصال دیتابیس
              </button>
            )}
            
            <button
              type="submit"
              className={`px-5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                mode === "supabase"
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                  : "bg-blue-600 hover:bg-blue-500 text-white"
              }`}
            >
              ذخیره و اعمال تنظیمات
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

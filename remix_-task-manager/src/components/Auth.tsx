import { useState, useEffect, FormEvent } from "react";
import { Mail, Lock, UserPlus, LogIn, LogOut, CheckCircle, AlertTriangle, User, Phone, Edit2, X, Settings } from "lucide-react";
import { getSupabase } from "../lib/supabase";

interface AuthProps {
  isSupabaseActive: boolean;
  onSessionChange: (sessionUser: any | null) => void;
  currentUser: any | null;
  appFont?: string;
  setAppFont?: (font: string) => void;
}

export default function Auth({ isSupabaseActive, onSessionChange, currentUser, appFont = "Vazirmatn", setAppFont }: AuthProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signUpName, setSignUpName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Profile Edit States
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<'font' | 'profile'>('font');
  const [originalAppFont, setOriginalAppFont] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");

  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.user_metadata?.full_name || "");
      setPhone(currentUser.user_metadata?.phone || "");
      setBio(currentUser.user_metadata?.bio || "");
      setAvatarUrl(currentUser.user_metadata?.avatar_url || "");
    }
  }, [currentUser]);

  useEffect(() => {
    // Check initial session
    checkSession();
    
    // Set up auth listener if Supabase is active
    if (isSupabaseActive) {
      const client = getSupabase();
      if (client) {
        const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
          onSessionChange(session?.user || null);
        });
        return () => {
          subscription.unsubscribe();
        };
      }
    }
  }, [isSupabaseActive]);

  const checkSession = async () => {
    if (isSupabaseActive) {
      const client = getSupabase();
      if (client) {
        const { data } = await client.auth.getSession();
        onSessionChange(data.session?.user || null);
      }
    } else {
      const localUser = localStorage.getItem("local_session_user");
      if (localUser) {
        onSessionChange(JSON.parse(localUser));
      } else {
        onSessionChange(null);
      }
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    if (!email || !password) {
      setError("لطفاً تمامی فیلدها را پر کنید.");
      return;
    }
    if (password.length < 6) {
      setError("رمز عبور باید حداقل ۶ کاراکتر باشد.");
      return;
    }

    setLoading(true);

    try {
      if (isSupabaseActive) {
        const client = getSupabase();
        if (!client) throw new Error("کلاینت Supabase در دسترس نیست.");

        if (isSignUp) {
          const { data, error: signUpErr } = await client.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: signUpName
              }
            }
          });
          if (signUpErr) throw signUpErr;
          
          if (data.user && data.session === null) {
            setSuccess("ثبت‌نام با موفقیت انجام شد! لطفاً ایمیل خود را تایید کنید (در صورت فعال بودن در Supabase).");
          } else if (data.user) {
            setSuccess("ثبت‌نام و ورود با موفقیت انجام شد.");
            onSessionChange(data.user);
          }
        } else {
          const { data, error: signInErr } = await client.auth.signInWithPassword({
            email,
            password,
          });
          if (signInErr) throw signInErr;
          
          onSessionChange(data.user);
          setSuccess("ورود با موفقیت انجام شد.");
        }
      } else {
        // Simulated local auth
        const localUsers = JSON.parse(localStorage.getItem("local_users") || "[]");
        
        if (isSignUp) {
          const userExists = localUsers.find((u: any) => u.email === email);
          if (userExists) {
            throw new Error("این ایمیل قبلاً ثبت‌نام شده است.");
          }
          
          const newUser = { 
            id: crypto.randomUUID(), 
            email, 
            password,
            user_metadata: { full_name: signUpName }
          };
          localUsers.push(newUser);
          localStorage.setItem("local_users", JSON.stringify(localUsers));
          
          const sessionUser = { id: newUser.id, email: newUser.email, user_metadata: newUser.user_metadata };
          localStorage.setItem("local_session_user", JSON.stringify(sessionUser));
          onSessionChange(sessionUser);
          setSuccess("ثبت‌نام و ورود محلی با موفقیت انجام شد!");
        } else {
          const matchedUser = localUsers.find((u: any) => u.email === email && u.password === password);
          if (!matchedUser) {
            throw new Error("ایمیل یا رمز عبور اشتباه است.");
          }
          
          const sessionUser = { id: matchedUser.id, email: matchedUser.email };
          localStorage.setItem("local_session_user", JSON.stringify(sessionUser));
          onSessionChange(sessionUser);
          setSuccess("ورود محلی با موفقیت انجام شد.");
        }
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      // Translate common error messages
      let msg = err.message || "خطایی رخ داد.";
      if (msg.includes("Invalid login credentials") || msg.includes("User not found")) {
        msg = "ایمیل یا رمز عبور وارد شده اشتباه است.";
      } else if (msg.includes("User already registered") || msg.includes("already registered")) {
        msg = "این ایمیل قبلاً ثبت‌نام شده است.";
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      if (isSupabaseActive) {
        const client = getSupabase();
        if (client) {
          await client.auth.signOut();
        }
      } else {
        localStorage.removeItem("local_session_user");
      }
      onSessionChange(null);
      setEmail("");
      setPassword("");
    } catch (err: any) {
      console.error("Logout error:", err);
      setError(err.message || "خطا در خروج از حساب.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setProfileError("");
    setProfileSuccess("");
    setLoading(true);

    try {
      if (isSupabaseActive) {
        const client = getSupabase();
        if (!client) throw new Error("کلاینت Supabase در دسترس نیست.");

        const { data, error: updateErr } = await client.auth.updateUser({
          data: {
            full_name: fullName,
            phone: phone,
            bio: bio,
            avatar_url: avatarUrl
          }
        });

        if (updateErr) throw updateErr;
        
        onSessionChange(data.user);
        setProfileSuccess("اطلاعات پروفایل شما در دیتابیس ابری با موفقیت بروزرسانی شد.");
      } else {
        // Local mode update
        const localUsers = JSON.parse(localStorage.getItem("local_users") || "[]");
        const updatedUsers = localUsers.map((u: any) => {
          if (u.id === currentUser.id) {
            return {
              ...u,
              user_metadata: {
                ...u.user_metadata,
                full_name: fullName,
                phone: phone,
                bio: bio,
                avatar_url: avatarUrl
              }
            };
          }
          return u;
        });
        localStorage.setItem("local_users", JSON.stringify(updatedUsers));

        const sessionUser = {
          ...currentUser,
          user_metadata: {
            ...currentUser?.user_metadata,
            full_name: fullName,
            phone: phone,
            bio: bio,
            avatar_url: avatarUrl
          }
        };
        localStorage.setItem("local_session_user", JSON.stringify(sessionUser));
        onSessionChange(sessionUser);
        setProfileSuccess("اطلاعات پروفایل محلی شما با موفقیت بروزرسانی شد.");
      }
      
      setTimeout(() => {
        setShowEditProfile(false);
        setProfileSuccess("");
      }, 1500);
    } catch (err: any) {
      console.error("Save profile error:", err);
      setProfileError(err.message || "خطا در ذخیره اطلاعات پروفایل.");
    } finally {
      setLoading(false);
    }
  };

  if (currentUser) {
    const userDisplayName = currentUser.user_metadata?.full_name || currentUser.email?.split("@")[0] || "کاربر گرامی";
    const userPhone = currentUser.user_metadata?.phone || "";
    const userBio = currentUser.user_metadata?.bio || "";
    const userAvatar = currentUser.user_metadata?.avatar_url || "";
    const userInitials = userDisplayName.substring(0, 2).toUpperCase();

    return (
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-md mb-6 animate-in fade-in duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {userAvatar ? (
              <img src={userAvatar} alt="Profile" className="h-14 w-14 rounded-2xl object-cover shadow-md shadow-emerald-600/10 shrink-0" />
            ) : (
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-black text-lg shadow-md shadow-emerald-600/10 shrink-0">
                {userInitials}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold text-slate-800">{userDisplayName}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${isSupabaseActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                  {isSupabaseActive ? 'ورود آنلاین' : 'ورود آفلاین'}
                </span>
              </div>
              <span className="text-xs text-slate-400 block font-semibold font-mono mt-1">{currentUser.email}</span>
              {userPhone && (
                <span className="text-xs text-slate-400 block font-semibold font-mono mt-0.5">تلفن: {userPhone}</span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const willShow = !showSettings;
                setShowSettings(willShow);
                if (willShow) setOriginalAppFont(appFont || "Vazirmatn");
              }}
              className="px-4 py-2.5 text-white text-xs font-bold rounded-2xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer hover:opacity-90"
              style={{ backgroundColor: "#0000FF" }}
            >
              <Settings size={14} />
              <span>تنظیمات</span>
            </button>
            <button
              onClick={handleLogout}
              disabled={loading}
              className="px-4 py-2.5 bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-600 text-xs font-bold rounded-2xl transition-all border border-slate-200/60 hover:border-rose-200/50 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <LogOut size={14} />
              )}
              <span>خروج</span>
            </button>
          </div>
        </div>

        {userBio && (
          <div className="mt-4 p-3 bg-slate-50 rounded-2xl border border-slate-100/80">
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              <span className="font-bold text-slate-600">درباره من:</span> {userBio}
            </p>
          </div>
        )}

        {/* Settings Panel */}
        {showSettings && (
          <div className="mt-6 pt-6 border-t border-slate-100 animate-in slide-in-from-top-4 duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                <Settings size={16} style={{ color: "#0000FF" }} />
                تنظیمات
              </h3>
              <button 
                onClick={() => {
                  if (setAppFont && originalAppFont) setAppFont(originalAppFont);
                  setShowSettings(false);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 cursor-pointer"
                type="button"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-2">
              <button
                onClick={() => setActiveSettingsTab('font')}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${activeSettingsTab === 'font' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                فونت برنامه
              </button>
              <button
                onClick={() => setActiveSettingsTab('profile')}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${activeSettingsTab === 'profile' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                ویرایش پروفایل
              </button>
            </div>

            {activeSettingsTab === 'font' && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { id: 'Vazirmatn', name: 'وزیرمتن' },
                      { id: 'Lalezar', name: 'لاله‌زار' },
                      { id: 'Markazi Text', name: 'مرکزی' },
                      { id: 'Noto Naskh Arabic', name: 'نسخ عربی' },
                      { id: 'Parastoo', name: 'پرستو' },
                      { id: 'Jomhuria', name: 'جمهوریه' }
                    ].map((font) => (
                      <button
                        key={font.id}
                        type="button"
                        onClick={() => setAppFont?.(font.id)}
                        className={`py-3 px-2 rounded-xl text-sm font-semibold transition-all border ${appFont === font.id ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                        style={{ fontFamily: font.id }}
                      >
                        {font.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-50">
                  <button
                    type="button"
                    onClick={() => {
                      if (setAppFont && originalAppFont) setAppFont(originalAppFont);
                      setShowSettings(false);
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    انصراف
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOriginalAppFont(appFont || "Vazirmatn");
                      setShowSettings(false);
                    }}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/10 transition-all cursor-pointer flex items-center gap-1"
                  >
                    <span>ذخیره تغییرات</span>
                  </button>
                </div>
              </div>
            )}

            {activeSettingsTab === 'profile' && (
              <form onSubmit={handleSaveProfile} className="space-y-4 animate-in fade-in duration-300">
                {profileError && (
                  <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs flex items-center gap-2">
                    <AlertTriangle size={15} className="shrink-0" />
                    <span>{profileError}</span>
                  </div>
                )}

                {profileSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl text-xs flex items-center gap-2">
                    <CheckCircle size={15} className="shrink-0" />
                    <span>{profileSuccess}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">نام و نام خانوادگی</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: علی احمدی"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-right"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">شماره همراه</label>
                    <input
                      type="tel"
                      dir="ltr"
                      placeholder="09123456789"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-left font-mono"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">لینک تصویر پروفایل (اختیاری)</label>
                  <input
                    type="url"
                    dir="ltr"
                    placeholder="https://example.com/avatar.png"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-left font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">درباره من / بیوگرافی (اختیاری)</label>
                  <textarea
                    placeholder="توضیحات کوتاه یا بیوگرافی شخصی..."
                    value={bio}
                    rows={2}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-right"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (setAppFont && originalAppFont) setAppFont(originalAppFont);
                      setShowSettings(false);
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/10 transition-all cursor-pointer flex items-center gap-1"
                  >
                    {loading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                    <span>ذخیره تغییرات</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white border border-slate-100 rounded-3xl shadow-xl p-8 mb-6 animate-in fade-in duration-300">
      <div className="text-center mb-8">
        <div className="inline-flex p-3 bg-emerald-50 text-emerald-600 rounded-2xl mb-3">
          {isSignUp ? <UserPlus size={28} /> : <LogIn size={28} />}
        </div>
        <h2 className="text-xl font-bold text-slate-800">
          {isSignUp ? "ایجاد حساب کاربری" : "ورود به حساب کاربری"}
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          {isSupabaseActive
            ? "از ایمیل و رمز عبور خود برای ورود به دیتابیس ابری استفاده کنید"
            : "برای کار محلی و آزمایشی، یک ایمیل و پسورد دلخواه وارد کنید"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs flex items-center gap-2 leading-relaxed">
            <AlertTriangle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl text-xs flex items-center gap-2 leading-relaxed">
            <CheckCircle size={16} className="shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {isSignUp && (
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">نام نمایشی</label>
            <div className="relative">
              <input
                type="text"
                required={isSignUp}
                placeholder="نام و نام خانوادگی"
                value={signUpName}
                onChange={(e) => setSignUpName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl pl-3 pr-10 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-right"
              />
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 pointer-events-none">
                <User size={18} />
              </div>
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">آدرس ایمیل</label>
          <div className="relative">
            <input
              type="email"
              dir="ltr"
              required
              placeholder="example@mail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm font-mono rounded-xl pl-3 pr-10 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-left"
            />
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 pointer-events-none">
              <Mail size={18} />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">رمز عبور</label>
          <div className="relative">
            <input
              type="password"
              dir="ltr"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl pl-3 pr-10 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-left"
            />
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 pointer-events-none">
              <Lock size={18} />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-lg shadow-emerald-600/10 hover:shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-6"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : isSignUp ? (
            <>
              <UserPlus size={18} />
              <span>ثبت‌نام در سامانه</span>
            </>
          ) : (
            <>
              <LogIn size={18} />
              <span>ورود به برنامه</span>
            </>
          )}
        </button>
      </form>

      <div className="text-center mt-6 pt-5 border-t border-slate-100">
        <button
          onClick={() => {
            setIsSignUp(!isSignUp);
            setError("");
            setSuccess("");
          }}
          className="text-xs text-emerald-600 hover:text-emerald-500 font-semibold cursor-pointer"
        >
          {isSignUp ? "حساب کاربری دارید؟ وارد شوید" : "هنوز ثبت‌نام نکرده‌اید؟ ساخت حساب کاربری"}
        </button>
      </div>
    </div>
  );
}

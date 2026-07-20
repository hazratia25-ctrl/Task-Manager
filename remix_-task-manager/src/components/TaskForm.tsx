import { useState, useEffect, FormEvent } from "react";
import { Plus, Check, MapPin, Tag, FileText, Clock, RefreshCw, X, RotateCcw } from "lucide-react";
import JalaliDatePicker from "./JalaliDatePicker";
import TimePicker from "./TimePicker";
import { getTodayJalaliString, getCurrentTimeString } from "../utils/jalali";
import { Task } from "../types";

interface TaskFormProps {
  onSubmit: (taskData: Omit<Task, "id" | "user_id" | "created_at">) => Promise<void>;
  editTask: Task | null;
  onCancelEdit: () => void;
}

export default function TaskForm({ onSubmit, editTask, onCancelEdit }: TaskFormProps) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(getTodayJalaliString());
  const [time, setTime] = useState(getCurrentTimeString());
  const [category, setCategory] = useState("کاری");
  const [customTag, setCustomTag] = useState("");
  const [isCustomTagActive, setIsCustomTagActive] = useState(false);
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editTask) {
      setTitle(editTask.title);
      setDate(editTask.date);
      setTime(editTask.time);
      
      const standardTags = ["کاری", "شخصی", "فوری"];
      if (standardTags.includes(editTask.tag)) {
        setCategory(editTask.tag);
        setIsCustomTagActive(false);
        setCustomTag("");
      } else {
        setCategory("سفارشی");
        setIsCustomTagActive(true);
        setCustomTag(editTask.tag);
      }
      
      setLocation(editTask.location || "");
      setDescription(editTask.description || "");
    } else {
      resetForm();
    }
  }, [editTask]);

  const resetForm = () => {
    setTitle("");
    setDate(getTodayJalaliString());
    setTime(getCurrentTimeString());
    setCategory("کاری");
    setCustomTag("");
    setIsCustomTagActive(false);
    setLocation("");
    setDescription("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      const finalTag = isCustomTagActive ? (customTag.trim() || "سفارشی") : category;
      await onSubmit({
        title: title.trim(),
        date,
        time,
        tag: finalTag,
        location: location.trim(),
        description: description.trim(),
        is_completed: editTask ? editTask.is_completed : false,
      });
      resetForm();
    } catch (err) {
      console.error("Error submitting task form:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (val: string) => {
    setCategory(val);
    if (val === "سفارشی") {
      setIsCustomTagActive(true);
    } else {
      setIsCustomTagActive(false);
    }
  };

  return (
    <div className="bg-white border border-slate-100 rounded-3xl shadow-xl p-6 md:p-8 animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-50">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <span className="inline-block w-2.5 h-6 bg-emerald-500 rounded-full" />
          {editTask ? "ویرایش وظیفه موجود" : "افزودن وظیفه جدید"}
        </h2>
        {editTask && (
          <button
            onClick={onCancelEdit}
            className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            title="انصراف از ویرایش"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">عنوان وظیفه (اجباری)</label>
          <input
            type="text"
            required
            disabled={loading}
            placeholder="مثال: جلسه هفتگی با تیم توسعه"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-right"
          />
        </div>

        {/* Date and Time Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">تاریخ انجام (شمسی)</label>
            <JalaliDatePicker value={date} onChange={setDate} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">ساعت انجام</label>
            <TimePicker
              value={time}
              onChange={setTime}
              disabled={loading}
            />
          </div>
        </div>

        {/* Tag / Category Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-2.5 flex items-center gap-1.5">
            <Tag size={14} className="text-slate-400" />
            <span>دسته‌بندی و برچسب</span>
          </label>
          
          <div className="flex flex-wrap gap-2.5">
            {["کاری", "شخصی", "فوری", "سفارشی"].map((cat) => {
              const isActive = category === cat;
              let activeClass = "bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-500/10";
              if (isActive) {
                if (cat === "کاری") activeClass = "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/10";
                if (cat === "شخصی") activeClass = "bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-500/10";
                if (cat === "فوری") activeClass = "bg-rose-600 text-white border-rose-600 shadow-sm shadow-rose-500/10";
                if (cat === "سفارشی") activeClass = "bg-purple-600 text-white border-purple-600 shadow-sm shadow-purple-500/10";
              }
              
              return (
                <button
                  key={cat}
                  type="button"
                  disabled={loading}
                  onClick={() => handleCategoryChange(cat)}
                  className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all border cursor-pointer ${
                    isActive
                      ? activeClass
                      : "bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {isCustomTagActive && (
            <div className="mt-3 animate-in fade-in slide-in-from-top-1 duration-200">
              <input
                type="text"
                disabled={loading}
                placeholder="برچسب دلخواه خود را بنویسید..."
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-right"
              />
            </div>
          )}
        </div>

        {/* Location */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
            <MapPin size={14} className="text-slate-400" />
            <span>مکان / آدرس (اختیاری)</span>
          </label>
          <input
            type="text"
            disabled={loading}
            placeholder="مثال: اتاق کنفرانس شماره ۲ یا پلتفرم گوگل‌میت"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-right"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
            <FileText size={14} className="text-slate-400" />
            <span>توضیحات تکمیلی (اختیاری)</span>
          </label>
          <textarea
            disabled={loading}
            rows={3}
            placeholder="جزئیات بیشتر در مورد این وظیفه..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-right resize-none"
          />
        </div>

        {/* Form Actions */}
        <div className="flex items-center gap-3 pt-4 border-t border-slate-50">
          {editTask ? (
            <button
              type="button"
              onClick={onCancelEdit}
              disabled={loading}
              className="flex-1 py-3 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <span>انصراف</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={resetForm}
              disabled={loading}
              className="flex-1 py-3 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 hover:opacity-90"
              style={{ backgroundColor: "#0000FF" }}
            >
              <RotateCcw size={14} />
              <span>پاک کردن فرم</span>
            </button>
          )}
          
          <button
            type="submit"
            disabled={loading || !title.trim()}
            className={`flex-[2] py-3 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 ${
              editTask
                ? "bg-amber-500 hover:bg-amber-400 shadow-amber-500/10 hover:shadow-amber-500/20"
                : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/10 hover:shadow-emerald-600/20"
            }`}
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : editTask ? (
              <>
                <RefreshCw size={14} />
                <span>بروزرسانی وظیفه</span>
              </>
            ) : (
              <>
                <Plus size={14} />
                <span>ثبت وظیفه جدید</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

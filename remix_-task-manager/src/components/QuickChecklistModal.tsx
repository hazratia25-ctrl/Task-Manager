import { useState, useEffect } from "react";
import { Check, Edit2, Trash2, X, MapPin, Clock } from "lucide-react";
import { Task } from "../types";
import { convertToPersianNumbers, formatJalaliDateFull, getTodayJalaliString } from "../utils/jalali";
import TaskForm from "./TaskForm";

interface QuickChecklistModalProps {
  tasks: Task[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedTasks: Task[]) => void;
  onDelete: (id: string) => void;
  onEditSubmit: (id: string, taskData: Omit<Task, "id" | "user_id" | "created_at">) => Promise<void>;
}

export default function QuickChecklistModal({ tasks, isOpen, onClose, onSave, onDelete, onEditSubmit }: QuickChecklistModalProps) {
  const [localTasks, setLocalTasks] = useState<Task[]>([]);
  const [isModified, setIsModified] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const today = getTodayJalaliString();

  useEffect(() => {
    if (isOpen) {
      setLocalTasks([...tasks]);
      setIsModified(false);
      setConfirmDeleteId(null);
      setEditingTask(null);
    }
  }, [isOpen, tasks]);

  if (!isOpen) return null;

  const todayTasks = localTasks.filter(t => t.date === today);

  const handleToggle = (id: string) => {
    setLocalTasks(prev => 
      prev.map(t => t.id === id ? { ...t, is_completed: !t.is_completed } : t)
    );
    setIsModified(true);
  };

  const handleDelete = (id: string) => {
    onDelete(id);
    setLocalTasks(prev => prev.filter(t => t.id !== id));
    setConfirmDeleteId(null);
  };

  const handleSave = () => {
    onSave(localTasks);
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  const getTagStyle = (tag: string) => {
    switch (tag) {
      case "کاری": return "bg-blue-100 text-blue-700 border border-blue-200";
      case "شخصی": return "bg-purple-100 text-purple-700 border border-purple-200";
      case "فوری": return "bg-rose-100 text-rose-700 border border-rose-200";
      default: return "bg-slate-100 text-slate-700 border border-slate-200";
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" dir="rtl">
        <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-300">
          {/* Header */}
          <div className="px-6 py-5 flex items-center justify-between" style={{ backgroundColor: "#0000FF" }}>
            <h2 className="text-white font-black text-lg">چک لیست سریع</h2>
            <span className="text-white/90 text-sm font-semibold bg-black/15 px-3 py-1.5 rounded-xl text-center">
              {convertToPersianNumbers(formatJalaliDateFull(today))}
            </span>
          </div>
          
          {/* Content */}
          <div className="p-6 overflow-y-auto flex-1 bg-slate-50/30">
            {todayTasks.length === 0 ? (
              <p className="text-center text-slate-500 text-sm font-semibold py-10">
                امروز برنامه‌ای برای انجام ندارید!
              </p>
            ) : (
              <div className="space-y-3">
                {todayTasks.map(task => (
                  <div key={task.id} className="flex flex-col p-4 bg-white rounded-2xl border border-slate-100 shadow-sm transition-all hover:border-blue-100">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-1.5 min-w-0 flex-1 ml-4">
                        <div className="flex items-center gap-3">
                          <span className={`px-2.5 py-1 text-[10px] sm:text-xs font-bold rounded-lg shrink-0 ${getTagStyle(task.tag || "سفارشی")}`}>
                            {task.tag || "سفارشی"}
                          </span>
                          <span className={`text-sm font-bold truncate flex-1 ${task.is_completed ? "text-slate-400 line-through" : "text-slate-800"}`}>
                            {task.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-500 pr-1">
                          {task.time && (
                            <div className="flex items-center gap-1">
                              <Clock size={12} className="text-slate-400" />
                              <span>{convertToPersianNumbers(task.time)}</span>
                            </div>
                          )}
                          {task.location && (
                            <div className="flex items-center gap-1 max-w-[120px]">
                              <MapPin size={12} className="text-slate-400 shrink-0" />
                              <span className="truncate">{task.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {confirmDeleteId === task.id ? (
                          <div className="flex items-center gap-1 bg-rose-50 p-1 rounded-xl animate-in fade-in zoom-in duration-200 border border-rose-100 shrink-0">
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="p-1.5 hover:bg-white text-slate-500 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
                              title="انصراف"
                            >
                              <X size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(task.id)}
                              className="p-1.5 hover:bg-white text-rose-500 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                              title="تایید حذف"
                            >
                              <Check size={16} />
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => setEditingTask(task)}
                              className="text-blue-500 hover:bg-blue-50 p-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
                              title="ویرایش"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(task.id)}
                              className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
                              title="حذف"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                        
                        <button
                          onClick={() => handleToggle(task.id)}
                          className={`ml-1 relative w-[42px] h-[24px] rounded-full border-[2.5px] transition-colors duration-300 flex items-center px-[3px] cursor-pointer shrink-0 ${
                            task.is_completed 
                              ? 'border-blue-500 bg-blue-50 justify-end' 
                              : 'border-slate-500 bg-slate-100 justify-start'
                          }`}
                        >
                          <div className="w-[14px] h-[14px] rounded-full flex items-center justify-center">
                            <Check size={12} strokeWidth={4} className={task.is_completed ? "text-blue-500" : "text-slate-500"} />
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-slate-100 bg-white flex items-center justify-end gap-3">
            {isModified && (
              <button
                onClick={handleCancel}
                className="px-5 py-2.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 text-sm font-bold rounded-xl transition-all cursor-pointer"
              >
                انصراف
              </button>
            )}
            <button
              onClick={isModified ? handleSave : onClose}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl shadow-md transition-all cursor-pointer"
            >
              {isModified ? "ذخیره تغییرات" : "تایید"}
            </button>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingTask && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" dir="rtl">
          <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">ویرایش برنامه</h3>
              <button 
                onClick={() => setEditingTask(null)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <TaskForm
                editTask={editingTask}
                onCancelEdit={() => setEditingTask(null)}
                onSubmit={async (data) => {
                  await onEditSubmit(editingTask.id, data);
                  setLocalTasks(prev => prev.map(t => t.id === editingTask.id ? { ...t, ...data } : t));
                  setEditingTask(null);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

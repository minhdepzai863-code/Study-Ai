import React, { useState } from 'react';
import { CalendarCheck, Loader2, CheckCircle2 } from 'lucide-react';
import { handleCalendarSync } from '../services/googleCalendar';
import { StudyTask } from '../types';

interface CalendarSyncButtonProps {
  onSyncComplete: (tasks: StudyTask[]) => void;
}

export const CalendarSyncButton: React.FC<CalendarSyncButtonProps> = ({ onSyncComplete }) => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleClick = async () => {
    setLoading(true);
    setStatus('idle');
    try {
      const tasks = await handleCalendarSync();
      if (tasks && tasks.length > 0) {
        onSyncComplete(tasks);
        setStatus('success');
        setTimeout(() => setStatus('idle'), 3000);
      } else {
        setStatus('error');
      }
    } catch (error) {
      console.error("Sync failed", error);
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-6">
      <button
        onClick={handleClick}
        disabled={loading}
        type="button"
        className={`
          w-full py-3 px-5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 border shadow-sm active:scale-95
          ${status === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400' 
            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700'}
        `}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Đang kết nối Calendar...</span>
          </>
        ) : status === 'success' ? (
          <>
            <CheckCircle2 className="w-4 h-4" />
            <span>Đã đồng bộ thành công!</span>
          </>
        ) : (
          <>
            <CalendarCheck className="w-4 h-4" />
            <span>Nhập từ Google Calendar</span>
          </>
        )}
      </button>
    </div>
  );
};
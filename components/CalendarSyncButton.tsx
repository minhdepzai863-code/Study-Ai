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
        // Reset status after 3 seconds
        setTimeout(() => setStatus('idle'), 3000);
      } else {
        setStatus('error'); // Or just idle if empty
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
          w-full flex items-center justify-center gap-2 py-4 px-4 rounded-2xl border transition-all duration-300 font-bold text-sm shadow-sm
          ${status === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' 
            : 'bg-white dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-500 hover:shadow-md'}
        `}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin opacity-70" />
            <span>Đang kết nối...</span>
          </>
        ) : status === 'success' ? (
          <>
            <CheckCircle2 className="w-4 h-4" />
            <span>Đã đồng bộ thành công!</span>
          </>
        ) : (
          <>
            <CalendarCheck className="w-4 h-4 opacity-70" />
            <span>Nhập từ Google Calendar</span>
          </>
        )}
      </button>
      {status === 'success' && (
        <p className="text-center text-xs text-emerald-600 dark:text-emerald-400 mt-2 animate-fade-in font-medium">
          Đã thêm các sự kiện sắp tới vào danh sách.
        </p>
      )}
    </div>
  );
};
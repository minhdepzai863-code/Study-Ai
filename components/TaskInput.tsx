import React, { useState } from 'react';
import { Plus, BookOpen, Clock, AlertCircle, Calendar, Smile } from 'lucide-react';
import { StudyTask, DifficultyLevel } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { CalendarSyncButton } from './CalendarSyncButton';
import { SUBJECT_ICONS } from '../constants';

interface TaskInputProps {
  onAddTask: (task: StudyTask) => void;
  theme: any;
}

export const TaskInput: React.FC<TaskInputProps> = ({ onAddTask, theme }) => {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [hours, setHours] = useState<number>(2);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(DifficultyLevel.MEDIUM);
  const [selectedIcon, setSelectedIcon] = useState('📚');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !deadline) return;

    // Allow up to 24 hours
    const cleanHours = Math.max(0.5, Math.min(hours, 24)); 

    const newTask: StudyTask = {
      id: uuidv4(),
      subject: subject.trim(),
      description: description.trim(),
      deadline,
      estimatedHours: cleanHours,
      difficulty,
      priority: 1,
      icon: selectedIcon
    };

    onAddTask(newTask);
    
    // Reset form
    setSubject('');
    setDescription('');
    setHours(2);
    setDifficulty(DifficultyLevel.MEDIUM);
    setSelectedIcon('📚');
  };

  const handleSyncTasks = (tasks: StudyTask[]) => {
    tasks.forEach(task => onAddTask(task));
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-black/20 border border-white dark:border-slate-700 overflow-hidden relative transition-colors duration-300">
      <div className={`absolute top-0 left-0 w-full h-2`} style={{ background: `linear-gradient(to right, ${theme.palette[0]}, ${theme.palette[2]})` }}></div>
      
      <div className="p-8">
        <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-3 tracking-tight">
          <div className="p-2.5 rounded-xl transition-colors text-white shadow-md shadow-slate-200 dark:shadow-none" style={{ background: `linear-gradient(135deg, ${theme.palette[0]}, ${theme.palette[1]})` }}>
             <Plus className="w-5 h-5" />
          </div>
          Thêm Môn Học Mới
        </h3>

        {/* Google Calendar Sync Integration */}
        <CalendarSyncButton onSyncComplete={handleSyncTasks} />

        <div className="relative flex py-6 items-center">
          <div className="flex-grow border-t border-slate-100 dark:border-slate-700"></div>
          <span className="flex-shrink-0 mx-4 text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider bg-white dark:bg-slate-800 px-2">Hoặc nhập thủ công</span>
          <div className="flex-grow border-t border-slate-100 dark:border-slate-700"></div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6">
          {/* Icon Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wide ml-1">
              Chọn biểu tượng
            </label>
            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar snap-x">
              {SUBJECT_ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setSelectedIcon(icon)}
                  className={`flex-shrink-0 snap-center w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-all duration-300 ease-out ${
                    selectedIcon === icon 
                      ? 'bg-slate-50 dark:bg-slate-700 ring-2 ring-offset-2 dark:ring-offset-slate-800 scale-105 shadow-md' 
                      : 'bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700 hover:scale-105 opacity-80 hover:opacity-100'
                  }`}
                  style={{ '--tw-ring-color': selectedIcon === icon ? theme.palette[0] : undefined } as React.CSSProperties}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide ml-1">Tên môn học <span className="text-rose-400">*</span></label>
            <div className="flex gap-3 group">
              <div className="w-14 flex-shrink-0 flex items-center justify-center bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600 rounded-2xl text-2xl shadow-inner transition-colors">
                {selectedIcon}
              </div>
              <input
                required
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ví dụ: Toán cao cấp..."
                className="flex-1 px-5 py-4 bg-slate-50 dark:bg-slate-900/50 border-0 ring-1 ring-slate-200 dark:ring-slate-700 rounded-2xl focus:ring-2 focus:ring-offset-0 outline-none transition-all text-sm font-semibold text-slate-800 dark:text-white placeholder-slate-400 shadow-sm"
                style={{ '--tw-ring-color': theme.palette[0] } as React.CSSProperties}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide ml-1">Nội dung</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ghi chú thêm (Không bắt buộc)..."
              className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900/50 border-0 ring-1 ring-slate-200 dark:ring-slate-700 rounded-2xl focus:ring-2 focus:ring-offset-0 outline-none transition-all text-sm font-medium text-slate-800 dark:text-white shadow-sm"
              style={{ '--tw-ring-color': theme.palette[1] } as React.CSSProperties}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide ml-1 flex items-center gap-2">
                 Deadline <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  required
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full pl-11 pr-4 py-4 bg-slate-50 dark:bg-slate-900/50 border-0 ring-1 ring-slate-200 dark:ring-slate-700 rounded-2xl focus:ring-2 outline-none transition-all text-sm font-medium text-slate-800 dark:text-white cursor-pointer shadow-sm"
                  style={{ '--tw-ring-color': theme.palette[0] } as React.CSSProperties}
                />
              </div>
            </div>
             <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide ml-1 flex items-center gap-1">
                Độ khó
                <span className="text-slate-400 group relative">
                   <AlertCircle className="w-3.5 h-3.5 cursor-help"/>
                </span>
              </label>
              <div className="relative">
                 <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900/50 border-0 ring-1 ring-slate-200 dark:ring-slate-700 rounded-2xl focus:ring-2 outline-none transition-all text-sm font-medium text-slate-800 dark:text-white cursor-pointer appearance-none shadow-sm"
                  style={{ '--tw-ring-color': theme.palette[1] } as React.CSSProperties}
                >
                  {Object.values(DifficultyLevel).map((level) => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <span className={`block w-2 h-2 rounded-full`} style={{ backgroundColor: theme.palette[1] }}></span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide ml-1 flex items-center gap-2">
              Thời gian ước tính (Max 24h)
            </label>
            <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-700/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
               <input
                required
                type="range"
                min="0.5"
                max="24"
                step="0.5"
                value={hours}
                onChange={(e) => setHours(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer"
                style={{ accentColor: theme.palette[0] }}
              />
              <span className="min-w-[4.5rem] text-center font-bold bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-600 py-2 px-3 rounded-xl text-sm" style={{ color: theme.palette[1] }}>
                {hours}h
              </span>
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-2 text-white py-4 px-6 rounded-2xl hover:brightness-110 hover:-translate-y-0.5 transition-all font-bold text-sm shadow-lg shadow-indigo-200/50 dark:shadow-none flex justify-center items-center gap-2 group active:scale-[0.98]"
            style={{ 
              background: `linear-gradient(to right, ${theme.palette[0]}, ${theme.palette[2]})`
            }}
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
            Thêm Nhiệm Vụ
          </button>
        </form>
      </div>
    </div>
  );
};
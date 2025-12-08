import React, { useState, CSSProperties } from 'react';
import { Plus, Calendar, AlertCircle, Clock, Zap, Flag } from 'lucide-react';
import { StudyTask, DifficultyLevel, PriorityLevel } from '../types';
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
  const [priority, setPriority] = useState<PriorityLevel>(PriorityLevel.MEDIUM);
  const [selectedIcon, setSelectedIcon] = useState('📚');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !deadline) return;

    const cleanHours = Math.max(0.5, Math.min(hours, 24)); 

    const newTask: StudyTask = {
      id: uuidv4(),
      subject: subject.trim(),
      description: description.trim(),
      deadline,
      estimatedHours: cleanHours,
      difficulty,
      priority,
      icon: selectedIcon,
      isCompleted: false
    };

    onAddTask(newTask);
    
    setSubject('');
    setDescription('');
    setHours(2);
    setDifficulty(DifficultyLevel.MEDIUM);
    setPriority(PriorityLevel.MEDIUM);
    setSelectedIcon('📚');
  };

  const handleSyncTasks = (tasks: StudyTask[]) => {
    tasks.forEach(task => onAddTask(task));
  };

  const getIntensityInfo = (h: number) => {
    if (h <= 2) return { label: 'Nhanh gọn', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' };
    if (h <= 5) return { label: 'Tiêu chuẩn', color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' };
    if (h <= 9) return { label: 'Chuyên sâu', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' };
    return { label: 'Căng thẳng', color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-900/20' };
  };

  const intensity = getIntensityInfo(hours);

  return (
    <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden transition-all duration-300">
        <div className="absolute top-0 left-0 right-0 h-1.5" style={{ background: `linear-gradient(to right, ${theme.palette[0]}, ${theme.palette[1]})` }}></div>

        <div className="flex items-center gap-4 mb-8">
           <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-slate-50 dark:bg-slate-800 text-white shadow-sm transition-colors duration-500">
             <Plus className="w-6 h-6" style={{ color: theme.palette[0] }} />
           </div>
           <div>
             <h3 className="font-bold text-xl text-slate-800 dark:text-white tracking-tight">Thêm Nhiệm Vụ</h3>
             <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tạo mới</p>
           </div>
        </div>

        <CalendarSyncButton onSyncComplete={handleSyncTasks} />

        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Chủ đề</label>
            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar no-scrollbar">
              {SUBJECT_ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setSelectedIcon(icon)}
                  className={`flex-shrink-0 w-11 h-11 flex items-center justify-center text-xl transition-all duration-300 rounded-xl ${
                    selectedIcon === icon 
                      ? 'bg-slate-100 dark:bg-slate-800 scale-105 shadow-sm ring-2 ring-offset-2 dark:ring-offset-slate-900' 
                      : 'bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800 hover:scale-105'
                  }`}
                  style={{ 
                    '--tw-ring-color': selectedIcon === icon ? theme.palette[0] : 'transparent' 
                  } as CSSProperties}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-5">
            <div>
               <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Môn học <span className="text-red-500">*</span></label>
               <input
                  required
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Ví dụ: Toán cao cấp..."
                  className="w-full bg-slate-100/50 dark:bg-slate-800/50 border-transparent rounded-xl px-5 py-3.5 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-offset-0 transition-all font-medium"
                  style={{ 
                    '--tw-ring-color': theme.palette[0] 
                  } as CSSProperties}
                />
            </div>

            <div>
               <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Ghi chú</label>
               <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Nội dung chi tiết..."
                  className="w-full bg-slate-100/50 dark:bg-slate-800/50 border-transparent rounded-xl px-5 py-3.5 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-offset-0 transition-all text-sm"
                  style={{ 
                    '--tw-ring-color': theme.palette[0] 
                  } as CSSProperties}
               />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Hạn nộp <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      required
                      type="date"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="w-full bg-slate-100/50 dark:bg-slate-800/50 border-transparent rounded-xl px-4 py-3.5 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-offset-0 transition-all text-sm font-medium"
                      style={{ 
                        '--tw-ring-color': theme.palette[0] 
                      } as CSSProperties}
                    />
                  </div>
               </div>

               <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
                    Độ khó
                    <AlertCircle className="w-3 h-3 text-slate-400"/>
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
                    className="w-full bg-slate-100/50 dark:bg-slate-800/50 border-transparent rounded-xl px-4 py-3.5 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-offset-0 transition-all text-sm font-medium appearance-none cursor-pointer"
                    style={{ 
                        '--tw-ring-color': theme.palette[0] 
                      } as CSSProperties}
                  >
                    {Object.values(DifficultyLevel).map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
               </div>
            </div>

             {/* Priority Selector */}
             <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
                  Mức độ ưu tiên
                  <Flag className="w-3 h-3 text-slate-400"/>
                </label>
                <div className="flex gap-2">
                  {[PriorityLevel.LOW, PriorityLevel.MEDIUM, PriorityLevel.HIGH].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setPriority(level)}
                      className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
                        priority === level 
                        ? (level === PriorityLevel.HIGH ? 'bg-rose-50 text-rose-600 shadow-sm' : level === PriorityLevel.MEDIUM ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'bg-emerald-50 text-emerald-600 shadow-sm') + ' ring-1 ring-inset' 
                        : 'bg-slate-100/50 dark:bg-slate-800/50 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                      style={{ 
                         borderColor: priority === level ? 'transparent' : undefined,
                         color: priority === level && level === PriorityLevel.MEDIUM ? theme.palette[0] : undefined,
                         backgroundColor: priority === level && level === PriorityLevel.MEDIUM ? `${theme.palette[3]}` : undefined
                      }}
                    >
                      {level}
                    </button>
                  ))}
                </div>
             </div>

            <div className="pt-2">
              <div className="flex justify-between items-center mb-4">
                 <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" />
                    Thời gian ước tính
                 </label>
                 <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${intensity.bg} ${intensity.color} text-xs font-bold transition-colors`}>
                    <Zap className="w-3 h-3" />
                    <span>{intensity.label}: {hours}h</span>
                 </div>
              </div>
              
              <div className="relative h-6 flex items-center group">
                 <input
                  type="range"
                  min="0.5"
                  max="24"
                  step="0.5"
                  value={hours}
                  onChange={(e) => setHours(parseFloat(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer bg-slate-200 dark:bg-slate-700 hover:h-3 transition-all z-10 relative"
                  style={{ accentColor: theme.palette[0] }}
                />
                <div className="absolute inset-0 flex justify-between px-1 pointer-events-none opacity-50">
                   {[...Array(13)].map((_, i) => (
                      <div key={i} className={`w-0.5 h-1 ${i % 3 === 0 ? 'bg-slate-400 dark:bg-slate-500 h-2' : 'bg-slate-300 dark:bg-slate-600'} rounded-full`}></div>
                   ))}
                </div>
              </div>

              <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <span>0.5h</span>
                <span>Tiêu chuẩn</span>
                <span>Deep Work</span>
                <span>24h</span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-4 rounded-xl text-white font-bold shadow-md hover:shadow-lg hover:-translate-y-1 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group"
            style={{ 
              background: `linear-gradient(to right, ${theme.palette[0]}, ${theme.palette[1]})`
            }}
          >
            <Plus className="w-5 h-5 transition-transform group-hover:rotate-90" />
            Thêm Vào Danh Sách
          </button>
        </form>
    </div>
  );
};
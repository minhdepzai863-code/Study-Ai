import React, { useState, useMemo } from 'react';
import { StudyTask, DifficultyLevel, PriorityLevel } from '../types';
import { Play, Clock, CheckCircle2, Pencil, Save, X } from 'lucide-react';
import { FocusTimerModal } from './FocusTimerModal';

interface DailyActionPlanProps {
  tasks: StudyTask[];
  onToggleCompletion: (id: string) => void;
  onUpdateTask: (id: string, updates: Partial<StudyTask>) => void;
  theme: any;
}

export const DailyActionPlan: React.FC<DailyActionPlanProps> = ({ tasks, onToggleCompletion, onUpdateTask, theme }) => {
  const [activeTask, setActiveTask] = useState<StudyTask | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editDurationValue, setEditDurationValue] = useState('');

  const sortedTasks = useMemo(() => {
    return tasks
      .filter(t => !t.isCompleted)
      .sort((a, b) => {
        // Sort Priority High -> Low
        const priorityScore = {
           [PriorityLevel.HIGH]: 3,
           [PriorityLevel.MEDIUM]: 2,
           [PriorityLevel.LOW]: 1
        };
        if (a.priority !== b.priority) {
           return priorityScore[b.priority] - priorityScore[a.priority];
        }

        // Sort Date
        const dateA = new Date(a.deadline).getTime();
        const dateB = new Date(b.deadline).getTime();
        if (dateA !== dateB) return dateA - dateB;

        // Sort Difficulty Hard -> Easy
        const diffScore = {
          [DifficultyLevel.VERY_HARD]: 4,
          [DifficultyLevel.HARD]: 3,
          [DifficultyLevel.MEDIUM]: 2,
          [DifficultyLevel.EASY]: 1
        };
        if (a.difficulty !== b.difficulty) {
          return diffScore[b.difficulty] - diffScore[a.difficulty];
        }

        return 0;
      });
  }, [tasks]);

  const getRecommendedSession = (hours: number, difficulty: string) => {
    if (difficulty === DifficultyLevel.VERY_HARD || difficulty === DifficultyLevel.HARD) {
      return { type: 'Deep Work', duration: '45-60m', color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' };
    }
    if (hours < 1) {
      return { type: 'Quick Win', duration: '15-25m', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' };
    }
    return { type: 'Standard', duration: '30-45m', color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' };
  };

  const startEditing = (task: StudyTask, currentDuration: string) => {
     setEditingTaskId(task.id);
     setEditDurationValue(task.customSessionDuration || currentDuration);
  };

  const cancelEditing = () => {
     setEditingTaskId(null);
     setEditDurationValue('');
  };

  const saveDuration = (taskId: string) => {
     if (editDurationValue.trim()) {
        onUpdateTask(taskId, { customSessionDuration: editDurationValue.trim() });
     }
     setEditingTaskId(null);
  };

  if (sortedTasks.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-12 text-center shadow-sm">
        <div className="w-20 h-20 bg-emerald-100/50 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 dark:text-white">Tuyệt vời!</h3>
        <p className="text-slate-500 dark:text-slate-400">Bạn đã hoàn thành tất cả nhiệm vụ. Hãy nghỉ ngơi nhé!</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] shadow-xl overflow-hidden flex flex-col transition-all duration-300">
      <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
        <div className="flex items-center gap-4">
           <div className="p-3 bg-white dark:bg-slate-700 rounded-2xl shadow-sm">
             <Clock className="w-6 h-6" style={{ color: theme.palette[0] }} />
           </div>
           <div>
             <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Chiến Thuật Hôm Nay</h2>
             <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Thứ tự ưu tiên dựa trên Deadline & Độ khó</p>
           </div>
        </div>
      </div>

      <div className="p-8">
        <div className="relative border-l-2 border-slate-200 dark:border-slate-700 ml-4 space-y-8">
          {sortedTasks.map((task, index) => {
            const sessionInfo = getRecommendedSession(task.estimatedHours, task.difficulty);
            const isFirst = index === 0;
            // Prefer custom duration if set, otherwise recommendation
            const displayDuration = task.customSessionDuration || sessionInfo.duration;

            return (
              <div key={task.id} className="relative pl-10 group">
                {/* Timeline Dot */}
                <div 
                  className={`absolute -left-[9px] top-6 w-5 h-5 rounded-full border-4 transition-colors ${isFirst ? 'bg-white dark:bg-slate-800 scale-110' : 'bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600'}`}
                  style={isFirst ? { borderColor: theme.palette[0] } : {}}
                >
                  {isFirst && <div className="absolute inset-0 rounded-full animate-ping opacity-75" style={{ backgroundColor: theme.palette[0] }}></div>}
                </div>

                <div className={`p-6 rounded-2xl border transition-all duration-300 hover:shadow-md ${isFirst ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm' : 'bg-slate-50/50 dark:bg-slate-900/50 border-transparent hover:border-slate-200 dark:hover:border-slate-800'}`}>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-grow">
                      {isFirst && (
                        <span className="inline-block px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider mb-3 bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
                          Ưu tiên cao nhất
                        </span>
                      )}
                      <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-3">
                        <span className="text-2xl">{task.icon}</span>
                        {task.subject}
                      </h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 line-clamp-1">{task.description}</p>
                      
                      <div className="flex items-center gap-3 mt-4">
                         <span className={`text-xs font-bold px-3 py-1.5 rounded-lg ${sessionInfo.color}`}>
                           {sessionInfo.type}
                         </span>
                         
                         {/* Editable Duration */}
                         {editingTaskId === task.id ? (
                            <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                               <input 
                                 type="text" 
                                 autoFocus
                                 value={editDurationValue}
                                 onChange={(e) => setEditDurationValue(e.target.value)}
                                 placeholder="vd: 45m"
                                 className="w-20 px-2 py-1 text-xs bg-transparent outline-none font-bold"
                               />
                               <button onClick={() => saveDuration(task.id)} className="p-1 text-green-500 hover:bg-green-100 rounded-md"><CheckCircle2 className="w-3.5 h-3.5"/></button>
                               <button onClick={cancelEditing} className="p-1 text-red-500 hover:bg-red-100 rounded-md"><X className="w-3.5 h-3.5"/></button>
                            </div>
                         ) : (
                            <div 
                              className="flex items-center gap-1.5 group/edit cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors bg-slate-100 dark:bg-slate-800" 
                              onClick={() => startEditing(task, displayDuration)}
                              title="Nhấn để sửa thời gian"
                            >
                               <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                                 {displayDuration}
                               </span>
                               <Pencil className="w-3 h-3 text-slate-400" />
                            </div>
                         )}

                         <span className="text-xs font-medium text-slate-400 ml-2">
                           Deadline: {new Date(task.deadline).toLocaleDateString('vi-VN')}
                         </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setActiveTask(task)}
                      className="flex-shrink-0 px-6 py-3.5 rounded-xl font-bold text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all active:scale-95 flex items-center gap-2"
                      style={{ background: `linear-gradient(to right, ${theme.palette[0]}, ${theme.palette[1]})` }}
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span className="hidden sm:inline">Bắt đầu</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {activeTask && (
        <FocusTimerModal 
          task={activeTask} 
          isOpen={!!activeTask} 
          onClose={() => setActiveTask(null)}
          onComplete={() => {
             onToggleCompletion(activeTask.id);
             setActiveTask(null);
          }}
          theme={theme}
        />
      )}
    </div>
  );
};
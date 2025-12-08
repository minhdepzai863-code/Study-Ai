import React, { useState, useMemo } from 'react';
import { StudyTask, DifficultyLevel, PriorityLevel } from '../types';
import { Trash2, Search, Filter, ArrowUpDown, X, Check, Clock, Flag } from 'lucide-react';
import { DIFFICULTY_SCORE, PRIORITY_SCORE } from '../constants';

interface DataTableProps {
  tasks: StudyTask[];
  onRemoveTask: (id: string) => void;
  onToggleCompletion: (id: string) => void;
  theme: any;
}

export const DataTable: React.FC<DataTableProps> = ({ tasks, onRemoveTask, onToggleCompletion, theme }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('deadline_asc');

  const filteredTasks = useMemo(() => {
    let result = [...tasks];
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(
        (t) =>
          t.subject.toLowerCase().includes(lowerTerm) ||
          t.description?.toLowerCase().includes(lowerTerm)
      );
    }
    if (filterDifficulty !== 'ALL') {
      result = result.filter((t) => t.difficulty === filterDifficulty);
    }
    result.sort((a, b) => {
      if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;

      switch (sortBy) {
        case 'deadline_asc':
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        case 'deadline_desc':
          return new Date(b.deadline).getTime() - new Date(a.deadline).getTime();
        case 'priority_desc':
             return (PRIORITY_SCORE[b.priority] || 0) - (PRIORITY_SCORE[a.priority] || 0);
        case 'difficulty_desc':
          return (DIFFICULTY_SCORE[b.difficulty] || 0) - (DIFFICULTY_SCORE[a.difficulty] || 0);
        case 'difficulty_asc':
          return (DIFFICULTY_SCORE[a.difficulty] || 0) - (DIFFICULTY_SCORE[b.difficulty] || 0);
        default:
          return 0;
      }
    });
    return result;
  }, [tasks, searchTerm, filterDifficulty, sortBy]);

  const getRelativeTime = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: 'Quá hạn', color: 'text-rose-500 bg-rose-50 dark:bg-rose-900/20' };
    if (diffDays === 0) return { text: 'Hôm nay', color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' };
    if (diffDays === 1) return { text: 'Ngày mai', color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' };
    if (diffDays <= 3) return { text: `Còn ${diffDays} ngày`, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' };
    return { text: new Date(dateStr).toLocaleDateString('vi-VN'), color: 'text-slate-500 bg-slate-100 dark:bg-slate-800' };
  };

  const EmptyIllustration = () => (
    <div className="relative w-64 h-64 mx-auto mb-6">
       {/* Abstract Background Blob */}
       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full opacity-20 filter blur-2xl animate-pulse" style={{ backgroundColor: theme.palette[0] }}></div>
       
       <svg className="w-full h-full drop-shadow-sm" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Clipboard Board */}
          <rect x="60" y="40" width="80" height="110" rx="8" fill="white" className="dark:fill-slate-800" stroke={theme.palette[2]} strokeWidth="2"/>
          {/* Clipboard Clip */}
          <path d="M85 35H115V45H85V35Z" fill={theme.palette[0]}/>
          <path d="M90 30H110V40H90V30Z" fill={theme.palette[1]}/>
          
          {/* Paper Lines */}
          <line x1="75" y1="65" x2="125" y2="65" stroke="#E2E8F0" strokeWidth="3" strokeLinecap="round" className="dark:stroke-slate-600"/>
          <line x1="75" y1="85" x2="125" y2="85" stroke="#E2E8F0" strokeWidth="3" strokeLinecap="round" className="dark:stroke-slate-600"/>
          <line x1="75" y1="105" x2="105" y2="105" stroke="#E2E8F0" strokeWidth="3" strokeLinecap="round" className="dark:stroke-slate-600"/>
          
          {/* Floating Pencil */}
          <g className="animate-float">
             <path d="M145 135L135 125L155 105L165 115L145 135Z" fill={theme.palette[0]}/>
             <path d="M145 135L138 142L135 125" fill="#FCD34D"/>
             <path d="M138 142L136 144L137 141" fill="#333"/>
          </g>

          {/* Floating Plus Signs */}
          <path d="M40 80H50M45 75V85" stroke={theme.palette[1]} strokeWidth="3" strokeLinecap="round" className="animate-float-delayed opacity-50"/>
          <path d="M150 50H160M155 45V55" stroke={theme.palette[0]} strokeWidth="3" strokeLinecap="round" className="animate-float-slow opacity-50"/>
          
          {/* Decorative Circle */}
          <circle cx="50" cy="140" r="5" fill={theme.palette[2]} className="animate-bounce-slow opacity-60"/>
       </svg>
    </div>
  );

  if (tasks.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-12 flex flex-col items-center justify-center min-h-[500px] shadow-sm transition-all duration-500">
        <EmptyIllustration />
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2 tracking-tight">Danh sách trống</h3>
        <p className="text-slate-500 dark:text-slate-400 max-w-xs text-center text-sm leading-relaxed">
          Hãy thêm nhiệm vụ đầu tiên để hệ thống bắt đầu phân tích dữ liệu và lập kế hoạch cho bạn.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm rounded-[2rem] overflow-hidden flex flex-col h-full min-h-[600px] transition-all duration-300">
      
      {/* Header - Sticky on Desktop, Static on Mobile */}
      <div className="px-6 sm:px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex flex-col xl:flex-row xl:items-center justify-between gap-6 sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm z-20">
        <div className="flex items-center gap-3">
          <h3 className="font-extrabold text-xl text-slate-800 dark:text-slate-200 tracking-tight">Nhiệm Vụ</h3>
          <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold px-3 py-1 rounded-full">
             {filteredTasks.length}
          </span>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative group w-full sm:w-auto">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-600 dark:group-focus-within:text-slate-300 transition-colors" />
            <input
              type="text"
              placeholder="Tìm môn học..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-8 py-2.5 text-sm bg-slate-50/50 dark:bg-slate-800 border-transparent rounded-xl focus:bg-slate-100 dark:focus:bg-slate-700 focus:outline-none transition-all w-full sm:w-64 font-medium placeholder-slate-400"
            />
             {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex gap-2">
             <div className="relative flex-grow sm:flex-grow-0">
                <select
                    value={filterDifficulty}
                    onChange={(e) => setFilterDifficulty(e.target.value)}
                    className="w-full appearance-none bg-slate-50/50 dark:bg-slate-800 border-transparent pl-9 pr-10 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 focus:outline-none cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                    <option value="ALL">Độ khó</option>
                    {Object.values(DifficultyLevel).map(l => <option key={l} value={l}>{l}</option>)}
                </select>
                <Filter className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
             </div>
             
             <button 
                onClick={() => setSortBy(prev => prev === 'deadline_asc' ? 'priority_desc' : prev === 'priority_desc' ? 'deadline_asc' : 'deadline_asc')}
                className="p-2.5 bg-slate-50/50 dark:bg-slate-800 border-transparent rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors group flex items-center gap-2"
                title="Sắp xếp: Hạn nộp / Ưu tiên"
             >
                <ArrowUpDown className="w-4 h-4 text-slate-500 group-hover:text-slate-700" />
             </button>
          </div>
        </div>
      </div>
      
      {/* Table Content */}
      <div className="overflow-y-auto custom-scrollbar flex-grow p-4 sm:p-6 bg-slate-50/30 dark:bg-slate-900/30">
        {filteredTasks.length > 0 ? (
          <div className="space-y-4 sm:space-y-2">
            {filteredTasks.map((task, index) => {
              const relativeTime = getRelativeTime(task.deadline);
              const isHighPriority = task.priority === PriorityLevel.HIGH;

              return (
                <div 
                  key={task.id} 
                  className={`
                    group relative flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 p-5 sm:p-4 rounded-2xl transition-all duration-300 
                    border border-slate-100 dark:border-slate-800 sm:border-transparent sm:border-b
                    ${task.isCompleted 
                       ? 'bg-slate-50/50 dark:bg-slate-900/30 opacity-60' 
                       : 'bg-white dark:bg-slate-800/20 hover:bg-white sm:hover:bg-slate-50/80 sm:dark:hover:bg-slate-800/40 shadow-sm sm:shadow-none sm:hover:shadow-sm'
                    }
                  `}
                  style={{ animation: `fadeInUp 0.4s ease-out forwards ${index * 0.05}s`, opacity: 0 }}
                >
                  
                  {/* Mobile Header: Icon + Subject + Check */}
                  <div className="flex items-start justify-between sm:justify-start gap-4 w-full sm:w-auto">
                     <div className="flex items-center gap-3 sm:gap-4 flex-grow sm:flex-grow-0">
                        <button 
                            onClick={() => onToggleCompletion(task.id)}
                            className={`
                              relative w-6 h-6 flex-shrink-0 rounded-full border-2 flex items-center justify-center transition-all duration-300
                              ${task.isCompleted 
                                ? 'bg-emerald-400 border-emerald-400 scale-100' 
                                : 'border-slate-300 dark:border-slate-600 hover:border-emerald-400 scale-95 hover:scale-105'
                              }
                            `}
                        >
                            <Check className={`w-3.5 h-3.5 text-white transition-transform duration-300 ${task.isCompleted ? 'scale-100' : 'scale-0'}`} />
                        </button>

                        <div className={`
                            w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex-shrink-0 flex items-center justify-center text-2xl shadow-sm transition-transform duration-300 group-hover:scale-105
                            ${task.isCompleted ? 'bg-slate-100 dark:bg-slate-800 grayscale' : 'bg-white dark:bg-slate-700'}
                        `}>
                            {task.icon || '📚'}
                        </div>

                        {/* Subject on Mobile */}
                        <div className="block sm:hidden flex-grow">
                            <div className={`font-bold text-base text-slate-800 dark:text-slate-200 ${task.isCompleted ? 'line-through text-slate-500' : ''}`}>
                              {task.subject}
                            </div>
                            {isHighPriority && !task.isCompleted && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 mt-1 rounded-full bg-rose-50 text-rose-600 text-[10px] font-bold uppercase">
                                  <Flag className="w-3 h-3"/> Ưu tiên cao
                                </span>
                            )}
                        </div>
                     </div>

                     {/* Delete Button Mobile */}
                     <button
                        onClick={(e) => { e.stopPropagation(); onRemoveTask(task.id); }}
                        className="block sm:hidden p-2 text-slate-300 hover:text-rose-500 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                  </div>

                  {/* Middle: Content (Description & Meta) */}
                  <div className="flex-grow w-full sm:w-auto pl-0 sm:pl-2">
                    {/* Subject on Desktop */}
                    <div className="hidden sm:block">
                      <div className={`text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 ${task.isCompleted ? 'line-through text-slate-500' : ''}`}>
                          {task.subject}
                          {isHighPriority && !task.isCompleted && <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" title="Ưu tiên cao"></span>}
                      </div>
                    </div>
                    
                    <div className={`text-sm text-slate-500 dark:text-slate-400 font-medium truncate max-w-md mb-3 sm:mb-2 ${task.isCompleted ? 'line-through' : ''}`}>
                        {task.description || 'Không có ghi chú thêm'}
                    </div>

                    {/* Metadata Chips */}
                    <div className="flex flex-wrap items-center gap-2">
                       <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${task.isCompleted ? 'bg-slate-100 text-slate-400' : relativeTime.color}`}>
                          <Clock className="w-3 h-3" />
                          {relativeTime.text}
                       </div>

                       <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          <span>⏱ {task.estimatedHours}h</span>
                       </div>

                       {/* Pastel Badges for Difficulty */}
                       <div 
                          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border border-transparent"
                          style={{ 
                            backgroundColor: task.isCompleted ? '#f1f5f9' :
                              (task.difficulty === 'Rất khó' ? '#ffe4e6' : 
                              task.difficulty === 'Khó' ? '#ffedd5' :
                              task.difficulty === 'Trung bình' ? '#dbeafe' : '#dcfce7'),
                            color: task.isCompleted ? '#94a3b8' :
                              (task.difficulty === 'Rất khó' ? '#e11d48' : 
                              task.difficulty === 'Khó' ? '#ea580c' :
                              task.difficulty === 'Trung bình' ? '#2563eb' : '#16a34a'),
                          }}
                        >
                          {task.difficulty}
                        </div>

                        {/* Priority Badge Desktop */}
                        {!task.isCompleted && (
                           <div className={`hidden sm:flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                              task.priority === PriorityLevel.HIGH ? 'bg-rose-50 text-rose-500' : 
                              task.priority === PriorityLevel.MEDIUM ? 'bg-indigo-50 text-indigo-500' : 'bg-emerald-50 text-emerald-500'
                           }`}>
                              <Flag className="w-3 h-3" />
                              {task.priority}
                           </div>
                        )}
                    </div>
                  </div>

                  {/* Right: Actions (Desktop) */}
                  <div className="hidden sm:block opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); onRemoveTask(task.id); }}
                      className="p-2.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-colors"
                      title="Xóa nhiệm vụ"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400 italic gap-3">
            <Search className="w-10 h-10 opacity-20" />
            <p>Không tìm thấy nhiệm vụ nào phù hợp.</p>
          </div>
        )}
      </div>
    </div>
  );
};
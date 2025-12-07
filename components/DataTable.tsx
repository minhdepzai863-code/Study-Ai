import React, { useState, useMemo } from 'react';
import { StudyTask, DifficultyLevel } from '../types';
import { Trash2, Calendar, Search, Filter, ArrowUpDown, X, ListFilter } from 'lucide-react';
import { DIFFICULTY_SCORE } from '../constants';

interface DataTableProps {
  tasks: StudyTask[];
  onRemoveTask: (id: string) => void;
  theme: any;
}

export const DataTable: React.FC<DataTableProps> = ({ tasks, onRemoveTask, theme }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('deadline_asc');

  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    // 1. Filter by Search Term
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(
        (t) =>
          t.subject.toLowerCase().includes(lowerTerm) ||
          t.description?.toLowerCase().includes(lowerTerm)
      );
    }

    // 2. Filter by Difficulty
    if (filterDifficulty !== 'ALL') {
      result = result.filter((t) => t.difficulty === filterDifficulty);
    }

    // 3. Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'deadline_asc':
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        case 'deadline_desc':
          return new Date(b.deadline).getTime() - new Date(a.deadline).getTime();
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

  // Enhanced Dynamic Illustration for empty state
  const EmptyIllustration = () => (
    <div className="relative w-72 h-72 mb-4 group cursor-pointer perspective-1000">
      <svg viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full overflow-visible">
        <defs>
          <filter id="scribble-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
            <feOffset dx="2" dy="4" result="offsetblur"/>
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.3"/>
            </feComponentTransfer>
            <feMerge> 
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/> 
            </feMerge>
          </filter>
        </defs>

        {/* 1. Background Atmosphere - Rotating Dashed Ring (Time) */}
        <g className="origin-center animate-[spin_20s_linear_infinite] opacity-30 dark:opacity-20">
           <circle cx="150" cy="150" r="110" stroke={theme.palette[0]} strokeWidth="2" strokeDasharray="12 12" strokeLinecap="round" className="transition-colors duration-500" />
        </g>
        
        {/* 2. Floating Orbs/Particles */}
        <circle cx="50" cy="100" r="4" fill={theme.palette[2]} className="animate-float opacity-40">
           <animate attributeName="opacity" values="0.4;0.8;0.4" dur="3s" repeatCount="indefinite" />
        </circle>
        <circle cx="250" cy="200" r="6" fill={theme.palette[1]} className="animate-float-delayed opacity-40">
           <animate attributeName="opacity" values="0.4;0.8;0.4" dur="4s" repeatCount="indefinite" />
        </circle>
        
        {/* 3. The Clipboard / Paper Stack (Central Element) */}
        <g className="animate-float origin-center transition-transform duration-500 group-hover:scale-105" filter="url(#scribble-shadow)">
           {/* Back Paper */}
           <rect x="85" y="75" width="130" height="160" rx="16" transform="rotate(-5 150 150)" className="fill-white dark:fill-slate-700 stroke-slate-200 dark:stroke-slate-600 transition-colors" strokeWidth="3"/>
           
           {/* Front Paper */}
           <rect x="95" y="70" width="130" height="160" rx="16" transform="rotate(2 150 150)" className="fill-white dark:fill-slate-800 stroke-slate-200 dark:stroke-slate-500 transition-colors" strokeWidth="3"/>
           
           {/* Lines on Paper (Hand drawn style curves) */}
           <path d="M120 110H190" className="stroke-slate-100 dark:stroke-slate-600 transition-colors" strokeWidth="6" strokeLinecap="round"/>
           <path d="M120 135H190" className="stroke-slate-100 dark:stroke-slate-600 transition-colors" strokeWidth="6" strokeLinecap="round"/>
           <path d="M120 160H170" className="stroke-slate-100 dark:stroke-slate-600 transition-colors" strokeWidth="6" strokeLinecap="round"/>

           {/* Checkbox marks (Empty) */}
           <rect x="195" y="105" width="12" height="12" rx="3" stroke={theme.palette[0]} strokeWidth="2" fill="none" className="opacity-50"/>
           <rect x="195" y="130" width="12" height="12" rx="3" stroke={theme.palette[0]} strokeWidth="2" fill="none" className="opacity-50"/>
        </g>

        {/* 4. The Magic Pencil (Interactive) */}
        <g className="animate-float-delayed origin-center">
           <g className="transition-transform duration-500 group-hover:translate-x-4 group-hover:-translate-y-4 group-hover:rotate-12">
             <path d="M220 180 L250 80 L270 85 L240 185 Z" fill={theme.palette[1]} stroke="white" strokeWidth="2" className="drop-shadow-md"/>
             <path d="M220 180 L240 185 L228 200 Z" fill={theme.palette[0]} />
             <path d="M250 80 L270 85" stroke="white" strokeWidth="2"/>
           </g>
        </g>
        
        {/* 5. "Add" Hint - Dashed box appearing on hover */}
        <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-700 delay-100">
           <rect x="110" y="100" width="100" height="80" rx="10" stroke={theme.palette[2]} strokeWidth="2" strokeDasharray="6 6" fill="none" className="animate-pulse"/>
           <path d="M150 120 V160 M130 140 H170" stroke={theme.palette[2]} strokeWidth="3" strokeLinecap="round" className="opacity-60"/>
        </g>
      </svg>
    </div>
  );

  if (tasks.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-black/20 border border-white dark:border-slate-700 flex flex-col items-center justify-center min-h-[600px] transition-all duration-500 overflow-hidden relative group">
        <EmptyIllustration />
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-2 tracking-tight">Chưa có nhiệm vụ nào</h3>
        <p className="text-slate-500 dark:text-slate-400 max-w-xs mt-2 text-center leading-relaxed font-medium">
          Không gian này đang chờ đợi kế hoạch của bạn.
          <br/>
          <span className="text-xs opacity-70 block mt-1">(Bấm "Thêm nhiệm vụ" hoặc đồng bộ Calendar để bắt đầu)</span>
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-black/20 border border-white dark:border-slate-700 overflow-hidden flex flex-col h-full transition-all duration-300">
      
      {/* Header & Controls */}
      <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-700/50 flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white dark:bg-slate-800">
        <div className="flex items-center gap-4">
           <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded-2xl shadow-sm">
             <ListFilter className="w-5 h-5" style={{ color: theme.palette[2] }} />
           </div>
           <div>
             <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg flex items-center gap-3 tracking-tight">
               Danh Sách Nhiệm Vụ
               <span className="text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-full">
                 {filteredTasks.length}
               </span>
             </h3>
             <p className="text-xs text-slate-400 font-medium mt-1">Quản lý bài tập & đồ án</p>
           </div>
        </div>
        
        {/* Toolbar Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative group flex-grow sm:flex-grow-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-indigo-400 transition-colors" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-56 pl-10 pr-9 py-2.5 text-sm bg-slate-50 dark:bg-slate-900/50 border-0 ring-1 ring-slate-200 dark:ring-slate-700 rounded-xl focus:outline-none focus:ring-2 transition-all placeholder-slate-400 text-slate-700 dark:text-slate-200 font-medium"
              style={{ '--tw-ring-color': theme.palette[1] } as React.CSSProperties}
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 p-1 rounded-full transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex gap-3">
            {/* Filter */}
            <div className="relative flex-1 sm:flex-none">
               <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <Filter className="w-3.5 h-3.5" />
               </div>
               <select
                 value={filterDifficulty}
                 onChange={(e) => setFilterDifficulty(e.target.value)}
                 className="w-full sm:w-auto pl-9 pr-8 py-2.5 text-sm bg-slate-50 dark:bg-slate-900/50 border-0 ring-1 ring-slate-200 dark:ring-slate-700 rounded-xl focus:outline-none focus:ring-2 appearance-none cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-200 font-medium"
                 style={{ '--tw-ring-color': theme.palette[1] } as React.CSSProperties}
               >
                 <option value="ALL">Độ khó: Tất cả</option>
                 {Object.values(DifficultyLevel).map(level => (
                   <option key={level} value={level}>{level}</option>
                 ))}
               </select>
            </div>

            {/* Sort */}
            <div className="relative flex-1 sm:flex-none">
               <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <ArrowUpDown className="w-3.5 h-3.5" />
               </div>
               <select
                 value={sortBy}
                 onChange={(e) => setSortBy(e.target.value)}
                 className="w-full sm:w-auto pl-9 pr-8 py-2.5 text-sm bg-slate-50 dark:bg-slate-900/50 border-0 ring-1 ring-slate-200 dark:ring-slate-700 rounded-xl focus:outline-none focus:ring-2 appearance-none cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-200 font-medium"
                 style={{ '--tw-ring-color': theme.palette[1] } as React.CSSProperties}
               >
                 <option value="deadline_asc">Sắp xếp: Gần nhất</option>
                 <option value="deadline_desc">Sắp xếp: Xa nhất</option>
                 <option value="difficulty_desc">Sắp xếp: Khó nhất</option>
               </select>
            </div>
          </div>
        </div>
      </div>
      
      {/* Table Content */}
      <div className="overflow-x-auto custom-scrollbar flex-grow bg-white dark:bg-slate-800 relative">
        {filteredTasks.length > 0 ? (
          <table className="w-full text-sm text-left min-w-[750px] border-collapse">
            <thead className="text-xs text-slate-400 dark:text-slate-500 uppercase bg-white dark:bg-slate-800 font-bold tracking-wider sticky top-0 z-10 border-b border-slate-50 dark:border-slate-700 shadow-sm">
              <tr>
                <th className="px-8 py-5">Môn học</th>
                <th className="px-6 py-5">Deadline</th>
                <th className="px-6 py-5">Thời lượng</th>
                <th className="px-6 py-5">Độ khó</th>
                <th className="px-6 py-5 text-right pr-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
              {filteredTasks.map((task, index) => (
                <tr 
                  key={task.id} 
                  className="
                    group transition-all duration-200 ease-out
                    hover:bg-slate-50/80 dark:hover:bg-slate-700/30
                    animate-fade-in
                  "
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-4">
                       <div className="w-11 h-11 flex-shrink-0 bg-white dark:bg-slate-700 rounded-2xl flex items-center justify-center text-xl shadow-sm border border-slate-100 dark:border-slate-600">
                         {task.icon || '📚'}
                       </div>
                       <div>
                          <div className="font-bold text-slate-700 dark:text-slate-200 text-sm group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{task.subject}</div>
                          {task.description && (
                            <div className="text-slate-400 dark:text-slate-500 text-xs mt-0.5 truncate max-w-[200px] font-medium">{task.description}</div>
                          )}
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col items-start gap-1">
                      <span className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium text-xs">
                         <Calendar className="w-3.5 h-3.5 text-slate-300"/>
                         {new Date(task.deadline).toLocaleDateString('vi-VN')}
                      </span>
                      {/* Visual Urgency Indicator */}
                      {(() => {
                        const days = Math.ceil((new Date(task.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                        return days <= 3 && days >= 0 ? (
                           <span className="text-[10px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-900/30 px-2 py-0.5 rounded-full border border-rose-100 dark:border-rose-800">Sắp đến hạn</span>
                        ) : null;
                      })()}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                     <span className="font-semibold text-xs bg-slate-100 dark:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600">
                        {task.estimatedHours}h
                     </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border shadow-sm
                      ${task.difficulty === 'Rất khó' ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-300 border-rose-100 dark:border-rose-800' : 
                        task.difficulty === 'Khó' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-300 border-amber-100 dark:border-amber-800' :
                        task.difficulty === 'Trung bình' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300 border-indigo-100 dark:border-indigo-800' : 
                        'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-300 border-emerald-100 dark:border-emerald-800'}`}>
                      {task.difficulty}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right pr-8">
                    <button
                      onClick={() => onRemoveTask(task.id)}
                      className="text-slate-300 hover:text-rose-500 dark:hover:text-rose-400 p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0"
                      title="Xóa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-12 text-center flex flex-col items-center justify-center text-slate-400 h-full">
            <Search className="w-8 h-8 mb-3 opacity-20" />
            <p className="text-sm font-medium">Không tìm thấy kết quả</p>
            <button 
              onClick={() => {setSearchTerm(''); setFilterDifficulty('ALL');}}
              className="mt-2 text-xs font-bold hover:underline"
              style={{ color: theme.palette[1] }}
            >
              Xóa bộ lọc
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
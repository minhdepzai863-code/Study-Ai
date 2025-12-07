import React, { useState, useEffect } from 'react';
import { PenTool, GraduationCap, ArrowRight, Sparkles, CheckCircle2, ArrowDown, Palette, Moon, Sun, Layers, BookOpen, Atom, Calculator, Lightbulb, Globe, Ruler, BrainCircuit } from 'lucide-react';
import { TaskInput } from './components/TaskInput';
import { DataTable } from './components/DataTable';
import { StatsBoard } from './components/StatsBoard';
import { AIPlanner } from './components/AIPlanner';
import { StudyTask } from './types';
import { MOCK_TASKS, THEMES } from './constants';

function App() {
  const [tasks, setTasks] = useState<StudyTask[]>(MOCK_TASKS);
  const [activeTab, setActiveTab] = useState<'input' | 'analysis'>('input');
  const [currentThemeId, setCurrentThemeId] = useState('ocean');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('themeMode') === 'dark';
    }
    return false;
  });

  const activeTheme = Object.values(THEMES).find(t => t.id === currentThemeId) || THEMES.OCEAN;

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('themeMode', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('themeMode', 'light');
    }
  }, [isDarkMode]);

  const handleAddTask = (task: StudyTask) => {
    setTasks(prev => [...prev, task]);
  };

  const handleRemoveTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const cycleTheme = () => {
    const themeKeys = Object.keys(THEMES);
    const currentIndex = themeKeys.findIndex(k => THEMES[k as keyof typeof THEMES].id === currentThemeId);
    const nextKey = themeKeys[(currentIndex + 1) % themeKeys.length];
    setCurrentThemeId(THEMES[nextKey as keyof typeof THEMES].id);
  };

  return (
    <div className={`min-h-screen font-sans transition-colors duration-500 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'} pb-24`}>
      
      {/* --- Rich Background Layer --- */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {/* 1. Base Gradient */}
        <div className={`absolute inset-0 transition-opacity duration-700 ${isDarkMode ? 'opacity-0' : 'opacity-100'}`} 
             style={{ background: 'linear-gradient(to bottom right, #f8fafc, #f1f5f9)' }}></div>
        
        {/* 2. Dot Pattern Overlay */}
        <div className="absolute inset-0 bg-dot-pattern opacity-[0.4] dark:opacity-[0.1]"></div>

        {/* 3. Floating Gradient Blobs (Softer & Pastel) */}
        <div 
           className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] rounded-full blur-[120px] opacity-20 dark:opacity-10 animate-float transition-colors duration-1000"
           style={{ backgroundColor: activeTheme.palette[0] }}
        ></div>
        <div 
           className="absolute bottom-[-10%] right-[-5%] w-[60%] h-[60%] rounded-full blur-[120px] opacity-20 dark:opacity-10 animate-float-delayed transition-colors duration-1000"
           style={{ backgroundColor: activeTheme.palette[2] }}
        ></div>

        {/* 4. Educational Illustrations (Subtle & Themed) */}
        {/* Top Left - Book */}
        <BookOpen 
          className="absolute top-[12%] left-[2%] w-24 h-24 opacity-5 dark:opacity-[0.03] rotate-[-12deg] animate-float transition-colors duration-1000" 
          style={{ color: activeTheme.palette[1] }} 
        />
        
        {/* Bottom Right - Atom */}
        <Atom 
          className="absolute bottom-[15%] right-[2%] w-32 h-32 opacity-5 dark:opacity-[0.03] animate-float-delayed transition-colors duration-1000" 
          style={{ color: activeTheme.palette[0] }} 
        />
        
        {/* Middle Right - Calculator */}
        <Calculator 
          className="absolute top-[25%] right-[12%] w-20 h-20 opacity-5 dark:opacity-[0.03] rotate-[15deg] animate-float-slow transition-colors duration-1000" 
          style={{ color: activeTheme.palette[2] }} 
        />
        
        {/* Bottom Left - Lightbulb */}
        <Lightbulb 
          className="absolute bottom-[25%] left-[8%] w-24 h-24 opacity-5 dark:opacity-[0.03] rotate-[-10deg] animate-float transition-colors duration-1000" 
          style={{ color: activeTheme.palette[1] }} 
        />

        {/* Top Center - Brain */}
        <BrainCircuit 
           className="absolute top-[8%] left-[45%] w-28 h-28 opacity-5 dark:opacity-[0.03] animate-float-slow transition-colors duration-1000"
           style={{ color: activeTheme.palette[3] }}
        />

        {/* Middle Left - Ruler */}
        <Ruler 
           className="absolute top-[40%] left-[-2%] w-32 h-32 opacity-5 dark:opacity-[0.02] rotate-[45deg] animate-float-delayed transition-colors duration-1000"
           style={{ color: activeTheme.palette[0] }}
        />

         {/* Bottom Center - Globe */}
        <Globe
           className="absolute bottom-[-5%] left-[35%] w-40 h-40 opacity-5 dark:opacity-[0.02] animate-float transition-colors duration-1000"
           style={{ color: activeTheme.palette[2] }}
        />
      </div>

      {/* --- Header --- */}
      <header className="sticky top-0 z-40 border-b border-white/40 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl transition-all duration-300">
        <div className="w-full max-w-[1800px] mx-auto px-6 sm:px-8 lg:px-12 h-auto sm:h-20 flex flex-col sm:flex-row items-center justify-between py-4 gap-4 sm:gap-0">
          <div className="flex items-center gap-3 self-start sm:self-center cursor-default group select-none">
            <div 
               className="p-2.5 rounded-2xl shadow-lg shadow-indigo-500/10 ring-1 ring-white/50 dark:ring-slate-700/50 group-hover:scale-105 transition-transform duration-300 ease-out"
               style={{ background: `linear-gradient(135deg, ${activeTheme.palette[0]}, ${activeTheme.palette[1]})` }}
            >
               <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight leading-none">
                SmartStudy AI
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 tracking-wide">Trợ lý Học tập & Wellbeing</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 w-full sm:w-auto">
             {/* Nav Tabs - Pill Style */}
             <nav className="flex bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-2xl w-full sm:w-auto border border-white/40 dark:border-slate-700/50 backdrop-blur-sm">
               <button
                 onClick={() => setActiveTab('input')}
                 className={`relative z-10 flex-1 sm:flex-none justify-center px-6 py-2 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${
                   activeTab === 'input' 
                     ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm ring-1 ring-black/5' 
                     : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-700/50'
                 }`}
               >
                 <PenTool className={`w-4 h-4 transition-colors ${activeTab === 'input' ? 'text-current' : 'opacity-70'}`} style={activeTab === 'input' ? { color: activeTheme.palette[0] } : {}}/>
                 Dữ Liệu
               </button>
               <button
                 onClick={() => setActiveTab('analysis')}
                 className={`relative z-10 flex-1 sm:flex-none justify-center px-6 py-2 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${
                   activeTab === 'analysis' 
                     ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm ring-1 ring-black/5' 
                     : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-700/50'
                 }`}
               >
                 <Sparkles className={`w-4 h-4 transition-colors ${activeTab === 'analysis' ? 'text-current' : 'opacity-70'}`} style={activeTab === 'analysis' ? { color: activeTheme.palette[2] } : {}}/>
                 Phân Tích
               </button>
             </nav>
             
             {/* Action Buttons */}
             <div className="flex items-center gap-2">
                <button 
                  onClick={cycleTheme}
                  className="p-2.5 rounded-xl bg-white/60 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-white/60 dark:border-slate-700 shadow-sm transition-all active:scale-95 hover:shadow-md"
                  title={`Đổi chủ đề: ${activeTheme.name}`}
                >
                  <Palette className="w-5 h-5 transition-colors" style={{ color: activeTheme.palette[1] }} />
                </button>

                <button 
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className="p-2.5 rounded-xl bg-white/60 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-white/60 dark:border-slate-700 shadow-sm transition-all active:scale-95 hover:shadow-md"
                  title={isDarkMode ? "Chuyển sang chế độ Sáng" : "Chuyển sang chế độ Tối"}
                >
                  {isDarkMode ? (
                    <Sun className="w-5 h-5 text-amber-400" />
                  ) : (
                    <Moon className="w-5 h-5 text-slate-500" />
                  )}
                </button>
             </div>
          </div>
        </div>
      </header>

      <main className="w-full max-w-[1800px] mx-auto px-6 sm:px-8 lg:px-12 py-10 relative z-10">
        
        {/* Workflow Banner - Modern Glassmorphism */}
        <div className="mb-10 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-[2.5rem] p-8 md:p-12 shadow-lg shadow-slate-200/40 dark:shadow-black/20 border border-white/60 dark:border-slate-700 overflow-hidden relative group">
          {/* Decorative Sparkle */}
          <div className="absolute top-0 right-0 p-10 opacity-10 dark:opacity-5 transition-transform duration-1000 group-hover:scale-110 group-hover:rotate-12 pointer-events-none">
            <Layers className="w-64 h-64" style={{ color: activeTheme.palette[0] }} />
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 relative z-10">
             <div className="max-w-lg">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100/80 dark:bg-slate-700/80 border border-slate-200 dark:border-slate-600 mb-4">
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: `linear-gradient(to right, ${activeTheme.palette[0]}, ${activeTheme.palette[1]})` }}></span>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Workflow</span>
                </div>
                <h3 className="text-3xl md:text-4xl font-extrabold text-slate-800 dark:text-white tracking-tight mb-4 leading-tight">
                  Tối ưu hóa học tập <br className="hidden md:block"/> với AI Mentor
                </h3>
                <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed font-medium">
                  Nhập dữ liệu bài tập và để AI xây dựng lộ trình cá nhân hóa, giúp bạn cân bằng giữa điểm số và sức khỏe.
                </p>
             </div>

             {/* Steps Visualization */}
             <div className="flex-1 max-w-2xl grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Connector Line */}
                <div className="hidden md:block absolute top-[50%] -translate-y-1/2 left-[45%] right-[5%] h-0.5 -z-10 bg-slate-200 dark:bg-slate-700"></div>

                {[
                  { id: 'input', step: 1, label: 'Nhập Liệu', sub: 'Lịch & Deadline', paletteIdx: 0 },
                  { id: 'analysis', step: 2, label: 'Phân Tích', sub: 'Đánh giá tải trọng', paletteIdx: 1 },
                  { id: 'analysis', step: 3, label: 'AI Guidebook', sub: 'Lộ trình tối ưu', paletteIdx: 2 }
                ].map((item, idx) => (
                   <div 
                      key={idx}
                      onClick={() => setActiveTab(item.id as any)}
                      className={`
                        relative bg-white dark:bg-slate-800 p-5 rounded-[1.5rem] border transition-all duration-300 cursor-pointer hover:-translate-y-1 group/card
                        ${(activeTab === 'input' && idx === 0) || (activeTab === 'analysis' && idx > 0) 
                          ? 'border-slate-200 dark:border-slate-600 shadow-md ring-2 ring-offset-2 dark:ring-offset-slate-900' 
                          : 'border-slate-100 dark:border-slate-700 shadow-sm opacity-70 hover:opacity-100 hover:shadow-md'}
                      `}
                      style={{ 
                        '--tw-ring-color': activeTheme.palette[item.paletteIdx] 
                      } as React.CSSProperties}
                   >
                     <div 
                        className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white text-lg shadow-lg mb-3 transition-transform group-hover/card:scale-110"
                        style={{ background: `linear-gradient(135deg, ${activeTheme.palette[item.paletteIdx]}, ${activeTheme.palette[item.paletteIdx + 1] || activeTheme.palette[0]})` }}
                     >
                       {item.step}
                     </div>
                     <h4 className="font-bold text-slate-800 dark:text-slate-100 text-base">{item.label}</h4>
                     <p className="text-xs text-slate-500 font-medium mt-1">{item.sub}</p>
                  </div>
                ))}
             </div>
          </div>
        </div>

        {activeTab === 'input' ? (
          <div className="animate-fade-in space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-4 space-y-6">
                <TaskInput onAddTask={handleAddTask} theme={activeTheme} />
                
                {/* Tips Card */}
                <div className="bg-white/80 dark:bg-slate-800/80 p-6 rounded-[2rem] border border-white dark:border-slate-700 shadow-lg shadow-slate-200/50 dark:shadow-none backdrop-blur-sm">
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" style={{ color: activeTheme.palette[1] }} /> 
                    Tips nhập liệu hiệu quả
                  </h4>
                  <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-4 list-none font-medium">
                     <li className="flex items-start gap-3 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-xl">
                        <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: activeTheme.palette[0] }}></span>
                        <span className="flex-1">Ưu tiên nhập các môn <strong>sắp thi</strong> hoặc có <strong>bài tập lớn</strong>.</span>
                     </li>
                     <li className="flex items-start gap-3 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-xl">
                        <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: activeTheme.palette[2] }}></span>
                        <span className="flex-1">Đánh giá <strong>độ khó</strong> trung thực để cân bằng thời gian nghỉ.</span>
                     </li>
                  </ul>
                </div>
              </div>
              
              <div className="lg:col-span-8">
                <DataTable tasks={tasks} onRemoveTask={handleRemoveTask} theme={activeTheme} />
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-fade-in space-y-10">
             <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/60 dark:border-slate-700 pb-6">
                <div>
                   <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">Trung Tâm Phân Tích</h2>
                   <p className="text-slate-500 dark:text-slate-400 mt-2 text-base font-medium">Tổng quan sức khỏe học tập & Hiệu suất cá nhân</p>
                </div>
                <div className="text-xs font-bold bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-2 backdrop-blur-sm">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: activeTheme.palette[3] }}></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ backgroundColor: activeTheme.palette[2] }}></span>
                  </span>
                  Dữ liệu thời gian thực
                </div>
             </div>

            <StatsBoard tasks={tasks} theme={activeTheme} isDarkMode={isDarkMode} />
            
            <AIPlanner tasks={tasks} theme={activeTheme} />
          </div>
        )}

      </main>
    </div>
  );
}

export default App;
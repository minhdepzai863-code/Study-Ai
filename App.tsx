
import React, { useState, useEffect, useMemo } from 'react';
import { 
  PenTool, GraduationCap, Sparkles, Palette, Moon, Sun, Layers, 
  BookOpen, Calculator, Atom, Globe, Lightbulb, Ruler, Image, 
  Music, Leaf, Shapes, Camera, Feather, Cloud, Flower2, Wind,
  ChevronRight
} from 'lucide-react';
import { TaskInput } from './components/TaskInput';
import { DataTable } from './components/DataTable';
import { StatsBoard } from './components/StatsBoard';
import { AIPlanner } from './components/AIPlanner';
import { DailyActionPlan } from './components/DailyActionPlan';
import { StudyTask } from './types';
import { MOCK_TASKS, THEMES } from './constants';

// Define Background Icon Sets
const BACKGROUND_VARIANTS = {
  educational: [
    { Icon: Atom, className: "top-[15%] left-[10%] w-24 h-24" },
    { Icon: Calculator, className: "bottom-[20%] right-[10%] w-32 h-32" },
    { Icon: Globe, className: "top-[20%] right-[20%] w-20 h-20" },
    { Icon: Lightbulb, className: "bottom-[30%] left-[25%] w-16 h-16" },
    { Icon: Ruler, className: "top-[50%] left-[5%] w-28 h-28 rotate-45" },
    { Icon: BookOpen, className: "bottom-[10%] left-[40%] w-24 h-24" },
  ],
  creative: [
    { Icon: Palette, className: "top-[15%] left-[10%] w-24 h-24" },
    { Icon: Music, className: "bottom-[20%] right-[10%] w-32 h-32" },
    { Icon: Camera, className: "top-[20%] right-[20%] w-20 h-20" },
    { Icon: Feather, className: "bottom-[30%] left-[25%] w-16 h-16" },
    { Icon: Shapes, className: "top-[50%] left-[5%] w-28 h-28" },
    { Icon: PenTool, className: "bottom-[10%] left-[40%] w-24 h-24" },
  ],
  nature: [
    { Icon: Leaf, className: "top-[15%] left-[10%] w-24 h-24" },
    { Icon: Sun, className: "bottom-[20%] right-[10%] w-32 h-32" },
    { Icon: Cloud, className: "top-[20%] right-[20%] w-20 h-20" },
    { Icon: Flower2, className: "bottom-[30%] left-[25%] w-16 h-16" },
    { Icon: Wind, className: "top-[50%] left-[5%] w-28 h-28" },
    { Icon: Globe, className: "bottom-[10%] left-[40%] w-24 h-24" }, // Reusing Globe as 'Earth'
  ],
  minimal: []
};

type BgMode = keyof typeof BACKGROUND_VARIANTS;

function App() {
  const [tasks, setTasks] = useState<StudyTask[]>(() => {
    if (typeof window !== 'undefined') {
      const savedTasks = localStorage.getItem('smartstudy-tasks');
      if (savedTasks) {
        try {
          return JSON.parse(savedTasks);
        } catch (error) {
          console.error("Error parsing saved tasks:", error);
          return MOCK_TASKS;
        }
      }
    }
    return MOCK_TASKS;
  });

  const [activeTab, setActiveTab] = useState<'input' | 'analysis'>('input');
  const [currentThemeId, setCurrentThemeId] = useState('serene');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('themeMode') === 'dark';
    }
    return false;
  });

  const [bgMode, setBgMode] = useState<BgMode>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('bgMode') as BgMode) || 'educational';
    }
    return 'educational';
  });

  const activeTheme = Object.values(THEMES).find(t => t.id === currentThemeId) || THEMES.SERENE;

  useEffect(() => {
    localStorage.setItem('smartstudy-tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('themeMode', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('themeMode', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('bgMode', bgMode);
  }, [bgMode]);

  const handleAddTask = (task: StudyTask) => {
    setTasks(prev => [...prev, task]);
  };

  const handleRemoveTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleToggleTaskCompletion = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, isCompleted: !t.isCompleted } : t));
  };

  const handleUpdateTask = (id: string, updates: Partial<StudyTask>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const cycleTheme = () => {
    const themeKeys = Object.keys(THEMES);
    const currentIndex = themeKeys.findIndex(k => THEMES[k as keyof typeof THEMES].id === currentThemeId);
    const nextKey = themeKeys[(currentIndex + 1) % themeKeys.length];
    setCurrentThemeId(THEMES[nextKey as keyof typeof THEMES].id);
  };

  const cycleBgMode = () => {
    const modes = Object.keys(BACKGROUND_VARIANTS) as BgMode[];
    const currentIndex = modes.indexOf(bgMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setBgMode(modes[nextIndex]);
  };

  const bgLabel = useMemo(() => {
    switch(bgMode) {
      case 'educational': return 'Giáo dục';
      case 'creative': return 'Sáng tạo';
      case 'nature': return 'Thiên nhiên';
      case 'minimal': return 'Tối giản';
      default: return 'Background';
    }
  }, [bgMode]);

  return (
    <div 
      className={`min-h-screen font-sans transition-colors duration-500 pb-24 relative flex flex-col ${isDarkMode ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-800'}`}
    >
      
      {/* --- Accessible Modern Background Layer --- */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none print:hidden">
        <div className="absolute inset-0 bg-dot-pattern opacity-40"></div>

        {/* Very subtle floating blobs - Reduced opacity for ADHD friendliness */}
        <div className="absolute top-[-10%] left-[-5%] w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-[0.03] animate-float" style={{ backgroundColor: activeTheme.palette[1] }}></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-[0.03] animate-float-delayed" style={{ backgroundColor: activeTheme.palette[2] }}></div>
        <div className="absolute top-[40%] left-[30%] w-72 h-72 rounded-full mix-blend-multiply filter blur-3xl opacity-[0.03] animate-float-slow" style={{ backgroundColor: activeTheme.palette[0] }}></div>

        {/* Dynamic Background Icons - INCREASED OPACITY FOR VISIBILITY */}
        {BACKGROUND_VARIANTS[bgMode].map((item, index) => {
            const Icon = item.Icon;
            return (
                <Icon 
                    key={index} 
                    className={`absolute transition-all duration-1000 ${item.className} ${
                        index % 2 === 0 ? 'animate-float' : 
                        index % 3 === 0 ? 'animate-float-delayed' : 'animate-float-slow'
                    }`} 
                    style={{ 
                      color: index % 2 === 0 ? activeTheme.palette[0] : activeTheme.palette[1],
                      // Increased opacity to 0.12 (12%) so user can actually see them change
                      opacity: 0.12 
                    }} 
                />
            )
        })}
      </div>

      {/* --- Header --- */}
      <header className="sticky top-0 z-50 border-b border-slate-200/50 dark:border-slate-800/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl transition-all duration-300 print:hidden">
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-default group select-none">
            <div 
               className="p-2.5 rounded-2xl shadow-sm transition-transform duration-500 ease-out group-hover:rotate-[15deg] group-hover:scale-105"
               style={{ 
                 background: `linear-gradient(135deg, ${activeTheme.palette[0]}, ${activeTheme.palette[1]})`
               }}
            >
               <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-extrabold tracking-tight leading-none text-slate-800 dark:text-slate-100">
                SmartStudy AI
              </h1>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-0.5 tracking-widest uppercase">Student Assistant</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 sm:gap-6">
             <nav className="flex bg-slate-100/60 dark:bg-slate-800/60 p-1 rounded-full relative backdrop-blur-sm shadow-inner">
               <button
                 onClick={() => setActiveTab('input')}
                 className={`relative z-10 px-5 sm:px-6 py-2 text-xs sm:text-sm font-bold rounded-full transition-all duration-300 flex items-center gap-2 ${
                   activeTab === 'input' 
                     ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-slate-100 scale-100' 
                     : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 scale-95 hover:scale-100'
                 }`}
               >
                 <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] border ${activeTab === 'input' ? 'border-current' : 'border-slate-300'}`}>1</span>
                 <span className="hidden xs:inline">Nhập Liệu</span>
               </button>
               <button
                 onClick={() => setActiveTab('analysis')}
                 className={`relative z-10 px-5 sm:px-6 py-2 text-xs sm:text-sm font-bold rounded-full transition-all duration-300 flex items-center gap-2 ${
                   activeTab === 'analysis' 
                     ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-slate-100 scale-100' 
                     : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 scale-95 hover:scale-100'
                 }`}
               >
                 <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] border ${activeTab === 'analysis' ? 'border-current' : 'border-slate-300'}`}>2</span>
                 <span className="hidden xs:inline">Phân Tích</span>
               </button>
             </nav>
             
             <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>

             <div className="flex items-center gap-2">
                <button 
                  onClick={cycleBgMode}
                  className="p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95 group relative border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                  title={`Background: ${bgLabel}`}
                >
                  <Image className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  <span className="absolute top-full right-0 mt-2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                    {bgLabel}
                  </span>
                </button>

                <button 
                  onClick={cycleTheme}
                  className="p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95 group relative border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                  title={`Đổi chủ đề: ${activeTheme.name}`}
                >
                  <Palette className="w-5 h-5 transition-colors duration-500" style={{ color: activeTheme.palette[0] }} />
                  <span className="absolute top-full right-0 mt-2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                    {activeTheme.name}
                  </span>
                </button>

                <button 
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className="p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95 border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                >
                  {isDarkMode ? (
                    <Sun className="w-5 h-5 text-amber-400" />
                  ) : (
                    <Moon className="w-5 h-5 text-slate-600" />
                  )}
                </button>
             </div>
          </div>
        </div>
      </header>

      {/* Main Content Area - Refactored Responsive Grid System */}
      <main className="flex-grow w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        
        {/* Banner Section */}
        <section className="mb-12 print:hidden">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-white dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800 shadow-sm group mx-auto backdrop-blur-sm">
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none group-hover:opacity-10 transition-opacity duration-700">
              <Layers className="w-80 h-80" style={{ color: activeTheme.palette[0] }} />
            </div>
            
            <div className="absolute top-0 left-0 w-1.5 h-full transition-colors duration-500" style={{ backgroundColor: activeTheme.palette[0] }}></div>

            <div className="relative z-10 p-8 sm:p-12">
                <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-xs font-bold uppercase tracking-wider transition-colors duration-500" style={{ color: activeTheme.palette[0] }}>
                  <Sparkles className="w-3 h-3" />
                  <span>Trợ lý học tập thông minh</span>
                </div>
                <h3 className="text-3xl sm:text-5xl font-extrabold mb-4 text-slate-800 dark:text-white tracking-tight">
                  Welcome, <span className="bg-clip-text text-transparent bg-gradient-to-r" style={{ backgroundImage: `linear-gradient(to right, ${activeTheme.palette[0]}, ${activeTheme.palette[1]})` }}>Learners</span>
                </h3>
                <p className="text-lg text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
                  Quản lý thời gian hiệu quả, phân tích workload và để AI giúp bạn cân bằng cuộc sống học tập một cách khoa học.
                </p>
            </div>
          </div>
        </section>

        {activeTab === 'input' ? (
          <div className="animate-fade-in flex flex-col gap-8">
            {/* GRID LAYOUT: Stacks on mobile, 12 Cols on LG */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Input Form (4/12) - Sticky only on large screens */}
              <div className="lg:col-span-4 xl:col-span-3 lg:sticky lg:top-28 z-20 space-y-8">
                <TaskInput onAddTask={handleAddTask} theme={activeTheme} />
              </div>
              
              {/* Right Column: Data Table (8/12) */}
              <div className="lg:col-span-8 xl:col-span-9">
                <DataTable 
                  tasks={tasks} 
                  onRemoveTask={handleRemoveTask} 
                  onToggleCompletion={handleToggleTaskCompletion} 
                  theme={activeTheme} 
                />
              </div>
            </div>

            {/* Navigation Hint Footer */}
            {tasks.length > 0 && (
              <div className="flex justify-end mt-8 pb-8">
                <button 
                  onClick={() => setActiveTab('analysis')}
                  className="px-8 py-4 rounded-2xl text-white font-bold text-lg shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all active:scale-[0.98] flex items-center gap-3 animate-bounce-slow"
                  style={{ backgroundImage: `linear-gradient(to right, ${activeTheme.palette[0]}, ${activeTheme.palette[1]})` }}
                >
                  <span>Bước tiếp theo: Phân tích AI</span>
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="animate-fade-in max-w-[1600px] mx-auto space-y-8">
             {/* Analysis Dashboard Header */}
             <div className="flex items-center gap-4 pb-2 print:hidden">
                <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700">
                  <Sparkles className="w-6 h-6" style={{ color: activeTheme.palette[0] }} />
                </div>
                <div>
                   <h2 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Phân Tích & Chiến Lược</h2>
                   <p className="text-slate-500 dark:text-slate-400 font-medium">Tổng hợp dữ liệu và đề xuất phương án tối ưu</p>
                </div>
             </div>

            {/* Row 1: Full Width Stats */}
            <section className="w-full print:hidden">
              <StatsBoard tasks={tasks} theme={activeTheme} isDarkMode={isDarkMode} />
            </section>
            
            {/* Row 2: Split View - AI Guide (Left) & Action Plan (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
               {/* Main Strategy Guide - 2/3 width on LG */}
               <div className="lg:col-span-8 order-2 lg:order-1 print:col-span-12 print:w-full">
                  <AIPlanner tasks={tasks} theme={activeTheme} />
               </div>

               {/* Actionable Timeline - 1/3 width, Sticky Sidebar on LG */}
               <div className="lg:col-span-4 order-1 lg:order-2 lg:sticky lg:top-24 print:hidden">
                  <DailyActionPlan 
                    tasks={tasks} 
                    onToggleCompletion={handleToggleTaskCompletion} 
                    onUpdateTask={handleUpdateTask}
                    theme={activeTheme} 
                  />
               </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default App;


import React, { useState, useEffect, useRef } from 'react';
import { StudyTask, MindMapOptions, StudentProfile, SavedPlan } from '../types';
import { generateStudyPlan, refineStudyPlan, generateMindMap } from '../services/geminiService';
import { Sparkles, Loader2, FileText, MessageSquare, Send, Calendar, Network, Check, Printer, Download, Copy, Brain, Cpu, TrendingUp, Lightbulb, GraduationCap, Heart, Flame, Quote, AlertTriangle, PieChart, Settings, X, Battery, BarChart3, Users, History, Save, Trash2, ChevronRight, Clock, ArrowRight, UserCheck, ShieldAlert, Target } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface AIPlannerProps {
  tasks: StudyTask[];
  theme: any;
}

// Internal Component for Rendering Mermaid Diagrams
const MermaidChart = ({ code }: { code: string }) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (elementRef.current && code) {
      setHasError(false); // Reset error state on new code
      elementRef.current.removeAttribute('data-processed');
      elementRef.current.innerHTML = code;
      
      // @ts-ignore
      if (window.mermaid) {
        try {
          // @ts-ignore
          window.mermaid.run({ nodes: [elementRef.current] })
            .catch((err: any) => {
              console.error("Mermaid Async Render Error:", err);
              setHasError(true);
            });
        } catch (err) {
          console.error("Mermaid Sync Render Error:", err);
          setHasError(true);
        }
      }
    }
  }, [code]);

  if (hasError) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-8 text-center bg-rose-50 dark:bg-rose-900/10 rounded-xl border border-rose-100 dark:border-rose-800/30">
        <AlertTriangle className="w-8 h-8 text-rose-500 mb-2" />
        <p className="text-sm font-bold text-rose-600 dark:text-rose-400">Không thể hiển thị biểu đồ</p>
        <p className="text-xs text-rose-400 dark:text-rose-500/70 mt-1">AI đã tạo mã không hợp lệ. Vui lòng thử lại.</p>
      </div>
    );
  }

  return <div ref={elementRef} className="mermaid w-full flex justify-center py-4 overflow-x-auto min-h-[200px]" />;
};

export const AIPlanner: React.FC<AIPlannerProps> = ({ tasks, theme }) => {
  const [loading, setLoading] = useState(false);
  const [refining, setRefining] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Student Profile State
  const [studentProfile, setStudentProfile] = useState<StudentProfile>({
    performance: 'Khá',
    energyLevel: 7
  });

  // Initialize state from localStorage if available
  const [guidebook, setGuidebook] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('smartstudy-guidebook');
    }
    return null;
  });

  const [mindMapCode, setMindMapCode] = useState<string | null>(() => {
     if (typeof window !== 'undefined') {
      return localStorage.getItem('smartstudy-mindmap');
    }
    return null;
  });

  // History / Storage State
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('smartstudy-history');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [showHistory, setShowHistory] = useState(false);

  const [mapOptions, setMapOptions] = useState<MindMapOptions>({
    showDifficulty: true,
    showHours: false,
    showDeadline: false
  });
  const [showMapSettings, setShowMapSettings] = useState(false);
  
  const [userComment, setUserComment] = useState('');
  const [isGeneratingMap, setIsGeneratingMap] = useState(false);

  // Save guidebook to localStorage whenever it changes
  useEffect(() => {
    if (guidebook) localStorage.setItem('smartstudy-guidebook', guidebook);
    if (mindMapCode) localStorage.setItem('smartstudy-mindmap', mindMapCode);
  }, [guidebook, mindMapCode]);

  // Save history
  useEffect(() => {
    localStorage.setItem('smartstudy-history', JSON.stringify(savedPlans));
  }, [savedPlans]);

  // Prevent body scroll when history is open
  useEffect(() => {
    if (showHistory) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [showHistory]);

  const handleGenerate = async () => {
    if (tasks.length === 0) return;
    
    setLoading(true);
    setGuidebook(null);
    setMindMapCode(null);
    setUserComment('');
    
    // Pass profile to generation service
    const result = await generateStudyPlan(tasks, studentProfile);
    
    setGuidebook(result);
    setLoading(false);
  };

  const handleGenerateMindMap = async () => {
     setIsGeneratingMap(true);
     setMindMapCode(null); // Reset previous map
     setShowMapSettings(false); // Close settings if open
     const code = await generateMindMap(tasks, mapOptions);
     if (code) {
       setMindMapCode(code);
     }
     setIsGeneratingMap(false);
  };

  const handleRefine = async () => {
    if (!guidebook || !userComment.trim()) return;
    setRefining(true);
    const result = await refineStudyPlan(tasks, guidebook, userComment, studentProfile);
    setGuidebook(result);
    setRefining(false);
    setUserComment('');
  };

  const handleSavePlan = () => {
    if (!guidebook) return;
    const newPlan: SavedPlan = {
      id: uuidv4(),
      timestamp: Date.now(),
      guidebook,
      mindMapCode,
      tasks: tasks, // Snapshot of tasks at that moment
      profile: studentProfile,
      title: `Plan ${new Date().toLocaleDateString('vi-VN')} (${studentProfile.energyLevel}/10 Energy)`
    };
    setSavedPlans(prev => [newPlan, ...prev]);
  };

  const handleLoadPlan = (plan: SavedPlan) => {
    setGuidebook(plan.guidebook);
    setMindMapCode(plan.mindMapCode);
    setStudentProfile(plan.profile);
    // Note: We are not overwriting current tasks to allow user to compare
    setShowHistory(false);
  };

  const handleDeletePlan = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedPlans(prev => prev.filter(p => p.id !== id));
  };

  const handleDownload = () => {
    if (!guidebook) return;
    const blob = new Blob([guidebook], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SmartStudy_Plan_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    if (!guidebook) return;
    navigator.clipboard.writeText(guidebook);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const toggleMapOption = (key: keyof MindMapOptions) => {
    setMapOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getEnergyLabel = (level: number) => {
     if (level <= 3) return { text: 'Kiệt sức', color: 'text-rose-500' };
     if (level <= 6) return { text: 'Bình thường', color: 'text-amber-500' };
     if (level <= 8) return { text: 'Sung sức', color: 'text-emerald-500' };
     return { text: 'Đỉnh cao', color: 'text-indigo-500' };
  };

  const renderMarkdown = (text: string) => {
    if (!text) return null;

    // Split text into sections based on Headers (###)
    const sections = text.split('###').filter(section => section.trim().length > 0);

    return (
      <div className="space-y-8">
        {sections.map((section, index) => {
          const lines = section.trim().split('\n');
          const rawTitle = lines[0].trim(); // First line is the title
          const contentLines = lines.slice(1); // Rest is content

          // Determine Icon & Style based on Title keywords
          let HeaderIcon = Sparkles;
          
          const titleLower = rawTitle.toLowerCase();
          const isScheduleSection = titleLower.includes('lộ trình') || titleLower.includes('lịch') || titleLower.includes('ngày');
          const isProfileSection = titleLower.includes('hồ sơ') || titleLower.includes('phân loại') || titleLower.includes('archetype');

          if (titleLower.includes('phân tích') || titleLower.includes('chiến lược')) HeaderIcon = TrendingUp;
          else if (titleLower.includes('sức khỏe') || titleLower.includes('rủi ro')) HeaderIcon = Heart;
          else if (titleLower.includes('tiêu điểm') || titleLower.includes('ưu tiên')) HeaderIcon = Flame;
          else if (isScheduleSection) HeaderIcon = Calendar;
          else if (titleLower.includes('thông điệp') || titleLower.includes('mentor')) HeaderIcon = Quote;
          else if (titleLower.includes('đồng kiến tạo') || titleLower.includes('lời khuyên')) HeaderIcon = Lightbulb;
          
          // --- SPECIAL RENDERER: PROFILE / CLASSIFICATION CARD ---
          if (isProfileSection) {
            // Helper to parse key-value pairs like "- Archetype: Name"
            const profileData: any = {};
            contentLines.forEach(line => {
              const parts = line.split(':');
              if (parts.length > 1) {
                const key = parts[0].replace(/[-*]/g, '').trim().toLowerCase();
                const value = parts.slice(1).join(':').trim();
                profileData[key] = value;
              }
            });

            // Fallback content parsing if structured data isn't perfect
            const archetype = profileData['archetype'] || profileData['loại'] || "Học sinh";
            
            return (
              <div key={index} className="relative rounded-[2rem] overflow-hidden bg-gradient-to-r from-slate-900 to-indigo-900 text-white shadow-xl animate-fade-in-up">
                 {/* Decorative background */}
                 <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                 <div className="absolute bottom-0 left-0 w-64 h-64 bg-fuchsia-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
                 
                 <div className="relative z-10 p-8 flex flex-col md:flex-row gap-8 items-start">
                    {/* Left: Avatar/Icon */}
                    <div className="flex-shrink-0 flex flex-col items-center gap-4">
                       <div className="w-24 h-24 rounded-full bg-white/10 backdrop-blur-md border-2 border-white/20 flex items-center justify-center text-4xl shadow-inner">
                          <UserCheck className="w-10 h-10 text-indigo-300" />
                       </div>
                       <span className="px-4 py-1.5 rounded-full bg-indigo-500/30 border border-indigo-400/30 text-xs font-bold uppercase tracking-wider">
                         Đã phân loại
                       </span>
                    </div>

                    {/* Right: Info */}
                    <div className="flex-grow space-y-4">
                       <div>
                          <h3 className="text-3xl font-extrabold tracking-tight text-white mb-1">
                             {archetype.replace(/\*\*/g, '')}
                          </h3>
                          <p className="text-indigo-200 font-medium">Hồ sơ học tập & Phong cách cá nhân</p>
                       </div>
                       
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                          {contentLines.map((line, lIdx) => {
                             const trimmed = line.trim();
                             if (!trimmed || trimmed.startsWith('Archetype')) return null;
                             
                             let icon = <Check className="w-4 h-4 text-emerald-400"/>;
                             if (trimmed.toLowerCase().includes('bẫy') || trimmed.toLowerCase().includes('yếu')) icon = <ShieldAlert className="w-4 h-4 text-rose-400"/>;
                             if (trimmed.toLowerCase().includes('mạnh') || trimmed.toLowerCase().includes('tốt')) icon = <Target className="w-4 h-4 text-emerald-400"/>;

                             return (
                                <div key={lIdx} className="bg-white/5 rounded-xl p-3 border border-white/10 text-sm leading-relaxed text-slate-200">
                                   <div className="flex gap-2">
                                      <div className="mt-0.5 flex-shrink-0">{icon}</div>
                                      <div>{trimmed.replace(/^[-*]\s*/, '').replace(/\*\*/g, '')}</div>
                                   </div>
                                </div>
                             )
                          })}
                       </div>
                    </div>
                 </div>
              </div>
            );
          }

          // --- SPECIAL RENDERER: VISUAL SCHEDULE ---
          if (isScheduleSection) {
            // Parse schedule items
            const dayItems: { day: string, content: string[] }[] = [];
            let currentDay: any = null;

            contentLines.forEach(line => {
              const cleanLine = line.trim();
              // Check for "Day X" or "Ngày X" header markers
              const dayMatch = cleanLine.match(/[-*]*\s*\**((Ngày|Day)\s*\d+.*?)[:\*\*]/i);
              
              if (dayMatch) {
                if (currentDay) dayItems.push(currentDay);
                currentDay = { day: dayMatch[1].replace(/\*\*/g, ''), content: [] };
                // If there's content on the same line after the colon
                const splitContent = cleanLine.split(/[:]/);
                if (splitContent.length > 1 && splitContent[1].trim()) {
                   currentDay.content.push(splitContent[1].trim());
                }
              } else if (cleanLine.length > 0 && currentDay) {
                 // Regular item under a day
                 currentDay.content.push(cleanLine.replace(/^[-*]\s*/, '').replace(/\*\*/g, ''));
              }
            });
            if (currentDay) dayItems.push(currentDay);

            return (
              <div 
                key={index}
                className="relative rounded-[2rem] p-8 animate-fade-in-up break-inside-avoid bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-900 shadow-lg overflow-hidden"
              >
                  {/* Visual Background Elements */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl"></div>

                  {/* Header */}
                  <div className="relative z-10 flex items-center gap-4 mb-8">
                    <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                      <HeaderIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
                        {rawTitle.replace(/^[*_]+|[*_]+$/g, '')}
                      </h3>
                      <p className="text-slate-500 dark:text-slate-400 text-sm">Lịch trình tối ưu hóa cho Archetype của bạn</p>
                    </div>
                  </div>

                  {/* Horizontal Timeline Cards */}
                  <div className="relative z-10 flex flex-col gap-6">
                     {dayItems.length > 0 ? dayItems.map((day, dIdx) => (
                        <div 
                          key={dIdx} 
                          className="flex flex-col sm:flex-row gap-4 sm:gap-6 border-l-2 border-indigo-200 dark:border-indigo-800 pl-6 relative"
                        >
                           <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white dark:bg-slate-900 border-4 border-indigo-500"></div>
                           
                           <div className="w-full sm:w-32 flex-shrink-0">
                              <span className="font-bold text-lg text-indigo-600 dark:text-indigo-400 block">{day.day}</span>
                           </div>
                           
                           <div className="flex-grow space-y-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl">
                              {day.content.map((item, iIdx) => (
                                 <div key={iIdx} className="flex gap-3 text-sm text-slate-700 dark:text-slate-300 leading-relaxed items-start">
                                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0"></div>
                                    <span>{item}</span>
                                 </div>
                              ))}
                           </div>
                        </div>
                     )) : (
                        <div className="text-slate-400 italic">Không tìm thấy dữ liệu lịch trình chi tiết.</div>
                     )}
                  </div>
              </div>
            );
          }

          // STANDARD RENDERER FOR OTHER SECTIONS
          return (
            <div 
              key={index} 
              className="relative rounded-[2rem] p-6 sm:p-8 transition-all duration-500 hover:shadow-lg animate-fade-in-up break-inside-avoid bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 shadow-sm"
              style={{ 
                animationDelay: `${index * 0.15}s`
              }}
            >
              {/* Card Header */}
              <div className="flex items-center gap-4 mb-6">
                <div 
                  className="p-3 rounded-2xl shadow-sm bg-slate-50 dark:bg-slate-700"
                  style={{ backgroundColor: theme.palette[0], color: '#fff' }}
                >
                  <HeaderIcon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                  {rawTitle.replace(/^[*_]+|[*_]+$/g, '')} {/* Remove bold markers from title if present */}
                </h3>
              </div>

              {/* Card Content */}
              <div className="space-y-4">
                {contentLines.map((line, lineIdx) => {
                  const trimmed = line.trim();
                  if (!trimmed) return null;

                  // Parse Markdown Table
                  if (trimmed.startsWith('|')) {
                     // Simple table rendering logic
                     const cells = trimmed.split('|').filter(c => c.trim() !== '');
                     if (cells.length === 0 || trimmed.includes('---')) return null; // Skip separator lines
                     
                     const isHeader = lineIdx < 4 && contentLines[lineIdx+1]?.includes('---');
                     
                     return (
                        <div key={lineIdx} className="grid gap-2 border-b border-slate-100 dark:border-slate-700 py-2" style={{ gridTemplateColumns: `repeat(${cells.length}, 1fr)`}}>
                           {cells.map((cell, cIdx) => (
                              <div key={cIdx} className={`text-sm ${isHeader ? 'font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider' : 'text-slate-600 dark:text-slate-300'}`}>
                                 {cell.trim()}
                              </div>
                           ))}
                        </div>
                     )
                  }

                  // Parse Bold (**text**)
                  const parseBold = (str: string) => str.split('**').map((part, i) => 
                    i % 2 === 1 ? <strong key={i} className="font-bold text-slate-900 dark:text-white">{part}</strong> : part
                  );

                  // Blockquote (>)
                  if (trimmed.startsWith('>')) {
                    return (
                      <div key={lineIdx} className="pl-6 border-l-4 border-indigo-200 dark:border-indigo-800 italic text-slate-600 dark:text-slate-400 py-2">
                        {parseBold(trimmed.substring(1))}
                      </div>
                    );
                  }

                  // List Item
                  if (trimmed.startsWith('- ')) {
                    return (
                      <div key={lineIdx} className="flex gap-3 items-start group">
                        <span className="mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0 transition-transform group-hover:scale-150" style={{ backgroundColor: theme.palette[1] }}></span>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-base sm:text-[1.05rem]">
                          {parseBold(trimmed.substring(2))}
                        </p>
                      </div>
                    );
                  }

                  // Regular Paragraph
                  return (
                    <p key={lineIdx} className="text-slate-600 dark:text-slate-300 leading-relaxed text-base sm:text-[1.05rem]">
                      {parseBold(trimmed)}
                    </p>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Skeleton Loader Component
  const SkeletonLoader = () => (
    <div className="max-w-3xl mx-auto space-y-8 animate-pulse p-8">
      <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-full w-3/4 mb-10"></div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
            <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-full w-1/3"></div>
          </div>
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-full w-full"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-full w-5/6"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-full w-4/6"></div>
        </div>
      ))}
    </div>
  );

  const ScaleIcon = (props: any) => (
      <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/></svg>
  );

  return (
    <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 relative">
      
      {/* 
        ------------------------------------------------
        HISTORY SIDEBAR (Refined Animation) 
        ------------------------------------------------
      */}
      <div className={`fixed inset-0 z-50 flex justify-end transition-all duration-300 ${showHistory ? 'visible' : 'invisible'}`}>
        {/* Backdrop */}
        <div 
          onClick={() => setShowHistory(false)} 
          className={`absolute inset-0 bg-slate-900/30 backdrop-blur-sm transition-opacity duration-300 ${showHistory ? 'opacity-100' : 'opacity-0'}`}
        ></div>
        
        {/* Drawer */}
        <div 
          className={`
            relative z-10 w-full max-w-sm bg-white dark:bg-slate-900 shadow-2xl h-full flex flex-col transform transition-transform duration-300 ease-out
            ${showHistory ? 'translate-x-0' : 'translate-x-full'}
          `}
        >
           <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-md">
             <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-500" />
                <h3 className="font-bold text-lg text-slate-800 dark:text-white">Lịch sử Plan</h3>
             </div>
             <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"><X className="w-5 h-5 text-slate-500"/></button>
          </div>
          
          <div className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50/30 dark:bg-slate-900/30">
             {savedPlans.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400 text-center p-6">
                   <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                      <Clock className="w-8 h-8 opacity-30" />
                   </div>
                   <p className="font-medium text-slate-600 dark:text-slate-300">Chưa có bản lưu nào</p>
                   <p className="text-xs mt-1">Lưu plan sau khi tạo để xem lại tại đây.</p>
                </div>
             ) : (
                savedPlans.map(plan => (
                   <div key={plan.id} onClick={() => handleLoadPlan(plan)} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 bg-white dark:bg-slate-800 cursor-pointer group transition-all hover:shadow-md relative">
                      <div className="flex justify-between items-start mb-2">
                         <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider">{new Date(plan.timestamp).toLocaleDateString('vi-VN')}</span>
                         <button onClick={(e) => handleDeletePlan(plan.id, e)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5"/></button>
                      </div>
                      <h4 className="font-bold text-slate-700 dark:text-slate-200 mb-2">{plan.title || 'Kế hoạch học tập'}</h4>
                      <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-100 dark:bg-slate-700/50 p-2 rounded-lg">
                         <Battery className="w-3 h-3" /> Năng lượng: {plan.profile.energyLevel}/10
                         <span className="mx-1 text-slate-300">|</span>
                         <Cpu className="w-3 h-3" /> {plan.tasks.length} tasks
                      </div>
                   </div>
                ))
             )}
          </div>
        </div>
      </div>

      {/* 
        ------------------------------------------------
        LEFT COLUMN: Daily Check-in Card (Redesigned)
        ------------------------------------------------
      */}
      <div className="lg:col-span-4 space-y-6 print:hidden">
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 sm:p-8 border border-slate-100 dark:border-slate-800 shadow-xl relative overflow-hidden lg:sticky lg:top-28">
           
           {/* Decorative Header */}
           <div className="relative z-10 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-start">
                <div>
                   <h2 className="text-xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                     <Brain className="w-6 h-6 text-indigo-500" />
                     Daily Check-in
                   </h2>
                   <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Cập nhật trạng thái để AI tối ưu hóa.</p>
                </div>
                <button 
                  onClick={() => setShowHistory(true)}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-600"
                  title="Xem lịch sử"
                >
                   <History className="w-5 h-5" />
                </button>
              </div>
           </div>

           <div className="relative z-10 space-y-6">
              
              {/* Energy Slider Card */}
              <div className="bg-slate-50/80 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                 <div className="flex justify-between items-center mb-3">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                      <Battery className="w-4 h-4"/> Năng lượng
                    </label>
                    <span className={`text-xs font-bold px-2 py-1 rounded-md bg-white dark:bg-slate-700 shadow-sm ${getEnergyLabel(studentProfile.energyLevel).color}`}>
                      {studentProfile.energyLevel}/10 • {getEnergyLabel(studentProfile.energyLevel).text}
                    </span>
                 </div>
                 <input 
                   type="range" 
                   min="1" 
                   max="10" 
                   step="1"
                   value={studentProfile.energyLevel}
                   onChange={(e) => setStudentProfile(prev => ({ ...prev, energyLevel: parseInt(e.target.value) }))}
                   className="w-full h-2 rounded-full appearance-none cursor-pointer bg-slate-200 dark:bg-slate-700"
                   style={{ accentColor: theme.palette[0] }}
                 />
                 <div className="flex justify-between mt-2 text-[10px] text-slate-400 font-bold uppercase">
                    <span>Mệt mỏi</span>
                    <span>Đỉnh cao</span>
                 </div>
              </div>

              {/* Performance Select Card */}
              <div className="bg-slate-50/80 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                 <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2 mb-3">
                      <BarChart3 className="w-4 h-4"/> Tự đánh giá học lực
                 </label>
                 <select
                    value={studentProfile.performance}
                    onChange={(e) => setStudentProfile(prev => ({ ...prev, performance: e.target.value as any }))}
                    className="w-full bg-white dark:bg-slate-700 border-transparent rounded-xl px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer shadow-sm hover:shadow"
                 >
                    <option value="Yếu">Yếu (Cần hỗ trợ nhiều)</option>
                    <option value="Trung bình">Trung bình (Cần cố gắng)</option>
                    <option value="Khá">Khá (Duy trì phong độ)</option>
                    <option value="Giỏi">Giỏi (Cần thử thách)</option>
                 </select>
              </div>

              {/* Action Button */}
              <button
                onClick={handleGenerate}
                disabled={loading || tasks.length === 0}
                className={`
                  w-full py-4 rounded-2xl text-white font-bold text-lg shadow-lg hover:shadow-indigo-200/50 dark:hover:shadow-indigo-900/50 hover:-translate-y-1 transition-all active:scale-[0.98] relative overflow-hidden group flex items-center justify-center gap-3
                  ${loading || tasks.length === 0 
                    ? 'opacity-50 cursor-not-allowed bg-slate-400' 
                    : ''}
                `}
                style={!loading && tasks.length > 0 ? { backgroundImage: `linear-gradient(to right, ${theme.palette[0]}, ${theme.palette[1]})` } : {}}
              >
                {loading ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Đang phân tích...</span>
                    </>
                ) : (
                    <>
                        <Sparkles className="w-5 h-5 fill-white/20" />
                        <span>Tạo Guidebook</span>
                    </>
                )}
              </button>
              
              <div className="text-center">
                 <p className="text-xs text-slate-400 font-medium">
                    AI sẽ phân tích {tasks.length} tasks dựa trên dữ liệu bạn cung cấp.
                 </p>
              </div>

           </div>
        </div>
      </div>

      {/* 
        ------------------------------------------------
        RIGHT COLUMN: Document Output
        ------------------------------------------------
      */}
      <div className="lg:col-span-8 print:col-span-12 print:w-full">
        {loading ? (
           <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl border border-slate-100 dark:border-slate-800 min-h-[600px]">
              <SkeletonLoader />
           </div>
        ) : guidebook ? (
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-[2rem] shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden min-h-[600px] animate-fade-in-up flex flex-col print:shadow-none print:border-none">
            {/* Header */}
            <div className="bg-slate-50/50 dark:bg-slate-800/50 p-6 sm:p-8 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4 backdrop-blur-md print:bg-transparent print:border-b-2 print:border-slate-200">
               <div className="flex items-center gap-5 w-full sm:w-auto">
                  <div className="p-4 bg-white dark:bg-slate-700 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-600 print:hidden">
                    <FileText className="w-8 h-8" style={{ color: theme.palette[0] }}/>
                  </div>
                  <div>
                     <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">Student Guidebook</h1>
                     <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                        Kế hoạch học tập cá nhân hóa & Phân tích số liệu
                     </p>
                  </div>
               </div>
               
               {/* Actions */}
               <div className="flex items-center gap-2 self-end sm:self-auto print:hidden">
                    <div className="relative">
                       <button
                          onClick={() => setShowMapSettings(!showMapSettings)}
                          className={`p-2.5 rounded-xl transition-all border ${showMapSettings ? 'bg-indigo-100 border-indigo-200 text-indigo-600' : 'bg-transparent border-transparent text-slate-400 hover:text-indigo-500 hover:bg-white'}`}
                          title="Cấu hình Visual Map"
                       >
                         <Settings className="w-5 h-5" />
                       </button>

                       {showMapSettings && (
                          <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 p-4 z-50 animate-fade-in-up">
                             <div className="flex justify-between items-center mb-3">
                                <h4 className="text-xs font-bold uppercase text-slate-400">Chi tiết hiển thị</h4>
                                <button onClick={() => setShowMapSettings(false)} className="text-slate-400 hover:text-slate-600"><X className="w-3 h-3"/></button>
                             </div>
                             <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 p-2 rounded-lg transition-colors">
                                   <input 
                                     type="checkbox" 
                                     checked={mapOptions.showDifficulty} 
                                     onChange={() => toggleMapOption('showDifficulty')}
                                     className="rounded text-indigo-500 focus:ring-indigo-500"
                                   />
                                   Độ khó
                                </label>
                                <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 p-2 rounded-lg transition-colors">
                                   <input 
                                     type="checkbox" 
                                     checked={mapOptions.showHours} 
                                     onChange={() => toggleMapOption('showHours')}
                                     className="rounded text-indigo-500 focus:ring-indigo-500"
                                   />
                                   Thời gian (Giờ)
                                </label>
                                <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 p-2 rounded-lg transition-colors">
                                   <input 
                                     type="checkbox" 
                                     checked={mapOptions.showDeadline} 
                                     onChange={() => toggleMapOption('showDeadline')}
                                     className="rounded text-indigo-500 focus:ring-indigo-500"
                                   />
                                   Deadline
                                </label>
                             </div>
                          </div>
                       )}
                    </div>

                    <button 
                      onClick={handleGenerateMindMap}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 font-bold text-sm transition-all active:scale-95 border border-indigo-200 dark:border-indigo-800"
                      disabled={isGeneratingMap}
                    >
                      {isGeneratingMap ? <Loader2 className="w-4 h-4 animate-spin"/> : <Network className="w-4 h-4"/>}
                      <span className="hidden sm:inline">Visual Map</span>
                    </button>

                    <button 
                      onClick={handleSavePlan}
                      className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all border border-emerald-200 dark:border-emerald-800 active:scale-95"
                      title="Lưu kế hoạch"
                    >
                      <Save className="w-5 h-5"/>
                    </button>

                    <button 
                      onClick={handleCopy}
                      className="p-2.5 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-600 active:scale-95"
                      title="Sao chép nội dung"
                    >
                      {copied ? <Check className="w-5 h-5 text-emerald-500"/> : <Copy className="w-5 h-5"/>}
                    </button>
                    <button 
                      onClick={handleDownload}
                      className="p-2.5 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-600 active:scale-95"
                      title="Tải xuống (Markdown)"
                    >
                      <Download className="w-5 h-5"/>
                    </button>
                    <button 
                      onClick={handlePrint}
                      className="p-2.5 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-600 active:scale-95"
                      title="In / Lưu PDF"
                    >
                      <Printer className="w-5 h-5"/>
                    </button>
               </div>
            </div>
            
            {/* Content Body */}
            <div className="p-6 sm:p-12 text-lg flex-grow bg-slate-50/20 dark:bg-slate-950/20 print:bg-white">
               {refining ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <Loader2 className="w-12 h-12 animate-spin mb-4" style={{ color: theme.palette[0] }} />
                    <p className="font-medium">AI đang điều chỉnh kế hoạch theo ý bạn...</p>
                  </div>
               ) : (
                  <div className="max-w-4xl mx-auto">
                    {/* Visual AI MindMap Section (Inserted if generated) */}
                    {mindMapCode && (
                       <div className="mb-10 p-1 bg-gradient-to-br from-violet-500 via-indigo-500 to-fuchsia-500 rounded-[2rem] shadow-xl animate-fade-in-up">
                          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-[1.9rem] p-6 sm:p-8 relative overflow-hidden">
                              {/* Decorative Grid Background for Map */}
                              <div className="absolute inset-0 bg-dot-pattern opacity-30 pointer-events-none"></div>
                              
                              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800 relative z-10">
                                 <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl text-white shadow-md">
                                   <Network className="w-5 h-5"/>
                                 </div>
                                 <h3 className="font-extrabold text-xl text-slate-800 dark:text-white tracking-tight">SmartStudy Visual Map</h3>
                                 <span className="ml-auto text-xs font-bold uppercase text-white bg-slate-800 px-3 py-1.5 rounded-full shadow-sm">Live Render</span>
                              </div>
                              <div className="relative z-10">
                                 <MermaidChart code={mindMapCode} />
                              </div>
                          </div>
                       </div>
                    )}

                    {renderMarkdown(guidebook)}
                  </div>
               )}
            </div>

            {/* Feedback Loop Footer */}
            <div className="bg-white dark:bg-slate-800/80 p-6 border-t border-slate-100 dark:border-slate-700 print:hidden">
               <div className="max-w-3xl mx-auto flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
                    <MessageSquare className="w-4 h-4" />
                    Phản hồi & Điều chỉnh (Feedback Loop)
                  </div>
                  <div className="flex gap-3 flex-col sm:flex-row">
                    <input 
                      type="text" 
                      value={userComment}
                      onChange={(e) => setUserComment(e.target.value)}
                      placeholder="Ví dụ: Tôi muốn học môn Toán vào buổi sáng..."
                      className="flex-grow bg-slate-50 dark:bg-slate-900 border-transparent rounded-xl px-5 py-3.5 focus:outline-none focus:ring-2 transition-all shadow-inner w-full"
                      style={{ 
                        // @ts-ignore
                        '--tw-ring-color': theme.palette[0] 
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && handleRefine()}
                    />
                    <button 
                      onClick={handleRefine}
                      disabled={!userComment.trim() || refining}
                      className="w-full sm:w-auto px-6 py-3.5 rounded-xl text-white font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      style={{ 
                         background: `linear-gradient(to right, ${theme.palette[0]}, ${theme.palette[1]})`
                      }}
                    >
                      <Send className="w-4 h-4" />
                      <span>Gửi</span>
                    </button>
                  </div>
               </div>
            </div>
          </div>
        ) : (
           <div className="h-full border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem] flex flex-col items-center justify-center p-12 text-center bg-slate-50/50 dark:bg-slate-900/20 min-h-[500px]">
              <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-sm mb-4">
                 <Sparkles className="w-8 h-8 text-indigo-400 animate-pulse" />
              </div>
              <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-2">Sẵn sàng tạo kế hoạch</h3>
              <p className="text-slate-400 max-w-xs leading-relaxed">
                 Hãy cập nhật "Daily Check-in" ở cột bên trái, sau đó nhấn nút <strong>Tạo Guidebook</strong> để bắt đầu.
              </p>
           </div>
        )}
      </div>
    </div>
  );
};

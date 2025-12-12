
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { StudyTask, MindMapOptions, StudentProfile, SavedPlan, LearningStyle, StudyMethod } from '../types';
import { generateStudyPlan, refineStudyPlan, generateMindMap, calculateWellbeingStats } from '../services/geminiService';
import { Sparkles, Loader2, FileText, MessageSquare, Send, Calendar, Network, Check, Printer, Download, Copy, Brain, Cpu, TrendingUp, Lightbulb, GraduationCap, Heart, Flame, Quote, AlertTriangle, PieChart, Settings, X, Battery, BarChart3, Users, History, Save, Trash2, ChevronRight, Clock, ArrowRight, UserCheck, ShieldAlert, Target, Eye, Ear, BookOpen, Hand, Timer, Repeat, Hourglass, Zap, ChevronDown, ChevronUp, Star, Layout, Bookmark, Activity, Info } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { MiniChatbot } from './MiniChatbot';

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
  const [showAdvancedProfile, setShowAdvancedProfile] = useState(false);
  
  // Student Profile State
  const [studentProfile, setStudentProfile] = useState<StudentProfile>({
    performance: 'Khá',
    energyLevel: 7,
    learningStyle: 'Visual',
    studyMethod: 'Pomodoro'
  });

  // Calculate Wellbeing Stats on the fly based on tasks & profile
  const wellbeingStats = useMemo(() => {
     return calculateWellbeingStats(tasks, studentProfile);
  }, [tasks, studentProfile]);

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
      <div className="space-y-8 sm:space-y-10 pb-12">
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
              <div key={index} className="relative rounded-[2.5rem] overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-2xl animate-fade-in-up border border-indigo-500/20">
                 {/* Decorative background */}
                 <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
                 <div className="absolute bottom-0 left-0 w-80 h-80 bg-fuchsia-500/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2"></div>
                 <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
                 
                 <div className="relative z-10 p-8 sm:p-10 flex flex-col md:flex-row gap-8 sm:gap-12 items-start">
                    {/* Left: Avatar/Icon */}
                    <div className="flex-shrink-0 flex flex-col items-center gap-5 mx-auto md:mx-0">
                       <div className="w-28 h-28 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center text-5xl shadow-[0_0_40px_rgba(99,102,241,0.3)] relative group">
                          <UserCheck className="w-12 h-12 text-indigo-300 group-hover:scale-110 transition-transform duration-500" />
                          <div className="absolute inset-0 rounded-full border border-white/20 animate-pulse-slow"></div>
                       </div>
                       <span className="px-5 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-xs font-bold uppercase tracking-widest text-indigo-200">
                         Persona
                       </span>
                    </div>

                    {/* Right: Info */}
                    <div className="flex-grow space-y-6 w-full text-center md:text-left">
                       <div>
                          <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3 leading-tight">
                             {archetype.replace(/\*\*/g, '')}
                          </h3>
                          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                              <span className="px-3 py-1.5 rounded-lg bg-white/10 text-sm font-medium border border-white/5 flex items-center gap-2 backdrop-blur-md">
                                {studentProfile.learningStyle === 'Visual' ? <Eye className="w-4 h-4 text-blue-300"/> : studentProfile.learningStyle === 'Auditory' ? <Ear className="w-4 h-4 text-amber-300"/> : <Brain className="w-4 h-4 text-emerald-300"/>}
                                <span className="text-slate-200">{studentProfile.learningStyle} Learner</span>
                              </span>
                              <span className="px-3 py-1.5 rounded-lg bg-white/10 text-sm font-medium border border-white/5 flex items-center gap-2 backdrop-blur-md">
                                <Zap className="w-4 h-4 text-yellow-300"/>
                                <span className="text-slate-200">{studentProfile.studyMethod} Method</span>
                              </span>
                          </div>
                       </div>
                       
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 text-left">
                          {contentLines.map((line, lIdx) => {
                             const trimmed = line.trim();
                             if (!trimmed || trimmed.startsWith('Archetype') || trimmed.toLowerCase().startsWith('phong cách') || trimmed.toLowerCase().startsWith('wellbeing')) return null;
                             
                             let icon = <Bookmark className="w-5 h-5 text-indigo-300"/>;
                             let bgClass = "bg-indigo-500/10 border-indigo-500/20";

                             if (trimmed.toLowerCase().includes('bẫy') || trimmed.toLowerCase().includes('yếu')) {
                                icon = <ShieldAlert className="w-5 h-5 text-rose-400"/>;
                                bgClass = "bg-rose-500/10 border-rose-500/20";
                             }
                             if (trimmed.toLowerCase().includes('mạnh') || trimmed.toLowerCase().includes('tốt')) {
                                icon = <Target className="w-5 h-5 text-emerald-400"/>;
                                bgClass = "bg-emerald-500/10 border-emerald-500/20";
                             }

                             return (
                                <div key={lIdx} className={`${bgClass} backdrop-blur-sm rounded-xl p-4 border text-sm leading-relaxed text-slate-200 transition-all hover:bg-opacity-20`}>
                                   <div className="flex gap-3">
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
                className="relative rounded-[2.5rem] p-8 sm:p-10 animate-fade-in-up break-inside-avoid bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden"
              >
                  {/* Visual Background Elements */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[60px]"></div>

                  {/* Header */}
                  <div className="relative z-10 flex items-center gap-5 mb-10 pb-6 border-b border-slate-100 dark:border-slate-700/50">
                    <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 shadow-sm transform -rotate-2">
                      <HeaderIcon className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">
                        {rawTitle.replace(/^[*_]+|[*_]+$/g, '')}
                      </h3>
                      <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">Lịch trình tối ưu hóa cho Archetype của bạn</p>
                    </div>
                  </div>

                  {/* Vertical Timeline Cards */}
                  <div className="relative z-10 flex flex-col gap-10">
                     {dayItems.length > 0 ? dayItems.map((day, dIdx) => (
                        <div key={dIdx} className="relative pl-8 sm:pl-10 border-l-2 border-indigo-100 dark:border-indigo-900/50">
                           {/* Timeline dot */}
                           <div className="absolute -left-[11px] top-0 w-6 h-6 rounded-full bg-white dark:bg-slate-800 border-4 border-indigo-500 shadow-lg"></div>
                           
                           <div className="mb-6">
                              <span className="inline-block px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 text-sm font-bold uppercase tracking-wider shadow-sm border border-indigo-100 dark:border-indigo-800">
                                {day.day}
                              </span>
                           </div>
                           
                           <div className="space-y-4">
                              {day.content.map((item, iIdx) => (
                                 <div 
                                    key={iIdx} 
                                    className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all hover:shadow-md group"
                                 >
                                    <div className="flex gap-4 items-start">
                                      <div className="mt-1.5 w-2 h-2 rounded-full bg-indigo-400 flex-shrink-0 group-hover:scale-125 transition-transform"></div>
                                      <span className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium text-base">
                                        {/* Highlight time logic if needed, simple render for now */}
                                        {item}
                                      </span>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        </div>
                     )) : (
                        <div className="text-slate-400 italic text-center py-10">Không tìm thấy dữ liệu lịch trình chi tiết.</div>
                     )}
                  </div>
              </div>
            );
          }

          // --- STANDARD RENDERER FOR OTHER SECTIONS (STRATEGY, ADVICE, ETC) ---
          
          // Determine specific visual theme based on section title
          let cardStyle = "bg-white dark:bg-slate-800/50 border-slate-100 dark:border-slate-700";
          let iconBg = theme.palette[0];
          let iconColor = "#fff";
          let accentColorClass = "text-indigo-600 dark:text-indigo-400";

          if (titleLower.includes('chiến lược') || titleLower.includes('phân tích')) {
             cardStyle = "bg-gradient-to-br from-blue-50/80 to-white dark:from-blue-900/20 dark:to-slate-800 border-blue-100 dark:border-blue-800/50";
             iconBg = "#3b82f6"; // Blue-500
             accentColorClass = "text-blue-600 dark:text-blue-400";
          } else if (titleLower.includes('lời khuyên') || titleLower.includes('góc')) {
             cardStyle = "bg-gradient-to-br from-amber-50/80 to-white dark:from-amber-900/20 dark:to-slate-800 border-amber-100 dark:border-amber-800/50";
             iconBg = "#f59e0b"; // Amber-500
             accentColorClass = "text-amber-600 dark:text-amber-400";
          } else if (titleLower.includes('wellbeing') || titleLower.includes('đồng kiến tạo')) {
             cardStyle = "bg-gradient-to-br from-emerald-50/80 to-white dark:from-emerald-900/20 dark:to-slate-800 border-emerald-100 dark:border-emerald-800/50";
             iconBg = "#10b981"; // Emerald-500
             accentColorClass = "text-emerald-600 dark:text-emerald-400";
          }

          return (
            <div 
              key={index} 
              className={`relative rounded-[2.5rem] p-6 sm:p-10 transition-all duration-500 hover:shadow-xl animate-fade-in-up break-inside-avoid border shadow-sm ${cardStyle}`}
              style={{ 
                animationDelay: `${index * 0.15}s`
              }}
            >
              {/* Card Header */}
              <div className="flex items-center gap-5 mb-8 border-b border-black/5 dark:border-white/5 pb-6">
                <div 
                  className="p-3.5 rounded-2xl shadow-lg shadow-black/5 transform rotate-3"
                  style={{ backgroundColor: iconBg, color: iconColor }}
                >
                  <HeaderIcon className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight leading-none">
                  {rawTitle.replace(/^[*_]+|[*_]+$/g, '')}
                </h3>
              </div>

              {/* Card Content */}
              <div className="space-y-5 text-slate-600 dark:text-slate-300">
                {contentLines.map((line, lineIdx) => {
                  const trimmed = line.trim();
                  if (!trimmed) return null;

                  // Parse Markdown Table
                  if (trimmed.startsWith('|')) {
                     const cells = trimmed.split('|').filter(c => c.trim() !== '');
                     if (cells.length === 0 || trimmed.includes('---')) return null;
                     
                     const isHeader = lineIdx < 4 && contentLines[lineIdx+1]?.includes('---');
                     
                     return (
                        <div key={lineIdx} className="grid gap-4 border-b border-black/5 dark:border-white/10 py-3 first:border-t" style={{ gridTemplateColumns: `repeat(${cells.length}, 1fr)`}}>
                           {cells.map((cell, cIdx) => (
                              <div key={cIdx} className={`text-sm ${isHeader ? 'font-bold text-slate-900 dark:text-white uppercase tracking-wider' : 'text-slate-600 dark:text-slate-300'}`}>
                                 {cell.trim()}
                              </div>
                           ))}
                        </div>
                     )
                  }

                  // Enhanced Bold Parsing with Highlight
                  const parseBold = (str: string) => str.split('**').map((part, i) => 
                    i % 2 === 1 ? (
                      <span key={i} className={`font-extrabold text-slate-900 dark:text-white bg-white/50 dark:bg-white/10 px-1 rounded box-decoration-clone shadow-sm`}>
                        {part}
                      </span>
                    ) : part
                  );

                  // Enhanced Blockquote
                  if (trimmed.startsWith('>')) {
                    return (
                      <div key={lineIdx} className="relative pl-10 pr-6 py-6 my-6 rounded-2xl bg-white/60 dark:bg-slate-900/40 border border-indigo-100 dark:border-indigo-900 shadow-inner">
                        <Quote className={`absolute left-4 top-4 w-6 h-6 opacity-40 ${accentColorClass}`} />
                        <p className="relative z-10 font-medium text-lg leading-relaxed italic text-slate-700 dark:text-slate-200">
                             "{parseBold(trimmed.substring(1).trim())}"
                        </p>
                      </div>
                    );
                  }

                  // Enhanced List Item
                  if (trimmed.startsWith('- ')) {
                    return (
                      <div key={lineIdx} className="flex gap-4 items-start group pl-1">
                        <div className="mt-2.5 w-2 h-2 rounded-full flex-shrink-0 transition-all duration-300 group-hover:scale-150 group-hover:ring-4 ring-current opacity-40" style={{ color: iconBg }}>
                            <div className="w-full h-full rounded-full bg-current"></div>
                        </div>
                        <p className="leading-relaxed text-base sm:text-lg">
                          {parseBold(trimmed.substring(2))}
                        </p>
                      </div>
                    );
                  }
                  
                   // Numbered List
                  if (/^\d+\./.test(trimmed)) {
                     const [num, ...rest] = trimmed.split('.');
                     return (
                        <div key={lineIdx} className="flex gap-4 items-start group pl-1">
                           <span className={`font-black text-lg ${accentColorClass} min-w-[1.5rem]`}>{num}.</span>
                           <p className="leading-relaxed text-base sm:text-lg">
                              {parseBold(rest.join('.').trim())}
                           </p>
                        </div>
                     )
                  }

                  // Regular Paragraph
                  return (
                    <p key={lineIdx} className="leading-relaxed text-base sm:text-lg">
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
    <div className="max-w-3xl mx-auto space-y-10 animate-pulse p-10">
      <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-full w-2/3 mb-12"></div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-5 p-6 border border-slate-100 dark:border-slate-800 rounded-[2rem]">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-2xl"></div>
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-full w-1/3"></div>
          </div>
          <div className="space-y-3">
             <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-full w-full"></div>
             <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-full w-5/6"></div>
             <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-full w-4/6"></div>
          </div>
        </div>
      ))}
    </div>
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

              {/* --- ADVANCED PROFILE TOGGLE --- */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                  <button 
                    onClick={() => setShowAdvancedProfile(!showAdvancedProfile)}
                    className="flex items-center justify-between w-full text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors mb-4"
                  >
                    <span className="flex items-center gap-2"><UserCheck className="w-4 h-4"/> Hồ sơ chuyên sâu</span>
                    {showAdvancedProfile ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
                  </button>
                  
                  {showAdvancedProfile && (
                     <div className="space-y-4 animate-fade-in">
                        {/* Learning Style */}
                        <div className="bg-slate-50/80 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                           <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2 mb-3">
                              Phong cách học (VARK)
                           </label>
                           <div className="grid grid-cols-2 gap-2">
                              {[
                                { id: 'Visual', icon: Eye, label: 'Visual', color: 'text-blue-500' },
                                { id: 'Auditory', icon: Ear, label: 'Auditory', color: 'text-amber-500' },
                                { id: 'ReadWrite', icon: BookOpen, label: 'R/W', color: 'text-emerald-500' },
                                { id: 'Kinesthetic', icon: Hand, label: 'Kinesthetic', color: 'text-rose-500' },
                              ].map((item) => (
                                 <button
                                   key={item.id}
                                   onClick={() => setStudentProfile(prev => ({ ...prev, learningStyle: item.id as LearningStyle }))}
                                   className={`p-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all border ${
                                     studentProfile.learningStyle === item.id 
                                     ? 'bg-white dark:bg-slate-700 border-indigo-200 shadow-md ring-1 ring-indigo-500/50' 
                                     : 'bg-transparent border-transparent hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-500'
                                   }`}
                                 >
                                    <item.icon className={`w-5 h-5 ${studentProfile.learningStyle === item.id ? item.color : 'text-slate-400'}`} />
                                    <span>{item.label}</span>
                                 </button>
                              ))}
                           </div>
                        </div>

                        {/* Study Method */}
                        <div className="bg-slate-50/80 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                           <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2 mb-3">
                              Phương pháp ưa thích
                           </label>
                           <div className="space-y-2">
                             {[
                               { id: 'Pomodoro', label: 'Pomodoro (25/5)', icon: Timer },
                               { id: 'Feynman', label: 'Feynman (Giảng lại)', icon: Users },
                               { id: 'SpacedRepetition', label: 'Spaced Repetition', icon: Repeat },
                               { id: 'Flowtime', label: 'Flowtime (Linh hoạt)', icon: Hourglass },
                             ].map((method) => (
                               <button
                                  key={method.id}
                                  onClick={() => setStudentProfile(prev => ({ ...prev, studyMethod: method.id as StudyMethod }))}
                                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-xs font-bold transition-all border ${
                                     studentProfile.studyMethod === method.id
                                     ? 'bg-white dark:bg-slate-700 border-indigo-200 shadow-sm'
                                     : 'bg-transparent border-transparent hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-500'
                                  }`}
                               >
                                  <div className={`p-1.5 rounded-lg ${studentProfile.studyMethod === method.id ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                                    <method.icon className="w-4 h-4" />
                                  </div>
                                  <span className={studentProfile.studyMethod === method.id ? 'text-slate-800 dark:text-white' : ''}>{method.label}</span>
                                  {studentProfile.studyMethod === method.id && <Check className="w-3.5 h-3.5 ml-auto text-indigo-500"/>}
                               </button>
                             ))}
                           </div>
                        </div>
                     </div>
                  )}
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
      <div className="lg:col-span-8 print:col-span-12 print:w-full relative">
        {loading ? (
           <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl border border-slate-100 dark:border-slate-800 min-h-[600px]">
              <SkeletonLoader />
           </div>
        ) : guidebook ? (
          <>
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
                      
                      {/* --- WELLBEING SCORECARD --- */}
                      <div className="mb-12 p-8 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 shadow-xl animate-fade-in-up">
                          <div className="flex items-center gap-3 mb-8">
                            <div className="p-3 rounded-2xl bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400">
                              <Activity className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-extrabold text-slate-800 dark:text-white">Wellbeing Analysis</h3>
                                <p className="text-sm font-medium text-slate-400">Phân tích tác động và dự đoán sự cải thiện</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start mb-8">
                            {/* Before */}
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm font-bold uppercase tracking-wider text-slate-500">
                                  <span>Hiện tại (Stress Load)</span>
                                  <span>{wellbeingStats.current}/100</span>
                                </div>
                                <div className="h-6 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-1">
                                  <div 
                                      className="h-full rounded-full bg-slate-400 transition-all duration-1000" 
                                      style={{ width: `${wellbeingStats.current}%` }}
                                  ></div>
                                </div>
                            </div>
                            
                            {/* After */}
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                                  <span>Dự kiến (Tối ưu hóa)</span>
                                  <span>{wellbeingStats.projected}/100</span>
                                </div>
                                <div className="h-6 w-full bg-teal-50 dark:bg-teal-900/20 rounded-full overflow-hidden p-1 relative">
                                    {/* Shadow Bar for previous value to show delta */}
                                  <div 
                                      className="absolute top-1 left-1 h-4 rounded-full bg-slate-200 dark:bg-slate-700 opacity-30" 
                                      style={{ width: `${wellbeingStats.current}%` }}
                                  ></div>
                                  <div 
                                      className="h-full rounded-full bg-teal-500 transition-all duration-1000 shadow-[0_0_15px_rgba(20,184,166,0.5)]" 
                                      style={{ width: `${wellbeingStats.projected}%` }}
                                  ></div>
                                </div>
                            </div>
                          </div>

                          {/* Factor Analysis Pills */}
                          <div className="grid grid-cols-3 gap-3 mb-6">
                              {wellbeingStats.factors && (
                                <>
                                  <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 text-center">
                                    <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Workload</div>
                                    <div className={`text-sm font-bold ${wellbeingStats.factors.workload === 'Quá tải' ? 'text-rose-500' : 'text-slate-700 dark:text-slate-200'}`}>
                                      {wellbeingStats.factors.workload}
                                    </div>
                                  </div>
                                  <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 text-center">
                                    <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Pressure</div>
                                    <div className={`text-sm font-bold ${wellbeingStats.factors.pressure.includes('Gấp') ? 'text-amber-500' : 'text-slate-700 dark:text-slate-200'}`}>
                                      {wellbeingStats.factors.pressure}
                                    </div>
                                  </div>
                                  <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 text-center">
                                    <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Capacity</div>
                                    <div className={`text-sm font-bold ${wellbeingStats.factors.capacity.includes('Thấp') ? 'text-rose-500' : 'text-emerald-500'}`}>
                                      {wellbeingStats.factors.capacity}
                                    </div>
                                  </div>
                                </>
                              )}
                          </div>

                          <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-900/10 border border-teal-100 dark:border-teal-800/50 flex gap-3 text-sm text-teal-800 dark:text-teal-300">
                            <Info className="w-5 h-5 flex-shrink-0 opacity-80" />
                            <p className="font-medium leading-relaxed">
                                Thuật toán dự đoán tăng <strong>+{wellbeingStats.projected - wellbeingStats.current} điểm</strong> nhờ giảm tải áp lực deadline và điều phối năng lượng hợp lý.
                            </p>
                          </div>
                      </div>

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

            {/* INTEGRATE MINI CHATBOT HERE */}
            <MiniChatbot 
              planContext={guidebook} 
              profile={studentProfile} 
              taskSummary={`${tasks.length} tasks`}
              theme={theme}
            />
          </>
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

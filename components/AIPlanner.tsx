
import React, { useState, useEffect } from 'react';
import { StudyTask } from '../types';
import { generateStudyPlan, refineStudyPlan } from '../services/geminiService';
import { Sparkles, Loader2, FileText, MessageSquare, Send, Activity, Target, Brain, Map, Quote, CheckCircle2 } from 'lucide-react';

interface AIPlannerProps {
  tasks: StudyTask[];
  theme: any;
}

export const AIPlanner: React.FC<AIPlannerProps> = ({ tasks, theme }) => {
  const [loading, setLoading] = useState(false);
  const [refining, setRefining] = useState(false);
  
  // Initialize state from localStorage if available
  const [guidebook, setGuidebook] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('smartstudy-guidebook');
    }
    return null;
  });
  
  const [userComment, setUserComment] = useState('');
  const [step, setStep] = useState(0); // 0: Idle, 1: Cleaning, 2: Analyzing, 3: Writing, 4: Done

  // Save guidebook to localStorage whenever it changes
  useEffect(() => {
    if (guidebook) {
      localStorage.setItem('smartstudy-guidebook', guidebook);
    }
  }, [guidebook]);

  const handleGenerate = async () => {
    if (tasks.length === 0) return;
    
    // Workflow Simulation
    setLoading(true);
    setGuidebook(null);
    setUserComment('');
    
    setStep(1); // Cleaning
    await new Promise(r => setTimeout(r, 800));
    
    setStep(2); // Analyzing
    await new Promise(r => setTimeout(r, 1200));
    
    setStep(3); // Writing
    const result = await generateStudyPlan(tasks);
    
    setStep(4); // Done
    setGuidebook(result);
    setLoading(false);
  };

  const handleRefine = async () => {
    if (!guidebook || !userComment.trim()) return;
    setRefining(true);
    const result = await refineStudyPlan(tasks, guidebook, userComment);
    setGuidebook(result);
    setRefining(false);
    setUserComment('');
  };

  const renderMarkdown = (text: string) => {
    if (!text) return null;

    // Split text into sections based on Headers (###)
    // The filter(Boolean) removes empty strings from the split
    const sections = text.split('###').filter(section => section.trim().length > 0);

    return (
      <div className="space-y-8">
        {sections.map((section, index) => {
          const lines = section.trim().split('\n');
          const rawTitle = lines[0].trim(); // First line is the title
          const contentLines = lines.slice(1); // Rest is content

          // Determine Icon & Style based on Title keywords
          let HeaderIcon = Sparkles;
          let isQuoteSection = false;

          if (rawTitle.includes('Tổng Quan') || rawTitle.includes('Sức Khỏe')) HeaderIcon = Activity;
          else if (rawTitle.includes('Tiêu Điểm') || rawTitle.includes('Priority')) HeaderIcon = Target;
          else if (rawTitle.includes('Chiến Lược') || rawTitle.includes('Tư Duy')) HeaderIcon = Brain;
          else if (rawTitle.includes('Lộ Trình') || rawTitle.includes('Lịch Trình')) HeaderIcon = Map;
          else if (rawTitle.includes('Thông Điệp') || rawTitle.includes('Mentor')) {
             HeaderIcon = Quote;
             isQuoteSection = true;
          }

          return (
            <div 
              key={index} 
              className={`
                relative rounded-[2rem] p-6 sm:p-8 transition-all duration-500 hover:shadow-lg animate-fade-in-up
                ${isQuoteSection 
                  ? 'bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border-2' 
                  : 'bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 shadow-sm'}
              `}
              style={{ 
                animationDelay: `${index * 0.15}s`,
                borderColor: isQuoteSection ? theme.palette[0] : undefined
              }}
            >
              {/* Card Header */}
              <div className="flex items-center gap-4 mb-6">
                <div 
                  className={`p-3 rounded-2xl shadow-sm ${isQuoteSection ? 'text-white' : 'bg-slate-50 dark:bg-slate-700'}`}
                  style={{ backgroundColor: isQuoteSection ? theme.palette[0] : undefined }}
                >
                  <HeaderIcon 
                    className="w-6 h-6" 
                    style={{ color: isQuoteSection ? '#fff' : theme.palette[0] }} 
                  />
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

                  // Parse Bold (**text**)
                  const parseBold = (str: string) => str.split('**').map((part, i) => 
                    i % 2 === 1 ? <strong key={i} className="font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-700/50 px-1 rounded-md mx-0.5">{part}</strong> : part
                  );

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

                  // Blockquote (Inner Box)
                  if (trimmed.startsWith('>')) {
                    return (
                      <div key={lineIdx} className="my-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border-l-4 italic" style={{ borderColor: theme.palette[2] }}>
                        <p className="text-slate-700 dark:text-slate-300 font-medium text-lg leading-relaxed">
                          "{trimmed.substring(1).trim()}"
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

  return (
    <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
      
      {/* Sidebar Control */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2rem] p-6 sm:p-8 border border-white/20 dark:border-slate-800 shadow-xl relative overflow-hidden lg:sticky lg:top-28">
           {/* Decorative bg blob */}
           <div className="absolute -top-10 -right-10 w-32 h-32 opacity-20 rounded-full blur-2xl" style={{ background: theme.palette[0] }}></div>

           <div className="relative z-10">
              <h2 className="text-2xl font-bold mb-4 text-slate-800 dark:text-white flex items-center gap-2">
                <Sparkles className="w-6 h-6" style={{ color: theme.palette[0] }} />
                AI Mentor
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                Hệ thống sẽ phân tích workload, độ khó và deadline để tạo ra chiến lược học tập tối ưu nhất cho bạn.
              </p>

              {/* Workflow Steps Visualization */}
              {loading && (
                <div className="mb-6 space-y-4">
                   <div className={`flex items-center gap-3 text-sm p-3 rounded-xl transition-colors ${step >= 1 ? 'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white font-bold' : 'text-slate-400'}`}>
                      {step > 1 ? <CheckCircle2 className="w-5 h-5 text-green-500"/> : (step === 1 ? <Loader2 className="w-5 h-5 animate-spin text-blue-500"/> : <div className="w-5 h-5 border-2 border-slate-200 rounded-full"/>)}
                      Làm sạch dữ liệu & Chuẩn hóa
                   </div>
                   <div className={`flex items-center gap-3 text-sm p-3 rounded-xl transition-colors ${step >= 2 ? 'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white font-bold' : 'text-slate-400'}`}>
                      {step > 2 ? <CheckCircle2 className="w-5 h-5 text-green-500"/> : (step === 2 ? <Loader2 className="w-5 h-5 animate-spin text-blue-500"/> : <div className="w-5 h-5 border-2 border-slate-200 rounded-full"/>)}
                      Phân tích Workload & Stress
                   </div>
                   <div className={`flex items-center gap-3 text-sm p-3 rounded-xl transition-colors ${step >= 3 ? 'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white font-bold' : 'text-slate-400'}`}>
                      {step > 3 ? <CheckCircle2 className="w-5 h-5 text-green-500"/> : (step === 3 ? <Loader2 className="w-5 h-5 animate-spin text-blue-500"/> : <div className="w-5 h-5 border-2 border-slate-200 rounded-full"/>)}
                      Soạn thảo Guidebook Chiến Lược
                   </div>
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={loading || tasks.length === 0}
                className={`
                  w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all active:scale-[0.98] relative overflow-hidden group
                  ${loading || tasks.length === 0 
                    ? 'opacity-50 cursor-not-allowed bg-slate-400' 
                    : ''}
                `}
                style={!loading && tasks.length > 0 ? { backgroundImage: `linear-gradient(to right, ${theme.palette[0]}, ${theme.palette[1]})` } : {}}
              >
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
                {loading ? 'Đang Xử Lý...' : 'Tạo Kế Hoạch Ngay'}
              </button>
           </div>
        </div>
      </div>

      {/* Main Document Output */}
      <div className="lg:col-span-8">
        {loading ? (
           <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl border border-slate-100 dark:border-slate-800 min-h-[600px]">
              <SkeletonLoader />
           </div>
        ) : guidebook ? (
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-[2rem] shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden min-h-[600px] animate-fade-in-up flex flex-col">
            {/* Header */}
            <div className="bg-slate-50/50 dark:bg-slate-800/50 p-6 sm:p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center backdrop-blur-md">
               <div className="flex items-center gap-5">
                  <div className="p-4 bg-white dark:bg-slate-700 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-600">
                    <FileText className="w-8 h-8" style={{ color: theme.palette[0] }}/>
                  </div>
                  <div>
                     <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">Study Plan Guidebook</h1>
                     <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">Được thiết kế riêng cho bạn</p>
                  </div>
               </div>
               <div className="text-right hidden sm:block">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Ngày lập</span>
                  <div className="font-bold text-slate-700 dark:text-slate-300 text-lg">{new Date().toLocaleDateString('vi-VN')}</div>
               </div>
            </div>
            
            {/* Content Body - Box in Box Layout */}
            <div className="p-6 sm:p-12 text-lg flex-grow bg-slate-50/20 dark:bg-slate-950/20">
               {refining ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <Loader2 className="w-12 h-12 animate-spin mb-4" style={{ color: theme.palette[0] }} />
                    <p className="font-medium">AI đang điều chỉnh kế hoạch theo ý bạn...</p>
                  </div>
               ) : (
                  <div className="max-w-4xl mx-auto">
                    {renderMarkdown(guidebook)}
                  </div>
               )}
            </div>

            {/* Feedback Loop Footer */}
            <div className="bg-white dark:bg-slate-800/80 p-6 border-t border-slate-100 dark:border-slate-700">
               <div className="max-w-3xl mx-auto flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
                    <MessageSquare className="w-4 h-4" />
                    Phản hồi & Điều chỉnh
                  </div>
                  <div className="flex gap-3 flex-col sm:flex-row">
                    <input 
                      type="text" 
                      value={userComment}
                      onChange={(e) => setUserComment(e.target.value)}
                      placeholder="Ví dụ: Mình muốn dành thêm thời gian cho môn Toán..."
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
               <div className="mt-4 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-300 dark:text-slate-600 flex items-center justify-center gap-1">
                    Powered by Gemini 2.0 Flash <Sparkles className="w-3 h-3"/>
                  </p>
               </div>
            </div>
          </div>
        ) : (
           <div className="h-full border border-slate-200 dark:border-slate-800 rounded-[2rem] flex flex-col items-center justify-center p-12 text-center text-slate-400 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-default shadow-sm relative overflow-hidden group min-h-[500px]">
              
              {/* Animated Neural Network Background */}
              <div className="w-80 h-80 mb-6 relative z-10">
                 <svg className="w-full h-full" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Neural Nodes - Pulsing */}
                    <circle cx="100" cy="100" r="10" fill={theme.palette[0]} className="animate-pulse opacity-80" />
                    <circle cx="60" cy="60" r="6" fill={theme.palette[1]} className="animate-bounce-slow opacity-60" style={{ animationDelay: '0.2s' }} />
                    <circle cx="140" cy="60" r="6" fill={theme.palette[1]} className="animate-bounce-slow opacity-60" style={{ animationDelay: '0.4s' }} />
                    <circle cx="60" cy="140" r="6" fill={theme.palette[1]} className="animate-bounce-slow opacity-60" style={{ animationDelay: '0.6s' }} />
                    <circle cx="140" cy="140" r="6" fill={theme.palette[1]} className="animate-bounce-slow opacity-60" style={{ animationDelay: '0.8s' }} />
                    
                    {/* Small Satellites */}
                    <circle cx="30" cy="100" r="3" fill={theme.palette[2]} className="animate-float" />
                    <circle cx="170" cy="100" r="3" fill={theme.palette[2]} className="animate-float-delayed" />
                    
                    {/* Connecting Lines (Simulated Synapses) */}
                    <path d="M100 100 L60 60" stroke={theme.palette[1]} strokeWidth="1.5" strokeOpacity="0.4" className="animate-pulse" />
                    <path d="M100 100 L140 60" stroke={theme.palette[1]} strokeWidth="1.5" strokeOpacity="0.4" className="animate-pulse" style={{ animationDelay: '0.2s' }} />
                    <path d="M100 100 L60 140" stroke={theme.palette[1]} strokeWidth="1.5" strokeOpacity="0.4" className="animate-pulse" style={{ animationDelay: '0.4s' }} />
                    <path d="M100 100 L140 140" stroke={theme.palette[1]} strokeWidth="1.5" strokeOpacity="0.4" className="animate-pulse" style={{ animationDelay: '0.6s' }} />
                    
                    {/* Outer Rings - Brain Waves */}
                    <circle cx="100" cy="100" r="50" stroke={theme.palette[0]} strokeWidth="0.5" strokeOpacity="0.2" className="animate-spin" style={{ animationDuration: '10s' }} />
                    <circle cx="100" cy="100" r="70" stroke={theme.palette[0]} strokeWidth="0.5" strokeOpacity="0.1" className="animate-spin" style={{ animationDuration: '15s', animationDirection: 'reverse' }} />
                 </svg>
              </div>

              <div className="relative z-10">
                <h3 className="text-xl font-bold text-slate-600 dark:text-slate-300 mb-2">Sẵn sàng phân tích</h3>
                <p className="text-sm max-w-xs text-slate-400 leading-relaxed mx-auto">
                  Nhấn nút <span className="font-bold text-slate-600 dark:text-slate-300">"Tạo Kế Hoạch Ngay"</span> để AI kích hoạt mạng lưới nơ-ron và xây dựng chiến lược cho bạn.
                </p>
              </div>
           </div>
        )}
      </div>
    </div>
  );
};

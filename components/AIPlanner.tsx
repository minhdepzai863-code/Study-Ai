import React, { useState, useEffect, useRef } from 'react';
import { StudyTask } from '../types';
import { generateStudyPlan, refineStudyPlan, generateMindMap } from '../services/geminiService';
import { Sparkles, Loader2, FileText, MessageSquare, Send, Calendar, Network, Check, Printer, Download, Copy, Brain, Cpu, TrendingUp, Lightbulb, GraduationCap, Heart, Flame, Quote, AlertTriangle } from 'lucide-react';

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
  
  const [userComment, setUserComment] = useState('');
  const [isGeneratingMap, setIsGeneratingMap] = useState(false);

  // Save guidebook to localStorage whenever it changes
  useEffect(() => {
    if (guidebook) localStorage.setItem('smartstudy-guidebook', guidebook);
    if (mindMapCode) localStorage.setItem('smartstudy-mindmap', mindMapCode);
  }, [guidebook, mindMapCode]);

  const handleGenerate = async () => {
    if (tasks.length === 0) return;
    
    setLoading(true);
    setGuidebook(null);
    setMindMapCode(null);
    setUserComment('');
    
    const result = await generateStudyPlan(tasks);
    
    setGuidebook(result);
    setLoading(false);
  };

  const handleGenerateMindMap = async () => {
     setIsGeneratingMap(true);
     setMindMapCode(null); // Reset previous map
     const code = await generateMindMap(tasks);
     if (code) {
       setMindMapCode(code);
     }
     setIsGeneratingMap(false);
  };

  const handleRefine = async () => {
    if (!guidebook || !userComment.trim()) return;
    setRefining(true);
    const result = await refineStudyPlan(tasks, guidebook, userComment);
    setGuidebook(result);
    setRefining(false);
    setUserComment('');
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

          if (titleLower.includes('tổng quan') || titleLower.includes('sức khỏe')) HeaderIcon = Heart;
          else if (titleLower.includes('chiến lược')) HeaderIcon = Brain;
          else if (titleLower.includes('tiêu điểm') || titleLower.includes('ưu tiên')) HeaderIcon = Flame;
          else if (titleLower.includes('lộ trình') || titleLower.includes('lịch') || titleLower.includes('ngày')) HeaderIcon = Calendar;
          else if (titleLower.includes('thông điệp') || titleLower.includes('mentor')) HeaderIcon = Quote;
          else if (titleLower.includes('công cụ')) HeaderIcon = Cpu;
          
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

  return (
    <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
      
      {/* Sidebar Control */}
      <div className="lg:col-span-4 space-y-6 print:hidden">
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2rem] p-6 sm:p-8 border border-white/20 dark:border-slate-800 shadow-xl relative overflow-hidden lg:sticky lg:top-28">
           {/* Decorative bg blob */}
           <div className="absolute -top-10 -right-10 w-32 h-32 opacity-20 rounded-full blur-2xl" style={{ background: theme.palette[0] }}></div>

           <div className="relative z-10">
              <h2 className="text-2xl font-bold mb-4 text-slate-800 dark:text-white flex items-center gap-2">
                <Brain className="w-8 h-8" style={{ color: theme.palette[0] }} />
                AI Guidebook
              </h2>
              <div className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed text-sm space-y-2">
                <p>Hệ thống sẽ tổng hợp dữ liệu để tạo ra:</p>
                <ul className="space-y-2 font-medium text-slate-700 dark:text-slate-300">
                   <li className="flex items-center gap-3"><div className="p-1.5 bg-indigo-100 dark:bg-indigo-900 rounded-full text-indigo-600"><Heart className="w-3.5 h-3.5"/></div> Tổng quan & Sức khỏe</li>
                   <li className="flex items-center gap-3"><div className="p-1.5 bg-amber-100 dark:bg-amber-900 rounded-full text-amber-600"><Brain className="w-3.5 h-3.5"/></div> Chiến lược học tập</li>
                   <li className="flex items-center gap-3"><div className="p-1.5 bg-emerald-100 dark:bg-emerald-900 rounded-full text-emerald-600"><Flame className="w-3.5 h-3.5"/></div> Tiêu điểm ưu tiên</li>
                </ul>
              </div>

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
                {loading ? (
                    <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Đang phân tích...</span>
                    </div>
                ) : 'Tạo Guidebook'}
              </button>
           </div>
        </div>
      </div>

      {/* Main Document Output */}
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
                        Kế hoạch học tập cá nhân hóa
                     </p>
                  </div>
               </div>
               
               {/* Actions */}
               <div className="flex items-center gap-2 self-end sm:self-auto print:hidden">
                    <button 
                      onClick={handleGenerateMindMap}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 font-bold text-sm transition-all active:scale-95 border border-indigo-200 dark:border-indigo-800"
                      disabled={isGeneratingMap}
                    >
                      {isGeneratingMap ? <Loader2 className="w-4 h-4 animate-spin"/> : <Network className="w-4 h-4"/>}
                      <span className="hidden sm:inline">Visual Map</span>
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
           <div className="h-full border border-slate-200 dark:border-slate-800 rounded-[2rem] flex flex-col items-center justify-center p-12 text-center text-slate-400 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-default shadow-sm relative overflow-hidden group min-h-[500px]">
              
              <div className="w-64 h-64 mb-6 relative z-10 opacity-50">
                 <svg className="w-full h-full" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="100" cy="100" r="40" stroke={theme.palette[0]} strokeWidth="2" className="animate-pulse" />
                    <path d="M100 60V140 M60 100H140" stroke={theme.palette[1]} strokeWidth="2" strokeLinecap="round" />
                    <circle cx="100" cy="100" r="70" stroke={theme.palette[2]} strokeWidth="1" strokeDasharray="5 5" className="animate-spin" style={{ animationDuration: '20s'}} />
                 </svg>
              </div>

              <div className="relative z-10">
                <h3 className="text-xl font-bold text-slate-600 dark:text-slate-300 mb-2">SmartStudy Guidebook</h3>
                <p className="text-sm max-w-xs text-slate-400 leading-relaxed mx-auto">
                  Nhấn <span className="font-bold text-slate-600 dark:text-slate-300">"Tạo Guidebook"</span> để hệ thống phân tích dữ liệu và tạo kế hoạch học tập chi tiết.
                </p>
              </div>
           </div>
        )}
      </div>
    </div>
  );
};
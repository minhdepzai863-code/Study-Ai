import React, { useState } from 'react';
import { StudyTask } from '../types';
import { generateStudyPlan } from '../services/geminiService';
import { Sparkles, Loader2, BookOpen, BrainCircuit } from 'lucide-react';

interface AIPlannerProps {
  tasks: StudyTask[];
  theme: any;
}

export const AIPlanner: React.FC<AIPlannerProps> = ({ tasks, theme }) => {
  const [loading, setLoading] = useState(false);
  const [guidebook, setGuidebook] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (tasks.length === 0) return;
    setLoading(true);
    const result = await generateStudyPlan(tasks);
    setGuidebook(result);
    setLoading(false);
  };

  return (
    <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Control Panel */}
      <div className="lg:col-span-4 space-y-4">
        <div className="bg-slate-800 dark:bg-slate-900 text-white rounded-[2.5rem] p-8 shadow-xl shadow-indigo-900/20 relative overflow-hidden transition-colors duration-300">
           {/* Abstract Background Decoration */}
           <div className="absolute top-[-20%] right-[-20%] w-64 h-64 bg-white opacity-5 rounded-full blur-3xl"></div>
           <div className="absolute bottom-[-10%] left-[-10%] w-40 h-40 bg-white opacity-5 rounded-full blur-2xl"></div>
           
           <h2 className="text-2xl font-bold mb-3 flex items-center gap-3 relative z-10">
             <Sparkles className="w-6 h-6" style={{ color: theme.palette[2] }} />
             AI Planner
           </h2>
           <p className="text-slate-300 text-sm mb-8 relative z-10 leading-relaxed opacity-90 font-medium">
             Kích hoạt trí tuệ nhân tạo để phân tích lịch trình và đề xuất chiến lược học tập tối ưu cho riêng bạn.
           </p>

           <button
            onClick={handleGenerate}
            disabled={loading || tasks.length === 0}
            className={`
              w-full py-4 px-6 rounded-2xl font-bold text-sm shadow-lg transition-all transform hover:-translate-y-1 relative z-10 flex justify-center items-center gap-2
              ${loading || tasks.length === 0 
                ? 'bg-slate-700 cursor-not-allowed text-slate-400 shadow-none' 
                : 'text-white shadow-lg active:scale-95'}
            `}
            style={!(loading || tasks.length === 0) ? { 
                background: `linear-gradient(135deg, ${theme.palette[1]}, ${theme.palette[2]})`,
                boxShadow: `0 10px 20px -5px ${theme.palette[1]}60` 
            } : {}}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> 
                Đang suy nghĩ...
              </>
            ) : (
              <>
                <BrainCircuit className="w-5 h-5" /> 
                Tạo Guidebook
              </>
            )}
          </button>
        </div>
        
        {tasks.length === 0 && (
           <div className="text-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 text-slate-500 text-xs font-medium">
              Vui lòng nhập ít nhất 1 nhiệm vụ để sử dụng AI.
           </div>
        )}
      </div>

      {/* Output Area */}
      <div className="lg:col-span-8">
        {guidebook ? (
          <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-lg shadow-slate-200/50 dark:shadow-black/20 border border-white dark:border-slate-700 overflow-hidden animate-fade-in-up transition-colors duration-300">
            <div className="px-8 py-6 border-b border-slate-50 dark:border-slate-700 flex items-center gap-4 bg-slate-50/50 dark:bg-slate-900/30 backdrop-blur-sm">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm text-white" style={{ backgroundColor: theme.palette[0] }}>
                 <BookOpen className="w-5 h-5" />
              </div>
              <div>
                 <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 tracking-tight">Kế Hoạch Học Tập</h3>
                 <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Được thiết kế riêng cho bạn</p>
              </div>
            </div>
            <div className="p-8 md:p-10">
               <div className="prose prose-slate dark:prose-invert max-w-none font-medium leading-loose text-slate-600 dark:text-slate-300">
                  <div className="whitespace-pre-wrap">{guidebook}</div>
               </div>
            </div>
          </div>
        ) : (
           <div className="h-full min-h-[350px] border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[2.5rem] flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 p-8 bg-slate-50/50 dark:bg-slate-800/20 transition-colors">
              <div className="p-4 bg-white dark:bg-slate-800 rounded-full shadow-sm mb-4">
                  <Sparkles className="w-8 h-8 opacity-50" />
              </div>
              <p className="font-bold text-sm">Chưa có dữ liệu phân tích</p>
              <p className="text-xs mt-1 opacity-70">Kết quả sẽ hiển thị tại đây sau khi bạn nhấn nút tạo.</p>
           </div>
        )}
      </div>
    </div>
  );
};
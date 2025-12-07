import React from 'react';
import { StudyTask, DifficultyLevel } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { DIFFICULTY_SCORE } from '../constants';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

interface StatsBoardProps {
  tasks: StudyTask[];
  theme: any;
  isDarkMode: boolean;
}

export const StatsBoard: React.FC<StatsBoardProps> = ({ tasks, theme, isDarkMode }) => {
  const difficultyData = Object.values(DifficultyLevel).map((level, index) => ({
    name: level,
    value: tasks.filter(t => t.difficulty === level).length
  })).filter(d => d.value > 0);

  const workloadData = tasks.map(t => ({
    name: t.subject.length > 10 ? t.subject.substring(0, 8) + '...' : t.subject,
    fullSubject: t.subject,
    hours: t.estimatedHours,
    score: DIFFICULTY_SCORE[t.difficulty]
  }));

  const totalHours = tasks.reduce((sum, t) => sum + t.estimatedHours, 0);
  
  // Define overload threshold (e.g., > 12 hours total in the list is considered heavy)
  const OVERLOAD_THRESHOLD = 12;
  const isOverloaded = totalHours > OVERLOAD_THRESHOLD;

  const axisColor = isDarkMode ? '#94a3b8' : '#94a3b8'; // Slate-400
  const gridColor = isDarkMode ? '#334155' : '#f1f5f9';
  const tooltipBg = isDarkMode ? '#1e293b' : '#ffffff';
  const tooltipText = isDarkMode ? '#f8fafc' : '#1e293b';

  // Use the pastel palette from the theme
  const chartColors = theme.palette;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Workload Chart */}
      <div className={`bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-lg shadow-slate-200/50 dark:shadow-black/20 border flex flex-col relative overflow-hidden group transition-all duration-300
          ${isOverloaded 
            ? 'border-rose-200 dark:border-rose-900 ring-4 ring-rose-50 dark:ring-rose-900/20' 
            : 'border-white dark:border-slate-700'}
      `}>
        {/* Overload Background Tint */}
        {isOverloaded && (
           <div className="absolute top-0 right-0 w-32 h-32 bg-rose-400 opacity-5 rounded-full blur-3xl pointer-events-none -mr-10 -mt-10"></div>
        )}

        <div className="p-8 flex flex-col h-full relative z-10">
          <div className="flex justify-between items-start mb-8">
             <div>
                <h4 className="text-slate-800 dark:text-slate-100 font-extrabold text-lg tracking-tight">Khối Lượng Công Việc</h4>
                {isOverloaded ? (
                  <p className="text-xs text-rose-500 font-bold mt-1 flex items-center gap-1.5 animate-pulse">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Cảnh báo: Khối lượng bài vở cao!
                  </p>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    Phân bổ giờ học hợp lý
                  </p>
                )}
             </div>
             
             {/* Total Hours Badge */}
             <div className={`px-4 py-2 rounded-2xl font-bold text-sm shadow-sm border transition-colors duration-300 flex items-center gap-1.5
                ${isOverloaded 
                  ? 'bg-rose-50 dark:bg-rose-900/40 text-rose-600 dark:text-rose-300 border-rose-100 dark:border-rose-800' 
                  : 'bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-100 dark:border-slate-600'}
             `}>
                {isOverloaded && <AlertTriangle className="w-4 h-4" />}
                <span>
                   <span className="text-base mr-1" style={{ color: isOverloaded ? undefined : theme.palette[1] }}>{totalHours}</span> 
                   giờ
                </span>
             </div>
          </div>
          
          <div className="flex-grow w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workloadData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: axisColor, fontSize: 11, fontWeight: 600 }} 
                  axisLine={false} 
                  tickLine={false} 
                  interval={0}
                  dy={10}
                />
                <YAxis 
                  tick={{ fill: axisColor, fontSize: 11 }} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <Tooltip 
                   cursor={{fill: isDarkMode ? '#334155' : '#f8fafc', radius: 8}}
                   contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px 16px', backgroundColor: tooltipBg }}
                   labelStyle={{ fontWeight: 'bold', color: tooltipText, marginBottom: '0.25rem', fontSize: '13px' }}
                   itemStyle={{ color: tooltipText, fontSize: '13px' }}
                />
                <Bar 
                  dataKey="hours" 
                  name="Số giờ học" 
                  radius={[8, 8, 8, 8]} 
                  barSize={32}
                  animationDuration={1500}
                >
                  {workloadData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={isOverloaded && entry.hours >= 4 ? '#f43f5e' : chartColors[index % 4]} // Highlight specific heavy tasks in red if overloaded
                      className="opacity-90 hover:opacity-100 transition-opacity cursor-pointer"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Difficulty Distribution Chart */}
      <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-lg shadow-slate-200/50 dark:shadow-black/20 border border-white dark:border-slate-700 flex flex-col relative overflow-hidden group">
        <div className="p-8 flex flex-col h-full">
          <div className="mb-6">
             <h4 className="text-slate-800 dark:text-slate-100 font-extrabold text-lg tracking-tight">Phân Tích Độ Khó</h4>
             <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Tỷ lệ các môn theo mức độ</p>
          </div>
          
          <div className="flex-grow w-full min-h-[300px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={difficultyData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={6}
                  dataKey="value"
                  stroke="none"
                  cornerRadius={8}
                >
                  {difficultyData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={chartColors[(index + 1) % 4]} // Shift index slightly for variety
                      className="hover:opacity-90 transition-opacity"
                    />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)', padding: '8px 12px', backgroundColor: tooltipBg }}
                   itemStyle={{ fontWeight: 600, color: tooltipText, fontSize: '13px' }}
                />
                <Legend 
                   verticalAlign="bottom" 
                   height={36} 
                   iconType="circle"
                   iconSize={10}
                   wrapperStyle={{ fontSize: '12px', paddingTop: '20px', fontWeight: 600, color: axisColor }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center Text */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -mt-4 text-center pointer-events-none">
               <span className="text-4xl font-black text-slate-800 dark:text-slate-100 tracking-tighter block" style={{ color: theme.palette[2] }}>{tasks.length}</span>
               <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-widest">Môn học</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
import React from 'react';
import { StudyTask, DifficultyLevel } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { DIFFICULTY_SCORE } from '../constants';
import { AlertTriangle, CheckCircle2, Info, Activity, PartyPopper } from 'lucide-react';

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
    name: t.subject.length > 8 ? t.subject.substring(0, 6) + '..' : t.subject,
    fullSubject: t.subject,
    hours: t.estimatedHours,
    isCompleted: t.isCompleted,
    score: DIFFICULTY_SCORE[t.difficulty]
  }));

  const totalHours = tasks.reduce((sum, t) => sum + t.estimatedHours, 0);
  const completedHours = tasks.filter(t => t.isCompleted).reduce((sum, t) => sum + t.estimatedHours, 0);
  const progressPercentage = totalHours > 0 ? Math.round((completedHours / totalHours) * 100) : 0;

  const OVERLOAD_THRESHOLD = 12;
  const isOverloaded = totalHours > OVERLOAD_THRESHOLD;
  const isAllDone = progressPercentage === 100 && tasks.length > 0;

  // Accessible Pastel Colors for Charts
  const chartColors = [
    theme.palette[0], // Primary
    theme.palette[1], // Secondary
    theme.palette[2], // Accent
    '#cbd5e1',        // Slate-300
  ];

  const textColor = isDarkMode ? '#cbd5e1' : '#64748b';
  const gridColor = isDarkMode ? '#334155' : '#f1f5f9';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      
      {/* Progress & Workload Report */}
      <div className={`glass-panel rounded-[2rem] p-8 relative overflow-hidden transition-all duration-300 shadow-lg ${isOverloaded ? 'ring-2 ring-rose-100 dark:ring-rose-900' : ''}`}>
        
        <div className="flex justify-between items-start mb-8">
           <div>
              <h3 className="font-bold text-xl text-slate-800 dark:text-white flex items-center gap-2 tracking-tight">
                 Tiến Độ & Workload
                 {isOverloaded && !isAllDone && <span className="animate-pulse text-[10px] font-bold text-rose-500 uppercase tracking-wide px-2 py-0.5 bg-rose-50 rounded-full">Quá tải</span>}
                 {isAllDone && <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wide px-2 py-0.5 bg-emerald-50 rounded-full flex items-center gap-1"><PartyPopper className="w-3 h-3"/> Hoàn tất</span>}
              </h3>
              <p className="text-sm font-medium text-slate-400 mt-1">Đã hoàn thành {completedHours}/{totalHours} giờ</p>
           </div>
           
           <div className={`flex flex-col items-end`}>
              <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold shadow-sm ${isAllDone ? 'bg-emerald-50 text-emerald-600' : (isOverloaded ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-600')}`}>
                 {isAllDone ? <CheckCircle2 className="w-4 h-4"/> : (isOverloaded ? <AlertTriangle className="w-4 h-4"/> : <Activity className="w-4 h-4"/>)}
                 <span>{progressPercentage}% xong</span>
              </div>
           </div>
        </div>

        {/* Modern Progress Bar */}
        <div className="mb-8">
           <div className="w-full h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-1">
             <div 
                className="h-full rounded-full transition-all duration-1000 ease-out shadow-sm" 
                style={{ 
                  width: `${progressPercentage}%`, 
                  backgroundImage: isAllDone 
                    ? `linear-gradient(to right, #34d399, #10b981)`
                    : `linear-gradient(to right, ${theme.palette[0]}, ${theme.palette[1]})`
                }}
             />
           </div>
        </div>

        {isOverloaded && !isAllDone && (
           <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-800/50 rounded-2xl flex gap-3 text-sm text-rose-700 dark:text-rose-300">
             <Info className="w-5 h-5 flex-shrink-0 opacity-80" />
             <p className="font-medium">Khối lượng này vượt quá {OVERLOAD_THRESHOLD}h. Hãy cân nhắc chia nhỏ công việc hoặc dời deadline.</p>
           </div>
        )}
        
        {isAllDone && (
           <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/50 rounded-2xl flex gap-3 text-sm text-emerald-700 dark:text-emerald-300">
             <PartyPopper className="w-5 h-5 flex-shrink-0 opacity-80" />
             <p className="font-medium">Tuyệt vời! Bạn đã hoàn thành tất cả nhiệm vụ trong danh sách.</p>
           </div>
        )}

        <div className="w-full h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={workloadData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
              <XAxis 
                dataKey="name" 
                tick={{ fill: textColor, fontSize: 11, fontWeight: 500 }} 
                axisLine={false} 
                tickLine={false} 
                dy={10}
              />
              <YAxis 
                tick={{ fill: textColor, fontSize: 11, fontWeight: 500 }} 
                axisLine={false} 
                tickLine={false} 
              />
              <Tooltip 
                 cursor={{fill: isDarkMode ? '#334155' : '#f8fafc', opacity: 0.5}}
                 contentStyle={{ 
                   borderRadius: '16px', 
                   border: 'none', 
                   boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                   padding: '16px', 
                   backgroundColor: isDarkMode ? '#1e293b' : '#fff',
                   color: isDarkMode ? '#fff' : '#000'
                 }}
              />
              <Bar 
                dataKey="hours" 
                name="Giờ học" 
                radius={[8, 8, 8, 8]}
                barSize={36}
              >
                {workloadData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.isCompleted ? '#cbd5e1' : (isOverloaded && entry.hours >= 4 ? '#fda4af' : chartColors[index % chartColors.length])}
                    opacity={entry.isCompleted ? 0.3 : 1}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Difficulty Pie Chart */}
      <div className="glass-panel rounded-[2rem] p-8 relative overflow-hidden flex flex-col justify-between shadow-lg">
        <div className="mb-4">
           <h3 className="font-bold text-xl text-slate-800 dark:text-white tracking-tight">Cấu Trúc Độ Khó</h3>
           <p className="text-sm font-medium text-slate-400 mt-1">Tỷ lệ phân bố các mức độ nhiệm vụ</p>
        </div>

        <div className="w-full h-[320px] relative flex-grow">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={difficultyData}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={120}
                paddingAngle={6}
                dataKey="value"
                stroke="none"
                cornerRadius={8}
              >
                {difficultyData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={chartColors[(index + 1) % chartColors.length]}
                    strokeWidth={0}
                  />
                ))}
              </Pie>
              <Tooltip 
                 contentStyle={{ 
                   borderRadius: '16px', 
                   border: 'none', 
                   boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                   backgroundColor: isDarkMode ? '#1e293b' : '#fff'
                 }}
              />
              <Legend 
                 verticalAlign="bottom" 
                 height={36} 
                 iconType="circle"
                 formatter={(value) => <span style={{ color: textColor, fontWeight: 600, fontSize: '12px' }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
          
          {/* Center Text */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-[65%] text-center pointer-events-none">
             <span className="text-5xl font-extrabold block text-slate-800 dark:text-slate-100 tracking-tighter">{tasks.length}</span>
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Môn học</span>
          </div>
        </div>
      </div>

    </div>
  );
};
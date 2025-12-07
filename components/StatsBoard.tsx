import React from 'react';
import { StudyTask, DifficultyLevel } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { DIFFICULTY_SCORE } from '../constants';

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

  const axisColor = isDarkMode ? '#94a3b8' : '#94a3b8'; // Slate-400
  const gridColor = isDarkMode ? '#334155' : '#f1f5f9';
  const tooltipBg = isDarkMode ? '#1e293b' : '#ffffff';
  const tooltipText = isDarkMode ? '#f8fafc' : '#1e293b';

  // Use the pastel palette from the theme
  const chartColors = theme.palette;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Workload Chart */}
      <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-lg shadow-slate-200/50 dark:shadow-black/20 border border-white dark:border-slate-700 flex flex-col relative overflow-hidden group">
        <div className="p-8 flex flex-col h-full">
          <div className="flex justify-between items-start mb-8">
             <div>
                <h4 className="text-slate-800 dark:text-slate-100 font-extrabold text-lg tracking-tight">Khối Lượng Công Việc</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Phân bổ giờ học (Ước tính)</p>
             </div>
             <div className="bg-slate-50 dark:bg-slate-700 px-4 py-2 rounded-2xl text-slate-700 dark:text-slate-200 font-bold text-sm shadow-sm border border-slate-100 dark:border-slate-600">
                <span className="text-base mr-1" style={{ color: theme.palette[1] }}>{totalHours}</span> giờ
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
                      fill={chartColors[index % 4]} 
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
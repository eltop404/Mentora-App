import React, { useState, useEffect, useMemo } from 'react';
import { StorageLayer, DB } from '../../services/db';
import { Student } from '../../types';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Clock, BookOpen, Lock, Activity, ArrowRight, ShieldCheck, Play, Award, Zap, Database } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  user: Student;
  theme: any;
  onBack: () => void;
  premiumUnlocked: boolean;
  onUnlockPremium: () => void;
}

export default function ControlDashboard({ user, theme, onBack, premiumUnlocked: _premiumProp, onUnlockPremium }: Props) {
  const [studyLogs, setStudyLogs] = useState<{ [date: string]: { activeSeconds: number, lessonSeconds: number } }>({});
  const [completedLessonsCount, setCompletedLessonsCount] = useState(0);

  useEffect(() => {
    if (user) {
      setStudyLogs(DB.getStudyTimeLogs(user.id));
      setCompletedLessonsCount(DB.getCompletedLessons(user.id).length);
    }
  }, [user]);

  const PRIMARY = theme?.primary || '#ffd700';

  const chartData = useMemo(() => {
    const dates = Object.keys(studyLogs).sort();
    // Get last 7 days
    const last7Days = dates.slice(-7);
    return last7Days.map(date => {
      const dayName = new Date(date).toLocaleDateString('ar-EG', { weekday: 'short' });
      const hours = (studyLogs[date]?.activeSeconds || 0) / 3600;
      return {
        date,
        day: dayName,
        hours: Number(hours.toFixed(1))
      };
    });
  }, [studyLogs]);

  const totalStudySeconds = Object.values(studyLogs).reduce((acc, curr) => acc + (curr.activeSeconds || 0), 0);
  const totalStudyHours = Math.floor(totalStudySeconds / 3600);
  const todayStr = new Date().toISOString().split('T')[0];
  const todayStudySeconds = studyLogs[todayStr]?.activeSeconds || 0;
  const todayStudyHours = Math.floor(todayStudySeconds / 3600);
  const todayStudyMins = Math.floor((todayStudySeconds % 3600) / 60);

  // Example Pie Chart Data (Mocked based on generic structure, adjust as needed)
  const pieData = [
    { name: 'مكتمل', value: completedLessonsCount },
    { name: 'جاري', value: 3 },
    { name: 'لم يبدأ', value: 10 }
  ];
  const COLORS = [PRIMARY, '#22c55e', '#ef4444'];

  const progressPercentage = Math.min(100, Math.floor((completedLessonsCount / (completedLessonsCount + 13)) * 100)) || 0;

  // Preview mode: always show all sections
  const premiumUnlocked = true;

  return (
    <div className="flex flex-col w-full h-full text-white pb-24 overflow-y-auto custom-scrollbar" dir="rtl">
      {/* Top Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <div className="bg-white/[0.02] rounded-2xl p-3 flex flex-col justify-between transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-[10px] font-bold">رصيد الكوينز</span>
            <Database size={14} style={{ color: PRIMARY }} />
          </div>
          <div className="text-lg md:text-xl font-black text-white">{user?.coins || 0} عملة</div>
        </div>
        <div className="bg-white/[0.02] rounded-2xl p-3 flex flex-col justify-between transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-[10px] font-bold">وقت المذاكرة الكلي</span>
            <Clock size={14} className="text-blue-400" />
          </div>
          <div className="text-lg md:text-xl font-black text-white">{totalStudyHours} ساعة</div>
        </div>
        <div className="bg-white/[0.02] rounded-2xl p-3 flex flex-col justify-between transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-[10px] font-bold">مذاكرة اليوم</span>
            <Clock size={14} className="text-green-400" />
          </div>
          <div className="text-sm md:text-lg font-black text-white">
            {todayStudyHours > 0 && `${todayStudyHours} س `}{todayStudyMins} د
          </div>
        </div>
        <div className="bg-white/[0.02] rounded-2xl p-3 flex flex-col justify-between transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-[10px] font-bold">نسبة التقدم</span>
            <Award size={14} style={{ color: PRIMARY }} />
          </div>
          <div className="text-lg md:text-xl font-black text-white">{progressPercentage}%</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
        {/* Progress Ring */}
        <div className="bg-white/[0.02] rounded-2xl p-4 flex flex-col items-center justify-center relative overflow-hidden">
          <h3 className="text-xs font-bold text-gray-300 w-full text-right mb-4">نسبة التقدم الإجمالية</h3>
          <div className="relative w-32 h-32 flex flex-col items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#333" strokeWidth="8" />
              <motion.circle
                cx="50" cy="50" r="40" fill="none"
                stroke={PRIMARY}
                strokeWidth="8"
                strokeDasharray="251.2"
                strokeDashoffset={251.2 - (251.2 * progressPercentage) / 100}
                strokeLinecap="round"
                initial={{ strokeDashoffset: 251.2 }}
                animate={{ strokeDashoffset: 251.2 - (251.2 * progressPercentage) / 100 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                style={{ filter: `drop-shadow(0 0 8px ${PRIMARY}60)` }}
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-2xl font-black">{progressPercentage}%</span>
            </div>
          </div>
          <p className="text-[10px] text-gray-400 mt-2 text-center">أكمل {100 - progressPercentage}% للوصول للهدف.</p>
        </div>

        {/* Subscription / Premium Block */}
        <div className="bg-white/[0.02] rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 blur-[60px] opacity-20 pointer-events-none" style={{ background: PRIMARY }} />
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm md:text-base font-black" style={{ color: PRIMARY }}>حالة الاشتراك</h3>
              {premiumUnlocked ? (
                <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 text-[9px] font-bold">Premium النشط</span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-gray-500/10 text-gray-400 text-[9px] font-bold">الحساب المجاني</span>
              )}
            </div>
            
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-xs text-gray-300">
                <ShieldCheck size={14} className={premiumUnlocked ? "text-green-400" : "text-gray-500"} />
                <span>تحليلات متقدمة</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-300">
                <Play size={14} className={premiumUnlocked ? "text-green-400" : "text-gray-500"} />
                <span>تقارير مفصلة</span>
              </div>
            </div>
          </div>
          
          {!premiumUnlocked && (
            <button
              onClick={onUnlockPremium}
              className="w-full py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
              style={{ background: `linear-gradient(90deg, ${PRIMARY}10, ${PRIMARY}20)`, color: PRIMARY }}
            >
              <Lock size={14} />
              فتح التحليلات الاحترافية
            </button>
          )}
        </div>
      </div>

      {/* Advanced Analytics (Locked behind premium) */}
      <div className={`relative ${!premiumUnlocked ? 'opacity-50 pointer-events-none blur-[2px]' : ''} transition-all duration-500`}>
        {!premiumUnlocked && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/40 rounded-2xl backdrop-blur-sm">
            <Lock size={32} style={{ color: PRIMARY }} className="mb-2 drop-shadow-lg" />
            <span className="text-sm font-bold mb-1">ميزة مقفلة</span>
            <span className="text-[10px] text-gray-300 px-4 text-center">قم بترقية حسابك لفتح الرسوم البيانية.</span>
          </div>
        )}

        <div className="bg-white/[0.02] rounded-2xl p-4 mb-5">
          <h3 className="text-xs font-bold text-gray-300 mb-4 flex items-center gap-2">
            <Activity size={14} style={{ color: PRIMARY }} />
            ساعات المذاكرة الأسبوعية
          </h3>
          <div className="h-48 w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="day" stroke="#666" fontSize={9} tickLine={false} axisLine={false} />
                <YAxis stroke="#666" fontSize={9} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: '8px', fontSize: '10px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Line type="monotone" dataKey="hours" stroke={PRIMARY} strokeWidth={2} dot={{ r: 3, fill: '#000', stroke: PRIMARY, strokeWidth: 2 }} activeDot={{ r: 4, fill: PRIMARY }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white/[0.02] rounded-2xl p-4">
            <h3 className="text-xs font-bold text-gray-300 mb-4 flex items-center gap-2">
              <Zap size={14} style={{ color: PRIMARY }} />
              توزيع الكورسات
            </h3>
            <div className="h-32 w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={35} outerRadius={50} paddingAngle={5} dataKey="value">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: '8px', fontSize: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-3 mt-3 text-[10px] font-bold text-gray-400">
              {pieData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  {entry.name}
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-white/[0.02] rounded-2xl p-4">
            <h3 className="text-xs font-bold text-gray-300 mb-4 flex items-center gap-2">
              <BookOpen size={14} style={{ color: PRIMARY }} />
              عدد الكورسات النشطة
            </h3>
            <div className="h-32 w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pieData} margin={{ left: -25 }}>
                  <XAxis dataKey="name" stroke="#666" fontSize={9} tickLine={false} axisLine={false} />
                  <YAxis stroke="#666" fontSize={9} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: '8px', fontSize: '10px' }} />
                  <Bar dataKey="value" fill={PRIMARY} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

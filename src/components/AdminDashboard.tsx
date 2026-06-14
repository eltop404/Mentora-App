
import React, { useState, useEffect } from 'react';
import {
  LayoutGrid,
  Users, MessageSquare, Bell, Sparkles, FileText,
  LogOut, Trash2, Ban, ShieldAlert, Plus, Save,
  CheckCircle, Search, User, MapPin, Activity,
  Hash, Calendar, Clock, Lock, Unlock, Globe, Monitor, Send, Video,
  Moon, Sun, Languages, Eye, EyeOff, Edit, Trophy, RotateCcw,
  Package, Headset, CheckSquare, Coins, Ticket, Trash, Shield, Type, ListOrdered, FileUp, ShieldCheck, Copy, Play, X, Power,
  Brain, Calculator, Phone, RefreshCw, Menu, Smartphone, Tablet, BarChart2, Fingerprint, PenTool, Star, Book, Download, FileDown,
  TrendingUp, Edit3, ArrowLeft, DollarSign, Layout, CreditCard, Settings
} from 'lucide-react';


import { DB, StorageLayer } from '../services/db';
import { Content, Exam, Question, Student, Survey, SurveyPost, SupportTicket, Booklet, Course, PaymentOrder, Lesson, ExamResult } from '../types';
import { ContentManagement } from './admin/ContentManagement';
import { SectionsManagement } from './admin/SectionsManagement';
import { ExamManagement } from './admin/ExamManagement';

import { BookletManagement } from './admin/BookletManagement';
import { CourseManagement } from './admin/CourseManagement';
import { PaymentManagement } from './admin/PaymentManagement';
import { CouponManagement } from './admin/CouponManagement';
import { RechargeManagement } from './admin/RechargeManagement';
import { PaymentMethodsManagement } from './admin/PaymentMethodsManagement';
import { StudentReports } from './admin/StudentReports';
import { LessonManagement } from './admin/LessonManagement';

import { SupportManagement } from './admin/SupportManagement';
import { RatingsSection } from './admin/RatingsSection';
import { SystemControl } from './admin/SystemControl';
import { BannedPhones } from './admin/BannedPhones';
import { GoldenMembershipAdmin } from './admin/GoldenMembershipAdmin';


import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { supabase, isSupabaseConnected } from '../services/supabaseClient';
import { usePDFExport } from '../utils/pdfExport';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const QuotaCountdown = ({ resetTime }: { resetTime: number }) => {
  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    const update = () => {
      const diff = resetTime - Date.now();
      if (diff <= 0) { setTimeLeft('00:00:00'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    };
    update();
    const itv = setInterval(update, 1000);
    return () => clearInterval(itv);
  }, [resetTime]);
  return <span>{timeLeft}</span>;
};

// Subcomponent for Student Card
const StudentCard: React.FC<{
  student: Student;
  theme: any;
  handleBlockStudent: (s: Student) => void;
  handleDeleteStudent: (id: string, name: string) => void;
  handleBlockIP: (ip: string, name: string) => void;
  setStudents: any;
  handleManagePointsAccess: (s: Student) => void;
  isSubAdmin?: boolean;
}> = ({ student, theme, handleBlockStudent, handleDeleteStudent, handleBlockIP, setStudents, handleManagePointsAccess, isSubAdmin }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [showPackageActions, setShowPackageActions] = useState(false);
  const [passwordValue, setPasswordValue] = useState(student.password);
  const [isCopied, setIsCopied] = useState(false);
  const isOnline = DB.getOnlineStatus(student.id);

  const handleCopyID = (id: string) => {
    navigator.clipboard.writeText(id);
    alert('تم نسخ المعرف بنجاح!');
  };

  const handleUpdatePassword = () => {
    if (!passwordValue.trim()) return;
    DB.updateStudent(student.id, { password: passwordValue });
    setStudents(DB.getStudents());
    setIsEditingPassword(false);
    setShowPassword(true);
    alert('تم تحديث كلمة المرور بنجاح!');
  };




  const handleResetExams = () => {
    if (window.confirm('هل تريد تصفير امتحانات الطالب لإعادتها؟')) {
      DB.updateStudent(student.id, { completedExams: [], achievements: [] });
      setStudents(DB.getStudents());
    }
  };

  const handleResetSheets = () => {
    if (window.confirm('هل تريد تصفير الشيتات التفاعلية لهذا الطالب؟')) {
      DB.updateStudent(student.id, { completedExams: [], achievements: [] });
      setStudents(DB.getStudents());
    }
  };

  return (
    <div className="bg-[#0b141a]/60 border border-white/5 rounded-[2rem] p-4 hover:border-white/20 transition-all group relative overflow-hidden shadow-xl flex flex-col lg:flex-row gap-5 w-full border-t border-t-white/10">

      {/* 1. Profile Side (Left) */}
      <div className="w-full lg:w-fit flex flex-col items-center gap-3 shrink-0 lg:border-l lg:border-white/5 lg:pl-6">
        <div className="relative">
          <div className="p-1 rounded-full border-2 border-white/10 bg-white/5 group-hover:border-primary/50 transition-colors shadow-xl overflow-hidden w-20 h-20 sm:w-24 sm:h-24">
            <img
              src={student.avatarUrl || student.profilePictureUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.username}`}
              className="w-full h-full object-cover"
              alt={student.username}
            />
          </div>
          <div className={cn(
            "absolute top-1 right-1 w-3.5 h-3.5 rounded-full border-2 border-[#0b141a] z-20 shadow-lg transition-all duration-500",
            isOnline ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)] animate-pulse" : "bg-gray-800 border-gray-900 opacity-40"
          )} />
        </div>

        <div className="text-center space-y-0.5">
          <h3 className="text-base font-black text-white flex items-center justify-center gap-1.5">
            {student.username}
            <span className="text-red-500 text-sm">❤️</span>
          </h3>
          <div className="flex flex-col items-center gap-1 mt-0.5">
            <p className="text-[10px] text-gray-400 font-bold">{student.level} | {student.year}</p>
            <div className={cn(
              "flex items-center gap-1 px-2 py-0.5 rounded-full border transition-all duration-500",
              isOnline ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" : "text-red-500 bg-white/5 border-red-500/10 opacity-60"
            )}>
              <div className={cn("w-1 h-1 rounded-full", isOnline ? "bg-emerald-500 animate-pulse" : "bg-red-500")} />
              <span className="text-[8px] font-black uppercase tracking-tighter">
                {isOnline ? 'متصل' : 'غير متصل'}
              </span>
            </div>
          </div>
        </div>

        {/* Current Activity Badge */}
        <div className="w-full bg-primary/5 border border-primary/20 rounded-xl py-2 px-3 flex flex-col items-center gap-0.5" style={{ borderColor: `${theme.primary}20` }}>
          <div className="flex items-center gap-1.5 text-primary font-black text-[9px] uppercase tracking-wider" style={{ color: theme.primary }}>
            <Monitor size={11} />
            <span>يتصفح الوحدات الدراسية</span>
          </div>
        </div>
      </div>

      {/* 2. Technical Details (Center) */}
      <div className="flex-1 flex flex-col gap-4 text-right">
        <div className="space-y-3">
          <div className="flex items-center justify-end gap-3 group/item">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopyID(student.id)}
                className="text-gray-500 hover:text-white transition-colors p-1 hover:bg-white/5 rounded-md"
                title="نسخ ID"
              >
                <Copy size={12} />
              </button>
              <span className="text-[11px] text-white/90 font-mono tracking-tighter bg-white/5 px-3 py-0.5 rounded-lg border border-white/5">{student.id}</span>
            </div>
            <span className="text-xs font-black text-white flex items-center gap-1">ID <Fingerprint size={12} className="text-gray-500" /></span>
          </div>
          <div className="flex items-center justify-end gap-3 group/item">
            <span className="text-[11px] text-gray-400 font-bold bg-white/[0.02] px-3 py-0.5 rounded-lg">{student.regDate || '٠٣/٠٤/٢٠٢٦'}</span>
            <span className="text-xs font-black text-white">تاريخ التسجيل:</span>
          </div>
          <div className="flex items-center justify-end gap-3 group/item">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 bg-white/[0.02] px-3 py-0.5 rounded-lg">
              <span>يتصفح الوحدات الدراسية</span>
              <Smartphone size={10} />
            </div>
            <span className="text-xs font-black text-white">النشاط:</span>
          </div>
          <div className="flex items-center justify-end gap-3 group/item">
            <span className={`text-[11px] text-gray-400 font-mono bg-white/[0.02] px-3 py-0.5 rounded-lg transition-all ${isSubAdmin ? 'blur-sm select-none pointer-events-none' : ''}`}>{student.ip || '156.221.32.0'}</span>
            <span className="text-xs font-black text-white">IP:</span>
          </div>
        </div>

        {/* Password Group */}
        <div className="mt-2 space-y-2">
          <div className="flex items-center justify-end gap-4">
            {isEditingPassword && !isSubAdmin ? (
              <button onClick={handleUpdatePassword} className="flex items-center gap-1.5 text-[10px] font-black text-blue-400 hover:opacity-80 transition-opacity">
                <span>تحديث الآن </span>
                <Save size={12} />
              </button>
            ) : (
              <>
                {!isSubAdmin && (
                  <button onClick={() => setShowPassword(!showPassword)} className="flex items-center gap-1.5 text-[10px] font-black text-primary hover:opacity-80 transition-opacity" style={{ color: theme.primary }}>
                    <span>عرض</span>
                    <Eye size={12} />
                  </button>
                )}
                {isSubAdmin && (
                  <span className="flex items-center gap-1.5 text-[10px] font-black text-gray-600 opacity-30 cursor-not-allowed select-none" title="غير مصرح">
                    <Eye size={12} />
                    <span>عرض</span>
                  </span>
                )}
                {!isSubAdmin && (
                  <button onClick={() => setIsEditingPassword(true)} className="flex items-center gap-1.5 text-[10px] font-black text-emerald-400 hover:opacity-80 transition-opacity">
                    <span>تغيير كلمة المرور</span>
                    <Edit size={12} />
                  </button>
                )}
                {!isSubAdmin ? (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(student.password);
                      setIsCopied(true);
                      setTimeout(() => setIsCopied(false), 2000);
                    }}
                    className="flex items-center gap-1.5 text-[10px] font-black text-amber-500 hover:opacity-80 transition-opacity"
                  >
                    <span>{isCopied ? 'تم النسخ' : 'نسخ'}</span>
                    {isCopied ? <CheckCircle size={12} className="animate-bounce" /> : <Copy size={12} />}
                  </button>
                ) : (
                  <span className="flex items-center gap-1.5 text-[10px] font-black text-gray-600 opacity-30 cursor-not-allowed select-none" title="غير مصرح">
                    <Copy size={12} />
                    <span>نسخ</span>
                  </span>
                )}
              </>
            )}
            <span className="text-xs font-black text-white">كلمة المرور:</span>
          </div>
          <div className="bg-black/40 border border-white/5 rounded-2xl p-3 text-center transition-all hover:border-white/10 group/pass">
            {isEditingPassword ? (
              <input
                type="text"
                value={passwordValue}
                onChange={(e) => setPasswordValue(e.target.value)}
                className="w-full bg-transparent text-center text-sm font-mono tracking-[0.1em] text-white outline-none"
                autoFocus
                placeholder="ادخل كلمة المرور الجديدة"
              />
            ) : (
              <span className="text-sm font-mono tracking-[0.3em] text-white/40 block group-hover/pass:text-white/60 transition-colors">
                {showPassword ? student.password : '⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢'}
              </span>
            )}
          </div>
        </div>

        {/* Province & New Free Access Toggle */}
        <div className="mt-auto pt-4 border-t border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-emerald-500 bg-emerald-500/10 px-4 py-1.5 rounded-full border border-emerald-500/20">{student.location || 'غير محدد'}</span>
            <span className="text-xs font-black text-white">المحافظة</span>
          </div>



          {/* Package Points Tracking - Compact & Chic UI */}
          <div className="space-y-3 bg-white/5 border border-white/5 rounded-[1.5rem] p-4 hover:bg-white/[0.08] transition-all group/stats relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 blur-[40px] rounded-full -mr-12 -mt-12 pointer-events-none opacity-20" />

            <div className="flex items-center justify-between relative z-10">
              <div className="flex flex-col gap-0.5 items-end">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black text-white">{student.plan || 'الباقة المجانية'}</span>
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: student.plan && student.plan !== 'مجانية' ? theme.primary : '#475569', boxShadow: student.plan && student.plan !== 'مجانية' ? `0 0 8px ${theme.primary}` : 'none' }} />
                </div>
                <span className="text-[7px] font-bold text-gray-500 uppercase tracking-widest">Enrollment</span>
              </div>
              <Sparkles size={14} style={{ color: student.plan && student.plan !== 'مجانية' ? theme.primary : '#475569' }} />
            </div>

            <div className="space-y-2 relative z-10">
              {(() => {
                const tp = student.plan === 'الباقة الأساسية' ? 2500 : student.plan === 'الباقة الذهبية' ? 5000 : student.plan === 'الباقة البلاتينية' ? 7500 : 0;
                const cp = student.points || 0;
                const pct = tp > 0 ? (cp / tp) * 100 : 0;
                return (
                  <>
                    <div className="flex items-center justify-between text-[9px] font-black font-mono">
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-500 tabular-nums">/ {tp.toLocaleString()}</span>
                        <span style={{ color: theme.primary }} className="text-xs">{cp.toLocaleString()}</span>
                      </div>
                      <span className="text-gray-500 uppercase tracking-tighter">Points</span>
                    </div>
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full transition-all duration-1000 ease-out" style={{ backgroundColor: theme.primary, width: `${Math.min(100, Math.max(0, pct))}%` }} />
                    </div>
                  </>
                );
              })()}
              <div className="flex items-center justify-between pt-0.5">
                <span className="text-[8px] font-black text-gray-500 bg-white/5 px-1.5 py-0.5 rounded-md border border-white/5">{student.plan && student.plan !== 'مجانية' ? 'VIP' : 'FREE'}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-black font-mono" style={{ color: theme.primary }}>{student.messageQuota || 0}</span>
                  <span className="text-[7.5px] text-gray-600 font-bold uppercase tracking-tight">Limit</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* 3. Actions Vertical Side (Right) */}
      <div className={cn(
        "w-full lg:w-60 shrink-0 flex flex-col gap-2 lg:border-r lg:border-white/5 lg:pr-8",
        isSubAdmin ? "relative" : ""
      )}>
        {/* Sub-admin lock overlay */}
        {isSubAdmin && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-[2rem] bg-black/30 backdrop-blur-[2px] border border-white/5 pointer-events-none">
            <Lock size={22} className="text-gray-500 opacity-60" />
            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest opacity-60">غير مصرح</span>
          </div>
        )}

        <button
          onClick={() => handleDeleteStudent(student.id, student.username)}
          disabled={isSubAdmin}
          className={cn("text-[11px] font-black transition-colors text-center w-full mb-1", isSubAdmin ? "text-red-500/20 cursor-not-allowed" : "text-red-500/60 hover:text-red-500")}
        >حذف</button>

        <button
          onClick={() => handleBlockStudent(student)}
          disabled={isSubAdmin}
          className={cn(
            "w-full py-3.5 rounded-2xl flex items-center justify-center gap-3 font-black text-xs transition-all shadow-xl",
            isSubAdmin ? "bg-yellow-500/5 text-yellow-500/20 cursor-not-allowed" :
              student.isBlocked ? "bg-yellow-500 text-black translate-y-[-2px] shadow-yellow-500/20" : "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20"
          )}
        >
          <span>{student.isBlocked ? 'إغاء حظر' : 'حظر طاب'}</span>
        </button>

        <button
          onClick={handleResetExams}
          disabled={isSubAdmin}
          className={cn("w-full py-3.5 rounded-2xl border flex items-center justify-center gap-3 font-black text-xs transition-all",
            isSubAdmin ? "bg-cyan-500/5 text-cyan-400/20 border-cyan-500/10 cursor-not-allowed" : "bg-cyan-500/10 text-cyan-400 border-cyan-500/20 hover:bg-cyan-500/20"
          )}
        >
          <span>إعادة الامتحانات </span>
          <RotateCcw size={16} />
        </button>

        <button
          onClick={handleResetSheets}
          disabled={isSubAdmin}
          className={cn("w-full py-3.5 rounded-2xl border flex items-center justify-center gap-3 font-black text-xs transition-all",
            isSubAdmin ? "bg-emerald-500/5 text-emerald-400/20 border-emerald-500/10 cursor-not-allowed" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
          )}
        >
          <span>إعادة الشيتات </span>
          <RotateCcw size={16} />
        </button>

        <button
          onClick={() => handleBlockIP(student.ip || '127.0.0.1', student.username)}
          disabled={isSubAdmin}
          className={cn("w-full py-3.5 rounded-2xl border flex items-center justify-center gap-3 font-black text-xs transition-all",
            isSubAdmin ? "bg-purple-500/5 text-purple-400/20 border-purple-500/10 cursor-not-allowed" : "bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/20"
          )}
        >
          <span>حظر IP</span>
          <Globe size={16} />
        </button>

        <button
          onClick={() => handleManagePointsAccess(student)}
          disabled={isSubAdmin}
          className={cn("w-full py-3.5 rounded-2xl border flex items-center justify-center gap-3 font-black text-xs transition-all text-center",
            isSubAdmin ? "bg-yellow-900/5 text-yellow-600/20 border-yellow-600/10 cursor-not-allowed" : "bg-yellow-900/20 text-yellow-600 border-yellow-600/20 hover:bg-yellow-900/30"
          )}
        >
          <span>المحتوى المفتوح بالنقاط</span>
        </button>
      </div>
    </div>
  );
};




interface AdminDashboardProps {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  surveys: any[];
  setSurveys: React.Dispatch<React.SetStateAction<any[]>>;
  notifications: any[];
  setNotifications: React.Dispatch<React.SetStateAction<any[]>>;
  aiTools: any[];
  setAiTools: React.Dispatch<React.SetStateAction<any[]>>;
  supportTickets: SupportTicket[];
  setSupportTickets: React.Dispatch<React.SetStateAction<SupportTicket[]>>;
  contentList: Content[];
  sectionList: Content[];
  setSectionList: React.Dispatch<React.SetStateAction<Content[]>>;
  setContentList: React.Dispatch<React.SetStateAction<Content[]>>;
  examList: Exam[];
  setExamList: React.Dispatch<React.SetStateAction<Exam[]>>;
  bookletList: Booklet[];
  setBookletList: React.Dispatch<React.SetStateAction<Booklet[]>>;
  courseList: Course[];
  setCourseList: React.Dispatch<React.SetStateAction<Course[]>>;
  lessonList: Lesson[];
  setLessonList: React.Dispatch<React.SetStateAction<Lesson[]>>;
  paymentList: PaymentOrder[];
  setPaymentList: React.Dispatch<React.SetStateAction<PaymentOrder[]>>;
  onLogout: () => void;
  theme: any;
  siteTexts: any;
  setSiteTexts: (val: any) => void;
  appSettings: any;
  setAppSettings: (val: any) => void;
  meetingConfig: any;
  setMeetingConfig: (cfg: any) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  students,
  setStudents,
  surveys,
  setSurveys,
  notifications,
  setNotifications,
  aiTools,
  setAiTools,
  supportTickets,
  setSupportTickets,
  contentList,
  setContentList,
  sectionList,
  setSectionList,
  examList,
  setExamList,
  bookletList,
  setBookletList,
  courseList,
  setCourseList,
  lessonList,
  setLessonList,
  paymentList,
  setPaymentList,
  onLogout,
  theme,
  siteTexts,
  setSiteTexts,
  appSettings,
  setAppSettings,
  meetingConfig,
  setMeetingConfig
}) => {
  const { generatePDF } = usePDFExport();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [securityLogs, setSecurityLogs] = useState<any[]>([]);

  const subAdminConfig = React.useMemo(() => {
    try {
      const conf = StorageLayer.getItem('nt_admin_config');
      return conf ? JSON.parse(conf) : null;
    } catch { return null; }
  }, []);

  const isolatedStudents = React.useMemo(() => {
    if (!subAdminConfig) return students;
    return (students || []).filter(s =>
      s.year === subAdminConfig.year &&
      s.level === subAdminConfig.stage &&
      (subAdminConfig.specialization === 'الكل' || !s.specialization || s.specialization === subAdminConfig.specialization)
    );
  }, [students, subAdminConfig]);

  const isolatedExams = React.useMemo(() => {
    if (!subAdminConfig) return examList;
    return (examList || []).filter(e => e.year === subAdminConfig.year && e.stage === subAdminConfig.stage);
  }, [examList, subAdminConfig]);

  const isolatedContent = React.useMemo(() => {
    if (!subAdminConfig) return contentList;
    return (contentList || []).filter(e => e.year === subAdminConfig.year && e.stage === subAdminConfig.stage);
  }, [contentList, subAdminConfig]);

  const isolatedCourses = React.useMemo(() => {
    if (!subAdminConfig) return courseList;
    return (courseList || []).filter(e => e.year === subAdminConfig.year && e.stage === subAdminConfig.stage);
  }, [courseList, subAdminConfig]);

  const isolatedBooklets = React.useMemo(() => {
    if (!subAdminConfig) return bookletList;
    return (bookletList || []).filter(e => e.year === subAdminConfig.year && e.stage === subAdminConfig.stage);
  }, [bookletList, subAdminConfig]);

  const isolatedLessons = React.useMemo(() => {
    if (!subAdminConfig) return lessonList;
    return (lessonList || []).filter(e => e.year === subAdminConfig.year && e.stage === subAdminConfig.stage);
  }, [lessonList, subAdminConfig]);

  const isolatedSections = React.useMemo(() => {
    if (!subAdminConfig) return sectionList;
    return (sectionList || []).filter(e => e.year === subAdminConfig.year && e.stage === subAdminConfig.stage);
  }, [sectionList, subAdminConfig]);

  useEffect(() => {
    const handleSettingsChange = () => setAppSettings(DB.getSettings());
    window.addEventListener('nt-settings-change', handleSettingsChange);
    return () => window.removeEventListener('nt-settings-change', handleSettingsChange);
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearchTerm = React.useDeferredValue(searchTerm);
  const [levelFilter, setLevelFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [specFilter, setSpecFilter] = useState('all');
  const [semesterFilter, setSemesterFilter] = useState('all');
  const [visibleStudents, setVisibleStudents] = useState(50);

  const [visibleActivities, setVisibleActivities] = useState(30);
  const [activeCouponCount, setActiveCouponCount] = useState(0);
  const pendingTicketsCount = (supportTickets || []).filter(t => t.status !== 'responded').length;
  const [hiddenActivityIds, setHiddenActivityIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('nt_hide_acts') || '[]');
    } catch { return []; }
  });

  const handleGlobalDelete = (type: string, id: string) => {
    if (!window.confirm('هل أنت متأكد من الحذف؟')) return;

    if (type === 'content') DB.deleteContent(id);
    else if (type === 'section') DB.deleteSection(id);
    else if (type === 'booklet') DB.deleteBooklet(id);
    else if (type === 'course') DB.deleteCourse(id);
    else if (type === 'lesson') DB.deleteLesson(id);

    // Refresh all lists
    setContentList(DB.getContent());
    setSectionList(DB.getSections());
    setBookletList(DB.getBooklets());
    setCourseList(DB.getCourses());
    setLessonList(DB.getLessons());

    alert('تم حذف المحتوى بنجاح');
  };

  const handleGlobalEdit = (type: string, item: any) => {
    setShowAllContentModal(false);

    // Switch to the correct tab
    if (type === 'content') setActiveTab('content');
    else if (type === 'section') setActiveTab('sections');
    else if (type === 'lesson') setActiveTab('lessons');
    else if (type === 'booklet') setActiveTab('booklets');
    else if (type === 'course') setActiveTab('courses');

    // Dispatch event for the specific tab to handle editing
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent(type === 'section' ? 'nt-admin-force-edit-section' : 'nt-admin-force-edit', {
        detail: { type, item }
      }));
    }, 150);
  };

  useEffect(() => {
    setActiveCouponCount(DB.getCoupons().filter(c => c.isActive).length);
  }, []);

  const [surveyPosts, setSurveyPosts] = useState<SurveyPost[]>(() => DB.getSurveyPosts());
  const [newSurveyTitle, setNewSurveyTitle] = useState('');

  const [showAllContentModal, setShowAllContentModal] = useState(false);
  const [showIncomeDetails, setShowIncomeDetails] = useState(false);
  const [pointsModalStudent, setPointsModalStudent] = useState<Student | null>(null);


  const [replyText, setReplyText] = useState('');
  const [replyingTicketId, setReplyingTicketId] = useState<string | null>(null);

  const [newAiTool, setNewAiTool] = useState({ name: '', url: '', desc: '' });
  const [replyingPostId, setReplyingPostId] = useState<string | null>(null);
  const [previewResult, setPreviewResult] = useState<ExamResult | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const allPublishedContent = React.useMemo(() => {
    return [
      ...(contentList || []).map(c => ({ ...c, _type: 'content', _label: 'وحدة/درس' })),
      ...(bookletList || []).map(b => ({ ...b, _type: 'booklet', _label: 'ملخص' })),
      ...(courseList || []).map(c => ({ ...c, _type: 'course', _label: 'كورس' })),
      ...(lessonList || []).map(l => ({ ...l, _type: 'lesson', _label: 'شرح محاضرة' }))
    ].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
  }, [contentList, bookletList, courseList, lessonList]);

  const stats = React.useMemo(() => {
    const visits = DB.getVisits();
    const totalVisits = (visits || []).reduce((acc: number, v: any) => acc + (v.count || 0), 0);

    const list: any[] = [
      { label: 'إجمالي الطلاب', value: (isolatedStudents || []).filter(s => !s.isDeleted).length, icon: <Users size={24} />, color: '#10b981' },
      { label: 'نتائج الامتحانات', value: (isolatedStudents || []).filter(s => !s.isDeleted).reduce((acc, s) => acc + (s.achievements?.length || 0), 0), icon: <Trophy size={24} />, color: '#f59e0b', action: () => setActiveTab('results') },
      { label: 'المحتوى المنشور', value: ((isolatedContent || []).length + (isolatedBooklets || []).length + (isolatedCourses || []).length + (isolatedLessons || []).length), icon: <Package size={24} />, color: '#3b82f6', action: () => setShowAllContentModal(true) },
    ];

    if (!subAdminConfig) {
      list.splice(1, 0, { label: 'إجمالي الدخل', value: `${(paymentList || []).filter(p => p.status === 'approved' && p.itemType !== 'exam' && p.itemType !== 'chat').reduce((acc, p) => acc + (p.discountedPrice || p.price || 0), 0)} ج.م`, icon: <Coins size={24} />, color: '#fbbf24', action: () => setShowIncomeDetails(true) });
      list.push({ label: 'المدفوعات المعلقة', value: (paymentList || []).filter(p => p.status === 'pending_review').length, icon: <Clock size={24} />, color: '#ef4444', action: () => setActiveTab('payments') });
    }

    return list;
  }, [isolatedStudents, paymentList, isolatedContent, isolatedBooklets, isolatedCourses, isolatedLessons, activeCouponCount, theme, subAdminConfig]);

  const recentActivities = React.useMemo(() => {
    if (subAdminConfig) return [];
    const list = [
      ...(paymentList || []).map(p => ({
        id: p.id,
        type: 'payment',
        title: "New survey post",
        user: p.studentName,
        date: p.date,
        time: p.time,
        status: p.status === 'approved' ? 'مقبول' : p.status === 'pending_review' ? 'قيد المراجعة' : 'مرفوض',
        amount: p.price
      })),
      ...(surveyPosts || []).map(post => ({
        id: post.id,
        type: 'survey',
        title: "New survey post",
        user: post.studentName,
        date: post.date,
        time: post.time,
        status: 'نشط',
        amount: null
      }))
    ].filter(a => !hiddenActivityIds.includes(a.id)).sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
    return list.slice(0, 15);
  }, [paymentList, surveyPosts, hiddenActivityIds, subAdminConfig]);



  const filteredStudents = React.useMemo(() => {
    const getStudentTimestamp = (s: Student): number => {
      if (!s) return 0;
      try {
        const convertToEnglishDigits = (str: string): string =>
          (str || '').replace(/[٠-٩]/g, d => String(d.charCodeAt(0) - 1632));

        const cleanDate = convertToEnglishDigits(s.regDate || '');
        const cleanTime = convertToEnglishDigits(s.regTime || '');

        const dateParts = cleanDate.match(/\d+/g) || [];
        const timeParts = cleanTime.match(/\d+/g) || [];

        if (dateParts.length < 3) return 0;

        let year = 2026, month = 1, day = 1;
        if (dateParts[0].length === 4) {
          year = parseInt(dateParts[0]); month = parseInt(dateParts[1]); day = parseInt(dateParts[2]);
        } else if (dateParts[2]?.length === 4) {
          year = parseInt(dateParts[2]); month = parseInt(dateParts[1]); day = parseInt(dateParts[0]);
        } else {
          year = parseInt(dateParts[0]) || 2026; month = parseInt(dateParts[1]) || 1; day = parseInt(dateParts[2]) || 1;
        }

        let hours = 0, minutes = 0, seconds = 0;
        if (timeParts.length >= 2) {
          hours = parseInt(timeParts[0]) || 0;
          minutes = parseInt(timeParts[1]) || 0;
          seconds = parseInt(timeParts[2]) || 0;

          const isPM = cleanTime.includes('PM') || (s.regTime && (s.regTime.includes('&') || s.regTime.includes('&ساء')));
          const isAM = cleanTime.includes('AM') || (s.regTime && (s.regTime.includes('ص') || s.regTime.includes('صباح')));

          if (isPM && hours < 12) hours += 12;
          else if (isAM && hours === 12) hours = 0;
        }

        return new Date(year, month - 1, day, hours, minutes, seconds).getTime();
      } catch {
        return 0;
      }
    };

    let list = [...(students || [])];
    list.sort((a, b) => {
      const timeA = getStudentTimestamp(a);
      const timeB = getStudentTimestamp(b);
      if (timeA !== timeB) return timeB - timeA;
      // Fallback: reverse insertion order (newest last in array = highest index)
      return (students || []).indexOf(b) - (students || []).indexOf(a);
    });

    return list.filter(s => {
      if (s.isDeleted) return false;
      const matchesSearch = (
        (s?.username || '').toLowerCase().includes((deferredSearchTerm || '').toLowerCase()) ||
        (s?.id || '').toLowerCase().includes((deferredSearchTerm || '').toLowerCase())
      );
      const matchesLevel = subAdminConfig ? s.level === subAdminConfig.stage : (levelFilter === 'all' || s.level === levelFilter);
      const matchesYear = subAdminConfig ? s.year === subAdminConfig.year : (yearFilter === 'all' || s.year === yearFilter);
      const matchesSpec = subAdminConfig ? (subAdminConfig.specialization === 'الكل' || !s.specialization || s.specialization === subAdminConfig.specialization) : (specFilter === 'all' || s.specialization === specFilter);
      const matchesSemester = semesterFilter === 'all' || s.semester === semesterFilter;
      return matchesSearch && matchesLevel && matchesYear && matchesSpec && matchesSemester;
    });
  }, [students, deferredSearchTerm, levelFilter, yearFilter, specFilter, semesterFilter, subAdminConfig]);

  const incomeDetails = React.useMemo(() => {
    const approved = (paymentList || []).filter(p => p.status === 'approved');
    return {
      courses: approved.filter(p => p.itemType === 'course').reduce((acc, p) => acc + (p.discountedPrice || p.price || 0), 0),
      ads: approved.filter(p => p.itemType === 'ads_package').reduce((acc, p) => acc + (p.discountedPrice || p.price || 0), 0),
      recharge: approved.filter(p => p.itemType === 'recharge').reduce((acc, p) => acc + (p.discountedPrice || p.price || 0), 0)
    };
  }, [paymentList]);

  const handleBlockStudent = (s: Student) => {
    if (subAdminConfig) return alert("غير مصرح لك بتعديل أو حظر الطلاب");
    if (window.confirm(s.isBlocked ? 'هل تريد إلغاء حظر هذا الطالب؟' : 'هل تريد حظر هذا الطالب من الدخول؟')) {
      DB.updateStudent(s.id, { isBlocked: !s.isBlocked });
      setStudents(DB.getStudents());
    }
  };

  const handleBlockIP = (ip: string, name: string) => {
    if (subAdminConfig) return alert('غير مصرح');
    const settings = DB.getSettings();
    const blockedIPs = settings.blockedIPs || [];
    const isAlreadyBlocked = blockedIPs.includes(ip);

    if (window.confirm(isAlreadyBlocked ? `Unblock IP ${name} (${ip})?` : `Block IP ${name} (${ip})?`)) {
      let newBlocked = [...blockedIPs];
      if (isAlreadyBlocked) {
        newBlocked = newBlocked.filter((x: string) => x !== ip);
      } else {
        newBlocked.push(ip);
      }
      DB.updateSettings({ ...settings, blockedIPs: newBlocked });
      setAppSettings(DB.getSettings());
      alert(isAlreadyBlocked ? 'تم إلغاء حظر الـ IP بنجاح' : 'تم حظر الـ IP بنجاح');
    }
  };

  const handleDeleteStudent = (id: string, name: string) => {
    if (subAdminConfig) return alert("غير مصرح لك بحذف الطلاب");
      if (window.confirm(`تحذير: هل أنت متأكد من حذف الطالب (${name}) نهائياً؟`)) {
      DB.deleteStudent(id);
      setStudents(DB.getStudents());
    }
  };

  const handleSendReply = () => {
    if (!replyText.trim() || !replyingTicketId) return;
    try {
      if (typeof (DB as any).respondToTicket === 'function') {
        (DB as any).respondToTicket(replyingTicketId, replyText.trim());
      } else if (typeof (DB as any).replyToTicket === 'function') {
        (DB as any).replyToTicket(replyingTicketId, replyText.trim());
      } else {
        // Fallback: update ticket directly
        const tickets = DB.getTickets();
        const idx = tickets.findIndex(t => t.id === replyingTicketId);
        if (idx !== -1) {
          tickets[idx] = { ...tickets[idx], status: 'responded', response: replyText.trim(), responseDate: new Date().toLocaleDateString('ar-EG') };
          DB.saveTickets(tickets);
        }
      }
    } catch (e) { console.error('Reply error:', e); }
    setSupportTickets(DB.getTickets());
    setReplyText('');
    setReplyingTicketId(null);
    alert('تم إرسال الرد بنجاح');
  };

  const handleDeleteTicket = (id: string) => {
    if (window.confirm('هل أنت متأكد من الحذف؟')) {
      DB.deleteTicket(id);
      setSupportTickets(DB.getTickets());
    }
  };

  const handleAddAiTool = () => {
    if (!newAiTool.name || !newAiTool.url) return alert('يرجى ملء الاسم والرابط');
    DB.addAiTool({ ...newAiTool, id: Date.now().toString(), icon: 'Sparkles' });
    setAiTools(DB.getAiTools());
    setNewAiTool({ name: '', url: '', desc: '' });
    alert('تم إضافة أداة الذكاء الاصطناعي بنجاح');
  };

  const handleDeleteAiTool = (id: string) => {
    if (window.confirm('هل أنت متأكد من الحذف؟')) {
      DB.deleteAiTool(id);
      setAiTools(DB.getAiTools());
    }
  };

  const handleDeleteAchievement = (studentId: string, achievementId: string) => {
    if (window.confirm('هل أنت متأكد من الحذف؟')) {
      const student = students.find(s => s.id === studentId);
      if (student) {
        const newAchievements = (student.achievements || []).filter(a => a.id !== achievementId);
        DB.updateStudent(studentId, { achievements: newAchievements });
        setStudents(DB.getStudents());
      }
    }
  };

  const handleDeleteAllSurveyPosts = () => {
    if (window.confirm('هل أنت متأكد من الحذف؟')) {
      (surveyPosts || []).forEach(post => DB.deleteSurveyPost(post.id));
      setSurveyPosts([]);
      alert('تم إفراغ ساحة النقاش بنجاح');
    }
  };

  const handleDeleteAllTickets = () => {
    if (window.confirm('هل أنت متأكد من الحذف؟')) {
      (supportTickets || []).forEach(t => DB.deleteTicket(t.id));
      setSupportTickets([]);
      alert('تم & إفراغ س& الدعم الفني بنجاح');
    }
  };

  const handleDeleteAllAchievements = () => {
    if (window.confirm('هل أنت متأكد من الحذف؟')) {
      (students || []).forEach(s => {
        if (s.achievements && s.achievements.length > 0) {
          DB.updateStudent(s.id, { achievements: [] });
        }
      });
      setStudents(DB.getStudents());
      alert('تم مسح كافة سجلات النتائج بنجاح');
    }
  };

  const handleSendSurveyReply = () => {
    if (!replyText.trim() || !replyingPostId) return;
    const post = surveyPosts.find(p => p.id === replyingPostId);
    if (post) {
      DB.updateSurveyPost(replyingPostId, {
        adminReply: replyText.trim(),
        adminReplyDate: new Date().toLocaleDateString('ar-EG'),
        adminReplyTime: new Date().toLocaleTimeString('ar-EG'),
      });
      setSurveyPosts(DB.getSurveyPosts());
      setReplyText('');
      setReplyingPostId(null);
      alert('تم إرسال الرد على الطالب بنجاح');
    }
  };

  const handleDownloadReportPDF = async (result: ExamResult) => {
    const firstName = result.studentName.split(' ')[0];
    const fileName = " تم `جة_" + firstName;

    await generatePDF('achievement-report-content', fileName, {
      scale: 2,
      onStart: () => setIsDownloading(true),
      onSuccess: () => setIsDownloading(false),
      onError: (err: any) => {
        setIsDownloading(false);
        const errorMsg = err?.message || 'خطأ في معالجة الألوان أو الرسوماتم ';
        alert("عذراً، فشل تصدير التقرير: " + errorMsg + "\nيرجى التأكد من تحديث المتصفحديثة.");
      }
    });
  };

  const handleDeleteSurvey = (id: string) => {
    if (window.confirm('هل أنت متأكد من الحذف؟')) {
      DB.deleteSurveyPost(id);
      setSurveyPosts(DB.getSurveyPosts());
    }
  };

  const handleSaveTexts = (e: React.FormEvent) => {
    e.preventDefault();
    DB.saveSiteTexts(siteTexts);
    alert('تم حفظ النصوص بنجاح');
  };

  const getToolIcon = (name: string, size = 18) => {
    switch (name) {
      case 'MessageSquare': return <MessageSquare size={size} />;
      case 'Brain': return <Brain size={size} />;
      case 'Sparkles': return <Sparkles size={size} />;
      case 'Languages': return <Languages size={size} />;
      case 'Calculator': return <Calculator size={size} />;
      default: return <Sparkles size={size} />;
    }
  };

  const handleSendNotif = (e: React.FormEvent) => {
    e.preventDefault();
    const data = (e.target as any);
    const title = data.elements[2].value;
    const msg = data.elements[3].value;
    const target = data.elements[0].value;
    const studentId = target === 'student' ? data.elements[1].value : undefined;

    if (!title || !msg) return alert('يرجى ملء البياناتم ');

    DB.addNotification({
      id: Date.now().toString(),
      title,
      message: msg,
      date: new Date().toLocaleDateString('ar-EG'),
      target,
      studentId
    });
    setNotifications(DB.getNotifications());
    alert('تم & إرسا اإشعالمرور بنجاح');
    data.reset();
  };


  return (
    <div className="relative flex h-[100dvh] text-white overflow-hidden font-sans dir-rtl select-none bg-[#02040a]" dir="rtl">
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="fixed top-4 left-4 z-[60] lg:hidden p-3 bg-slate-900 border border-white/10 rounded-2xl text-white shadow-2xl active:scale-90 transition-transform"
        style={{ color: theme.primary, borderColor: `${theme.primary}30` }}
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <div className="absolute inset-0 bg-gradient-to-br from-[#020617]/50 via-transparent to-[#020617]/50 pointer-events-none" />

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 right-0 z-[55] w-64 bg-[#020617]/40 border-l border-white/5 p-5 flex flex-col transition-transform duration-500 lg:fixed lg:translate-x-0 shadow-2xl overflow-y-auto no-scrollbar",
        isMobileMenuOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
      )}>
        <div className="flex flex-col items-center mb-8 mt-4 relative">
          <div className="mb-4">
            <div className="w-16 h-16 rounded-full border-2 border-white/10 shadow-2xl p-1 bg-white/5 overflow-hidden flex items-center justify-center">
              <div className="w-full h-full shrink-0 overflow-hidden flex items-center justify-center rounded-full" title="Mentora">
                <img src="https://i.postimg.cc/4NP62dYC/IMG-20260420-WA0023-2.jpg" className="w-full h-full object-cover" alt="Mentora Logo" onError={(e) => { (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=NT&background=5a189a&color=fff'; }} />
              </div>
            </div>
          </div>
          <div className="text-center group cursor-default">
            <h2 className="text-xl font-black text-white tracking-widest uppercase mb-0.5" style={{ color: theme.primary }}>لوحة المعلومات</h2>
            <p className="text-[10px] text-gray-500 font-black tracking-[0.2em] uppercase opacity-70">ADMIN MANAGEMENT</p>
          </div>
        </div>


        <nav className="flex-1 space-y-6 pb-10">
          {[
            {
              group: 'نظرة عامة',
              items: [
                { id: 'dashboard', label: 'لوحة المعلومات', icon: <Monitor size={18} /> },
                { id: 'students', label: 'إدارة الطلاب', icon: <Users size={18} /> },
                { id: 'student_reports', label: 'تقارير الطلاب', icon: <TrendingUp size={18} /> },
                { id: 'banned_phones', label: 'الهواتف المحظورة', icon: <Smartphone size={18} /> },
              ]
            },
            {
              group: 'المحتوى التعليمي',
              items: [
                { id: 'content', label: 'إدارة المحتوى', icon: <Layout size={18} /> },
                { id: 'sections', label: 'إدارة السكاشن', icon: <LayoutGrid size={18} /> },
                { id: 'exams_manage', label: 'إدارة الامتحانات', icon: <Edit3 size={18} /> },
                { id: 'booklets', label: 'إدارة الملخصات', icon: <Book size={18} /> },
                { id: 'courses', label: 'إدارة الكورسات', icon: <Video size={18} /> },
                { id: 'lessons', label: 'إدارة الشرح', icon: <FileText size={18} /> },
              ]
            },
            {
              group: 'المالية والمدفوعات',
              items: [
                { id: 'payments', label: 'المدفوعات', icon: <DollarSign size={18} /> },
                { id: 'payment_methods', label: 'طرق الدفع', icon: <CreditCard size={18} /> },
                { id: 'recharge', label: 'باقات الشحن', icon: <Package size={18} /> },
                { id: 'coupons', label: 'الأكواد', icon: <Ticket size={18} /> },
                { id: 'golden_membership', label: 'العضوية الذهبية', icon: <Star size={18} className="fill-yellow-400 text-yellow-400" /> },
              ]
            },
            {
              group: 'التفاعل والدعم',
              items: [
                { id: 'notifications', label: 'الإشعارات', icon: <Bell size={18} /> },
                { id: 'support', label: 'الدعم الفني', icon: <Headset size={18} /> },
                { id: 'polls_manage', label: 'ساحة النقاش', icon: <ListOrdered size={18} /> },
                { id: 'ratings', label: 'التقييمات', icon: <Star size={18} /> },
              ]
            },
            {
              group: 'الخصائص الإضافية',
              items: [
                { id: 'meeting', label: 'البث المباشر', icon: <Play size={18} /> },
                { id: 'aitools', label: 'أدوات الذكاء', icon: <Brain size={18} /> },
                { id: 'results', label: 'نتائج الامتحانات', icon: <Trophy size={18} /> },
                { id: 'texts', label: 'نصوص الموقع', icon: <Type size={18} /> },
                { id: 'admin_management', label: 'حالات التحكم', icon: <ShieldCheck size={18} /> },
                { id: 'screen_lock', label: 'حماية المنصة', icon: <Lock size={18} /> },
                { id: 'system_control', label: 'لوحة التحكم', icon: <Settings size={18} /> },
              ]
            }
          ].map(section => ({
            ...section,
            items: section.items.filter(item => {
              if (!subAdminConfig) return true;
              return ['dashboard', 'students', 'student_reports', 'content', 'sections', 'exams_manage', 'booklets', 'courses', 'lessons', 'results'].includes(item.id);
            })
          })).filter(section => section.items.length > 0).map((section, sidx) => (
            <div key={sidx} className="space-y-1.5">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-4 mb-2 opacity-40 border-r-2 border-primary/30 mr-2" style={{ borderColor: theme.primary }}>{section.group}</h3>
              {section.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
                  className={cn(
                    "w-full flex items-center justify-between p-2.5 rounded-xl transition-all duration-300 group relative overflow-hidden",
                    activeTab === item.id ? "bg-white text-black shadow-lg shadow-primary/20 scale-[1.02]" : "text-gray-400 hover:text-white hover:bg-white/5"
                  )}
                  style={activeTab === item.id ? { backgroundColor: theme.primary } : {}}
                >
                  <span className="flex items-center gap-2.5 relative z-10 font-black text-sm uppercase tracking-tight">
                    <span className={cn("transition-transform duration-500", activeTab === item.id ? "scale-105" : "group-hover:scale-105")}>{item.icon}</span>
                    <span className="flex items-center gap-2">
                      {item.label}
                      {item.id === 'payments' && (paymentList || []).filter(p => p.status === 'pending_review').length > 0 && (
                        <span className="px-1.5 py-0.5 rounded-md bg-amber-500 text-black text-[8px] font-black shadow-lg shadow-amber-500/20 tabular-nums">
                          {(paymentList || []).filter(p => p.status === 'pending_review').length}
                        </span>
                      )}
                      {item.id === 'polls_manage' && (surveyPosts || []).filter(p => p.studentId !== 'admin' && !p.adminReply).length > 0 && (
                        <span className="px-1.5 py-0.5 rounded-md bg-blue-500 text-white text-[8px] font-black shadow-lg shadow-blue-500/20 tabular-nums">
                          {(surveyPosts || []).filter(p => p.studentId !== 'admin' && !p.adminReply).length}
                        </span>
                      )}
                      {item.id === 'support' && activeTab !== 'support' && pendingTicketsCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-md bg-red-500 text-white text-[8px] font-black animate-pulse shadow-lg shadow-red-500/20 tabular-nums">
                          {pendingTicketsCount}
                        </span>
                      )}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          ))}
        </nav>


        <button
          onClick={onLogout}
          className="mt-8 mb-4 w-full flex-shrink-0 py-3.5 bg-slate-900/50 border-[3px] rounded-2xl font-black text-lg transition-all hover:bg-red-500/10 flex items-center justify-center gap-3 active:scale-95 shadow-xl"
          style={{ borderColor: theme.primary, color: theme.primary }}
        >
          <LogOut size={20} />
          <span>خروج</span>
        </button>
      </aside>

      <main className="relative z-10 flex-1 w-full lg:w-[calc(100%-16rem)] lg:mr-64 p-4 sm:p-5 md:p-6 lg:p-8 overflow-y-auto no-scrollbar bg-[#02040a] border border-white/5 rounded-tl-[3xl]" style={{ scrollBehavior: 'smooth' }}>


        <div className="absolute top-0 right-0 w-[500px] h-[500px] blur-[150px] rounded-full pointer-events-none opacity-20" style={{ backgroundColor: theme.primary }} />

        <div className="w-full h-full relative">
          {activeTab === 'student_reports' && (
            <StudentReports students={students} paymentList={paymentList} courseList={courseList} theme={theme} />
          )}
          {activeTab === 'banned_phones' && (
            <BannedPhones students={students} theme={theme} appSettings={appSettings} setAppSettings={setAppSettings} />
          )}

          {activeTab === 'system_control' && (
            <SystemControl appSettings={appSettings} setAppSettings={setAppSettings} theme={theme} />
          )}
          {activeTab === 'ratings' && (
            <RatingsSection />
          )}

          {showIncomeDetails && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/40" onClick={() => setShowIncomeDetails(false)} />
              <div className="relative w-full max-w-lg bg-[#0b141a] border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                  <button onClick={() => setShowIncomeDetails(false)} className="p-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl transition-colors"><X size={20} /></button>
                  <h2 className="text-2xl font-black text-emerald-500 flex items-center gap-2">تفاصيل الدخل <Coins size={24} /></h2>
                </div>
                <div className="p-6 space-y-4">
                  {[
                    { l: 'دخل الكورسات ', v: incomeDetails.courses, c: '#3b82f6', i: <Video size={20} /> },
                    { l: 'دخل الإعلانات ', v: incomeDetails.ads, c: '#eab308', i: <Star size={20} /> },
                    { l: 'دخل باقات الشحن', v: incomeDetails.recharge, c: '#14b8a6', i: <Coins size={20} /> }
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                      <div className="font-black text-xl text-white">{item.v} ج.م</div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-gray-300">{item.l}</span>
                        <div className="p-2 rounded-xl bg-white/5" style={{ color: item.c }}>{item.i}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {showAllContentModal && (
            <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/40 animate-in fade-in duration-300">
              <div className="relative w-full max-w-4xl bg-[#0b141a] border border-white/10 rounded-[3rem] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                  <button onClick={() => setShowAllContentModal(false)} className="p-2.5 bg-white/5 hover:bg-red-500/20 hover:text-red-500 rounded-xl transition-all group">
                    <X size={20} className="text-gray-400 group-hover:text-red-500" />
                  </button>
                  <div className="text-right">
                    <h2 className="text-2xl font-black text-white flex items-center justify-end gap-3">ا&حتم 0 ا& شر <Package size={24} className="text-primary" style={{ color: theme.primary }} /></h2>
                    <p className="text-[10px] text-gray-500 font-bold mt-1">إجمالي العناصر المنشورة: {allPublishedContent.length}</p>
                  </div>
                </div>
                <div className="p-6 sm:p-10 overflow-y-auto space-y-4 no-scrollbar flex-1 bg-gradient-to-b from-transparent to-black/20">
                  {allPublishedContent.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center py-20 opacity-20 grayscale">
                      <Package size={64} className="mb-4" />
                      <p className="text-xl font-black">ا `جد &حتم 0 & شر حاياً</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {allPublishedContent.map((item: any, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-4 p-5 rounded-[2rem] bg-white/[0.03] border border-white/5 hover:border-primary/30 hover:bg-white/[0.05] transition-all group/card shadow-lg">
                          <div className="flex gap-2">
                            <button onClick={() => handleGlobalDelete(item._type, item.id)} className="p-2.5 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-md active:scale-90" title="حذف">
                              <Trash2 size={16} />
                            </button>
                            <button onClick={() => handleGlobalEdit(item._type, item)} className="p-2.5 bg-cyan-500/10 text-cyan-500 rounded-xl hover:bg-cyan-500 hover:text-white transition-all shadow-md active:scale-90" title="تعديل">
                              <Edit size={16} />
                            </button>
                          </div>
                          <div className="text-right flex-1 min-w-0">
                            <h4 className="font-black text-white text-sm truncate group-hover/card:text-primary transition-colors" style={{ '--hover-color': theme.primary } as any}>{item.title}</h4>
                            <div className="flex flex-wrap items-center justify-end gap-1.5 mt-1.5">
                              <span className="px-2 py-0.5 rounded-md bg-white/5 text-[8px] font-black text-gray-500 border border-white/10">{item.stage}</span>
                              <span className="px-2 py-0.5 rounded-md bg-white/5 text-[8px] font-black text-gray-500 border border-white/10">{item.year}</span>
                              <span className="px-2 py-0.5 rounded-md bg-white/5 text-[8px] font-black text-gray-500 border border-white/10">{item.semester}</span>
                              <div className="w-1 h-1 bg-white/10 rounded-full mx-1" />
                              <span className="text-[9px] text-gray-500 font-black flex items-center gap-1 uppercase tracking-widest">{item.date}</span>
                              <span className="px-2 py-0.5 rounded-md bg-white/5 text-[8px] font-black text-primary border border-primary/20" style={{ color: theme.primary }}>{item._label}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="p-4 bg-white/5 text-center border-t border-white/5">
                  <p className="text-[9px] text-gray-600 font-bold italic">ملاحظة: تعديل المحتوى هنا لا يُسجَّل تلقائياً في الأقسام المخصصة - يرجى الحفظ يدوياً.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              {/* Header */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-white/5 pb-8 relative">
                <div className="text-right">
                  <h2 className="text-3xl font-black text-white flex items-center justify-end gap-3 flex-wrap">
                    <span>لوحة المعلومات</span>
                    {subAdminConfig && (
                      <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black border" style={{ color: theme.primary, backgroundColor: `${theme.primary}10`, borderColor: `${theme.primary}30` }}>
                        <span>{subAdminConfig.year}</span>
                        <span className="opacity-50">|</span>
                        <span>{subAdminConfig.stage}</span>
                        <span className="opacity-50">|</span>
                        <span>{subAdminConfig.specialization}</span>
                      </div>
                    )}
                    <div className="p-2 bg-primary/10 rounded-2xl" style={{ color: theme.primary }}>
                      <Monitor size={24} />
                    </div>
                  </h2>
                  <p className="text-gray-500 text-sm font-bold mt-2 pr-12">نظرة عامة على أداء المنصة والإحصاءات العامة</p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="bg-[#0b141a]/40 border border-white/5 rounded-2xl p-4 text-center min-w-[140px] shadow-2xl">
                    <div className="text-[10px] text-gray-500 font-black uppercase mb-1 tracking-widest">تاريخ الدخول</div>
                    <div className="text-lg font-black text-white">{new Date().toLocaleDateString('ar-EG')}</div>
                  </div>
                  <div className="bg-[#0b141a]/40 border border-white/5 rounded-2xl p-4 text-center min-w-[140px] shadow-2xl border-emerald-500/20">
                    <div className="text-[10px] text-gray-500 font-black uppercase mb-1 tracking-widest">إجمالي الطلاب</div>
                    <div className="text-2xl font-black text-emerald-400 flex items-center justify-center gap-2">
                      {(students || []).length}
                      <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                  <div key={i} onClick={(stat as any).action} className={cn(
                    "bg-[#0b141a]/40 p-5 rounded-[2rem] border border-white/5 shadow-2xl group transition-all relative overflow-hidden",
                    (stat as any).action ? 'cursor-pointer hover:border-primary/30 hover:bg-white/5' : ''
                  )}>
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-transparent to-white/[0.02] -z-10" />
                    <div className="flex justify-between items-start">
                      <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 group-hover:scale-110 transition-transform duration-500 shadow-inner" style={{ color: stat.color }}>
                        {stat.icon}
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{stat.label}</div>
                        <div className="text-3xl font-black text-white mt-1.5 tracking-tight">{stat.value}</div>
                      </div>
                    </div>
                    {(stat as any).action && (
                      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-end gap-1.5 text-[9px] font-black text-gray-400 group-hover:text-primary transition-colors">
                        عرض التفاصيل <ArrowLeft size={10} />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Bottom Section: Activities & System Status */}
              <div className={cn("grid grid-cols-1 gap-6", !subAdminConfig ? "lg:grid-cols-[1fr_380px]" : "lg:grid-cols-1")}>

                {/* Last Activities */}
                {!subAdminConfig && (
                  <div className="bg-[#0b141a]/40 border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col h-[500px]">
                    <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                      <button
                        onClick={() => {
                          if (window.confirm('!التراتيبد &سح ْافة النشاطات x')) {
                            const allIds = recentActivities.map((a: any) => a.id);
                            const newHidden = [...new Set([...hiddenActivityIds, ...allIds])];
                            setHiddenActivityIds(newHidden);
                            localStorage.setItem('nt_hide_acts', JSON.stringify(newHidden));
                          }
                        }}
                        className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-lg active:scale-90"
                      >
                        <Trash2 size={16} />
                      </button>
                      <div className="flex items-center gap-2 text-xs font-black text-gray-500 uppercase tracking-widest">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Live Feed
                      </div>
                      <h3 className="text-lg font-black text-white">آخر النشاطات</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
                      {(recentActivities || []).length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-20 grayscale">
                          <Activity size={48} className="mb-4" />
                          <p className="font-bold">لا توجد سجلات حالية</p>
                        </div>
                      ) : (
                        <>
                          {(recentActivities || []).slice(0, visibleActivities).map((act: any) => (
                            <div key={act.id} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.05] transition-colors group flex items-center justify-between gap-4">
                              <button
                                onClick={() => {
                                  const newHidden = [...hiddenActivityIds, act.id];
                                  setHiddenActivityIds(newHidden);
                                  localStorage.setItem('nt_hide_acts', JSON.stringify(newHidden));
                                }}
                                className="p-2 opacity-0 group-hover:opacity-100 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                              >
                                <Trash size={12} />
                              </button>
                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <div className="text-[10px] text-gray-500 font-bold">{act.date} | {act.time}</div>
                                  <div className={cn(
                                    "mt-1 px-2 py-0.5 rounded-md text-[8px] font-black inline-block uppercase tracking-wider",
                                    act.status === 'مقبول' ? "bg-emerald-500/10 text-emerald-500" :
                                      act.status === 'قيد المراجعة' ? "bg-yellow-500/10 text-yellow-500" : "bg-red-500/10 text-red-500"
                                  )}>
                                    {act.status}
                                  </div>
                                </div>
                              </div>
                              <div className="flex-1 min-w-0 text-right">
                                <h4 className="text-xs font-black text-white truncate">{act.title}</h4>
                                <p className="text-[10px] text-gray-500 font-bold mt-0.5">باسطة: {act.user}</p>
                              </div>
                              {act.type === 'payment' ? <DollarSign size={16} /> : <Activity size={16} />}
                            </div>
                          ))}
                          {(recentActivities || []).length > visibleActivities && (
                            <button
                              onClick={() => setVisibleActivities(prev => prev + 30)}
                              className="w-full py-3 bg-white/5 border border-white/5 rounded-xl font-bold text-[10px] text-gray-500 hover:bg-white/10 hover:text-white transition-all"
                            >
                              عرض ا&زيد &  النشاطات 
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}


                {/* System Status & Quick Stats */}
                <div className="space-y-6">

                  {/* Sub-admin: Frameless Curved Area Chart */}
                  {subAdminConfig && (() => {
                    const count = isolatedStudents.filter(s => !s.isDeleted).length;
                    // Generate smooth data points based on student count
                    const seed = count || 1;
                    const pts = [
                      Math.max(1, seed * 0.3),
                      Math.max(1, seed * 0.5),
                      Math.max(1, seed * 0.4),
                      Math.max(1, seed * 0.7),
                      Math.max(1, seed * 0.6),
                      Math.max(1, seed * 0.85),
                      Math.max(1, seed * 0.75),
                      Math.max(1, seed * 0.9),
                      Math.max(1, seed * 0.95),
                      Math.max(1, seed * 1.0),
                    ];
                    const W = 400, H = 120;
                    const maxV = Math.max(...pts);
                    const coords = pts.map((v, i) => ({
                      x: (i / (pts.length - 1)) * W,
                      y: H - (v / maxV) * (H - 16) - 8
                    }));
                    // Build smooth cubic bezier path
                    let d = `M ${coords[0].x},${coords[0].y}`;
                    for (let i = 0; i < coords.length - 1; i++) {
                      const cx = (coords[i].x + coords[i + 1].x) / 2;
                      d += ` C ${cx},${coords[i].y} ${cx},${coords[i + 1].y} ${coords[i + 1].x},${coords[i + 1].y}`;
                    }
                    const fillPath = d + ` L ${W},${H} L 0,${H} Z`;
                    return (
                      <div className="relative px-2 py-4">
                        {/* Labels */}
                        <div className="flex items-center justify-between mb-3 px-1">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: theme.primary }} />
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">نشاط الطلاب</span>
                          </div>
                          <span className="text-lg font-black" style={{ color: theme.primary }}>{count}</span>
                        </div>
                        {/* Frameless SVG chart */}
                        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 100, overflow: 'visible' }}>
                          <defs>
                            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={theme.primary} stopOpacity="0.35" />
                              <stop offset="100%" stopColor={theme.primary} stopOpacity="0.0" />
                            </linearGradient>
                            <filter id="glow">
                              <feGaussianBlur stdDeviation="3" result="blur" />
                              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                            </filter>
                          </defs>
                          {/* Area fill */}
                          <path d={fillPath} fill="url(#chartGrad)" />
                          {/* Line */}
                          <path d={d} fill="none" stroke={theme.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow)" />
                          {/* Dots on peaks */}
                          {coords.map((c, i) => (
                            <circle key={i} cx={c.x} cy={c.y} r={i === coords.length - 1 ? 4 : 2.5} fill={theme.primary} opacity={i === coords.length - 1 ? 1 : 0.5} />
                          ))}
                        </svg>
                        {/* X labels */}
                        <div className="flex justify-between mt-1 px-1">
                          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map(l => (
                            <span key={l} className="text-[8px] text-gray-600 font-bold">{l}</span>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Security Banner  main admin only */}
                  {!subAdminConfig && (
                    <div className="bg-primary/5 border border-primary/20 rounded-[2.5rem] p-8 text-center space-y-6 relative overflow-hidden group shadow-2xl" style={{ borderColor: `${theme.primary}30` }}>
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" style={{ backgroundColor: `${theme.primary}10` }} />
                      <div className="w-20 h-20 bg-primary/20 rounded-[2rem] flex items-center justify-center mx-auto text-primary border border-primary/20 shadow-inner group-hover:scale-110 transition-transform duration-700" style={{ color: theme.primary }}>
                        <ShieldCheck size={40} />
                      </div>
                      <div className="space-y-2 relative z-10">
                        <h3 className="text-2xl font-black text-white">النظام محمي ومستقر</h3>
                        <p className="text-[11px] text-gray-400 font-bold leading-relaxed max-w-[200px] mx-auto uppercase tracking-tighter">قاعدة البيانات محمية بشفرة بالكامل& &ستم خد&` ا& صة</p>
                      </div>
                      <div className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-black rounded-xl font-black text-[10px] tracking-widest cursor-default shadow-lg" style={{ backgroundColor: theme.primary }}>
                        <div className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
                        SYSTEM ONLINE
                      </div>
                    </div>
                  )}
                  {/* Parent Registration Toggle */}
                  {!subAdminConfig && (
                    <div className="bg-primary/5 border border-primary/20 rounded-[2.5rem] p-6 text-center space-y-4 relative overflow-hidden group shadow-xl" style={{ borderColor: `${theme.primary}30` }}>
                      <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto text-primary border border-primary/20 shadow-inner group-hover:scale-110 transition-transform duration-700" style={{ color: theme.primary }}>
                        <Users size={32} />
                      </div>
                      <div className="space-y-1 relative z-10">
                        <h3 className="text-xl font-black text-white">تسجيل أولياء الأمور</h3>
                        <p className="text-[11px] font-black leading-relaxed max-w-[200px] mx-auto" style={{ color: appSettings.isParentRegistrationEnabled ? theme.primary : '#ef4444' }}>
                          {appSettings.isParentRegistrationEnabled ? 'ظاهر في التسجيل' : 'مخفي عن التسجيل'}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          const newState = !appSettings.isParentRegistrationEnabled;
                          DB.updateSettings({ isParentRegistrationEnabled: newState });
                          setAppSettings(DB.getSettings());
                        }}
                        className={cn(
                          "w-full py-3 rounded-xl font-black text-[12px] transition-all flex items-center justify-center gap-2 text-black shadow-lg hover:scale-105"
                        )}
                        style={{ backgroundColor: appSettings.isParentRegistrationEnabled ? '#ef4444' : theme.primary, color: appSettings.isParentRegistrationEnabled ? 'white' : 'black' }}
                      >
                        {appSettings.isParentRegistrationEnabled ? <EyeOff size={16} /> : <Eye size={16} />}
                        {appSettings.isParentRegistrationEnabled ? 'إخفاء القسم' : 'إظهار القسم'}
                      </button>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}








          {activeTab === 'support' && (
            <SupportManagement
              tickets={supportTickets}
              setTickets={setSupportTickets}
              theme={theme}
              onDeleteAll={handleDeleteAllTickets}
            />
          )}

          {activeTab === 'booklets' && <BookletManagement isDarkMode={true} theme={theme} bookletList={isolatedBooklets} setBookletList={setBookletList} />}
          {activeTab === 'courses' && <CourseManagement isDarkMode={true} theme={theme} courseList={isolatedCourses} setCourseList={setCourseList} />}
          {activeTab === 'lessons' && <LessonManagement isDarkMode={true} theme={theme} lessonList={isolatedLessons} setLessonList={setLessonList} />}
          {activeTab === 'payments' && !subAdminConfig && <PaymentManagement paymentList={paymentList} setPaymentList={setPaymentList} />}
          {activeTab === 'payment_methods' && !subAdminConfig && <PaymentMethodsManagement theme={theme} appSettings={appSettings} setAppSettings={setAppSettings} />}
          {activeTab === 'coupons' && !subAdminConfig && <CouponManagement theme={theme} />}
          {activeTab === 'recharge' && !subAdminConfig && <RechargeManagement />}
          {activeTab === 'golden_membership' && !subAdminConfig && <GoldenMembershipAdmin theme={theme} students={students} setStudents={setStudents} />}
          {activeTab === 'content' && <ContentManagement isDarkMode={true} theme={theme} contentList={isolatedContent} setContentList={setContentList} />}
          {activeTab === 'sections' && <SectionsManagement isDarkMode={true} theme={theme} sectionList={isolatedSections} setSectionList={setSectionList} />}
          {activeTab === 'exams_manage' && <ExamManagement isDarkMode={true} theme={theme} examList={isolatedExams} setExamList={setExamList} />}

          {activeTab === 'students' && (
            <div className="space-y-8 text-right">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                {subAdminConfig ? (
                  /* Sub-admin: show static scope badges */
                  <div className="flex items-center gap-2 w-full flex-wrap">
                    <span className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black border" style={{ backgroundColor: `${theme.primary}20`, borderColor: `${theme.primary}40`, color: theme.primary }}>
                      {subAdminConfig.year}
                    </span>
                    <span className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black bg-white/5 border border-white/10 text-gray-300">
                      {subAdminConfig.stage}
                    </span>
                    {subAdminConfig.specialization && subAdminConfig.specialization !== 'الكل' && (
                      <span className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black bg-white/5 border border-white/10 text-gray-300">
                        {subAdminConfig.specialization}
                      </span>
                    )}
                    <input type="text" placeholder="بحث بااس& أ ID..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold flex-1 min-w-[160px] outline-none focus:border-primary/50" />
                  </div>
                ) : (
                  /* Main admin: full filter dropdowns */
                  <div className="flex items-center gap-2 w-full flex-wrap md:flex-nowrap">
                    <select
                      value={yearFilter}
                      onChange={e => setYearFilter(e.target.value)}
                      className={cn("border rounded-xl px-2 py-2 text-xs font-bold outline-none transition-all flex-1 min-w-[100px]", yearFilter !== 'all' ? "text-white" : "bg-white/5 text-gray-400 border-white/10")}
                      style={yearFilter !== 'all' ? { backgroundColor: `${theme.primary}30`, borderColor: theme.primary } : {}}
                    >
                      <option className="bg-[#0b141a] text-white" value="all">ْ افر</option>
                      <option className="bg-[#0b141a] text-white" value="الفرقة الأولى">الفرقة الأولى</option>
                      <option className="bg-[#0b141a] text-white" value="الفرقة الثانية">الفرقة الثانية</option>
                      <option className="bg-[#0b141a] text-white" value="الفرقة الثالثة">الفرقة الثالثة</option>
                      <option className="bg-[#0b141a] text-white" value="الفرقة الرابعة">الفرقة الرابعة</option>
                    </select>
                    <select
                      value={levelFilter}
                      onChange={e => setLevelFilter(e.target.value)}
                      className={cn("border rounded-xl px-2 py-2 text-xs font-bold outline-none transition-all flex-1 min-w-[100px]", levelFilter !== 'all' ? "text-white" : "bg-white/5 text-gray-400 border-white/10")}
                      style={levelFilter !== 'all' ? { backgroundColor: `${theme.primary}30`, borderColor: theme.primary } : {}}
                    >
                      <option className="bg-[#0b141a] text-white" value="all">ْ اشعب</option>
                      <option className="bg-[#0b141a] text-white" value="اعمال دولية IB">اعمال دولية IB</option>
                      <option className="bg-[#0b141a] text-white" value=" ظ& ا&ع&اتم BIS"> ظ& ا&ع&اتم BIS</option>
                    </select>
                    <select
                      value={specFilter}
                      onChange={e => setSpecFilter(e.target.value)}
                      className={cn("border rounded-xl px-2 py-2 text-xs font-bold outline-none transition-all flex-1 min-w-[100px]", specFilter !== 'all' ? "text-white" : "bg-white/5 text-gray-400 border-white/10")}
                      style={specFilter !== 'all' ? { backgroundColor: `${theme.primary}30`, borderColor: theme.primary } : {}}
                    >
                      <option className="bg-[#0b141a] text-white" value="all">ْ اتم خصصاتم </option>
                      <option className="bg-[#0b141a] text-white" value="محاسبة">محاسبة</option>
                      <option className="bg-[#0b141a] text-white" value="تم ✓">تم ✓</option>
                      <option className="bg-[#0b141a] text-white" value=" ظ& ا&ع&اتم "> ظ& ا&ع&اتم </option>
                    </select>
                    <select
                      value={semesterFilter}
                      onChange={e => setSemesterFilter(e.target.value)}
                      className={cn("border rounded-xl px-2 py-2 text-xs font-bold outline-none transition-all flex-1 min-w-[100px]", semesterFilter !== 'all' ? "text-white" : "bg-white/5 text-gray-400 border-white/10")}
                      style={semesterFilter !== 'all' ? { backgroundColor: `${theme.primary}30`, borderColor: theme.primary } : {}}
                    >
                      <option className="bg-[#0b141a] text-white" value="all">ْ افص</option>
                      <option className="bg-[#0b141a] text-white" value="الفصل الدراسي الأول">الفصل الدراسي الأول</option>
                      <option className="bg-[#0b141a] text-white" value="الفصل الدراسي الثاني">الفصل الدراسي الثاني</option>
                    </select>
                    <input type="text" placeholder="بحث بااس& أ ID..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold flex-1 md:w-48 outline-none focus:border-primary/50" />
                  </div>
                )}
                <h2 className="text-2xl font-black">إدارة الطلاب</h2>
              </div>

              <div className="flex flex-col gap-4">
                {filteredStudents.slice(0, visibleStudents).map(s => (
                  <StudentCard key={s.id} student={s} theme={theme} handleBlockStudent={handleBlockStudent} handleDeleteStudent={handleDeleteStudent} handleBlockIP={handleBlockIP} setStudents={setStudents} handleManagePointsAccess={setPointsModalStudent} isSubAdmin={!!subAdminConfig} />
                ))}

                {filteredStudents.length > visibleStudents && (
                  <button
                    onClick={() => setVisibleStudents(prev => prev + 50)}
                    className="w-full py-4 mt-2 bg-white/5 border border-white/5 rounded-2xl font-black text-gray-400 hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2"
                  >
                    <Plus size={16} />
                    عرض ا&زيد &  اطاب
                    <span className="text-[10px] opacity-50">({filteredStudents.length - visibleStudents} &تم ب`)</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {activeTab === 'polls_manage' && (
            <div className="space-y-6 text-right">
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-gray-500 font-bold">إدالمرورة ا اشاتم ااستم طاعاتم اعا&ة</p>
                <h2 className="text-2xl font-black text-white">ساحة النقاش</h2>
              </div>

              {/* Create Poll/Survey Form */}
              <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-6 space-y-4 max-w-2xl ml-auto relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[50px] -z-10" style={{ backgroundColor: `${theme.primary}10` }} />
                <div className="flex items-center justify-end gap-3 mb-2">
                  <div className="text-right">
                    <h3 className="text-sm font-black text-white">إضافة & شر جديد</h3>
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Create New Discussion Post</p>
                  </div>
                  <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20" style={{ color: theme.primary, borderColor: `${theme.primary}20` }}>
                    <Plus size={18} />
                  </div>
                </div>

                <textarea
                  value={newSurveyTitle}
                  onChange={(e) => setNewSurveyTitle(e.target.value)}
                  placeholder="أكتب ردك على الطالب هنا..."
                  className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:border-primary/50 transition-all h-24 no-scrollbar resize-none"
                />

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleDeleteAllSurveyPosts}
                    className="p-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-2xl transition-all border border-red-500/20 active:scale-95 group shadow-lg"
                    title="حذف جميع المنشوراتم "
                  >
                    <Trash2 size={20} className="group-hover:rotate-12 transition-transform" />
                  </button>
                  <button
                    onClick={() => {
                      if (!newSurveyTitle.trim()) return alert('`رجى ْتم ابة  ص ا& شر');
                      const post: SurveyPost = {
                        id: Date.now().toString(),
                        studentId: 'admin',
                        studentName: '❌ إدارة المنصة',
                        content: newSurveyTitle.trim(),
                        date: new Date().toLocaleDateString('ar-EG'),
                        time: new Date().toLocaleTimeString('ar-EG'),
                        level: 'عا&',
                        year: 'جميع المراحل',
                        avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=admin',
                        reactions: { like: 0, love: 0, insightful: 0 },
                        comments: [],
                        replies: []
                      };

                      DB.addSurveyPost(post);
                      setSurveyPosts(DB.getSurveyPosts());
                      setNewSurveyTitle('');
                      alert('تم &  شر ا& شر في ساحة النقاش');
                    }}
                    className="flex-1 py-3 rounded-2xl font-black text-black text-sm shadow-xl active:scale-95 transition-all"
                    style={{ backgroundColor: theme.primary }}
                  >
                     شر اآ  xa
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {(surveyPosts || []).length === 0 ? (
                  <div className="p-20 flex flex-col items-center justify-center opacity-30 text-center grayscale">
                    <ListOrdered size={64} className="mb-4" />
                    <p className="text-xl font-bold">ا تم جد استم طاعاتم في اتم احا`</p>
                  </div>
                ) : (
                  (surveyPosts || []).map(post => (
                    <div key={post.id} className="p-5 bg-white/[0.03] border border-white/5 rounded-[2rem] text-right group hover:bg-white/10 transition-all relative overflow-hidden">
                      {post.studentId === 'admin' && (
                        <div className="absolute top-0 right-0 px-4 py-1.5 bg-primary/20 text-primary text-[8px] font-black rounded-bl-2xl border-b border-l border-primary/20" style={{ color: theme.primary }}>& شر إدالمرور`</div>
                      )}
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleDeleteSurvey(post.id)} className="p-2.5 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all active:scale-95 border border-red-500/10"><Trash2 size={16} /></button>
                          {post.studentId !== 'admin' && !post.adminReply && (
                            <button
                              onClick={() => {
                                setReplyingPostId(post.id);
                                setReplyText('');
                              }}
                              className="px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded-xl hover:bg-emerald-500 hover:text-white transition-all active:scale-95 border border-emerald-500/10 font-bold text-xs flex items-center gap-2"
                            >
                              <MessageSquare size={14} /> ارد عى اطاب
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <h4 className="font-black text-sm text-white">{post.studentName}</h4>
                            <span className="text-[9px] text-gray-500 font-bold">{post.date} | {post.level} - {post.year}</span>
                          </div>
                          <img src={post.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.studentName}`} className="w-10 h-10 rounded-xl border border-white/10" alt="" />
                        </div >
                      </div >
                      <div className="bg-black/30 p-5 rounded-2xl border border-white/5 leading-relaxed text-xs font-bold text-gray-300">
                        {post.content}
                      </div>

                      {
                        post.adminReply && (
                          <div className="mt-4 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl relative">
                            <div className="flex items-center gap-2 mb-2 text-emerald-500">
                              <ShieldCheck size={14} />
                              <span className="text-[10px] font-black uppercase tracking-wider">رد الإدارة</span>
                            </div>
                            <p className="text-xs font-bold text-emerald-200/80 leading-relaxed text-right">{post.adminReply}</p>
                            <div className="mt-2 text-[8px] text-emerald-500/40 font-bold">{post.adminReplyDate} | {post.adminReplyTime}</div>
                          </div>
                        )
                      }
                    </div >
                  ))
                )}
              </div >
            </div >
          )}

          {
            replyingPostId && (
              <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                <div className="relative w-full max-w-lg bg-[#0b141a] border border-white/10 rounded-[2.5rem] p-8 text-right space-y-6 animate-in zoom-in-95">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-emerald-500 border-r-4 border-emerald-500 pr-3">
                      <MessageSquare size={18} />
                      <h2 className="text-xl font-black">ارد عى اطاب</h2>
                    </div>
                    <button onClick={() => setReplyingPostId(null)} className="p-2 bg-white/5 rounded-full hover:bg-red-500/20 hover:text-red-500 transition-colors">
                      <X size={20} />
                    </button>
                  </div>

                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-xs text-gray-400 font-bold italic line-clamp-2">
                    " {surveyPosts.find(p => p.id === replyingPostId)?.content} "
                  </div>

                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-2xl py-4 px-5 text-white outline-none focus:border-emerald-500/50 transition-all h-40 resize-none font-black text-sm placeholder:text-gray-600 no-scrollbar shadow-inner"
                    placeholder="الكلتم ب ردْ ! ا بشْ احتم راف`..."
                  />

                  <div className="flex gap-3">
                    <button
                      onClick={handleSendSurveyReply}
                      className="flex-1 py-4 bg-emerald-500 text-black rounded-2xl font-black text-sm shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <Send size={18} /> إرسا ارد اآ 
                    </button>
                    <button
                      onClick={() => setReplyingPostId(null)}
                      className="px-6 py-4 bg-white/5 text-gray-400 rounded-2xl font-black text-sm hover:bg-white/10 transition-all"
                    >
                      إغاء
                    </button>
                  </div>
                </div>
              </div>
            )
          }


          {
            activeTab === 'notifications' && (
              <div className="space-y-6 text-right pb-20">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => {
                      if (window.confirm('هل تريد مسح كافة الإشعارات المرسلة لجميع الطلاب نهائياً؟')) {
                        DB.deleteAllNotifications();
                        setNotifications([]);
                      }
                    }}
                    className="p-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-2xl transition-all border border-red-500/20 active:scale-95 group shadow-lg"
                    title="مسح كافة الإشعارات"
                  >
                    <Trash2 size={20} className="group-hover:rotate-12 transition-transform" />
                  </button>
                  <div className="flex flex-col items-end">
                    <h2 className="text-3xl font-black text-white">إرسال الإشعارات</h2>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Broadcast Push Notifications</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Form Side */}
                  <div className="lg:col-span-5 space-y-4">
                    <form onSubmit={handleSendNotif} className="glass p-8 rounded-[2.5rem] space-y-5 border border-white/5 relative overflow-hidden shadow-2xl">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 blur-[60px] -z-10" />

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">تحديد المستهدف</label>
                        <select
                          name="targetType"
                          onChange={(e) => {
                            const idInput = (e.currentTarget.form as any).elements['studentId'];
                            if (idInput) {
                              idInput.style.display = e.target.value === 'student' ? 'block' : 'none';
                            }
                          }}
                          className="w-full bg-black/60 border border-white/10 rounded-2xl py-4 px-5 text-white outline-none focus:border-yellow-500/50 transition-all font-black text-sm"
                          style={{ appearance: 'none' }}
                        >
                          <option value="all">الكل (عام)</option>
                          <option value="student">طالب محدد فقط</option>
                        </select>
                      </div>

                      <input
                        name="studentId"
                        type="text"
                        autoComplete="off"
                        placeholder="أدخل ID الطالب هنا..."
                        className="w-full bg-black/60 border border-t border-t-white/10 border-white/5 rounded-2xl py-4 px-5 text-white outline-none focus:border-yellow-500/50 transition-all font-mono text-sm placeholder:text-gray-600 shadow-inner"
                        style={{ display: 'none' }}
                      />

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">عنوان الإشعار</label>
                        <input name="title" type="text" placeholder="عنوان ملفت للنظر..." className="w-full bg-black/60 border border-white/10 rounded-2xl py-4 px-5 text-white outline-none focus:border-yellow-500/50 transition-all font-black text-sm placeholder:text-gray-600" />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">محتوى الإشعار</label>
                        <textarea name="message" placeholder="اكتب رسالتك للطالب..." className="w-full bg-black/60 border border-white/10 rounded-2xl py-4 px-5 text-white outline-none focus:border-yellow-500/50 transition-all h-32 resize-none font-black text-sm placeholder:text-gray-600 no-scrollbar shadow-inner" />
                      </div>

                      <button type="submit" className="w-full py-5 rounded-2xl font-black text-black shadow-2xl hover:brightness-110 active:scale-95 transition-all text-base flex items-center justify-center gap-3 group" style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.primary}dd)`, boxShadow: `0 10px 30px -5px ${theme.primary}60` }}>
                        <span>إرسال الإشعار الآن </span>
                        <Send size={18} className="group-hover:translate-x-[-4px] group-hover:translate-y-[-4px] transition-transform" />
                      </button>
                    </form>
                  </div>

                  {/* History Side */}
                  <div className="lg:col-span-7 flex flex-col gap-4">
                    <div className="flex items-center justify-between px-6">
                      <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Sent Notifications History</p>
                      <h3 className="text-xl font-black text-white">إشعارات سابقة</h3>
                    </div>

                    <div className="space-y-3 overflow-y-auto max-h-[800px] no-scrollbar pr-1">
                      {(notifications || []).length === 0 ? (
                        <div className="p-20 text-center glass rounded-[3rem] border border-white/5 opacity-30 flex flex-col items-center">
                          <Bell size={40} className="mb-4" />
                          <p className="text-sm font-bold">لا توجد إشعارات مرسلة بعد</p>
                        </div>
                      ) : (
                        (notifications || []).map((notif, idx) => (
                          <div key={notif.id || idx} className="p-5 glass rounded-[2rem] border border-white/5 group hover:border-white/20 transition-all flex flex-col gap-2 relative overflow-hidden">
                            <div className="flex items-center justify-between">
                              <button
                                onClick={() => {
                                  if (window.confirm('هل أنت متأكد من الحذف؟')) {
                                    DB.deleteNotification(notif.id);
                                    setNotifications(DB.getNotifications());
                                  }
                                }}
                                className="w-8 h-8 rounded-xl bg-red-500/10 text-red-500 opacity-0 group-hover:opacity-100 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-lg active:scale-90"
                              >
                                <Trash2 size={14} />
                              </button>
                              <div className="text-right">
                                <h4 className="font-black text-sm text-white group-hover:text-yellow-400 transition-colors">{notif.title}</h4>
                                <span className="text-[9px] text-gray-500 font-bold">{notif.date} | {notif.target === 'all' ? 'عام لجميع' : `إى: ${notif.studentId || 'طاب'}`}</span>
                              </div>
                            </div>
                            <p className="text-[11px] text-gray-400 leading-relaxed text-right font-black bg-black/40 p-4 rounded-2xl border border-white/5 line-clamp-2 group-hover:line-clamp-none transition-all">{notif.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          }

          {
            activeTab === 'meeting' && (
              <div className="space-y-6 text-right">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-gray-500 font-bold">بدء وإنهاء الحصص المباشرة للطلاب</p>
                  <h2 className="text-2xl font-black text-white">البث المباشر</h2>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 max-w-2xl ml-auto relative overflow-hidden flex flex-col items-center">
                  <div className={cn(
                    "absolute top-0 right-0 w-full h-1",
                    meetingConfig.isActive ? "bg-red-500 animate-pulse" : "bg-gray-700"
                  )} />

                  <div className={cn(
                    "w-20 h-20 rounded-3xl flex items-center justify-center mb-6 relative",
                    meetingConfig.isActive ? "bg-red-500/10 text-red-500 border-2 border-red-500" : "bg-white/5 text-gray-500 border-2 border-white/10"
                  )}>
                    <Video size={40} />
                    {meetingConfig.isActive && (
                      <div className="absolute -top-3 -right-3 px-2 py-0.5 bg-red-600 text-white text-[8px] font-black rounded-full">LIVE</div>
                    )}
                  </div>

                  <div className="text-center space-y-2 mb-8">
                    <h3 className="text-xl font-black">{meetingConfig.isActive ? 'البث نشط الآن' : 'البث متوقف'}</h3>
                    <p className="text-[11px] text-gray-500">في حالة التفعيل، سيظهر زر الدخول تلقائياً لجميع الطلاب</p>
                  </div>

                  <div className="w-full space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-gray-400 px-2 uppercase tracking-widest">Meeting Link (Zoom / Google Meet)</label>
                      <input
                        type="text"
                        dir="ltr"
                        value={meetingConfig.url || ''}
                        onChange={(e) => setMeetingConfig({ ...meetingConfig, url: e.target.value })}
                        placeholder="https://meet.google.com/..."
                        className="w-full bg-black/40 border border-white/10 rounded-2xl py-3.5 px-5 text-white outline-none focus:border-red-500/50 transition-all font-mono text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => {
                          if (!meetingConfig.url) return alert('يرجى إدخال الرابط أولاً');
                          const newCfg = { ...meetingConfig, isActive: true };
                          setMeetingConfig(newCfg);
                          DB.saveMeetingConfig(newCfg);
                          alert('تم & تم فعي البث المباشر بنجاح');
                        }}
                        className={cn(
                          "py-4 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 active:scale-95",
                          meetingConfig.isActive ? "bg-red-600 text-white shadow-xl shadow-red-600/20" : "bg-white/5 text-gray-400 border border-white/10 hover:bg-red-600 hover:text-white"
                        )}
                      >
                        <Play size={16} /> تفعيل البث
                      </button>
                      <button
                        onClick={() => {
                          const newCfg = { ...meetingConfig, isActive: false };
                          setMeetingConfig(newCfg);
                          DB.saveMeetingConfig(newCfg);
                          alert('تم إلغاء البث المباشر');
                        }}
                        className={cn(
                          "py-4 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 active:scale-95",
                          !meetingConfig.isActive ? "bg-slate-700 text-white" : "bg-white/5 text-red-500 border border-red-500/10 hover:bg-slate-700 hover:text-white"
                        )}
                      >
                        <X size={16} /> إلغاء البث
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          }


          {
            activeTab === 'aitools' && (
              <div className="space-y-6 text-right">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-gray-500 font-bold">توفير أدوات الذكاء الاصطناعي للطلاب</p>
                  <h2 className="text-2xl font-black text-white">أدوات الذكاء الاصطناعي</h2>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-6 space-y-4 max-w-2xl ml-auto relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[50px] -z-10" style={{ backgroundColor: `${theme.primary}10` }} />

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-500 px-1 uppercase">اسم الأداة</label>
                      <input type="text" placeholder="مثال: ChatGPT " value={newAiTool.name} onChange={e => setNewAiTool({ ...newAiTool, name: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white font-bold text-sm outline-none focus:border-primary/50 transition-all" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-500 px-1 uppercase">رابط ادخ</label>
                      <input type="text" placeholder="https://..." value={newAiTool.url} onChange={e => setNewAiTool({ ...newAiTool, url: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white font-mono text-xs outline-none focus:border-primary/50 transition-all" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-500 px-1 uppercase">شرح بسيط للطالب</label>
                    <textarea placeholder="ماذا تفعل هذه الأداة؟" value={newAiTool.desc} onChange={e => setNewAiTool({ ...newAiTool, desc: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 px-4 text-white font-bold h-20 resize-none text-[11px] outline-none focus:border-primary/50 transition-all" />
                  </div>

                  <button onClick={handleAddAiTool} className="w-full py-3.5 rounded-2xl font-black text-black text-sm shadow-xl active:scale-95 transition-all" style={{ backgroundColor: theme.primary }}>
                    إضافة الأداة الذكية
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(aiTools || []).length === 0 ? (
                    <div className="col-span-full py-20 text-center opacity-30 grayscale">
                      <Brain size={64} className="mx-auto mb-4" />
                      <p className="text-xl font-bold">لا توجد أدوات مضافة</p>
                    </div>
                  ) : (
                    aiTools.map(tool => (
                      <div key={tool.id} className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl flex flex-col items-center text-center group hover:bg-white/10 transition-all relative overflow-hidden">
                        <div className="p-3 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-3 border border-primary/20" style={{ color: theme.primary }}>
                          {getToolIcon(tool.icon || 'Brain', 24)}
                        </div>
                        <h4 className="text-base font-black text-white mb-1">{tool.name}</h4>
                        <p className="text-[10px] text-gray-400 font-bold mb-4 line-clamp-2 leading-relaxed">{tool.desc}</p>
                        <div className="flex gap-2 w-full mt-auto">
                          <button onClick={() => handleDeleteAiTool(tool.id)} className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-50 transition-colors"><Trash2 size={14} /></button>
                          <a href={tool.url} target="_blank" rel="noopener noreferrer" className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg font-black text-[10px] flex items-center justify-center gap-1 border border-white/10">زيارة الموقع</a>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          }


          {
            activeTab === 'results' && (
              <div className="space-y-4 text-right pb-20">
                <div className="flex items-center justify-between">
                  <button
                    onClick={handleDeleteAllAchievements}
                    className="p-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-2xl transition-all border border-red-500/20 active:scale-95 group shadow-lg"
                    title="تصفير كافة الحسابات والنتائج"
                  >
                    <Trash2 size={20} className="group-hover:rotate-12 transition-transform" />
                  </button>
                  <div className="flex flex-col items-end">
                    <h2 className="text-2xl font-black text-white px-2"> تقارير نتائج الطلاب</h2>
                    <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-black text-gray-500">
                      إجمالي السجلات: {(students || []).reduce((acc, s) => acc + (s.achievements?.length || 0), 0)}
                    </span>
                  </div>
                </div>

                <div className="overflow-hidden bg-[#020617]/50 rounded-3xl border border-white/5">
                  <table className="w-full text-right border-collapse text-xs">
                    <thead>
                      <tr className="bg-white/5 border-b border-white/10">
                        <th className="p-4 font-black text-gray-400 opacity-60">إجراء</th>
                        <th className="p-4 font-black text-gray-400 opacity-60">تاريخ الإنجاز</th>
                        <th className="p-4 font-black text-gray-400 opacity-60 text-center">ا تم `جة</th>
                        <th className="p-4 font-black text-gray-400 opacity-60 text-center">التقدير</th>
                        <th className="p-4 font-black text-gray-400 opacity-60 text-center">ا&دة</th>
                        <th className="p-4 font-black text-gray-400 opacity-60">الاختبار</th>
                        <th className="p-4 font-black text-gray-400 opacity-60">اطاب</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {(students || []).filter(s => !s.isDeleted && s.achievements?.length).flatMap(student =>
                        (student.achievements || []).map(achievement => (
                          <tr key={achievement.id} className="hover:bg-white/[0.02] transition-colors group">
                            <td className="p-4 w-12">
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                <button
                                  onClick={() => setPreviewResult(achievement)}
                                  className="p-2 bg-blue-500/10 text-blue-500 rounded-xl hover:bg-blue-500 hover:text-white transition-all shadow-lg"
                                  title="معاينة"
                                >
                                  <Eye size={14} />
                                </button>
                                <button
                                  onClick={() => handleDeleteAchievement(student.id, achievement.id)}
                                  className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-lg"
                                  title="حذف"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex flex-col">
                                <span className="text-[10px] text-gray-400 font-bold">{achievement.date}</span>
                                <span className="text-[9px] text-gray-500 opacity-50">{achievement.time}</span>
                              </div>
                            </td>
                            <td className="p-4 text-center">
                              <div className="flex flex-col items-center gap-1">
                                <div className="flex items-center gap-1.5 font-black text-xs">
                                  <span className={cn(achievement.percentage >= 50 ? "text-emerald-500" : "text-red-500")}>
                                    {achievement.score || achievement.percentage}%
                                  </span>
                                  <span className="text-gray-600">/</span>
                                  <span className="text-blue-400 text-[10px]">{achievement.correctAnswers}/{achievement.totalQuestions}</span>
                                </div>
                                <div className="w-16 h-1 bg-white/5 rounded-full overflow-hidden">
                                  <div
                                    className={cn("h-full transition-all", achievement.percentage >= 50 ? "bg-emerald-500" : "bg-red-500")}
                                    style={{ width: `${achievement.percentage}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="p-4 text-center">
                              <span className={cn(
                                "px-3 py-1 rounded-lg font-black text-[10px] border",
                                achievement.grade === 'ممتاز' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                                  achievement.grade === 'جيد جداً' ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                                    achievement.grade === 'جيد' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                                      "bg-red-500/10 text-red-500 border-red-500/20"
                              )}>
                                {achievement.grade || 'غير محدد'}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <div className="flex flex-col items-center">
                                <span className="font-bold text-white text-[11px]">{achievement.durationMinutes || 0} دقيقة</span>
                                <span className="text-[8px] text-gray-500 font-black uppercase tracking-tighter">Duration</span>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex flex-col">
                                <span className="font-black text-white text-[11px] truncate max-w-[150px]">{achievement.examTitle}</span>
                                <span className="text-[9px] text-gray-500 font-bold">{achievement.examType === 'MIXED' ? 'شيتم ' : 'ا&تم حا '}</span>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center justify-end gap-3 pr-2">
                                <div className="flex flex-col text-right">
                                  <span className="font-black text-white text-[12px]">{achievement.studentName || student.username}</span>
                                  <span className="text-[9px] text-gray-500 font-bold">{achievement.year || student.year} - {achievement.stage || student.level}</span>
                                </div>
                                <div className="relative group/avatar">
                                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-md opacity-0 group-hover/avatar:opacity-100 transition-all" style={{ backgroundColor: `${theme.primary}40` }} />
                                  {(achievement.studentPhoto || student.profilePictureUrl || student.avatarUrl) ? (
                                    <img
                                      src={achievement.studentPhoto || student.profilePictureUrl || student.avatarUrl}
                                      className="w-10 h-10 rounded-full border-2 border-white/10 relative z-10 object-cover"
                                      style={{ borderColor: achievement.grade === 'ممتاز' ? theme.primary : 'rgba(255,255,255,0.1)' }}
                                      alt=""
                                    />
                                  ) : (
                                    <div className="w-10 h-10 rounded-full bg-white/5 border-2 border-white/10 flex items-center justify-center relative z-10">
                                      <User size={18} className="text-gray-500" />
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          }

          {
            activeTab === 'screen_lock' && (
              <div className="space-y-6 text-right">
                <h2 className="text-2xl font-black text-white">حماية النظام</h2>
                <div className="bg-[#020617]/50 rounded-3xl border border-white/5 p-8 max-w-xl ml-auto flex flex-col items-center text-center space-y-5">
                  <div className={cn("w-16 h-16 rounded-full flex items-center justify-center text-3xl", appSettings.isPlatformLocked ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-500")}>
                    {appSettings.isPlatformLocked ? <Lock size={32} /> : <Unlock size={32} />}
                  </div>
                  <button onClick={() => { const newState = !appSettings.isPlatformLocked; DB.updateSettings({ isPlatformLocked: newState }); alert(newState ? 'تم الإيقاف' : 'تم & افتم ح'); }} className={cn("w-full py-4 rounded-2xl font-black text-lg transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3", appSettings.isPlatformLocked ? "bg-emerald-500 text-black" : "bg-red-500 text-white")}>
                    <Power size={20} />
                    <span>{appSettings.isPlatformLocked ? 'فتم ح ا& صة' : 'إغلاق المنصة'}</span>
                  </button>
                </div>
              </div>
            )
          }

          {
            activeTab === 'texts' && (
              <div className="space-y-8 text-right pb-20 animate-in fade-in duration-700">
                <div className="flex items-center justify-between border-b border-white/5 pb-6">
                  <button
                    onClick={() => DB.saveSiteTexts(siteTexts)}
                    className="px-8 py-3 bg-emerald-500 text-black font-black rounded-2xl shadow-xl hover:scale-105 transition-all text-sm flex items-center gap-2"
                  >
                    <Save size={18} /> حفظ التغييرات 
                  </button>
                  <div className="text-right">
                    <h2 className="text-3xl font-black text-white"> صص ا& صة اعا&ة</h2>
                    <p className="text-gray-500 text-xs font-bold mt-1">تعديل ْافة اعبالمروراتم ا&صطحاتم في ا&ع</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {/* Section 1: Branding & Hero */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-primary border-r-2 border-primary pr-3 mr-1" style={{ color: theme.primary, borderColor: theme.primary }}>اهشيئة العناوين </h3>
                    {[
                      { key: 'teacherName', label: 'اس& ا&ع&/اأد& ' },
                      { key: 'teacherTitle1', label: 'اصف اأ' },
                      { key: 'teacherTitle2', label: 'اصف اثا `' },
                      { key: 'teacherExperience', label: 'س اتم اخبرة' },
                      { key: 'welcomeTitle', label: 'ع ا  اتم رحيب (ب ادخ)' },
                      { key: 'welcomeSubtitle', label: 'صف اتم رحيب (ب ادخ)' },
                      { key: 'homeTitle', label: 'ع ا  اتم رحيب (داخ ا& صة)' },
                      { key: 'homeSubtitle', label: 'صف اتم رحيب (داخ ا& صة)' },
                      { key: 'headerGreetingAr', label: 'تم حية اأعى (عرب`)' },
                      { key: 'headerGreetingEn', label: 'تم حية اأعى (إ جيز`)' },
                      { key: 'marqueeText', label: ' ص اشريط ا&تم حرْ' },
                    ].map(f => (
                      <div key={f.key} className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase">{f.label}</label>
                        <input type="text" value={(siteTexts as any)[f.key] || ''} onChange={e => setSiteTexts({ ...siteTexts, [f.key]: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl py-2 px-4 text-white hover:border-primary/30 outline-none transition-all text-xs font-bold" />
                      </div>
                    ))}
                  </div>

                  {/* Section 2: Payments & Status */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-emerald-500 border-r-2 border-emerald-500 pr-3 mr-1">المدفوعاتااشتم رالكلاتم </h3>
                    {[
                      { key: 'buyNowButton', label: 'زر الشراء' },
                      { key: 'pendingReviewButton', label: 'زر قيد المراجعة' },
                      { key: 'unlockedButton', label: 'زر &تم اح/تم & اشراء' },
                      { key: 'paymentSuccessTitle', label: 'ع ا  ا جاح' },
                      { key: 'paymentPendingTitle', label: 'ع ا  اقيد المراجعة' },
                      { key: 'paymentSuccessMessage', label: 'رساة إتم &ا& ادفع' },
                    ].map(f => (
                      <div key={f.key} className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase">{f.label}</label>
                        <input type="text" value={(siteTexts as any)[f.key] || ''} onChange={e => setSiteTexts({ ...siteTexts, [f.key]: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl py-2 px-4 text-white hover:border-primary/30 outline-none transition-all text-xs font-bold" />
                      </div>
                    ))}
                  </div>

                  {/* Section 3: Sections Titles */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-blue-500 border-r-2 border-blue-500 pr-3 mr-1">ع اي  اأسا&</h3>
                    {[
                      { key: 'unitsSectionTitle', label: 'ع ا  س& احداتم ' },
                      { key: 'examsSectionTitle', label: 'ع ا  س& اا&تم حا اتم ' },
                      { key: 'bookletsSectionTitle', label: 'ع ا  س& ا&خصاتم ' },
                      { key: 'coursesSectionTitle', label: 'ع ا  س& الكلرساتم ' },
                      { key: 'lessonsSectionTitle', label: 'ع ا  س& اشرح' },
                    ].map(f => (
                      <div key={f.key} className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase">{f.label}</label>
                        <input type="text" value={(siteTexts as any)[f.key] || ''} onChange={e => setSiteTexts({ ...siteTexts, [f.key]: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl py-2 px-4 text-white hover:border-primary/30 outline-none transition-all text-xs font-bold" />
                      </div>
                    ))}
                  </div>

                  {/* Section 4: Chat & Support */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-purple-500 border-r-2 border-purple-500 pr-3 mr-1">ادع& اخصصية</h3>
                    {[
                      { key: 'supportSectionTitle', label: 'ع ا  ادع&' },
                      { key: 'supportSendButton', label: 'زر إرسال الدعم' },
                    ].map(f => (
                      <div key={f.key} className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase">{f.label}</label>
                        <input type="text" value={(siteTexts as any)[f.key] || ''} onChange={e => setSiteTexts({ ...siteTexts, [f.key]: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl py-2 px-4 text-white hover:border-primary/30 outline-none transition-all text-xs font-bold" />
                      </div>
                    ))}
                  </div>

                  {/* Section 5: Messages & Prompts */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-orange-500 border-r-2 border-orange-500 pr-3 mr-1">رسائ اتم ب`!</h3>
                    {[
                      { key: 'premiumLockMessage', label: 'رساة ا&حتم 0 ا&ف' },
                      { key: 'platformLockedMessage', label: 'رسالة المنصة المقفلة' },
                      { key: 'coinsInsufficientMessage', label: 'رصيد غير كافٍ' },
                      { key: 'unlockWithCoinsButtonText', label: 'زر فتم ح بالكلي ز' },
                      { key: 'confirmDeleteTitle', label: 'تم أْيد احذف' },
                    ].map(f => (
                      <div key={f.key} className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase">{f.label}</label>
                        <input type="text" value={(siteTexts as any)[f.key] || ''} onChange={e => setSiteTexts({ ...siteTexts, [f.key]: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl py-2 px-4 text-white hover:border-primary/30 outline-none transition-all text-xs font-bold" />
                      </div>
                    ))}
                  </div>

                  {/* Section 6: Auth & Login/Register */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-red-500 border-r-2 border-red-500 pr-3 mr-1">تخصيص التسجيل</h3>
                    {[
                      { key: 'loginModalTitle', label: 'ع ا  دخ اطاب' },
                      { key: 'loginModalSubtitle', label: 'وصف شاشة الدخول' },
                      { key: 'registerModalTitle', label: 'ع ا  إ شاء احساب' },
                      { key: 'registerModalSubtitle', label: 'وصف شاشة الحساب' },
                      { key: 'loginButtonLabel', label: 'نص زر الدخول' },
                      { key: 'registerButtonLabel', label: 'نص زر التسجيل' },
                      { key: 'usernameLabel', label: 'تسمية حقل الاسم' },
                      { key: 'passwordLabel', label: 'تسمية حقل كلمة المرور' },
                      { key: 'genderLabel', label: 'تسمية حقل الموقع' },
                      { key: 'stageLabel', label: 'تسمية حقل المرحلة' },
                      { key: 'yearLabel', label: 'تسمية حقل السنة' },
                      { key: 'semesterLabel', label: 'تسمية حقل الفصل الدراسي' },
                      { key: 'locationLabel', label: 'تسمية حقل المحافظة' },
                      { key: 'noAccountText', label: ' ص اتم حي تم سج`' },
                      { key: 'alreadyHaveAccountText', label: ' ص اتم حي دخ' },
                      { key: 'captchaSliderText', label: ' ص سحب الكلابتم شا' },
                      { key: 'captchaVerifiedText', label: ' ص  جاح الكلابتم شا' },
                    ].map(f => (
                      <div key={f.key} className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase">{f.label}</label>
                        <input type="text" value={(siteTexts as any)[f.key] || ''} onChange={e => setSiteTexts({ ...siteTexts, [f.key]: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl py-2 px-4 text-white hover:border-primary/30 outline-none transition-all text-xs font-bold" />
                      </div>
                    ))}
                  </div>

                  {/* Section 7: Platform & Loading */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-amber-500 border-r-2 border-amber-500 pr-3 mr-1">تخصيص شاشة التحميل</h3>
                    {[
                      { key: 'platformMaintenanceTitle', label: 'عنوان صفحة الصيانة' },
                      { key: 'adminLoginButton', label: 'زر دخول الإدارة' },
                      { key: 'preparingPlatformText', label: ' ص جالمروري اتم حضير' },
                      { key: 'loadingSystemText', label: 'نص شاشة التحميل' },
                      { key: 'syncingText', label: ' ص جالمروري ا&زا& ة' },
                      { key: 'blessingText', label: 'نص الصلاة على النبي' },
                    ].map(f => (
                      <div key={f.key} className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase">{f.label}</label>
                        <input type="text" value={(siteTexts as any)[f.key] || ''} onChange={e => setSiteTexts({ ...siteTexts, [f.key]: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl py-2 px-4 text-white hover:border-primary/30 outline-none transition-all text-xs font-bold" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          }


          {
            activeTab === 'admin_management' && !subAdminConfig && (
              <div className="space-y-6 text-right pb-20 animate-in fade-in duration-700">
                <div className="flex items-center justify-between border-b border-white/5 pb-6">
                  <div className="flex items-center gap-3 text-white">
                    <ShieldCheck size={28} style={{ color: theme.primary }} />
                    <div>
                      <h2 className="text-3xl font-black">إدالمرورة حالات التحكم افرعية</h2>
                      <p className="text-gray-500 text-xs font-bold mt-1">تغيير أسماء المستخدمين وكلمات المرور للمشرفين الفرعيين</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  {(appSettings.subAdmins || []).map((sa: any, index: number) => (
                    <div key={sa.id || index} className="bg-white/[0.02] border border-white/5 p-6 rounded-[2rem] space-y-4 hover:border-white/10 transition-all">
                      <div className="flex items-center justify-between mb-2 pb-3 border-b border-white/5">
                        <span className="text-sm font-black text-white">{sa.config.year} - {sa.config.stage}</span>
                        <span className="text-[10px] px-3 py-1 rounded-full font-bold" style={{ backgroundColor: `${theme.primary}10`, color: theme.primary }}>{sa.config.specialization}</span>
                      </div>

                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase">اسم المستخدم</label>
                          <div className="flex items-center gap-2">
                            <input type="text" value={sa.user} onChange={e => {
                              const newAdmins = [...appSettings.subAdmins];
                              newAdmins[index] = { ...newAdmins[index], user: e.target.value };
                              setAppSettings({ ...appSettings, subAdmins: newAdmins });
                            }} className="flex-1 bg-black/40 border border-white/10 rounded-xl py-2.5 px-4 text-white outline-none transition-all text-xs font-bold" style={{ outlineColor: theme.primary }} />
                            <button onClick={() => { navigator.clipboard.writeText(sa.user); alert('تم نسخ اسم المستخدم'); }} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all" title="نسخ"><Copy size={16} /></button>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase">ْ&ة ا&رر</label>
                          <div className="flex items-center gap-2">
                            <input type="text" value={sa.pass} onChange={e => {
                              const newAdmins = [...appSettings.subAdmins];
                              newAdmins[index] = { ...newAdmins[index], pass: e.target.value };
                              setAppSettings({ ...appSettings, subAdmins: newAdmins });
                            }} className="flex-1 bg-black/40 border border-white/10 rounded-xl py-2.5 px-4 text-white outline-none transition-all text-xs font-bold font-mono" style={{ outlineColor: theme.primary }} />
                            <button onClick={() => { navigator.clipboard.writeText(sa.pass); alert('تم نسخ كلمة المرور'); }} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all" title="نسخ"><Copy size={16} /></button>
                          </div>
                        </div>

                        <button onClick={() => {
                          DB.updateSettings({ subAdmins: appSettings.subAdmins });
                          alert('تم تحديث بيانات الحساب المحمي بنجاح! سيتم إخراج المشرف الحالي فوراً إذا كان مسجلاً.');
                        }} className="w-full mt-2 py-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2" style={{ backgroundColor: `${theme.primary}10`, color: theme.primary, border: `1px solid ${theme.primary}20` }}>
                          <Save size={14} /> تحديث البيانات 
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          }


          {
            pointsModalStudent && (
              <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 animate-in fade-in duration-300">
                <div className="relative w-full max-w-2xl bg-[#0b141a] border border-white/10 rounded-[3rem] p-8 text-right space-y-6 max-h-[90vh] overflow-y-auto no-scrollbar animate-in zoom-in-95">
                  <button onClick={() => setPointsModalStudent(null)} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors group">
                    <div className="p-2 bg-white/5 rounded-full group-hover:bg-red-500/20 group-hover:text-red-500">
                      <X size={20} />
                    </div>
                  </button>
                  <h2 className="text-2xl font-black text-white px-8">المحتوى المفتوح بالنقاط</h2>
                  <div className="text-[10px] text-gray-500 font-bold -mt-4 opacity-60">إدالمرورة &شتم رياتم اطاب: {pointsModalStudent.username}</div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                    {/* Left Column: Coin Controls */}
                    <div className="space-y-4">
                      <div className="bg-yellow-500/5 p-6 rounded-[2rem] border border-yellow-500/10 text-center relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
                          <Coins size={48} className="text-yellow-500" />
                        </div>
                        <span className="text-xs font-bold text-gray-500 block mb-1">ارصيد ا&تم اح &  الكلي ز</span>
                        <span className="text-4xl font-black text-yellow-500 drop-shadow-lg">{pointsModalStudent.coins || 0}</span>
                        <span className="text-[10px] font-black text-yellow-500/50 mr-2 uppercase tracking-widest">Points</span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {[10, 50, 100, 500].map(amount => (
                          <button
                            key={amount}
                            onClick={() => {
                              DB.updateStudent(pointsModalStudent.id, { coins: (pointsModalStudent.coins || 0) + amount });
                              setStudents(DB.getStudents());
                              setPointsModalStudent({ ...pointsModalStudent, coins: (pointsModalStudent.coins || 0) + amount });
                                alert(`تم إضافة ${amount} كوينز بنجاح!`);
                            }}
                            className="py-4 bg-white/5 border border-white/5 rounded-2xl font-black text-xs hover:bg-yellow-500 hover:text-black transition-all hover:-translate-y-1"
                          >
                            +{amount} ْي ز
                          </button>
                        ))}
                        <button
                          onClick={() => {
                            if (window.confirm('! أ تم &تم أْد &  تم صفير ْافة  اط اطابx')) {
                              DB.updateStudent(pointsModalStudent.id, { coins: 0 });
                              setStudents(DB.getStudents());
                              setPointsModalStudent({ ...pointsModalStudent, coins: 0 });
                            }
                          }}
                          className="col-span-2 py-4 bg-red-500/5 text-red-500 border border-red-500/10 rounded-2xl font-black text-xs hover:bg-red-500 hover:text-white transition-all shadow-xl"
                        >
                          تم صفلا يوجد رصيدد ا&حفظة
                        </button>
                      </div>
                    </div>

                    {/* Right Column: Collection List */}
                    <div className="flex flex-col h-full min-h-[300px]">
                      <div className="flex items-center justify-between mb-4">
                        <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[9px] font-black" style={{ color: theme.primary, backgroundColor: `${theme.primary}10` }}>
                          {(pointsModalStudent.unlockedCoursesWithCoins?.length || 0) + (pointsModalStudent.unlockedLessonsWithCoins?.length || 0) + (pointsModalStudent.unlockedBookletsWithCoins?.length || 0)} ع اصر
                        </span>
                        <h3 className="text-sm font-black text-white/50">سج ا&شتم رياتم </h3>
                      </div>

                      <div className="flex-1 space-y-3 overflow-y-auto pr-2 no-scrollbar">
                        {(() => {
                          const purchases = [
                            ...(courseList || []).filter(c => pointsModalStudent.unlockedCoursesWithCoins?.includes(c.id)).map(c => ({ ...c, _type: 'course' })),
                            ...(lessonList || []).filter(l => pointsModalStudent.unlockedLessonsWithCoins?.includes(l.id)).map(l => ({ ...l, _type: 'lesson' })),
                            ...(bookletList || []).filter(b => pointsModalStudent.unlockedBookletsWithCoins?.includes(b.id)).map(b => ({ ...b, _type: 'booklet' }))
                          ];

                          if ((purchases || []).length === 0) {
                            return (
                              <div className="h-full flex flex-col items-center justify-center py-12 opacity-20 grayscale bg-white/5 border border-dashed border-white/10 rounded-[2rem]">
                                <Activity size={32} className="mb-2" />
                                <p className="text-[10px] font-black">ا `جد &حتم 0 &فتم ح حاياً</p>
                              </div>
                            );
                          }

                          return purchases.map((item: any) => (
                            <div key={item.id} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between gap-4 hover:bg-white/[0.05] transition-all group/item">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    if (window.confirm(`! أ تم &تم أْد &  ف "${item.title}" ع  اطابx`)) {
                                      const field = item._type === 'course' ? 'unlockedCoursesWithCoins' :
                                        item._type === 'lesson' ? 'unlockedLessonsWithCoins' :
                                          'unlockedBookletsWithCoins';
                                      const newList = (pointsModalStudent as any)[field].filter((id: string) => id !== item.id);
                                      DB.updateStudent(pointsModalStudent.id, { [field]: newList });
                                      setStudents(DB.getStudents());
                                      setPointsModalStudent({ ...pointsModalStudent, [field]: newList });
                                    }
                                  }}
                                  className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-md"
                                  title="ف ا&حتم 0"
                                >
                                  <Trash2 size={14} />
                                </button>
                                <button
                                  onClick={() => {
                                    const url = item._type === 'course' ? item.videoUrl : item.videos?.[0]?.url;
                                    if (url) window.open(url, '_blank');
                                    else alert('لا يوجد فيديو متاح حالياً');
                                  }}
                                  className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl hover:bg-emerald-500 hover:text-white transition-all shadow-md"
                                  title="تشغيل الخوارزمية"
                                >
                                  <Play size={14} />
                                </button>
                              </div>
                              <div className="text-right flex-1 min-w-0">
                                <h4 className="text-xs font-black text-white truncate">{item.title}</h4>
                                <p className="text-[9px] text-amber-500 font-bold mt-1 flex items-center justify-end gap-1.5">
                                  <Sparkles size={10} /> {item.requiredCoins || 0} ْي ز
                                  {item.price > 0 && <span className="text-gray-500">| + {item.price} ج.م</span>}
                                </p>
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-white/5 text-center">
                    <p className="text-[9px] text-gray-500 font-bold opacity-40 italic">&احظة: تم صفير ا&حتم 0 ا&فتم ح   `عيد الكلي ز تم ائياً طاب إا إذا &تم بإضافتم !ا `دياً.</p>
                  </div>
                </div>
              </div>
            )
          }

          {previewResult && (
      <div className="fixed inset-0 z-[1000] flex flex-col items-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto py-10">
        <div className="w-full max-w-[21cm] flex justify-start mb-4 print:hidden">
          <button
            onClick={() => setPreviewResult(null)}
            className="group px-4 py-2 bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white rounded-xl shadow-lg transition-all flex items-center gap-2 font-black text-xs border border-red-500/20"
          >
            <X size={16} className="group-hover:rotate-90 transition-transform duration-300" />
            <span>خروج من المعاينة</span>
          </button>
        </div>
              <div id="achievement-report-content" className="relative shrink-0 w-full max-w-[21cm] bg-white text-gray-900 border-[12px] flex flex-col mx-auto rounded-none shadow-2xl overflow-hidden text-right"
                style={{
                  borderColor: '#1e3a8a',
                  fontFamily: 'Cairo, sans-serif',
                  height: '296mm',
                  boxSizing: 'border-box',
                  direction: 'rtl',
                  fontFeatureSettings: '"kern" 1',
                  textRendering: 'optimizeLegibility',
                  WebkitFontSmoothing: 'antialiased'
                }}>
                {/* Inner Accent Path */}
                <div className="absolute inset-2 border-2 pointer-events-none" style={{ borderColor: '#eff6ff' }} />

                <div className="flex-1 flex flex-col bg-white p-8 space-y-4 relative overflow-hidden">
                  {/* Rich Background Watermark */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none select-none z-0">
                    <span className="text-[12rem] font-black tracking-[0.2em] rotate-[-15deg]">REPORT</span>
                  </div>

                  {/* Premium Header */}
                  <div className="flex justify-between items-start border-b-4 pb-6 mb-2 relative z-10" style={{ borderColor: '#1e3a8a' }}>
                    <div className="text-right space-y-1">
                      <h1 className="text-2xl font-black" style={{ color: '#1e3a8a' }}>Mentora التعليمية</h1>
                      <h2 className="text-sm font-black tracking-widest text-blue-600/40 uppercase">MENTORA PLATFORM</h2>
                      <div className="mt-2 flex items-center justify-end gap-2 text-gray-400 text-xs font-bold">
                        <span>{previewResult.date} | {previewResult.time}</span>
                        <Calendar size={14} className="text-blue-500" />
                      </div>
                    </div>
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center border-4 p-1 shadow-xl overflow-hidden" style={{ borderColor: '#1e3a8a' }}>
                      <div className="w-full h-full shrink-0 overflow-hidden flex items-center justify-center rounded-full" title="Mentora">
                        <img src="https://i.postimg.cc/4NP62dYC/IMG-20260420-WA0023-2.jpg" className="w-full h-full object-cover" alt="Mentora Logo" />
                      </div>
                    </div>
                  </div>

                  <div className="text-center space-y-1 relative z-10 py-2">
                    <h1 className="text-4xl font-black tracking-tighter" style={{ color: '#1e3a8a' }}>تقرير نتيجة الطالب</h1>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500">Detailed Academic Performance Report</p>
                  </div>

                  {/* Student Info Card - Scaled down */}
                  <div className="grid grid-cols-2 gap-6 mb-2 relative z-10">
                    <div className="p-4 rounded-[1.5rem] border-2 bg-gray-50 flex items-center gap-4 justify-end border-gray-100">
                      <div className="text-right flex-1">
                        <label className="text-[9px] font-black uppercase tracking-widest block mb-0.5 text-blue-400">اسم الطالب</label>
                        <div className="text-xl font-black text-blue-900">{previewResult.studentName}</div>
                        <div className="mt-1 text-[11px] font-bold text-gray-500 flex items-center justify-end gap-2">
                          <span>{previewResult.stage} - {previewResult.year}</span>
                          <Hash size={12} className="text-blue-400" />
                        </div>
                      </div>
                      <div className="w-16 h-16 rounded-xl border-4 border-white bg-white shadow-lg overflow-hidden">
                        <img
                          src={previewResult.studentPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${previewResult.studentName}`}
                          className="w-full h-full object-cover"
                          alt=""
                          crossOrigin="anonymous"
                        />
                      </div>
                    </div>

                    <div className="p-4 rounded-[1.5rem] border-2 bg-gray-50 flex flex-col justify-center border-gray-100">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between border-b-2 border-white pb-1.5">
                          <span className="font-black text-base text-blue-900">{previewResult.examTitle}</span>
                          <span className="text-[9px] font-black text-blue-400 uppercase">الاختبار</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-black text-base text-blue-900">{previewResult.durationMinutes} دقيقة</span>
                          <span className="text-[9px] font-black text-blue-400 uppercase">مدة الحل</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Results Table - Scaled down */}
                  <div className="space-y-2 relative z-10 pt-2">
                    <div className="flex items-center justify-end gap-2 mb-1">
                      <span className="font-black text-lg text-blue-900">تفاصيل الدرجات والتقدير</span>
                      <div className="w-1.5 h-6 bg-blue-900 rounded-full" />
                    </div>

                    <div className="overflow-hidden border-4 rounded-[1.5rem] bg-white" style={{ borderColor: '#1e3a8a' }}>
                      <table className="w-full text-right border-collapse">
                        <thead>
                          <tr className="text-white text-[11px] font-black uppercase tracking-widest" style={{ backgroundColor: '#1e3a8a' }}>
                            <th className="p-4 border-l border-white/20">التقدير</th>
                            <th className="p-4 border-l border-white/20">النسبة %</th>
                            <th className="p-4 border-l border-white/20">خاطئة</th>
                            <th className="p-4 border-l border-white/20">صحيحة</th>
                            <th className="p-4 text-center">الإجمالي</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="text-lg font-black" style={{ color: '#1e3a8a' }}>
                            <td className="p-6 border-l border-gray-100">
                              <div className={cn(
                                "text-center py-2 px-4 rounded-xl font-black text-sm",
                                previewResult.percentage >= 90 ? "bg-emerald-500 text-white" :
                                  previewResult.percentage >= 75 ? "bg-blue-500 text-white" :
                                    previewResult.percentage >= 50 ? "bg-orange-500 text-white" :
                                      "bg-red-500 text-white"
                              )}>
                                {previewResult.grade}
                              </div>
                            </td>
                            <td className="p-6 border-l border-gray-100 text-center text-3xl">%{previewResult.percentage}</td>
                            <td className="p-6 border-l border-gray-100 text-center text-red-600">{previewResult.wrongAnswers}</td>
                            <td className="p-6 border-l border-gray-100 text-center text-emerald-600">{previewResult.correctAnswers}</td>
                            <td className="p-6 text-center text-gray-400">{previewResult.totalQuestions}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Professional Performance Chart */}
                  <div className="p-8 border-4 border-dashed border-blue-100 rounded-[3rem] bg-gray-50 flex flex-col items-center gap-4 relative z-10">
                    <div className="text-sm font-black text-blue-900 uppercase tracking-widest">مؤشر الأداء الدراسي العام</div>
                    <div className="w-full max-w-md h-5 bg-white rounded-full p-1 border-2 border-blue-50 shadow-inner overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-1000",
                          previewResult.percentage >= 90 ? "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" :
                            previewResult.percentage >= 75 ? "bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]" :
                              "bg-orange-500"
                        )}
                        style={{ width: `${previewResult.percentage}%` }}
                      />
                    </div>
                    <p className="text-xs font-bold text-gray-400 text-center leading-relaxed">
                      تم استخراج هذا التقرير آلياً من منصة Mentora عام 2026.<br />
                      يعكس هذا السجل الأداء الحقيقي للطلاب بناءً على كافة المشاركات والتقييمات.
                    </p>
                  </div>

                  {/* Footer Section with Stamp and Signature */}
                  <div className="pt-8 mt-auto border-t-2 border-gray-100 flex justify-between items-end relative bg-white">
                    {/* Realistic Stamp */}
                    <div className="relative">
                      <div className="w-28 h-28 rounded-full border-4 border-double border-blue-900 flex items-center justify-center rotate-[-15deg] bg-white relative overflow-hidden shadow-xl">
                        <div className="absolute inset-0 opacity-40 flex items-center justify-center">
                          <div className="w-full h-full  rounded-full shrink-0 overflow-hidden flex items-center justify-center" title="Mentora">
                            <img src="https://i.postimg.cc/4NP62dYC/IMG-20260420-WA0023-2.jpg" className="w-full h-full object-cover" alt="Mentora Logo" />
                          </div>
                        </div>
                        <div className="flex flex-col items-center justify-center relative z-10">
                          <div className="text-[14px] font-black text-blue-900 border-2 border-blue-900 px-4 py-0.5 rounded-lg">
                            مُعْتَمَد
                          </div>
                          <div className="text-[6px] font-black text-blue-900 mt-1 uppercase tracking-widest">OFFICIAL SEAL</div>
                        </div>
                      </div>
                    </div>

                    <div className="text-right space-y-2">
                      <div className="text-sm font-black text-blue-900">مدير المنصة</div>
                      <div className="text-2xl font-black px-4 pb-2 border-b-4 text-blue-900 font-cairo" style={{ borderColor: '#1e3a8a' }}>م/ عمرو لطفي</div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-100 flex justify-between items-center text-[10px] font-black text-gray-400 uppercase">
                    <span>© {new Date().getFullYear()} Mentora Platform</span>
                    <div className="flex items-center gap-2">
                      <Globe size={12} />
                      <a
                        href="https://Mentoraa.netlify.app"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-900 hover:underline cursor-pointer"
                      >Mentoraa.netlify.app</a>
                    </div>
                  </div>
                </div>

                {/* Main Action Buttons - Fully Ignored in PDF */}
                <div data-html2canvas-ignore="true" className="fixed top-6 left-1/2 -translate-x-1/2 flex items-center gap-6 z-[1010] print:hidden">
                  

                  {!subAdminConfig && (
                    <button
                      onClick={() => handleDownloadReportPDF(previewResult)}
                      className="group px-12 py-4 bg-blue-600 text-white rounded-2xl shadow-[0_15px_40px_rgba(37,99,235,0.4)] hover:bg-blue-700 hover:scale-105 transition-all flex items-center gap-3 font-black text-sm border-2 border-white/20"
                    >
                      <Download size={22} className="group-hover:bounce-y" />
                      <span>تحميل التقرير PDF</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {
            isDownloading && (
              <div className="fixed inset-0 z-[10001] flex flex-col items-center justify-center bg-black/98 backdrop-blur-xl animate-in fade-in duration-300">
                <div className="relative w-20 h-20 mb-6">
                  <div className="absolute inset-0 border-4 border-blue-500/10 rounded-full" />
                  <div className="absolute inset-0 border-4 border-t-blue-500 rounded-full animate-spin" />
                  <ShieldCheck size={30} className="absolute inset-0 m-auto text-blue-500 animate-pulse" />
                </div>
                <div className="text-center space-y-1">
                  <h2 className="text-xl font-black text-white tracking-widest uppercase">جاري تصدير التقرير الرسمي...</h2>
                  <p className="text-gray-500 font-bold text-[10px] tracking-widest uppercase">Generating Document - Please Wait</p>
                </div>
              </div>
            )
          }
        </div>
      </main >
    </div >
  );
};

export default React.memo(AdminDashboard);


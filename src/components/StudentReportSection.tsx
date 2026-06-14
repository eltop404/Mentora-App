import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Student } from '../types';
import { DB } from '../services/db';
import * as htmlToImage from 'html-to-image';
import { 
  User, BookOpen, Trophy, Award, 
  CheckCircle, XCircle, Share2, Loader2,
  FileText, Clock, BarChart3, Star,
  PlayCircle
} from 'lucide-react';

interface StudentReportSectionProps {
  user: Student;
  theme: any;
}

export const StudentReportSection: React.FC<StudentReportSectionProps> = ({ user, theme }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isSharing, setIsSharing] = useState(false);

  const exams = useMemo(() => user.achievements || [], [user.achievements]);
  const courses = useMemo(() => {
    const allCourses = DB.getCourses();
    const purchased = user.purchasedCourses || [];
    return allCourses.filter(c => purchased.includes(c.id));
  }, [user.purchasedCourses]);

  const totalPoints = user.points || 0;
  
  const avgScore = useMemo(() => {
    if (exams.length === 0) return 0;
    const totalPercentage = exams.reduce((acc, curr) => acc + curr.percentage, 0);
    return Math.round(totalPercentage / exams.length);
  }, [exams]);

  const totalCorrect = exams.reduce((acc, curr) => acc + (curr.correctAnswers || 0), 0);
  const totalWrong = exams.reduce((acc, curr) => acc + (curr.wrongAnswers || 0), 0);
  const totalQuestions = totalCorrect + totalWrong;

  const pieCorrectPercentage = totalQuestions === 0 ? 50 : Math.round((totalCorrect / totalQuestions) * 100);
  const pieWrongPercentage = totalQuestions === 0 ? 50 : 100 - pieCorrectPercentage;

  const getRating = (score: number) => {
    if (score >= 90) return { label: 'ممتاز', color: '#10B981', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
    if (score >= 75) return { label: 'جيد جداً', color: '#3B82F6', bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };
    if (score >= 60) return { label: 'مقبول', color: '#F59E0B', bg: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' };
    return { label: 'يحتاج تحسين', color: '#EF4444', bg: 'bg-red-500/10 text-red-400 border-red-500/20' };
  };

  const overallRating = getRating(avgScore);

  const handleShare = async () => {
    if (!reportRef.current) return;
    try {
      setIsSharing(true);
      
      const el = reportRef.current;
      const originalTransform = el.style.transform;
      // Temporarily expand to prevent cutoffs
      el.style.transform = 'none';

      // Inject styles to force a horizontal (desktop) layout for the screenshot
      const styleEl = document.createElement('style');
      styleEl.innerHTML = `
        .force-desktop { width: 1100px !important; max-width: 1100px !important; padding: 24px !important; }
        .force-desktop .sm\\:flex-row, .force-desktop .md\\:flex-row { flex-direction: row !important; }
        .force-desktop .md\\:flex { display: flex !important; }
        .force-desktop .md\\:w-auto { width: auto !important; }
        .force-desktop .md\\:mt-0 { margin-top: 0 !important; }
        .force-desktop .lg\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; display: grid !important; }
        .force-desktop .lg\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; display: grid !important; }
        .force-desktop .lg\\:col-span-2 { grid-column: span 2 / span 2 !important; }
        .force-desktop .md\\:w-1\\/3 { width: 33.333333% !important; }
        .force-desktop .md\\:w-2\\/3 { width: 66.666667% !important; }
        .force-desktop .lg\\:items-start { align-items: flex-start !important; }
        .force-desktop .md\\:w-8 { width: 2rem !important; }
      `;
      document.head.appendChild(styleEl);
      el.classList.add('force-desktop');

      const blob = await htmlToImage.toBlob(el, {
        backgroundColor: '#0b1120', 
        pixelRatio: 3,
        imagePlaceholder: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
        style: { transform: 'none', margin: '0' }
      });
      
      el.classList.remove('force-desktop');
      document.head.removeChild(styleEl);
      el.style.transform = originalTransform;

      if (!blob) {
         alert("حدث خطأ في معالجة الصورة. قد تكون بعض الصور الخارجية تمنع ذلك.");
         return;
      }

      const file = new File([blob], `report-${user.username}.png`, { type: 'image/png' });

      const fallbackDownload = () => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report-${user.username}.png`;
        a.click();
        URL.revokeObjectURL(url);
      };

      try {
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'تقرير الطالب',
            text: `تقرير الطالب ${user.username} من منصة Mentora التعليمية 🌟🚀`
          });
        } else {
          fallbackDownload();
        }
      } catch (shareErr: any) {
        if (shareErr.name !== 'AbortError') fallbackDownload();
      }

    } catch (error) {
      console.error('Error generating report:', error);
      alert('تعذر إنشاء التقرير. قد تكون بعض الموارد (كالصور) تمنع العملية.');
    } finally {
      setIsSharing(false);
    }
  };
  const badges = useMemo(() => {
    const b = [];
    b.push({ title: 'الطالب النشط', desc: 'حضورك مستمر داخل المنصة', color: 'text-purple-400', iconBg: 'bg-purple-500/20' });
    if (exams.length >= 5) {
      b.push({ title: 'المثابر', desc: `أكملت ${exams.length} اختبار بنجاح`, color: 'text-blue-400', iconBg: 'bg-blue-500/20' });
    }
    if (avgScore >= 90 && exams.length > 0) {
      b.push({ title: 'متفوق', desc: 'حصلت على معدل أعلى من 90%', color: 'text-yellow-400', iconBg: 'bg-yellow-500/20' });
    }
    return b.slice(0, 3);
  }, [exams.length, avgScore]);

  const activities = useMemo(() => {
    const list: any[] = [];
    
    list.push({
      type: 'register',
      title: 'إنشاء حساب جديد على المنصة',
      date: user.regDate,
      time: user.regTime || '12:00 ص',
      icon: <User size={12} className="text-white"/>,
      bg: 'bg-white/20',
      border: 'border-white/30',
      timestamp: 0 
    });

    (user.achievements || []).forEach(exam => {
       list.push({
         type: 'exam',
         title: `قمت بإجراء اختبار: ${exam.examTitle}`,
         date: exam.date,
         time: exam.time || '10:00 ص',
         icon: <FileText size={12} className="text-blue-400"/>,
         bg: 'bg-blue-500/20',
         border: 'border-blue-500/30',
         timestamp: 1
       });
    });

    (user.purchasedCourses || []).forEach(courseId => {
       const course = DB.getCourses().find(c => c.id === courseId);
       if (course) {
         list.push({
           type: 'course',
           title: `قمت بفتح كورس: ${course.title}`,
           date: user.regDate, 
           time: '12:00 م',
           icon: <PlayCircle size={12} className="text-emerald-400"/>,
           bg: 'bg-emerald-500/20',
           border: 'border-emerald-500/30',
           timestamp: 2
         });
       }
    });

    const sortedList = [
       ...list.filter(a => a.type !== 'register').reverse(),
       list.find(a => a.type === 'register')
    ];

    return sortedList;
  }, [user]);

  const studentPhoto = (user as any).profilePictureUrl || (user as any).avatarUrl || null;
  const [localPhoto, setLocalPhoto] = useState<string | null>(null);

  useEffect(() => {
    if (!studentPhoto) return;
    if (studentPhoto.startsWith('data:')) {
      setLocalPhoto(studentPhoto);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
         ctx.drawImage(img, 0, 0);
         setLocalPhoto(canvas.toDataURL('image/png'));
      }
    };
    img.onerror = () => {
       const proxyImg = new Image();
       proxyImg.crossOrigin = 'anonymous';
       proxyImg.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = proxyImg.width;
          canvas.height = proxyImg.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
             ctx.drawImage(proxyImg, 0, 0);
             setLocalPhoto(canvas.toDataURL('image/png'));
          }
       };
       proxyImg.onerror = () => setLocalPhoto(studentPhoto);
       proxyImg.src = `https://wsrv.nl/?url=${encodeURIComponent(studentPhoto)}&output=png`;
    };
    img.src = studentPhoto;
  }, [studentPhoto]);

  return (
    <div className="w-full flex flex-col items-center pb-8 animate-fade-in" dir="rtl">
      
      {/* Share Button */}
      <div className="w-full max-w-[1000px] flex justify-end mb-4 px-2">
        <button
          onClick={handleShare}
          disabled={isSharing}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold py-2 px-6 rounded-xl flex items-center gap-2 transition-all active:scale-95 shadow-[0_0_20px_rgba(168,85,247,0.4)] text-xs border border-white/20"
        >
          {isSharing ? <Loader2 size={16} className="animate-spin" /> : <Share2 size={16} />}
          مشاركة التقرير
        </button>
      </div>

      {/* Report Wrapper */}
      <div 
        ref={reportRef}
        className="w-full max-w-[1000px] relative overflow-hidden rounded-[2rem] p-4 md:p-6 flex flex-col gap-5 text-white font-sans shadow-[0_30px_60px_rgba(0,0,0,0.6)] border border-white/10"
        style={{ background: 'linear-gradient(135deg, #0b1120 0%, #0f172a 100%)' }}
      >
        {/* Decorative Glows */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-2 relative z-10 gap-4">
           <div className="flex items-center gap-3">
             <FileText size={28} className="text-purple-400" />
             <div>
               <h1 className="text-2xl font-black text-white tracking-tight">تقرير الطالب</h1>
               <p className="text-[11px] text-slate-300 font-bold mt-0.5">عرض شامل لأدائك وتقدمك داخل المنصة</p>
             </div>
           </div>
           <div className="bg-white/5 backdrop-blur-md border border-white/10 px-5 py-2 rounded-full flex items-center gap-2 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
              <Star size={16} className="text-yellow-400" />
              <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 tracking-wider text-sm">Mentora</span>
           </div>
        </div>

        {/* Top Card: User Info & Quick Stats */}
        <div className="bg-[#111827]/80 backdrop-blur-md border border-white/5 rounded-2xl p-5 flex flex-col relative z-10 shadow-lg">
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 w-full">
            
            {/* Right: Avatar & Info */}
            <div className="flex items-center gap-4 w-full md:w-auto">
               <div className="w-20 h-20 rounded-full border-2 border-purple-500/50 flex items-center justify-center bg-black/40 shrink-0 overflow-hidden shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                  {localPhoto ? (
                    <img 
                       src={localPhoto} 
                       alt={user.username} 
                       className="w-full h-full object-cover" 
                    />
                  ) : studentPhoto ? (
                    <Loader2 size={24} className="animate-spin text-purple-400" />
                  ) : (
                    <User size={36} className="text-slate-400"/>
                  )}
               </div>
               <div className="flex flex-col">
                 <h2 className="text-xl font-black text-white">{user.username}</h2>
                 <p className="text-[11px] text-slate-300 font-bold mb-2">{user.specialization || 'التخصص غير محدد'} - {user.year || 'الفرقة غير محددة'}</p>
                 <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-bold border border-emerald-500/30 w-fit">طالب نشط</span>
               </div>
            </div>

            {/* Middle: 4 Stats Boxes */}
            <div className="grid grid-cols-2 md:flex md:flex-row gap-3 w-full md:w-auto justify-center">
              <div className="bg-black/20 border border-white/5 rounded-xl p-3 flex flex-col items-center justify-center min-w-[100px] backdrop-blur-sm">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-300 font-bold mb-1"><BookOpen size={14} className="text-purple-400"/> المواد المسجلة</div>
                <div className="text-xl font-black text-white">{courses.length}</div>
                <div className="text-[9px] text-slate-400 font-bold">مواد</div>
              </div>
              <div className="bg-black/20 border border-white/5 rounded-xl p-3 flex flex-col items-center justify-center min-w-[100px] backdrop-blur-sm">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-300 font-bold mb-1"><CheckCircle size={14} className="text-blue-400"/> الاختبارات</div>
                <div className="text-xl font-black text-white">{exams.length}</div>
                <div className="text-[9px] text-slate-400 font-bold">اختبار</div>
              </div>
              <div className="bg-black/20 border border-white/5 rounded-xl p-3 flex flex-col items-center justify-center min-w-[100px] backdrop-blur-sm">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-300 font-bold mb-1"><Trophy size={14} className="text-yellow-400"/> المعدل العام</div>
                <div className="text-lg font-black text-white" style={{ color: overallRating.color }}>{overallRating.label}</div>
              </div>
              <div className="bg-black/20 border border-white/5 rounded-xl p-3 flex flex-col items-center justify-center min-w-[100px] backdrop-blur-sm">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-300 font-bold mb-1"><Star size={14} className="text-yellow-400"/> النقاط</div>
                <div className="text-xl font-black text-yellow-400">{totalPoints.toLocaleString()}</div>
                <div className="text-[9px] text-slate-400 font-bold">نقطة</div>
              </div>
            </div>

            {/* Left: Circular Progress */}
            <div className="flex items-center justify-center w-full md:w-auto shrink-0 mt-4 md:mt-0">
               <div className="relative w-24 h-24 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 w-full h-full transform -rotate-90 drop-shadow-[0_0_15px_rgba(59,130,246,0.6)]">
                    <circle cx="48" cy="48" r="44" stroke="rgba(255,255,255,0.05)" strokeWidth="6" fill="transparent" />
                    <circle cx="48" cy="48" r="44" stroke="#3b82f6" strokeWidth="6" fill="transparent" strokeDasharray={`${(avgScore / 100) * 276} 276`} strokeLinecap="round" />
                  </svg>
                  <div className="text-center">
                    <div className="text-2xl font-black text-white leading-none">{avgScore}%</div>
                    <div className="text-[9px] text-slate-300 font-bold mt-1">مستوى الأداء</div>
                  </div>
               </div>
            </div>

          </div>

          {/* Progress Bar (Bottom of Top Card) */}
          <div className="mt-6 flex items-center gap-4 w-full bg-[#0b1120]/50 p-3 rounded-xl border border-white/5">
             <span className="text-xs font-black text-white w-8">{avgScore}%</span>
             <div className="flex-1 h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
               <div className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]" style={{ width: `${avgScore}%` }} />
             </div>
             <span className="text-[11px] font-bold text-slate-300 w-16 text-left">التقدم العام</span>
          </div>

        </div>

        {/* Two Columns Section: Exams & Courses */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 relative z-10">
          
          {/* تقرير الامتحانات */}
          <div className="bg-[#111827]/80 backdrop-blur-md border border-white/5 rounded-2xl p-5 flex flex-col shadow-lg min-h-[300px]">
             <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2">
              <FileText size={16} className="text-purple-400" />
              تقرير الامتحانات
            </h3>
            <div className="w-full">
              <table className="w-full text-[10px] text-right border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-slate-300 font-bold">
                    <th className="pb-2 border-b border-white/10 w-[30%]">الاختبار</th>
                    <th className="pb-2 border-b border-white/10 text-center w-[20%]">التاريخ</th>
                    <th className="pb-2 border-b border-white/10 text-center w-[15%]">الدرجة</th>
                    <th className="pb-2 border-b border-white/10 text-center w-[20%]">
                      <div className="border-b border-white/5 pb-1 mb-1 text-[9px]">الإجابات</div>
                      <div className="flex justify-center gap-2 text-[9px]">
                        <span className="text-emerald-400">صحيحة</span>
                        <span className="text-red-400">خاطئة</span>
                      </div>
                    </th>
                    <th className="pb-2 border-b border-white/10 text-center w-[15%]">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {exams.length > 0 ? [...exams].reverse().map((exam, i) => (
                    <tr key={i} className="bg-black/20 group backdrop-blur-sm">
                       <td className="py-2.5 px-3 rounded-r-lg text-white font-bold truncate max-w-[100px] border border-transparent border-b-white/5 group-hover:border-white/10">{exam.examTitle}</td>
                       <td className="py-2.5 text-center text-slate-300 border-b border-white/5 group-hover:border-white/10">{exam.date}</td>
                       <td className="py-2.5 text-center text-white font-black border-b border-white/5 group-hover:border-white/10">{exam.percentage}%</td>
                       <td className="py-2.5 text-center border-b border-white/5 group-hover:border-white/10">
                         <div className="flex justify-center gap-4 text-xs font-black">
                           <span className="text-emerald-400">{exam.correctAnswers || 0}</span>
                           <span className="text-red-400">{exam.wrongAnswers || 0}</span>
                         </div>
                       </td>
                       <td className="py-2.5 text-center rounded-l-lg border-b border-white/5 border-l border-transparent group-hover:border-white/10">
                         <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${exam.percentage >= 50 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                           {exam.percentage >= 50 ? 'ناجح' : 'راسب'}
                         </span>
                       </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={5} className="text-center text-slate-400 py-10 font-bold">لا توجد اختبارات</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* أداء المواد */}
          <div className="bg-[#111827]/80 backdrop-blur-md border border-white/5 rounded-2xl p-5 flex flex-col shadow-lg min-h-[300px]">
             <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2">
              <BarChart3 size={16} className="text-purple-400" />
              أداء المواد
            </h3>
            <div className="w-full">
              <table className="w-full text-[10px] text-right border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-slate-300 font-bold">
                    <th className="pb-2 border-b border-white/10 w-[30%]">المادة</th>
                    <th className="pb-2 border-b border-white/10 text-center w-[45%]">التقدم</th>
                    <th className="pb-2 border-b border-white/10 text-center w-[25%]">المستوى</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.length > 0 ? courses.map((course, i) => {
                     const prog = Math.floor(Math.random() * 40) + 60;
                     const rating = getRating(prog);
                     return (
                      <tr key={i} className="bg-black/20 group backdrop-blur-sm">
                        <td className="py-2.5 px-3 rounded-r-lg text-white font-bold truncate max-w-[120px] border border-transparent border-b-white/5 group-hover:border-white/10">{course.title}</td>
                        <td className="py-2.5 px-2 border-b border-white/5 group-hover:border-white/10">
                          <div className="flex items-center gap-2 w-full">
                            <div className="flex-1 h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                              <div className="h-full rounded-full" style={{ width: `${prog}%`, backgroundColor: rating.color }} />
                            </div>
                            <span className="text-[10px] font-bold text-slate-300 w-6 text-left">{prog}%</span>
                          </div>
                        </td>
                        <td className="py-2.5 text-center rounded-l-lg border border-transparent border-b-white/5 group-hover:border-white/10">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${rating.bg}`}>
                            {rating.label}
                          </span>
                        </td>
                      </tr>
                     )
                  }) : (
                     <tr><td colSpan={3} className="text-center text-slate-400 py-10 font-bold">لا توجد مواد مسجلة</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Analytics and Achievements Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 relative z-10">
          
          {/* النقاط والإنجازات */}
          <div className="bg-[#111827]/80 backdrop-blur-md border border-white/5 rounded-2xl p-5 flex flex-col shadow-lg min-h-[350px]">
             <h3 className="text-sm font-black text-white mb-6 flex items-center gap-2">
              <Star size={16} className="text-yellow-400" />
              النقاط والإنجازات
            </h3>
            
            <div className="flex flex-col items-center mb-6 border-b border-white/10 pb-6">
              <div className="text-4xl font-black text-yellow-400 mb-1 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]">{totalPoints.toLocaleString()}</div>
              <div className="text-[11px] text-slate-300 font-bold mb-4">إجمالي النقاط</div>
              
              <div className="flex justify-center mb-4 relative w-20 h-16">
                 <div className="absolute inset-0 bg-yellow-400/20 blur-xl rounded-full"></div>
                 <div className="w-full h-full flex items-end justify-center relative z-10 text-yellow-400">
                    <Trophy size={40} className="drop-shadow-lg" />
                 </div>
              </div>

              <div className="text-center mt-2 bg-black/20 w-full py-2 rounded-xl border border-white/5">
                 <div className="text-[10px] text-slate-300 font-bold mb-1">ترتيبك على المنصة</div>
                 <div className="text-xl font-black text-white"># 7</div>
                 <div className="text-[9px] text-slate-400 font-bold mt-1">من أصل طالب</div>
              </div>
            </div>

            <div className="space-y-4">
               <h4 className="text-[11px] font-bold text-slate-200">أحدث الإنجازات</h4>
               {badges.map((b, i) => (
                 <div key={i} className="flex items-center gap-3 bg-black/10 p-2 rounded-xl border border-white/5">
                    <div className={`w-8 h-8 rounded-full border border-white/10 flex items-center justify-center shrink-0 ${b.iconBg}`}>
                       <Award size={14} className={b.color} />
                    </div>
                    <div>
                      <div className={`text-[11px] font-black ${b.color}`}>{b.title}</div>
                      <div className="text-[9px] text-slate-300 font-bold mt-0.5">{b.desc}</div>
                    </div>
                 </div>
               ))}
            </div>
          </div>

          {/* تحليل الأداء */}
          <div className="lg:col-span-2 bg-[#111827]/80 backdrop-blur-md border border-white/5 rounded-2xl p-5 shadow-lg min-h-[350px] flex flex-col">
             <h3 className="text-sm font-black text-white mb-6 flex items-center gap-2">
              <BarChart3 size={16} className="text-purple-400" />
              تحليل الأداء
            </h3>

            <div className="flex flex-col md:flex-row gap-6 items-center lg:items-start h-auto">
               {/* Pie Chart */}
               <div className="w-full md:w-1/3 flex flex-col items-center justify-center bg-black/20 p-4 rounded-2xl border border-white/5">
                  <div className="text-[10px] font-bold text-slate-300 mb-4">الإجابات الصحيحة والخاطئة</div>
                  <div className="relative w-28 h-28">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#ef4444" strokeWidth="6" strokeDasharray="100, 100" />
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#10b981" strokeWidth="6" strokeDasharray={`${pieCorrectPercentage}, 100`} />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                       <span className="text-[10px] font-bold text-slate-200">صحيحة</span>
                       <span className="text-sm font-black text-white drop-shadow-md">{pieCorrectPercentage}%</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 mt-4 w-full">
                     <div className="flex items-center justify-between"><div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-emerald-400 rounded-sm"></div><span className="text-[10px] text-slate-300 font-bold">صحيحة</span></div><span className="text-[10px] font-bold text-white">{pieCorrectPercentage}%</span></div>
                     <div className="flex items-center justify-between"><div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-red-400 rounded-sm"></div><span className="text-[10px] text-slate-300 font-bold">خاطئة</span></div><span className="text-[10px] font-bold text-white">{pieWrongPercentage}%</span></div>
                  </div>
               </div>

               {/* Line & Bar Charts */}
               <div className="w-full md:w-2/3 h-full flex flex-col gap-6">
                 
                 {/* Line Chart */}
                 <div className="flex flex-col bg-black/20 p-4 rounded-2xl border border-white/5">
                   <div className="text-[10px] font-bold text-slate-300 mb-2 text-center">التقدم على مدار الوقت</div>
                   <div className="h-24 w-full relative border-b border-l border-white/10 flex items-end">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                        <polyline points="0,80 20,60 40,50 60,30 80,40 100,10" fill="none" stroke="#a855f7" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                        <circle cx="0" cy="80" r="3" fill="#a855f7" className="drop-shadow-[0_0_5px_rgba(168,85,247,0.8)]" />
                        <circle cx="20" cy="60" r="3" fill="#a855f7" className="drop-shadow-[0_0_5px_rgba(168,85,247,0.8)]"/>
                        <circle cx="40" cy="50" r="3" fill="#a855f7" className="drop-shadow-[0_0_5px_rgba(168,85,247,0.8)]"/>
                        <circle cx="60" cy="30" r="3" fill="#a855f7" className="drop-shadow-[0_0_5px_rgba(168,85,247,0.8)]"/>
                        <circle cx="80" cy="40" r="3" fill="#a855f7" className="drop-shadow-[0_0_5px_rgba(168,85,247,0.8)]"/>
                        <circle cx="100" cy="10" r="3" fill="#a855f7" className="drop-shadow-[0_0_5px_rgba(168,85,247,0.8)]"/>
                      </svg>
                      <div className="absolute -bottom-4 w-full flex justify-between text-[8px] text-slate-400 font-bold px-1">
                        <span>يناير</span><span>فبراير</span><span>مارس</span><span>أبريل</span><span>مايو</span>
                      </div>
                      <div className="absolute -left-6 h-full flex flex-col justify-between text-[8px] text-slate-400 font-bold py-1">
                        <span>100%</span><span>50%</span><span>0%</span>
                      </div>
                   </div>
                 </div>

                 {/* Bar Chart */}
                 <div className="flex flex-col bg-black/20 p-4 rounded-2xl border border-white/5">
                   <div className="text-[10px] font-bold text-slate-300 mb-2 text-center">متوسط الدرجات في المواد</div>
                   <div className="flex-1 flex items-end justify-around gap-2 px-2 pb-1">
                      {courses.slice(0, 7).map((c, i) => {
                        const prog = Math.floor(Math.random() * 30) + 60;
                        return (
                          <div key={i} className="flex flex-col items-center gap-1 w-full relative group">
                             <div className="text-[9px] font-black text-white">{prog}%</div>
                             <div className="w-6 md:w-8 bg-black/40 rounded-t-md relative overflow-hidden flex flex-col justify-end border border-white/5 border-b-0" style={{ height: '60px' }}>
                               <div className="w-full bg-gradient-to-t from-blue-600 to-cyan-400 transition-all rounded-t-md shadow-[0_0_10px_rgba(59,130,246,0.5)]" style={{ height: `${prog}%` }} />
                             </div>
                             <div className="text-[8px] font-bold text-slate-400 truncate w-10 text-center">{c.title}</div>
                          </div>
                        )
                      })}
                      {courses.length === 0 && <div className="text-[10px] text-slate-500 font-bold w-full text-center">لا توجد مواد مسجلة</div>}
                   </div>
                 </div>

               </div>
            </div>

          </div>
        </div>

        {/* سجل النشاط (Fully Expanded) */}
        <div className="bg-[#111827]/80 backdrop-blur-md border border-white/5 rounded-2xl p-5 relative z-10 shadow-lg">
           <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2">
            <Clock size={16} className="text-purple-400" />
            سجل النشاط
          </h3>
          <div className="w-full overflow-hidden">
            <table className="w-full text-[10px] text-right min-w-[500px] border-separate border-spacing-y-1.5">
              <thead>
                <tr className="text-slate-300 font-bold">
                  <th className="pb-2 border-b border-white/10 w-[15%] text-center">النشاط</th>
                  <th className="pb-2 border-b border-white/10 w-[55%]">التفاصيل</th>
                  <th className="pb-2 border-b border-white/10 text-center w-[15%]">التاريخ</th>
                  <th className="pb-2 border-b border-white/10 text-center w-[15%]">الوقت</th>
                </tr>
              </thead>
              <tbody>
                {activities.length > 0 ? activities.slice(0, 8).map((act, i) => (
                  <tr key={i} className="bg-black/20 hover:bg-white/5 transition-colors backdrop-blur-sm">
                     <td className="py-2.5 rounded-r-lg border-y border-r border-transparent hover:border-white/10">
                       <div className="flex flex-col items-center justify-center gap-1">
                         <div className={`w-6 h-6 rounded-md ${act.bg} flex items-center justify-center border ${act.border}`}>
                            {act.icon}
                         </div>
                         <span className="text-[9px] text-slate-300">{act.type === 'exam' ? 'اختبار' : act.type === 'course' ? 'كورس' : 'تسجيل'}</span>
                       </div>
                     </td>
                     <td className="py-2.5 px-3 text-white font-bold border-y border-transparent hover:border-white/10">{act.title}</td>
                     <td className="py-2.5 text-center text-slate-300 border-y border-transparent hover:border-white/10">{act.date}</td>
                     <td className="py-2.5 text-center text-slate-300 rounded-l-lg border-y border-l border-transparent hover:border-white/10">{act.time}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={4} className="text-center text-slate-400 py-10 font-bold">لا توجد نشاطات مسجلة</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Signature */}
        <div className="mt-4 pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-2 relative z-10 text-[10px] font-bold text-slate-400">
           <div className="flex items-center gap-2">
              جميع الحقوق محفوظة لمنصة <span className="text-purple-400 font-black">Mentora</span> © {new Date().getFullYear()}
           </div>
           <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full border border-white/5 backdrop-blur-sm">
              <span className="text-slate-300">برمجة وتطوير /</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 font-black tracking-wide">المهندس : عمرو لطفي</span>
           </div>
        </div>

      </div>
      
    </div>
  );
};

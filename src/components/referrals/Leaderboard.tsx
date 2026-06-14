import React, { useState, useEffect } from 'react';
import { Medal, Trophy, Calendar, Sparkles } from 'lucide-react';
import { Student } from '../../types';
import { DB } from '../../services/db';

interface LeaderboardProps {
  user: Student;
  theme: any;
  onClose?: () => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ user, theme }) => {
  const [activeTab, setActiveTab] = useState<'all_time' | 'monthly' | 'weekly'>('all_time');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    DB.updateLeaderboardRanks();
  }, []);

  const allStudents = DB.getStudents().filter(s => !s.isDeleted);
  const currentUser = allStudents.find(s => s.id === user.id) || user;

  const getTopStudents = (type: 'all_time' | 'monthly' | 'weekly') => {
    const sorted = [...allStudents]
      .sort((a, b) => {
        const getCount = (student: any) => {
          if (type === 'all_time') return student.referral_count || 0;
          if (type === 'monthly') return student.monthly_referrals || 0;
          if (type === 'weekly') return student.monthly_referrals || 0;
          return 0;
        };
        const countA = getCount(a);
        const countB = getCount(b);
        if (countA !== countB) return countB - countA;
        return (getCount(b) * 300) - (getCount(a) * 300);
      });

    return sorted;
  };

  const topStudents = getTopStudents(activeTab);

  const renderTop3 = () => {
    if (topStudents.length < 3) return null;
    const [first, second, third] = topStudents;
    return (
      <div className="flex flex-wrap sm:flex-nowrap items-end justify-center gap-2 sm:gap-6 mt-8 mb-12 px-2">
        {/* Second */}
        <div className="flex flex-col items-center gap-2 relative group w-[45%] sm:w-auto order-2 sm:order-1">
          <div 
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-slate-800 border-4 border-slate-400 flex items-center justify-center shadow-[0_0_20px_rgba(148,163,184,0.3)] z-10 relative overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => (second.profilePictureUrl || second.avatarUrl) && setSelectedImage(second.profilePictureUrl || second.avatarUrl)}
          >
             {(second.profilePictureUrl || second.avatarUrl) ? <img src={second.profilePictureUrl || second.avatarUrl} className="w-full h-full object-cover" /> : <span className="text-xl text-slate-300">{second.username?.charAt(0)}</span>}
          </div>
          <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-600 rounded-xl p-2.5 flex flex-col items-center w-full max-w-[130px]">
            <span className="text-[11px] sm:text-xs font-black text-white truncate w-full text-center">{second.username}</span>
             <div className="flex flex-wrap justify-center items-center gap-1 text-[8px] sm:text-[9px] text-slate-400 font-semibold mt-1.5 w-full">
               <span className="bg-black/40 px-1 rounded border border-white/5 truncate max-w-full">{second.level || second.grade || 'غير محدد'}</span>
               {second.year && <span className="bg-black/40 px-1 rounded border border-white/5 truncate max-w-full">{second.year}</span>}
               {(second.specialization || second.category || second.major) && <span className="bg-black/40 px-1 rounded border border-white/5 truncate max-w-full">{second.specialization || second.category || second.major}</span>}
             </div>
             <div className="text-[8px] sm:text-[9px] text-slate-300 font-medium mt-1.5 flex items-center gap-1">
                <span>{second.regDate}</span>
                <span className="text-slate-500/50">•</span>
                <span>{second.regTime}</span>
             </div>
            <div className="flex justify-between w-full mt-2 pt-2 border-t border-slate-600/50">
               <div className="flex flex-col items-center flex-1 border-l border-slate-600/50">
                  <span className="text-[8px] text-slate-400">دعوات</span>
                  <span className="text-[10px] sm:text-xs font-bold text-slate-200">{activeTab === 'all_time' ? (second.referral_count || 0) : (second.monthly_referrals || 0)}</span>
               </div>
               <div className="flex flex-col items-center flex-1">
                  <span className="text-[8px] text-slate-400">نقاط</span>
                  <span className="text-[10px] sm:text-xs font-bold text-slate-200">{(activeTab === 'all_time' ? (second.referral_count || 0) : (second.monthly_referrals || 0)) * 300}</span>
               </div>
            </div>
            <span className="text-[8px] sm:text-[9px] bg-slate-600/50 border border-slate-500 text-slate-200 px-2 py-0.5 rounded-full mt-2 w-full text-center truncate">{second.referral_level || 'جديد'} {second.referral_badge}</span>
          </div>
          <div className="absolute -top-4 -right-2 bg-slate-200 text-slate-800 text-xs font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-slate-400 z-20">2</div>
        </div>

        {/* First */}
        <div className="flex flex-col items-center gap-2 relative group -translate-y-4 sm:-translate-y-6 w-[100%] sm:w-auto z-20 order-1 sm:order-2 mb-4 sm:mb-0">
          <div className="absolute -inset-4 bg-amber-400/20 blur-xl rounded-full" />
          <div 
            className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-amber-900 border-4 border-amber-400 flex items-center justify-center shadow-[0_0_30px_rgba(251,191,36,0.4)] z-10 relative overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => (first.profilePictureUrl || first.avatarUrl) && setSelectedImage(first.profilePictureUrl || first.avatarUrl)}
          >
             {(first.profilePictureUrl || first.avatarUrl) ? <img src={first.profilePictureUrl || first.avatarUrl} className="w-full h-full object-cover" /> : <span className="text-2xl sm:text-3xl text-amber-100">{first.username?.charAt(0)}</span>}
          </div>
          <div className="bg-amber-900/90 backdrop-blur-sm border border-amber-500/50 rounded-xl p-3 flex flex-col items-center w-full max-w-[160px] shadow-lg">
            <span className="text-xs sm:text-sm font-black text-white truncate w-full text-center">{first.username}</span>
             <div className="flex flex-wrap justify-center items-center gap-1 text-[9px] sm:text-[10px] text-amber-200/70 font-semibold mt-1.5 w-full">
               <span className="bg-black/40 px-1.5 rounded border border-amber-500/20 truncate max-w-full">{first.level || first.grade || 'غير محدد'}</span>
               {first.year && <span className="bg-black/40 px-1.5 rounded border border-amber-500/20 truncate max-w-full">{first.year}</span>}
               {(first.specialization || first.category || first.major) && <span className="bg-black/40 px-1.5 rounded border border-amber-500/20 truncate max-w-full">{first.specialization || first.category || first.major}</span>}
             </div>
             <div className="text-[8px] sm:text-[9px] text-amber-400 font-medium mt-2 flex items-center gap-1">
                <span>{first.regDate}</span>
                <span className="text-amber-500/30">•</span>
                <span>{first.regTime}</span>
             </div>
            <div className="flex justify-between w-full mt-3 pt-3 border-t border-amber-500/30">
               <div className="flex flex-col items-center flex-1 border-l border-amber-500/30">
                  <span className="text-[9px] text-amber-300/70">دعوات</span>
                  <span className="text-sm font-black text-amber-400 flex items-center gap-1">
                    {activeTab === 'all_time' ? (first.referral_count || 0) : (first.monthly_referrals || 0)}
                    <Sparkles size={10} className="text-amber-400" />
                  </span>
               </div>
               <div className="flex flex-col items-center flex-1">
                  <span className="text-[9px] text-amber-300/70">نقاط الدعوات</span>
                  <span className="text-sm font-black text-amber-400">{(activeTab === 'all_time' ? (first.referral_count || 0) : (first.monthly_referrals || 0)) * 300}</span>
               </div>
            </div>
            <span className="text-[9px] sm:text-[10px] font-bold bg-gradient-to-r from-amber-500/20 to-amber-600/10 border border-amber-500/40 text-amber-300 px-3 py-1 rounded-full mt-3 w-full text-center truncate shadow-[0_0_10px_rgba(245,158,11,0.1)]">{first.referral_level || 'جديد'} {first.referral_badge}</span>
          </div>
          <div className="absolute -top-6 bg-amber-400 text-amber-900 text-sm font-black w-8 h-8 rounded-full flex items-center justify-center border-2 border-amber-200 z-20 shadow-lg">1</div>
        </div>

        {/* Third */}
        <div className="flex flex-col items-center gap-2 relative group w-[45%] sm:w-auto order-3 sm:order-3">
          <div 
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-orange-950 border-4 border-orange-700 flex items-center justify-center shadow-[0_0_20px_rgba(194,65,12,0.3)] z-10 relative overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => (third.profilePictureUrl || third.avatarUrl) && setSelectedImage(third.profilePictureUrl || third.avatarUrl)}
          >
             {(third.profilePictureUrl || third.avatarUrl) ? <img src={third.profilePictureUrl || third.avatarUrl} className="w-full h-full object-cover" /> : <span className="text-xl text-orange-200">{third.username?.charAt(0)}</span>}
          </div>
          <div className="bg-orange-950/80 backdrop-blur-sm border border-orange-800/50 rounded-xl p-2.5 flex flex-col items-center w-full max-w-[130px]">
            <span className="text-[11px] sm:text-xs font-black text-white truncate w-full text-center">{third.username}</span>
             <div className="flex flex-wrap justify-center items-center gap-1 text-[8px] sm:text-[9px] text-orange-400/70 font-semibold mt-1.5 w-full">
               <span className="bg-black/40 px-1 rounded border border-white/5 truncate max-w-full">{third.level || third.grade || 'غير محدد'}</span>
               {third.year && <span className="bg-black/40 px-1 rounded border border-white/5 truncate max-w-full">{third.year}</span>}
               {(third.specialization || third.category || third.major) && <span className="bg-black/40 px-1 rounded border border-white/5 truncate max-w-full">{third.specialization || third.category || third.major}</span>}
             </div>
             <div className="text-[8px] sm:text-[9px] text-orange-400 font-medium mt-1.5 flex items-center gap-1">
                <span>{third.regDate}</span>
                <span className="text-orange-500/30">•</span>
                <span>{third.regTime}</span>
             </div>
            <div className="flex justify-between w-full mt-2 pt-2 border-t border-orange-800/50">
               <div className="flex flex-col items-center flex-1 border-l border-orange-800/50">
                  <span className="text-[8px] text-orange-400/70">دعوات</span>
                  <span className="text-[10px] sm:text-xs font-bold text-orange-300">{activeTab === 'all_time' ? (third.referral_count || 0) : (third.monthly_referrals || 0)}</span>
               </div>
               <div className="flex flex-col items-center flex-1">
                  <span className="text-[8px] text-orange-400/70">نقاط</span>
                  <span className="text-[10px] sm:text-xs font-bold text-orange-300">{(activeTab === 'all_time' ? (third.referral_count || 0) : (third.monthly_referrals || 0)) * 300}</span>
               </div>
            </div>
            <span className="text-[8px] sm:text-[9px] bg-orange-800/50 border border-orange-700 text-orange-200 px-2 py-0.5 rounded-full mt-2 w-full text-center truncate">{third.referral_level || 'جديد'} {third.referral_badge}</span>
          </div>
          <div className="absolute -top-4 -left-2 bg-orange-700 text-orange-100 text-xs font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-orange-400 z-20">3</div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6 w-full max-w-3xl mx-auto pb-32 animate-in fade-in slide-in-from-bottom-4 duration-500" dir="rtl">
      
      {/* Tabs */}
      <div className="flex bg-[#1e293b]/50 border border-white/5 p-1 rounded-xl w-full max-w-[320px] mx-auto relative z-10 shadow-lg">
        <button
          onClick={() => setActiveTab('all_time')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${
            activeTab === 'all_time' ? 'bg-amber-500 text-black shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Trophy size={14} />
          <span>طوال الوقت</span>
        </button>
        <button
          onClick={() => setActiveTab('monthly')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${
            activeTab === 'monthly' ? 'bg-amber-500 text-black shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Calendar size={14} />
          <span>هذا الشهر</span>
        </button>
        <button
          onClick={() => setActiveTab('weekly')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${
            activeTab === 'weekly' ? 'bg-amber-500 text-black shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Sparkles size={14} />
          <span>هذا الأسبوع</span>
        </button>
      </div>

      {/* Current User Card */}
      <div className="bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20 rounded-xl p-2.5 sm:p-3 flex items-center justify-between shadow-lg relative overflow-hidden mt-2">
        <div className="absolute right-0 top-0 bottom-0 w-1 bg-amber-500" />
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 text-sm sm:text-base font-bold shrink-0">
             {currentUser.leaderboard_rank ? `#${currentUser.leaderboard_rank}` : '--'}
          </div>
          <div className="flex flex-col">
            <span className="text-white font-bold text-[11px] sm:text-xs">ترتيبك الحالي</span>
            <span className="text-[9px] text-gray-400">من أصل {allStudents.length} طالب</span>
          </div>
        </div>
        <div className="flex gap-3 sm:gap-4 shrink-0">
           <div className="flex flex-col items-center">
             <span className="text-white font-bold text-xs sm:text-sm">{currentUser.referral_count || 0}</span>
             <span className="text-[8px] sm:text-[9px] text-gray-400">طوال الوقت</span>
           </div>
           <div className="flex flex-col items-center border-r border-white/10 pr-3 sm:pr-4">
             <span className="text-amber-400 font-bold text-xs sm:text-sm">{currentUser.monthly_referrals || 0}</span>
             <span className="text-[8px] sm:text-[9px] text-gray-400">هذا الشهر</span>
           </div>
        </div>
      </div>

      {topStudents.length >= 3 && renderTop3()}

      {/* List */}
      <div className="flex flex-col gap-2">
        {topStudents.slice(topStudents.length >= 3 ? 3 : 0).map((student, index) => {
          const rank = topStudents.length >= 3 ? index + 4 : index + 1;
          const invites = activeTab === 'all_time' ? (student.referral_count || 0) : (student.monthly_referrals || 0);
          const points = invites * 300;
          return (
            <div key={student.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 sm:p-5 bg-white/[0.02] rounded-2xl border border-white/5 hover:bg-white/[0.04] transition-all duration-300 gap-3 sm:gap-4 group shadow-sm">
              <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                <div className="flex flex-col items-center justify-center min-w-[28px] sm:min-w-[32px]">
                   <span className="text-gray-400 group-hover:text-amber-500 transition-colors font-black text-sm sm:text-base">#{rank}</span>
                </div>
                
                <div 
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-slate-800/80 flex items-center justify-center font-bold overflow-hidden text-gray-200 shrink-0 border border-white/10 shadow-inner group-hover:border-amber-500/30 transition-colors cursor-pointer"
                  onClick={() => (student.profilePictureUrl || student.avatarUrl) && setSelectedImage(student.profilePictureUrl || student.avatarUrl)}
                >
                  {(student.profilePictureUrl || student.avatarUrl) ? <img src={student.profilePictureUrl || student.avatarUrl} className="w-full h-full object-cover" /> : <span className="text-xl opacity-70">{student.username?.charAt(0)}</span>}
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                     <span className="text-sm sm:text-base font-black text-white tracking-tight">{student.username}</span>
                     <span className="text-[9px] bg-gradient-to-r from-amber-500/10 to-amber-600/5 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20">{student.referral_level || 'جديد'} {student.referral_badge}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 text-[9px] sm:text-[10px] text-gray-400 font-semibold">
                     <span className="bg-white/5 px-2 py-0.5 rounded-md border border-white/5">{student.level || student.grade || 'غير محدد'}</span>
                     {student.year && <span className="bg-white/5 px-2 py-0.5 rounded-md border border-white/5">{student.year}</span>}
                     {(student.specialization || student.category || student.major) && <span className="bg-white/5 px-2 py-0.5 rounded-md border border-white/5">{student.specialization || student.category || student.major}</span>}
                  </div>
                </div>
              </div>

              <div className="flex flex-row items-center justify-between sm:justify-end w-full sm:w-auto gap-4 mt-2 sm:mt-0 pt-3 sm:pt-0 border-t border-white/5 sm:border-t-0">
                 <div className="text-[9px] sm:text-[10px] text-gray-500 font-medium flex flex-col sm:items-end justify-center">
                    <span className="mb-0.5 opacity-70 text-[8px] sm:text-[9px] font-bold text-gray-400">تاريخ الانضمام</span>
                    <span className="text-amber-400 font-bold tracking-wider flex items-center gap-1.5">
                       <span>{student.regDate}</span>
                       <span className="text-amber-500/30">•</span>
                       <span>{student.regTime}</span>
                    </span>
                 </div>
                 
                 <div className="flex items-center gap-2">
                    <div className="bg-white/5 px-3 py-1.5 rounded-xl border border-white/5 flex flex-col items-center min-w-[65px] sm:min-w-[75px] group-hover:bg-white/10 transition-colors">
                      <span className="text-[9px] text-gray-400 mb-0.5">الدعوات</span>
                      <span className="text-xs sm:text-sm font-black text-white">{invites}</span>
                    </div>
                    <div className="bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20 flex flex-col items-center min-w-[65px] sm:min-w-[75px] shadow-[0_0_10px_rgba(245,158,11,0.05)] group-hover:bg-amber-500/20 transition-colors">
                      <span className="text-[9px] text-amber-500/70 mb-0.5">النقاط</span>
                      <span className="text-xs sm:text-sm font-black text-amber-500">{points}</span>
                    </div>
                 </div>
              </div>
            </div>
          );
        })}
        {topStudents.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <Trophy size={32} className="text-gray-600 mb-3" />
            <span className="text-gray-400 font-bold">لا يوجد متصدرين في هذه القائمة بعد.</span>
            <span className="text-xs text-gray-500 mt-1">كن أول من يدعو أصدقاءه ويتصدر القائمة!</span>
          </div>
        )}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-2xl w-full h-full max-h-[80vh] flex items-center justify-center">
            <img 
              src={selectedImage} 
              className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 border border-white/10"
              onClick={(e) => e.stopPropagation()} 
            />
            <button 
              className="absolute top-4 right-4 sm:-right-12 bg-white/10 text-white hover:bg-white/20 p-2.5 rounded-full backdrop-blur-md transition-colors"
              onClick={() => setSelectedImage(null)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

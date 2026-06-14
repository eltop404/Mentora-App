import React, { useState, useMemo } from 'react';
import {
    Search, FileText, Download,
    BarChart2, X, Trophy, Briefcase, Award, Activity, Eye, Trash2,
    Calendar, Hash, Shield, Smartphone, Globe, ShieldCheck, Clock
} from 'lucide-react';
import { DB } from '../../services/db';
import { Student, PaymentOrder, Course, ExamResult } from '../../types';
import { usePDFExport } from '../../utils/pdfExport';

interface StudentReportsProps {
    students: Student[];
    paymentList: PaymentOrder[];
    courseList: Course[];
    theme: any;
}

const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');

export const StudentReports: React.FC<StudentReportsProps> = ({
    students,
    theme
}) => {
    const { generatePDF } = usePDFExport();
    const [studentId, setStudentId] = useState('');
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all');
    const [customDate, setCustomDate] = useState<string>('');
    const [isDownloading, setIsDownloading] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    const normalizeDate = (dateStr: string) => {
        if (!dateStr) return new Date();
        let clean = dateStr.replace(/[\u200e\u200f\u200b\u202a\u202b\u202c\u202d\u202e\ufeff]/g, '').trim();
        const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
        arabicDigits.forEach((digit, i) => {
            clean = clean.replace(new RegExp(digit, 'g'), i.toString());
        });
        const numericMatch = clean.match(/[0-9]+[/.-][0-9]+[/.-][0-9]+/);
        if (numericMatch) clean = numericMatch[0];
        const parts = clean.split(/[/.-]/).filter(Boolean).map(val => parseInt(val, 10));
        if (parts.length === 3) {
            const [p1, p2, p3] = parts;
            if (p1 > 1000) return new Date(p1, p2 - 1, p3);
            if (p3 > 1000) return new Date(p3, p2 - 1, p1);
            return new Date(clean);
        }
        return new Date();
    };

    const selectedStudent = useMemo(() => {
        if (!selectedStudentId) return null;
        return students.find(s => s.id === selectedStudentId) || null;
    }, [selectedStudentId, students]);

    const studentAchievements = useMemo(() => {
        if (!selectedStudent) return [];
        return (selectedStudent.achievements || []).filter(ach => ach.score !== undefined && ach.score !== null);
    }, [selectedStudent]);

    const filteredData = useMemo(() => {
        const now = new Date();
        return studentAchievements.filter(ach => {
            try {
                const achDate = normalizeDate(ach.date);
                if (dateFilter === 'custom' && customDate) {
                    const target = new Date(customDate);
                    return achDate.toDateString() === target.toDateString();
                }
                if (dateFilter === 'today') {
                    return achDate.toDateString() === now.toDateString();
                }
                if (dateFilter === 'all') return true;

                const diffTime = Math.abs(now.getTime() - achDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (dateFilter === 'week') return diffDays <= 7;
                if (dateFilter === 'month') return diffDays <= 30;
                return true;
            } catch (e) {
                return true;
            }
        });
    }, [studentAchievements, dateFilter, customDate]);

    const stats = useMemo(() => {
        if (!filteredData.length) return {
            totalHw: 0,
            totalExams: 0,
            avgHw: 0,
            avgExams: 0,
            generalAvg: 0,
            totalCoins: selectedStudent?.coins || 0,
            bestPerformance: 'لا يوجد'
        };

        const homeworks = filteredData.filter(r =>
            r.examTitle.includes('شيت') ||
            r.examTitle.includes('واجب') ||
            (r as any).examType === 'MIXED'
        );
        const exams = filteredData.filter(r =>
            !r.examTitle.includes('شيت') &&
            !r.examTitle.includes('واجب') &&
            (r as any).examType !== 'MIXED'
        );

        const calcAvg = (arr: ExamResult[]) => arr.length ? Math.round(arr.reduce((a, b) => a + b.score, 0) / arr.length) : 0;
        const avgHw = calcAvg(homeworks);
        const avgExams = calcAvg(exams);

        return {
            totalHw: homeworks.length,
            totalExams: exams.length,
            avgHw,
            avgExams,
            generalAvg: Math.round((avgHw + avgExams) / (avgHw && avgExams ? 2 : 1)),
            totalCoins: selectedStudent?.coins || 0,
            bestPerformance: filteredData.sort((a, b) => b.score - a.score)[0]?.examTitle || 'لا يوجد'
        };
    }, [filteredData, selectedStudent]);

    const handleSearch = () => {
        const student = students.find(s => s.id === studentId.trim() && !s.isDeleted);
        if (student) {
            setSelectedStudentId(student.id);
        } else {
            alert('عفواً، لا يوجد طالب بهذا الـ ID أو أنه محذوف');
            setSelectedStudentId(null);
        }
    };

    const handleDownloadReportPDF = async () => {
        const fileName = `تقرير_كامل_${selectedStudent?.username || 'طالب'}`;
        await generatePDF('student-full-report-content', fileName, {
            scale: 2,
            onStart: () => setIsDownloading(true),
            onSuccess: () => setIsDownloading(false),
            onError: (err: any) => {
                setIsDownloading(false);
                const msg = err?.message || 'فشل تقني غير معروف';
                alert(`عذراً، فشل تصدير الملف: ${msg}\nيرجى المحاولة مرة أخرى أو التأكد من استقرار الإنترنت.`);
            }
        });
    };

    const handlePreviewReport = () => {
        if (!selectedStudent) return;
        setIsPreviewOpen(true);
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-8 border-b border-white/5">
                <div className="text-right">
                    <h2 className="text-4xl font-black text-white flex items-center justify-end gap-3 tracking-tighter">
                        <span>نظام تقارير الطالب</span>
                        <div className="w-2 h-10 rounded-full" style={{ backgroundColor: theme.primary }} />
                    </h2>
                    <p className="text-gray-400 font-bold mt-2 text-sm opacity-80">تحليل الأداء الأكاديمي المتكامل</p>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-3 bg-[#111827]/40 p-2 rounded-[2rem] border border-white/5 shadow-2xl">
                    <button
                        onClick={() => {
                            if (window.confirm('⚠️ هل أنت متأكد من حذف كافة نتائج جميع الطلاب نهائياً؟')) {
                                const allStudents = DB.getStudents();
                                const updated = allStudents.map((s: any) => ({ ...s, achievements: [] }));
                                DB.saveStudents(updated);
                                window.location.reload();
                            }
                        }}
                        className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white p-4 rounded-2xl border border-red-500/20 transition-all"
                    >
                        <Trash2 size={20} />
                    </button>
                    <div className="relative group">
                        <input
                            type="text"
                            placeholder="بحث عبر ID الطالب..."
                            value={studentId}
                            onChange={(e) => setStudentId(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="bg-black/60 border border-white/10 rounded-2xl py-4 pr-6 pl-12 outline-none focus:border-white/30 transition-all w-full md:w-[400px] text-sm font-bold text-white placeholder:text-gray-600 text-right"
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                    </div>
                    <button onClick={handleSearch} className="py-4 px-10 rounded-2xl font-black text-sm shadow-xl hover:brightness-110 active:scale-95 transition-all" style={{ backgroundColor: theme.primary, color: 'black' }}>بحث</button>
                </div>
            </div>

            {selectedStudent ? (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
                    <div className="bg-[#020617]/40 p-6 rounded-[2.5rem] border border-white/5 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-6">
                        <div className="flex flex-wrap items-center gap-3 justify-center">
                            {(['all', 'today', 'week', 'custom'] as const).map(f => (
                                <button
                                    key={f}
                                    onClick={() => setDateFilter(f)}
                                    className={cn(
                                        "px-4 py-2 rounded-xl text-[10px] font-black transition-all",
                                        dateFilter === f ? "bg-white text-black shadow-lg" : "text-gray-500 hover:text-white"
                                    )}
                                >
                                    {f === 'all' ? 'الكل' : f === 'today' ? 'اليوم' : f === 'week' ? 'أسبوع' : 'يوم محدد'}
                                </button>
                            ))}
                            {dateFilter === 'custom' && (
                                <input type="date" value={customDate} onChange={(e) => setCustomDate(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-black text-white" />
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={handlePreviewReport} className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl flex items-center gap-3 border border-white/10 font-black transition-all shadow-xl text-xs">
                                <Eye size={16} className="text-blue-400" />
                                <span>معاينة التقرير الرسمي</span>
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {[
                            { label: 'الواجبات', value: stats.totalHw, color: '#3b82f6', icon: <Briefcase size={20} /> },
                            { label: 'الامتحانات', value: stats.totalExams, color: '#a855f7', icon: <Trophy size={20} /> },
                            { label: 'م. الواجبات', value: `%${stats.avgHw}`, color: '#10b981', icon: <Activity size={20} /> },
                            { label: 'م. الاختبارات', value: `%${stats.avgExams}`, color: '#fbbf24', icon: <BarChart2 size={20} /> },
                            { label: 'المعدل العام', value: `%${stats.generalAvg}`, color: '#ec4899', icon: <Award size={20} /> }
                        ].map((stat, i) => (
                            <div key={i} className="bg-[#020617]/60 p-6 rounded-[2.5rem] border border-white/5 shadow-2xl flex flex-col items-center text-center group hover:border-white/20 transition-all">
                                <div className="p-3 rounded-2xl bg-white/5 mb-4 group-hover:scale-110 transition-transform" style={{ color: stat.color }}>{stat.icon}</div>
                                <span className="text-[10px] text-gray-500 font-black uppercase mb-1 tracking-widest">{stat.label}</span>
                                <span className="text-2xl font-black text-white tracking-tighter">{stat.value}</span>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-[#020617]/40 rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
                            <div className="p-6 border-b border-white/5 flex items-center justify-between flex-row-reverse bg-blue-500/[0.03]">
                                <h3 className="text-lg font-black text-white flex items-center gap-2">
                                    <FileText size={20} className="text-blue-400" />
                                    <span>سجل الشيتات والواجبات</span>
                                </h3>
                                <span className="text-[10px] bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full font-black uppercase">{stats.totalHw} عنصر</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-right">
                                    <thead className="text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-white/5 bg-white/[0.02]">
                                        <tr>
                                            <th className="px-6 py-5">المحتوى التعليمي</th>
                                            <th className="px-6 py-5 text-center">النسبة المئوية</th>
                                            <th className="px-6 py-5 text-center">التقدير</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {filteredData.filter(r => r.examTitle.includes('شيت') || r.examTitle.includes('واجب') || (r as any).examType === 'MIXED').map((row, idx) => (
                                            <tr key={idx} className="hover:bg-white/[0.02] transition-colors group">
                                                <td className="px-6 py-5">
                                                    <div className="font-black text-gray-200 text-xs">{row.examTitle}</div>
                                                    <div className="text-[9px] text-gray-500 font-bold mt-0.5">{row.date}</div>
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    <div className={cn(
                                                        "inline-block px-3 py-1 rounded-lg font-black text-xs",
                                                        row.score >= 90 ? "bg-emerald-500/10 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]" :
                                                            row.score >= 75 ? "bg-blue-500/10 text-blue-400" :
                                                                row.score >= 50 ? "bg-orange-500/10 text-orange-400" : "bg-red-500/10 text-red-500"
                                                    )}>
                                                        %{row.score}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-center font-bold text-gray-400 text-xs">{row.grade || 'مقبول'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="bg-[#020617]/40 rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
                            <div className="p-6 border-b border-white/5 flex items-center justify-between flex-row-reverse bg-purple-500/[0.03]">
                                <h3 className="text-lg font-black text-white flex items-center gap-2">
                                    <Trophy size={20} className="text-purple-400" />
                                    <span>سجل الاختبارات الدورية</span>
                                </h3>
                                <span className="text-[10px] bg-purple-500/10 text-purple-400 px-3 py-1 rounded-full font-black uppercase">{stats.totalExams} عنصر</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-right">
                                    <thead className="text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-white/5 bg-white/[0.02]">
                                        <tr>
                                            <th className="px-6 py-5">اسم الاختبار</th>
                                            <th className="px-6 py-5 text-center">النسبة المئوية</th>
                                            <th className="px-6 py-5 text-center">التقدير</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {filteredData.filter(r => !r.examTitle.includes('شيت') && !r.examTitle.includes('واجب') && (r as any).examType !== 'MIXED').map((row, idx) => (
                                            <tr key={idx} className="hover:bg-white/[0.02] transition-colors group">
                                                <td className="px-6 py-5">
                                                    <div className="font-black text-gray-200 text-xs">{row.examTitle}</div>
                                                    <div className="text-[9px] text-gray-500 font-bold mt-0.5">{row.date}</div>
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    <div className={cn(
                                                        "inline-block px-3 py-1 rounded-lg font-black text-xs",
                                                        row.score >= 90 ? "bg-emerald-500/10 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]" :
                                                            row.score >= 75 ? "bg-blue-500/10 text-blue-400" :
                                                                row.score >= 50 ? "bg-orange-500/10 text-orange-400" : "bg-red-500/10 text-red-500"
                                                    )}>
                                                        %{row.score}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-center font-bold text-gray-400 text-xs">{row.grade || 'مقبول'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="py-40 flex flex-col items-center justify-center opacity-20 text-center grayscale select-none pointer-events-none">
                    <Search size={120} className="text-white mb-8" />
                    <h2 className="text-5xl font-black text-white tracking-widest uppercase">بانتظار إدخال كود الطالب...</h2>
                    <p className="mt-4 text-gray-500 font-bold text-lg">أدخل رمز التعريف للبدء في تحليل البيانات الأكاديمية</p>
                </div>
            )}

            {/* Academic Report Modal */}
            {isPreviewOpen && selectedStudent && stats && (
                <div className="fixed inset-0 z-[10000] bg-black/95 backdrop-blur-xl flex justify-center overflow-y-auto p-4 md:p-10 custom-scrollbar animate-in fade-in duration-300">
                    <div className="relative w-full max-w-[900px]">
                        {/* Report Container (Word Style) */}
                        <div
                            id="student-full-report-content"
                            className="bg-white p-8 shadow-[0_0_60px_rgba(0,0,0,0.5)] relative border-[12px] flex flex-col mx-auto rounded-none overflow-hidden"
                            style={{
                                width: '210mm',
                                height: '296mm',
                                borderColor: '#1e3a8a',
                                fontFamily: 'Cairo, sans-serif',
                                boxSizing: 'border-box',
                                direction: 'rtl',
                                fontFeatureSettings: '"kern" 1',
                                textRendering: 'optimizeLegibility',
                                WebkitFontSmoothing: 'antialiased'
                            }}
                        >
                            {/* Inner Double Accent Line */}
                            <div className="absolute inset-2 border-2 pointer-events-none" style={{ borderColor: 'rgba(30, 58, 138, 0.1)' }} />
                            <div className="absolute inset-4 border pointer-events-none" style={{ borderColor: 'rgba(30, 58, 138, 0.05)' }} />

                            {/* Watermark Background */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none select-none z-0">
                                <span className="text-[12rem] font-black tracking-[0.2em] rotate-[-15deg]">REPORT</span>
                            </div>

                            <div className="flex-1 flex flex-col relative z-10 space-y-4 text-right">
                                {/* Premium Header Section */}
                                <div className="flex justify-between items-start border-b-4 pb-6 mb-2" style={{ borderColor: '#1e3a8a' }}>
                                    <div className="text-right space-y-1">
                                        <h1 className="text-2xl font-black" style={{ color: '#1e3a8a' }}>Mentora التعليمية</h1>
                                        <h2 className="text-sm font-black tracking-widest text-blue-600/40 uppercase">MENTORA PLATFORM</h2>
                                        <div className="flex items-center justify-end gap-2 font-bold text-[10px] pt-1 text-gray-400">
                                            <Calendar size={12} className="text-blue-500" />
                                            <span>التاريخ: {new Date().toLocaleDateString('ar-EG')}</span>
                                        </div>
                                    </div>
                                    <div className="w-20 h-20 rounded-full border-4 p-1 bg-white shadow-xl overflow-hidden" style={{ borderColor: '#1e3a8a' }}>
                                        <img src="https://i.postimg.cc/4NP62dYC/IMG-20260420-WA0023-2.jpg" className="w-full h-full object-cover" alt="Logo" />
                                    </div>
                                </div>

                                {/* Report Title Area */}
                                <div className="text-center mb-4">
                                    <h2 className="text-3xl font-black relative z-10 border-b-2 inline-block px-10 pb-1" style={{ color: '#1e3a8a', borderColor: '#1e3a8a' }}>تقرير مستوى الطالب الأكاديمي</h2>
                                    <p className="font-black text-[10px] mt-2 tracking-[0.4em] uppercase text-blue-500">Detailed Academic Performance Report</p>
                                </div>

                                {/* Student Info Card - Scaled Down */}
                                <div className="grid grid-cols-2 gap-4 mb-2">
                                    <div className="p-4 rounded-[1.5rem] border-2 bg-gray-50 flex items-center gap-4 justify-end border-gray-100">
                                        <div className="text-right flex-1">
                                            <div className="text-[9px] font-black uppercase tracking-widest text-blue-400 mb-0.5">اسم الطالب</div>
                                            <div className="text-lg font-black text-blue-900">{selectedStudent.username}</div>
                                            <div className="flex items-center justify-end gap-1.5 font-bold text-[10px] text-gray-500 mt-1">
                                                <Hash size={12} className="text-blue-400" />
                                                <span>{selectedStudent.level} - {selectedStudent.year}</span>
                                            </div>
                                        </div>
                                        <div className="w-16 h-16 rounded-xl border-4 border-white bg-white shadow-lg overflow-hidden">
                                            <img
                                                src={selectedStudent.avatarUrl || selectedStudent.profilePictureUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedStudent.username}`}
                                                className="w-full h-full object-cover"
                                                alt={selectedStudent.username}
                                            />
                                        </div>
                                    </div>

                                    <div className="p-4 rounded-[1.5rem] border-2 bg-gray-50 grid grid-cols-2 gap-3 border-gray-100">
                                        <div className="text-right flex flex-col justify-center">
                                            <div className="text-[9px] font-black uppercase mb-0.5 text-blue-400">المعدل العام</div>
                                            <div className="text-2xl font-black text-blue-900">%{stats.generalAvg}</div>
                                        </div>
                                        <div className="text-right border-r-2 border-white pr-3 flex flex-col justify-center">
                                            <div className="text-[9px] font-black uppercase mb-0.5 text-blue-400">الرتبة الأكاديمية</div>
                                            <div className="text-base font-black text-blue-900">{stats.generalAvg >= 90 ? 'ممتاز' : stats.generalAvg >= 75 ? 'جيد جداً' : stats.generalAvg >= 65 ? 'جيد' : 'مقبول'}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Tables Section - Scaled Down */}
                                <div className="space-y-4 mb-4">
                                    {/* Sheets Table */}
                                    <div>
                                        <div className="flex items-center justify-end gap-2 mb-2 text-blue-900">
                                            <span className="font-black text-lg">سجل الواجبات والأنشطة (Sheets)</span>
                                            <div className="w-1.5 h-6 bg-blue-900 rounded-full" />
                                        </div>
                                        <div className="overflow-hidden border-4 rounded-[1.5rem]" style={{ borderColor: '#1e3a8a' }}>
                                            <table className="w-full text-right border-collapse">
                                                <thead>
                                                    <tr className="text-white text-[11px] font-black uppercase tracking-widest bg-[#1e3a8a]">
                                                        <th className="p-3 border-l border-white/20">المحتوى</th>
                                                        <th className="p-3 border-l border-white/20 text-center">النسبة</th>
                                                        <th className="p-3 border-l border-white/20 text-center">التقدير</th>
                                                        <th className="p-3 text-left">التاريخ</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredData.filter(r => r.examTitle.includes('شيت') || r.examTitle.includes('واجب') || (r as any).examType === 'MIXED').map((row, idx) => (
                                                        <tr key={idx} className="text-[11px] font-bold border-b border-gray-100 text-blue-900/80">
                                                            <td className="p-3 border-l border-gray-100">{row.examTitle}</td>
                                                            <td className="p-3 border-l border-gray-100 text-center font-black">%{row.score}</td>
                                                            <td className="p-3 border-l border-gray-100 text-center">{row.grade || 'مقبول'}</td>
                                                            <td className="p-3 text-left opacity-40">{row.date}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Exams Table */}
                                    <div>
                                        <div className="flex items-center justify-end gap-2 mb-2 text-blue-900">
                                            <span className="font-black text-lg">سجل التقييمات والاختبارات الدورية</span>
                                            <div className="w-1.5 h-6 bg-blue-900 rounded-full" />
                                        </div>
                                        <div className="overflow-hidden border-4 rounded-[1.5rem]" style={{ borderColor: '#1e3a8a' }}>
                                            <table className="w-full text-right border-collapse">
                                                <thead>
                                                    <tr className="text-white text-[11px] font-black uppercase tracking-widest bg-[#1e3a8a]">
                                                        <th className="p-3 border-l border-white/20">الاختبار</th>
                                                        <th className="p-3 border-l border-white/20 text-center">النسبة</th>
                                                        <th className="p-3 border-l border-white/20 text-center">التقدير</th>
                                                        <th className="p-3 text-left">التاريخ</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredData.filter(r => !r.examTitle.includes('شيت') && !r.examTitle.includes('واجب') && (r as any).examType !== 'MIXED').map((row, idx) => (
                                                        <tr key={idx} className="text-[11px] font-bold border-b border-gray-100 text-blue-900/80">
                                                            <td className="p-3 border-l border-gray-100">{row.examTitle}</td>
                                                            <td className="p-3 border-l border-gray-100 text-center font-black">%{row.score}</td>
                                                            <td className="p-3 border-l border-gray-100 text-center">{row.grade || 'مقبول'}</td>
                                                            <td className="p-3 text-left opacity-40">{row.date}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>

                                {/* Analysis Chart Section - Scaled Down */}
                                <div className="p-6 border-4 border-dashed border-blue-100 rounded-[2rem] bg-gray-50 flex flex-col items-center gap-3 relative z-10">
                                    <div className="text-[11px] font-black text-blue-900 uppercase tracking-widest">مؤشر الأداء الدراسي العام</div>
                                    <div className="w-full max-w-sm h-4 bg-white rounded-full p-1 border-2 border-blue-50 shadow-inner overflow-hidden">
                                        <div
                                            className={cn(
                                                "h-full rounded-full transition-all duration-1000",
                                                stats.generalAvg >= 85 ? "bg-emerald-500" :
                                                    stats.generalAvg >= 70 ? "bg-blue-500" : "bg-orange-500"
                                            )}
                                            style={{ width: `${stats.generalAvg}%` }}
                                        />
                                    </div>
                                    <p className="text-[10px] font-bold text-gray-400 text-center leading-relaxed">
                                        تم استخراج هذا التقرير الأكاديمي الشامل آلياً من Mentora لعام 2026.<br />
                                        يعكس هذا السجل الأداء الحقيقي للطالب بناءً على كافة المشاركات الرقمية والتقييمات.
                                    </p>
                                </div>

                                {/* Footer Area - Scaled Down */}
                                <div className="pt-6 mt-auto border-t-2 border-gray-100 flex justify-between items-end relative bg-white">
                                    <div className="relative">
                                        <div className="w-24 h-24 rounded-full border-4 border-double border-blue-900 flex items-center justify-center rotate-[-15deg] bg-white relative overflow-hidden shadow-xl">
                                            <div className="absolute inset-0 opacity-40 flex items-center justify-center">
                                                <img src="https://i.postimg.cc/4NP62dYC/IMG-20260420-WA0023-2.jpg" className="w-full h-full object-cover rounded-full" alt="" />
                                            </div>
                                            <div className="flex flex-col items-center justify-center relative z-10">
                                                <div className="text-[12px] font-black text-blue-900 border-2 border-blue-900 px-3 py-0.5 rounded-lg">
                                                    مـعـتـمـد
                                                </div>
                                                <div className="text-[5px] font-black text-blue-900 mt-0.5 uppercase tracking-widest">OFFICIAL SEAL</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-right space-y-1">
                                        <div className="text-[11px] font-black text-blue-900">مدير المنصة</div>
                                        <div className="text-xl font-black px-3 pb-1 border-b-4 text-blue-900 font-cairo" style={{ borderColor: '#1e3a8a' }}>م/ عمرو لطفي</div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-100 flex justify-between items-center text-[9px] font-black text-gray-400 uppercase">
                                    <span>© {new Date().getFullYear()} Mentora Platform</span>
                                    <div className="flex items-center gap-2">
                                        <Globe size={10} />
                                        <a
                                            href="https://pullsehistorry.netlify.app"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-900 hover:underline cursor-pointer"
                                        >
                                            pullsehistorry.netlify.app
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Main Action Buttons for Preview Mode - Fixed at top */}
                        <div data-html2canvas-ignore="true" className="fixed top-6 left-1/2 -translate-x-1/2 flex items-center gap-6 z-[1010] print:hidden">
                            <button
                                onClick={() => setIsPreviewOpen(false)}
                                className="group px-8 py-4 bg-red-600 text-white rounded-2xl shadow-[0_15px_40px_rgba(220,38,38,0.4)] hover:bg-red-700 hover:scale-105 transition-all flex items-center gap-3 font-black text-sm border-2 border-white/20"
                            >
                                <X size={22} className="group-hover:rotate-90 transition-transform duration-300" />
                                <span>خروج من المعاينة</span>
                            </button>

                            {!localStorage.getItem('nt_admin_config') && (
                                <button
                                    onClick={handleDownloadReportPDF}
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

            {isDownloading && (
                <div data-html2canvas-ignore="true" className="fixed inset-0 z-[100000] flex flex-col items-center justify-center bg-black/98 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="relative w-24 h-24 mb-8">
                        <div className="absolute inset-0 border-4 border-blue-500/10 rounded-full" />
                        <div className="absolute inset-0 border-4 border-t-blue-500 rounded-full animate-spin shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                        <ShieldCheck size={40} className="absolute inset-0 m-auto text-blue-500 animate-pulse" />
                    </div>
                    <div className="text-center space-y-2">
                        <h2 className="text-2xl font-black text-white tracking-widest uppercase">جاري توثيق التقرير الرقمي...</h2>
                        <p className="text-gray-500 font-bold text-sm tracking-widest">Digital Authentication in Progress</p>
                    </div>
                </div>
            )}
        </div>
    );
};



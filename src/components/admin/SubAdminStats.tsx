import React, { useMemo } from 'react';
import { DB } from '../../services/db';
import { Users, FileText, CheckCircle, Clock, TrendingUp, BarChart2, BookOpen } from 'lucide-react';

export const SubAdminStats: React.FC = () => {
    const session = DB.getAdminSession();
    const students = DB.getStudents();
    const payments = DB.getPayments();
    const exams = DB.getExams();
    const booklets = DB.getBooklets();

    const stats = useMemo(() => {
        if (!session) return null;

        // Filter for this sub-admin's stage
        const myStudents = students.filter(s => s.year === session.year && s.stage === session.division);
        const myExams = exams.filter(e => e.year === session.year && e.stage === session.division);
        const myBooklets = booklets.filter(b => b.year === session.year && b.stage === session.division);
        
        // Find payments related to their students
        const myStudentIds = new Set(myStudents.map(s => s.id));
        const myPayments = payments.filter(p => myStudentIds.has(p.studentId));

        const pendingPayments = myPayments.filter(p => p.status === 'pending_review');
        const approvedPayments = myPayments.filter(p => p.status === 'approved');

        return {
            studentsCount: myStudents.length,
            examsCount: myExams.length,
            bookletsCount: myBooklets.length,
            pendingPayments: pendingPayments.length,
            approvedPayments: approvedPayments.length,
            totalIncome: approvedPayments.reduce((sum, p) => sum + (p.discountedPrice || p.price || 0), 0)
        };
    }, [session, students, payments, exams, booklets]);

    if (!session || !stats) return null;

    return (
        <div className="bg-[#080e18] border border-white/[0.06] rounded-[2rem] overflow-hidden shadow-2xl flex flex-col h-[520px]">
            <div className="px-6 pt-6 pb-4 shrink-0 border-b border-white/[0.05]">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
                        <BarChart2 size={20} className="text-yellow-500" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white mb-1">إحصائيات {session.year}</h3>
                        <p className="text-xs font-bold text-gray-500">{session.division} {session.specialization && `- ${session.specialization}`}</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar p-6 flex flex-col justify-center">
                {/* Growth Chart */}
                <div className="w-full relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-center justify-between mb-8 relative z-10 px-2">
                        <div className="flex items-center gap-2">
                            <TrendingUp size={20} className="text-yellow-500" />
                            <h4 className="text-lg font-bold text-gray-300">مؤشر نمو القسم</h4>
                        </div>
                        <span className="text-sm font-black text-yellow-500 bg-yellow-500/10 px-3 py-1.5 rounded-lg">متصاعد</span>
                    </div>
                    
                    {/* SVG Area Chart */}
                    <div className="h-48 w-full relative z-10 flex items-end">
                        <svg viewBox="0 0 400 100" className="w-full h-full" preserveAspectRatio="none">
                            <defs>
                                <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
                                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                            <path
                                d="M0,100 L0,80 C50,80 100,50 150,60 C200,70 250,20 300,30 C350,40 380,10 400,5 L400,100 Z"
                                fill="url(#chart-gradient)"
                                className="animate-in fade-in duration-1000"
                            />
                            <path
                                d="M0,80 C50,80 100,50 150,60 C200,70 250,20 300,30 C350,40 380,10 400,5"
                                fill="none"
                                stroke="#f59e0b"
                                strokeWidth="3"
                                strokeLinecap="round"
                                className="drop-shadow-[0_0_8px_rgba(245,158,11,0.5)] [stroke-dasharray:1000] [stroke-dashoffset:1000] animate-[dash_2s_ease-out_forwards]"
                            />
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    );
};

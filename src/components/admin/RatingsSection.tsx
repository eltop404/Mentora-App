import React, { useState, useEffect } from 'react';
import { Star, Trash2, Calendar, MapPin, Search } from 'lucide-react';
import { Rating } from '../../types';
import { DB } from '../../services/db';

export const RatingsSection = () => {
    const [ratings, setRatings] = useState<Rating[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        setRatings(DB.getRatings());
        const handleRatingsChange = () => setRatings(DB.getRatings());
        window.addEventListener('nt-ratings-change', handleRatingsChange);
        return () => window.removeEventListener('nt-ratings-change', handleRatingsChange);
    }, []);

    const handleDelete = (id: string) => {
        if (window.confirm('هل أنت متأكد من حذف هذا التقييم؟')) {
            DB.deleteRating(id);
        }
    };

    const handleDeleteAll = () => {
        if (window.confirm('🚨 تحذير: هل أنت متأكد تماماً من حذف جميع التقييمات في المنصة؟ هذا الإجراء لا يمكن التراجع عنه.')) {
            DB.deleteAllRatings();
        }
    };

    const filteredRatings = ratings.filter(r =>
        r.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.feedbackWord.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => parseInt(b.id) - parseInt(a.id));

    return (
        <div className="space-y-6" dir="rtl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/5 p-4 md:p-6 rounded-2xl border border-white/10">
                <div>
                    <h2 className="text-2xl font-black text-white flex items-center gap-2">
                        <Star className="text-yellow-400" fill="currentColor" />
                        التقييمات
                        <span className="text-sm bg-white/10 px-3 py-1 rounded-full text-indigo-300 mr-2 border border-white/5">
                            {filteredRatings.length} تقييم
                        </span>
                    </h2>
                    <p className="text-sm font-bold text-gray-400 mt-2">رؤية آراء وتقييمات الطلاب للمنصة.</p>
                </div>
                {ratings.length > 0 && (
                    <button
                        onClick={handleDeleteAll}
                        title="حذف جميع التقييمات"
                        className="px-4 py-2 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 rounded-xl border border-red-500/20 flex items-center gap-2 font-bold text-sm"
                    >
                        <Trash2 size={16} />
                        حذف الكل
                    </button>
                )}
            </div>

            <div className="bg-white/[0.02] p-4 md:p-6 rounded-3xl border border-white/5 shadow-2xl">
                {/* Search Bar */}
                <div className="relative mb-6">
                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                        <Search size={20} className="text-gray-500" />
                    </div>
                    <input
                        type="text"
                        placeholder="ابحث باسم الطالب أو محتوى التقييم..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[#0b1221]/50 border border-white/10 rounded-2xl py-4 pr-12 pl-4 text-white placeholder-gray-500 outline-none focus:border-indigo-500/50 focus:bg-white/5 transition-all text-sm font-bold shadow-inner"
                    />
                </div>

                {filteredRatings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center bg-black/20 rounded-2xl border border-white/5 border-dashed">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
                            <Star size={32} className="text-gray-500" />
                        </div>
                        <h3 className="text-lg font-black text-gray-400">لا توجد تقييمات</h3>
                        <p className="text-sm font-bold text-gray-500 mt-2">لم يقم أي طالب بتقييم المنصة بعد.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredRatings.map((rating) => (
                            <div key={rating.id} className="bg-[#0b1221] p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors group relative flex flex-col items-start shadow-md">
                                <button
                                    onClick={() => handleDelete(rating.id)}
                                    className="absolute top-4 left-4 p-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                                    title="حذف التقييم"
                                >
                                    <Trash2 size={16} />
                                </button>

                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-14 h-14 rounded-full bg-white/10 overflow-hidden border border-white/10 shrink-0">
                                        {rating.studentAvatar ? (
                                            <img src={rating.studentAvatar} alt={rating.studentName} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-800">
                                                <Star size={20} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <h3 className="font-black text-white text-base truncate max-w-[150px]">{rating.studentName}</h3>
                                        <div className="flex items-center gap-1 mt-1 text-xs font-medium text-gray-400" dir="rtl">
                                            <MapPin size={12} className="text-indigo-400 shrink-0" />
                                            <span className="truncate">{rating.studentLocation || 'غير محدد'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1 mb-3 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <Star key={s} size={14} className={s <= rating.stars ? "text-yellow-400 fill-yellow-400 drop-shadow-md" : "text-white/10"} />
                                    ))}
                                    <span className="text-xs font-black text-white mr-2">({rating.stars})</span>
                                </div>

                                <div className="bg-gradient-to-br from-indigo-500/10 to-transparent p-4 rounded-xl border border-indigo-500/10 w-full flex-grow text-center text-sm font-bold text-indigo-100 leading-relaxed mb-4">
                                    "{rating.feedbackWord}"
                                </div>

                                <div className="w-full flex items-center justify-between text-[11px] font-bold text-gray-500 border-t border-white/5 pt-3 mt-auto">
                                    <div className="flex items-center gap-1.5">
                                        <Calendar size={12} />
                                        <span>{rating.date}</span>
                                    </div>
                                    <span>{rating.time}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

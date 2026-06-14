import React, { useState, useEffect } from 'react';
import { Star, X } from 'lucide-react';
import { DB } from '../services/db';

interface RatingModalProps {
    isOpen: boolean;
    onClose: () => void;
    studentName: string;
    studentId: string;
    studentLocation?: string;
    studentAvatar?: string;
    theme: any;
}

export const PlatformRatingModal = ({ isOpen, onClose, studentName, studentId, studentLocation, studentAvatar, theme }: RatingModalProps) => {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [submitted, setSubmitted] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
        } else {
            setTimeout(() => setIsVisible(false), 300);
        }
    }, [isOpen]);

    if (!isOpen && !isVisible) return null;

    const getFeedbackText = (stars: number) => {
        switch (stars) {
            case 1: return `شكراً يا ${studentName}، نأسف لتجربتك وسنعمل جاهدين على التحسين فوراً.`;
            case 2: return `شكراً يا ${studentName}، رأيك يهمنا وسنحاول تقديم الأفضل دائماً.`;
            case 3: return `شكراً يا ${studentName}، تقييمك محل تقدير ونتمنى لك تجربة أفضل في المستقبل.`;
            case 4: return `شكراً يا ${studentName}، سعداء بتجربتك الجيدة معنا!`;
            case 5: return `شكراً يا ${studentName}، يسعدنا جداً أن المنصة نالت إعجابك وتجربتك كانت رائعة!`;
            default: return '';
        }
    };

    const handleSubmit = (finalRating: number) => {
        setRating(finalRating);

        // Save rating to DB
        DB.addRating({
            id: Date.now().toString(),
            studentId,
            studentName,
            studentAvatar: studentAvatar || '',
            studentLocation: studentLocation || '',
            stars: finalRating,
            feedbackWord: getFeedbackText(finalRating),
            date: new Date().toLocaleDateString('ar-EG'),
            time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
        });

        // Mark as rated locally
        localStorage.setItem(`nt_has_rated_${studentId}`, 'true');

        setSubmitted(true);
        setTimeout(() => {
            onClose();
        }, 3500);
    };

    return (
        <div className={`fixed inset-0 z-[999999] flex items-center justify-center p-4 ${isOpen ? 'bg-black/80 opacity-100' : 'bg-transparent opacity-0 pointer-events-none'}`} dir="rtl">
            <div className={`bg-[#0b141a] border border-white/10 rounded-3xl p-6 sm:p-8 max-w-[90%] sm:max-w-md w-full text-center shadow-[0_20px_60px_rgba(0,0,0,0.8)] relative overflow-hidden transform ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-8'}`}>
                {/* Accent glows */}
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-[60px] pointer-events-none opacity-20" style={{ backgroundColor: theme.primary }} />
                <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full blur-[60px] pointer-events-none opacity-20" style={{ backgroundColor: theme.primary }} />

                {!submitted ? (
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 mb-4 sm:mb-6 rounded-2xl bg-gradient-to-br from-white/10 to-transparent p-[1px] shadow-xl shrink-0">
                            <div className="w-full h-full bg-[#111b21] rounded-2xl flex items-center justify-center overflow-hidden">
                                {studentAvatar ? (
                                    <img src={studentAvatar} alt={studentName} className="w-full h-full object-cover" />
                                ) : (
                                    <Star className="w-8 h-8 sm:w-9 sm:h-9" style={{ color: theme.primary }} />
                                )}
                            </div>
                        </div>

                        <h2 className="text-lg sm:text-2xl font-black text-white mb-2">ما رأيك في تجربتك؟</h2>
                        <p className="text-xs sm:text-sm font-bold text-gray-400 mb-6 sm:mb-8 leading-relaxed">
                            أهلاً بك يا <span style={{ color: theme.primary }}>{studentName}</span>، نود معرفة رأيك في Mentora. تقييمك يساعدنا على تقديم الأفضل لك دائماً.
                        </p>

                        <div className="flex items-center justify-center gap-2 sm:gap-4 w-full mb-4 sm:mb-6" dir="ltr">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    onClick={() => handleSubmit(star)}
                                    className="transition-transform hover:scale-125 focus:outline-none"
                                >
                                    <Star
                                        className="w-10 h-10 sm:w-11 sm:h-11 drop-shadow-lg"
                                        fill={(hoverRating || rating) >= star ? "#eab308" : "transparent"}
                                        color={(hoverRating || rating) >= star ? "#eab308" : "#4b5563"}
                                    />
                                </button>
                            ))}
                        </div>

                        <div className="h-8 flex items-center justify-center">
                            {hoverRating > 0 && (
                                <span className="text-sm font-bold text-gray-300">
                                    {getFeedbackText(hoverRating)}
                                </span>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="relative z-10 flex flex-col items-center py-4 sm:py-6">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 mb-4 sm:mb-6 rounded-full bg-emerald-500/20 flex items-center justify-center relative">
                            <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full" />
                            <Star className="w-10 h-10 sm:w-12 sm:h-12 text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)] z-10" fill="currentColor" />
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black text-white mb-3 sm:mb-4">تم إرسال تقييمك!</h2>
                        <p className="text-sm sm:text-base font-bold text-emerald-400/90 leading-relaxed max-w-[280px]">
                            {getFeedbackText(rating)}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

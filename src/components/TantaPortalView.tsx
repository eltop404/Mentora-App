import React, { useState, useEffect } from 'react';
import { Loader2, LogIn } from 'lucide-react';

interface Props {
    theme: any;
}

export const TantaPortalView: React.FC<Props> = ({ theme }) => {
    const [isEntering, setIsEntering] = useState(false);
    const [timeLeft, setTimeLeft] = useState(3);
    const PRIMARY = theme?.primary || '#8b5cf6';

    const handleEnter = () => {
        setIsEntering(true);
        // Try playing a sound
        try {
            const audio = new Audio('/notification.mp3');
            audio.play().catch(e => console.log('Audio blocked', e));
        } catch (e) {}
    };

    useEffect(() => {
        if (isEntering && timeLeft > 0) {
            const timer = setTimeout(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
            return () => clearTimeout(timer);
        } else if (isEntering && timeLeft === 0) {
            // Open the portal when timer finishes
            window.open('https://tanta-services.online/TantaPortal/', '_blank');
            // Reset state so user can click again if they come back
            setIsEntering(false);
            setTimeLeft(3);
        }
    }, [isEntering, timeLeft]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] py-10 px-4 animate-in fade-in zoom-in-95 duration-500" dir="rtl">
            
            {/* Main Transparent Window Container */}
            <div className="w-full max-w-4xl p-4 md:p-8 flex flex-col items-center text-center relative">
                
                {/* Glow effects */}
                <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-gradient-to-br from-purple-500/10 via-transparent to-blue-500/10 animate-spin-slow pointer-events-none" />
                
                {/* Logo */}
                <div className="relative mb-6 z-10">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-white/10 shadow-[0_0_30px_rgba(255,255,255,0.1)] bg-black">
                        <img 
                            src="https://i.postimg.cc/1zw3cmRg/FB-IMG-1780433999357.jpg" 
                            alt="منصة المعهد" 
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>

                {/* Text Title */}
                <h2 className="text-sm md:text-base lg:text-lg xl:text-xl font-black text-cyan-400 mb-2 w-full px-2 z-10 leading-snug text-center" style={{ textShadow: '0 0 8px rgba(34,211,238,0.5)', letterSpacing: '0.02em' }}>
                    منصة المعهد العالي للحاسبات والمعلومات<br className="md:hidden" /> وتكنولوجيا الادارة - طنطا
                </h2>
                
                <p className="text-xs text-slate-400 font-bold mb-8 z-10">
                    الوصول المباشر للبوابة الإلكترونية للمعهد
                </p>

                {/* Button Area */}
                <div className="h-16 flex items-center justify-center w-full z-10">
                    {!isEntering ? (
                        <button
                            onClick={handleEnter}
                            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-black py-1.5 px-6 rounded-full flex items-center gap-2 transition-all active:scale-95 shadow-[0_0_20px_rgba(168,85,247,0.4)] border border-white/20 text-xs"
                        >
                            <LogIn size={16} />
                            الدخول للمنصة
                        </button>
                    ) : (
                        <div className="bg-black/40 border border-white/10 px-4 py-1.5 rounded-full flex items-center gap-2 shadow-inner">
                            <Loader2 size={16} className="animate-spin text-purple-400" />
                            <span className="text-xs font-bold text-slate-300">
                                جاري التوجيه خلال <span className="text-white text-sm mx-1 tabular-nums font-black drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]">{timeLeft}</span> ثواني...
                            </span>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

import React, { useState, useEffect } from 'react';
import { X, Crown } from 'lucide-react';

export const AdBanner = ({ theme, isActive }: { theme: any, isActive: boolean }) => {
    const [hidden, setHidden] = useState(true); // default true to avoid hydration mismatch

    useEffect(() => {
        // Read from local storage only on mount
        const isHidden = localStorage.getItem('nt_hide_golden_ad') === 'true';
        setHidden(isHidden);
    }, []);

    // If golden membership is active, or user manually closed the ad, hide it
    if (isActive || hidden) return null;

    const handleClose = (e: React.MouseEvent) => {
        e.stopPropagation();
        localStorage.setItem('nt_hide_golden_ad', 'true');
        setHidden(true);
    };

    const handleClick = () => {
        window.dispatchEvent(new CustomEvent('nt-open-golden-membership'));
        localStorage.setItem('nt_hide_golden_ad', 'true');
        setHidden(true);
    };

    return (
        <div 
            onClick={handleClick}
            className="w-full bg-gradient-to-r from-emerald-900/40 via-teal-900/40 to-emerald-900/40 border border-emerald-500/30 rounded-xl p-2.5 relative overflow-hidden mb-3 shadow-md group cursor-pointer hover:border-emerald-400/50 transition-all active:scale-[0.98]"
        >
            {/* Glowing orb */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/10 blur-[40px] -z-10" />

            <button 
                onClick={handleClose}
                className="absolute top-1.5 left-1.5 p-1 bg-black/40 text-gray-400 hover:text-white rounded-md transition-colors z-10"
                title="إغلاق الإعلان"
            >
                <X size={12} />
            </button>

            <div className="flex items-center gap-3 text-right">
                <div className="flex-1 pr-1">
                    <div className="flex items-center justify-end gap-2 mb-0.5">
                        <span className="text-[9px] font-black text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded border border-yellow-500/20">إعلان ممول</span>
                        <h4 className="text-xs font-black text-white group-hover:text-yellow-400 transition-colors">الآن.. احصل على العضوية الذهبية!</h4>
                    </div>
                    <p className="text-[10px] font-bold text-gray-400 leading-tight max-w-[95%] ml-auto">
                        تخلص من الإعلانات تماماً، واستمتع بتجربة دراسة احترافية بدون تشتيت، مع مميزات حصرية أخرى للمشتركين. اضغط هنا للتفاصيل!
                    </p>
                </div>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center shadow-lg shrink-0 border border-yellow-300 relative group-hover:scale-110 transition-transform">
                    <Crown size={18} className="text-black drop-shadow-sm" />
                </div>
            </div>
        </div>
    );
};

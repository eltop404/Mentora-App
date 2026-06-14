import React, { useState, useCallback, useEffect } from 'react';
import { LayoutGrid, X, Lock } from 'lucide-react';

interface NavItem {
    id: string;
    icon: React.ReactNode;
    label: string;
    notify?: boolean | number;
    isLocked?: boolean;
    onClick?: () => void;
}

interface ModernBottomNavProps {
    mainItems: NavItem[];
    moreItems: NavItem[];
    activeId: string | null;
    theme: any;
    onItemClick: (id: string) => void;
}

// Memoized nav button — zero transitions for instant feedback
const NavButton = React.memo(({ item, isActive, theme, onClick }: {
    item: NavItem; isActive: boolean; theme: any; onClick: () => void;
}) => (
    <button
        id={`tour-nav-${item.id}`}
        onClick={onClick}
        className="relative flex flex-col items-center justify-center w-full h-full gap-1 active:scale-90 touch-manipulation"
        style={{ WebkitTapHighlightColor: 'transparent' }}
    >
        {isActive && (
            <div
                className="absolute inset-0 mx-auto w-12 h-12 rounded-2xl z-0"
                style={{ backgroundColor: `${theme.primary}18` }}
            />
        )}
        <div className="relative z-10" style={{ color: isActive ? theme.primary : '#9ca3af' }}>
            {item.isLocked ? (
                <div className="relative">
                    <span className="opacity-40 grayscale">{item.icon}</span>
                    <Lock size={10} className="absolute -bottom-1 -right-1 text-white bg-red-500 rounded-full p-[2px] shadow-sm" />
                </div>
            ) : item.icon}
            {item.notify ? (
                <span className={`absolute -top-1.5 -right-1.5 flex items-center justify-center font-bold text-white bg-red-500 border-[1.5px] border-[#0f172a] ${typeof item.notify === 'number' && item.notify > 0 ? 'min-w-[16px] h-[16px] px-1 text-[9px] rounded-full' : 'w-2.5 h-2.5 rounded-full'}`}>
                    {typeof item.notify === 'number' && item.notify > 0 ? item.notify : ''}
                </span>
            ) : null}
        </div>
        <span className="relative z-10 text-[10px] font-bold" style={{ color: isActive ? theme.primary : '#9ca3af' }}>
            {item.label}
        </span>
    </button>
));
NavButton.displayName = 'NavButton';

// Memoized More Menu Item — no hover animations, instant
const MoreMenuItem = React.memo(({ item, theme, onClick }: {
    item: NavItem; theme: any; onClick: () => void;
}) => (
    <button
        onClick={onClick}
        className="flex flex-row-reverse items-center w-full p-3.5 rounded-[1.25rem] border border-white/5 active:bg-white/10 shadow-md"
        style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
    >
        <div
            className="flex items-center justify-center w-11 h-11 rounded-[0.875rem] ml-4 shrink-0"
            style={{ background: 'rgba(255,255,255,0.05)', color: theme.primary }}
        >
            {item.isLocked ? (
                <div className="relative">
                    <span className="opacity-40 grayscale">{item.icon}</span>
                    <Lock size={12} className="absolute -bottom-1 -right-1 text-white bg-red-500 rounded-full p-[2px]" />
                </div>
            ) : item.icon}
        </div>
        <span className="text-sm font-black text-gray-300 flex-1 text-right mr-2">{item.label}</span>
        {item.notify ? (
            <span className={`flex items-center justify-center font-bold text-white bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] mr-auto ${typeof item.notify === 'number' && item.notify > 0 ? 'min-w-[18px] h-[18px] px-1 text-[10px] rounded-full' : 'w-2.5 h-2.5 rounded-full'}`}>
                {typeof item.notify === 'number' && item.notify > 0 ? item.notify : ''}
            </span>
        ) : null}
    </button>
));
MoreMenuItem.displayName = 'MoreMenuItem';

const ModernBottomNav: React.FC<ModernBottomNavProps> = ({ mainItems, moreItems, activeId, theme, onItemClick }) => {
    const [isMoreOpen, setIsMoreOpen] = useState(false);

    const handleMainClick = useCallback((id: string) => {
        setIsMoreOpen(false);
        onItemClick(id);
    }, [onItemClick]);

    const toggleMore = useCallback(() => {
        setIsMoreOpen(prev => !prev);
    }, []);

    useEffect(() => {
        document.body.style.overflow = isMoreOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [isMoreOpen]);

    return (
        <>
            {/* Overlay — instant, conditional render, no animation */}
            {isMoreOpen && (
                <div
                    className="fixed inset-0 z-[9998]"
                    style={{ background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }}
                    onClick={() => setIsMoreOpen(false)}
                />
            )}

            {/* More Menu Bottom Sheet — instant via conditional render, no slide */}
            {isMoreOpen && (
                <div
                    className="fixed inset-x-0 bottom-0 z-[9999] rounded-t-[2rem] pb-[95px] max-h-[85vh] flex flex-col"
                    style={{
                        background: 'linear-gradient(180deg, rgba(11,14,20,0.52) 0%, rgba(8,10,16,0.58) 100%)',
                        backdropFilter: 'blur(28px)',
                        WebkitBackdropFilter: 'blur(28px)',
                        borderTop: '1px solid rgba(255,255,255,0.06)',
                        boxShadow: '0 -8px 32px rgba(0,0,0,0.5)',
                    }}
                >
                    {/* Drag handle */}
                    <div className="w-full flex justify-center py-3 shrink-0" onClick={() => setIsMoreOpen(false)}>
                        <div className="w-10 h-1 bg-gray-600 rounded-full opacity-40" />
                    </div>

                    {/* Header */}
                    <div className="px-5 pb-2 shrink-0 flex items-center justify-between">
                        <button
                            onClick={() => setIsMoreOpen(false)}
                            className="p-2 rounded-full active:scale-90 text-gray-400"
                            style={{ background: 'rgba(255,255,255,0.05)' }}
                        >
                            <X size={18} />
                        </button>
                        <h3 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-l from-[#fbbf24] to-[#f59e0b]">
                            المزيد من الأقسام
                        </h3>
                    </div>

                    {/* Items list */}
                    <div className="overflow-y-auto px-4 pb-4 space-y-2 no-scrollbar flex-1">
                        {moreItems.map(item => (
                            <MoreMenuItem
                                key={item.id}
                                item={item}
                                theme={theme}
                                onClick={() => {
                                    if (item.onClick) item.onClick();
                                    else onItemClick(item.id);
                                }}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Main Bottom Navigation Bar */}
            <div className="fixed bottom-0 inset-x-0 z-[10000] px-4 pb-5 pt-2 pointer-events-none">
                <div
                    className="h-[70px] flex items-center justify-around px-3 pointer-events-auto mx-auto max-w-[500px] rounded-[2rem]"
                    style={{
                        background: 'rgba(11,14,20,0.65)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
                    }}
                >
                    {mainItems.map(item => (
                        <NavButton
                            key={item.id}
                            item={item}
                            isActive={activeId === item.id && !isMoreOpen}
                            theme={theme}
                            onClick={() => handleMainClick(item.id)}
                        />
                    ))}
                    <NavButton
                        item={{ id: 'more', icon: <LayoutGrid size={24} strokeWidth={2.5} />, label: 'المزيد' }}
                        isActive={isMoreOpen}
                        theme={theme}
                        onClick={toggleMore}
                    />
                </div>
            </div>
        </>
    );
};

export default ModernBottomNav;

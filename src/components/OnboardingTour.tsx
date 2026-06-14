import React, { useEffect, useState, useRef } from 'react';

interface OnboardingTourProps {
    theme: any;
    userId: string;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ theme, userId }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const driverObjRef = useRef<any>(null);

    useEffect(() => {
        const hasSeen = localStorage.getItem(`has_seen_tour_${userId}`) === '1';
        if (hasSeen && !window.location.hash.includes('tour')) return;

        let script = document.getElementById('driver-js-script') as HTMLScriptElement;
        let link = document.getElementById('driver-js-style') as HTMLLinkElement;

        const initDriver = () => {
            if (!(window as any).driver) return;
            setIsLoaded(true);
        };

        if (!script) {
            script = document.createElement('script');
            script.id = 'driver-js-script';
            script.src = 'https://cdn.jsdelivr.net/npm/driver.js@1.3.1/dist/driver.js.iife.js';
            script.onload = initDriver;
            document.body.appendChild(script);

            link = document.createElement('link');
            link.id = 'driver-js-style';
            link.rel = 'stylesheet';
            link.href = 'https://cdn.jsdelivr.net/npm/driver.js@1.3.1/dist/driver.css';
            document.head.appendChild(link);
        } else {
            initDriver();
        }
    }, []);

    useEffect(() => {
        if (!isLoaded) return;
        const driver = (window as any).driver.js.driver; // driver variable contains js package via iife
        if (!driver) return;

        driverObjRef.current = driver({
            showProgress: true,
            animate: true,
            smoothScroll: true,
            allowClose: false,
            overlayColor: 'rgba(15, 23, 42, 0.90)', // Dark slate overlay
            stagePadding: 8,
            stageRadius: 16,
            progressText: '{{current}} من {{total}}',
            nextBtnText: 'التالي ▶',
            prevBtnText: '◀ السابق',
            doneBtnText: 'بدأ التعلم ✨',
            onHighlightStarted: (element: any) => {
                const el = element?.node;
                if (el) {
                    el.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'center' });
                    el.style.boxShadow = `0 0 30px ${theme.primary}60`;
                    el.style.transition = 'box-shadow 0.3s ease';
                    el.style.borderRadius = '16px'; // Matches stageRadius for beautiful glow effect
                }
            },
            onDestroyed: () => {
                localStorage.setItem(`has_seen_tour_${userId}`, '1');
                document.querySelectorAll('.driver-highlighted-element').forEach((el: any) => {
                    el.style.boxShadow = '';
                    el.style.borderRadius = '';
                });
                window.dispatchEvent(new CustomEvent('nt-tour-finished'));
            },
            steps: [
                { popover: { popoverClass: 'driver-center-step', title: 'مرحباً بك في Mentora! 👋', description: 'دعنا نأخذك في جولة سريعة للتعرف على أجزاء المنصة وكيفية استخدامها باحترافية.', side: 'over', align: 'center' } },

                // ── القائمة العلوية ──
                { element: '#tour-nav-logo',         popover: { popoverClass: 'driver-top-step', title: 'نبذة عن المنصة 🌟',         description: 'انقر هنا لمعرفة المزيد عن المنصة ومعلوماتنا.',                                                              side: 'bottom', align: 'start'  } },
                { element: '#tour-nav-notifications', popover: { popoverClass: 'driver-top-step', title: 'الإشعارات 🔔',              description: 'هنا تصلك كل التنبيهات والأخبار الجديدة الخاصة بالكورسات والملخصات.',                                         side: 'bottom', align: 'center' } },
                { element: '#tour-nav-top-profile',  popover: { popoverClass: 'driver-top-step', title: 'الملف الشخصي السريع 👤',    description: 'يمكنك الدخول لملفك الشخصي من هنا لتعديل بياناتك وصورتك.',                                                    side: 'bottom', align: 'end'    } },

                // ── القائمة السفلية (مطابقة لترتيب App.tsx) ──
                { element: '#tour-nav-booklets',        popover: { popoverClass: 'driver-bottom-step', title: 'الملخصات الدراسية 📚',        description: 'استعراض وشراء الملخصات الدراسية وإرسالها لباب منزلك.',                                               side: 'top', align: 'center' } },
                { element: '#tour-nav-sections',        popover: { popoverClass: 'driver-bottom-step', title: 'السكاشن 🏢',                   description: 'الوصول السريع لجميع السكاشن والمواد الخاصة بك بصورة منظمة.',                                          side: 'top', align: 'center' } },
                { element: '#tour-nav-exams',           popover: { popoverClass: 'driver-bottom-step', title: 'الامتحانات الشاملة 📝',        description: 'اختبر نفسك في الامتحانات العامة وراجع مستواك بوضوح.',                                                 side: 'top', align: 'center' } },
                { element: '#tour-nav-control',         popover: { popoverClass: 'driver-bottom-step', title: 'تحليل AI 📊',                  description: 'مركز متكامل لمتابعة تقدمك الدراسي وساعات المذاكرة وإحصائياتك الكاملة بالذكاء الاصطناعي.',            side: 'top', align: 'center' } },
                { element: '#tour-nav-student_report',  popover: { popoverClass: 'driver-bottom-step', title: 'تقرير الطالب 📉',              description: 'متابعة وتقييم مستواك ودرجاتك بشكل دوري لتحديد نقاط القوة والضعف.',                                     side: 'top', align: 'center' } },
                { element: '#tour-nav-golden_membership', popover: { popoverClass: 'driver-bottom-step', title: 'العضوية الذهبية 👑',         description: 'اشترك في العضوية الذهبية للاستفادة من مميزات حصرية وخصومات رائعة.',                                    side: 'top', align: 'center' } },
                { element: '#tour-nav-referrals',       popover: { popoverClass: 'driver-bottom-step', title: 'الإحالات 🤝',                  description: 'قم بدعوة أصدقائك للحصول على مكافآت ونقاط مجانية لك ولهم.',                                            side: 'top', align: 'center' } },
                { element: '#tour-nav-leaderboard',     popover: { popoverClass: 'driver-bottom-step', title: 'المتصدرون 🥇',                 description: 'تنافس مع زملائك واكتشف ترتيبك على مستوى الطلاب.',                                                      side: 'top', align: 'center' } },
                { element: '#tour-nav-ai',              popover: { popoverClass: 'driver-bottom-step', title: 'مساعد الذكاء الاصطناعي 🤖',   description: 'المساعد الذكي الخاص بك هنا لخدمتك والإجابة على أي سؤال.',                                             side: 'top', align: 'center' } },
                { element: '#tour-nav-certificates',    popover: { popoverClass: 'driver-bottom-step', title: 'شهاداتي 📜',                   description: 'لوحة الشرف وشهادات التقدير الخاصة بك بعد تفوقك.',                                                      side: 'top', align: 'center' } },
                { element: '#tour-nav-achievements',    popover: { popoverClass: 'driver-bottom-step', title: 'سجل الإنجازات 🏆',             description: 'تابع إنجازاتك واختباراتك المكتملة لتعزيز تقدمك.',                                                      side: 'top', align: 'center' } },
                { element: '#tour-nav-receipts',        popover: { popoverClass: 'driver-bottom-step', title: 'إيصالات المدفوعات 🧾',         description: 'استعرض جميع إيصالات مشترياتك وسجل المعاملات المالية الخاصة بك.',                                      side: 'top', align: 'center' } },
                { element: '#tour-nav-studentCard',     popover: { popoverClass: 'driver-bottom-step', title: 'بطاقة الطالب الرقمية 🪪',      description: 'استعرض هويتك التعليمية وبيانات تسجيلك داخل المنصة.',                                                  side: 'top', align: 'center' } },
                { element: '#tour-nav-courses',         popover: { popoverClass: 'driver-bottom-step', title: 'الكورسات التأسيسية 🎓',        description: 'دورات مكثفة تساعدك على فهم المادة بشكل منهجي.',                                                        side: 'top', align: 'center' } },
                { element: '#tour-nav-explanations',    popover: { popoverClass: 'driver-bottom-step', title: 'فيديوهات الشرح 🎬',            description: 'تجد فيها دروس الشرح الجبّارة الخاصة بك.',                                                              side: 'top', align: 'center' } },
                { element: '#tour-nav-tanta_portal',    popover: { popoverClass: 'driver-bottom-step', title: 'منصة المعهد 🏛️',              description: 'الوصول السريع لمنصة المعهد لضمان عدم تفويت أي تحديثات رسمية.',                                         side: 'top', align: 'center' } },
                { element: '#tour-nav-meeting',         popover: { popoverClass: 'driver-bottom-step', title: 'البث المباشر 📹',              description: 'احضر البثوث المباشرة مع المدرس لمراجعة المنهج بشكل تفاعلي.',                                          side: 'top', align: 'center' } },
                { element: '#tour-nav-developer',       popover: { popoverClass: 'driver-bottom-step', title: 'مطور المنصة 💻',               description: 'برمجة وتطوير المنصة تمت باحترافية، تعرف على المطور.',                                                  side: 'top', align: 'center' } },
                { element: '#tour-nav-support',         popover: { popoverClass: 'driver-bottom-step', title: 'الدعم الفني 🎧',               description: 'لأي مشكلة تقنية أو استفسار، تواصل مع فريق الدعم في أي وقت.',                                         side: 'top', align: 'center' } },
                { element: '#tour-nav-privacy',         popover: { popoverClass: 'driver-bottom-step', title: 'سياسة الخصوصية 🔐',           description: 'شروط استخدام المنصة وضوابط حفظ البيانات والمعلومات.',                                                  side: 'top', align: 'center' } },
                { element: '#tour-nav-themes',          popover: { popoverClass: 'driver-bottom-step', title: 'تخصيص المظهر 🎨',             description: 'غيّر ألوان المنصة بالكامل لتناسب ذوقك الشخصي من هذا القسم.',                                          side: 'top', align: 'center' } },
                { element: '#tour-nav-share',           popover: { popoverClass: 'driver-bottom-step', title: 'مشاركة المنصة 🔗',            description: 'انشر وشارك المنصة مع زملائك وأصدقائك بضغطة زر.',                                                      side: 'top', align: 'center' } },
                { element: '#tour-nav-profile',         popover: { popoverClass: 'driver-bottom-step', title: 'حسابك بالكامل ⚙️',            description: 'إدارة حسابك وتسجيل الخروج ومتابعة مدفوعاتك واشتراكاتك.',                                             side: 'top', align: 'center' } }
            ]
        });

        // Add custom dark styles
        const styleId = 'nt-driver-styles';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.innerHTML = `
                .driver-popover {
                    background-color: rgba(15, 23, 42, 0.95) !important;
                    backdrop-filter: none !important;
                    -webkit-backdrop-filter: none !important;
                    color: #e2e8f0 !important;
                    border-radius: 24px !important;
                    border: 1px solid rgba(255, 255, 255, 0.1) !important;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05) !important;
                    font-family: 'Cairo', 'Tajawal', sans-serif !important;
                    padding: 14px !important;
                    width: 260px !important;
                    max-width: 85vw !important;
                    z-index: 999999999 !important;

                    /* Force absolute center positioning for ALL screens as requested */
                    position: fixed !important;
                    top: 50% !important;
                    left: 50% !important;
                    transform: translate(-50%, -50%) !important;
                    bottom: auto !important;
                    right: auto !important;
                    margin: 0 !important;
                }
                
                /* Hide driver arrow fully since it's floating in the center */
                .driver-popover-arrow {
                    display: none !important;
                }

                .driver-popover-title {
                    color: ${theme.primary} !important;
                    font-size: 1rem !important;
                    font-weight: 900 !important;
                    margin-bottom: 6px !important;
                    text-shadow: 0 0 10px ${theme.primary}40 !important;
                    text-align: right !important;
                }
                .driver-popover-description {
                    color: #cbd5e1 !important;
                    font-size: 0.8rem !important;
                    line-height: 1.4 !important;
                    margin-bottom: 12px !important;
                    font-weight: 600 !important;
                    text-align: right !important;
                }
                .driver-popover-footer {
                    margin-top: 10px !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: space-between !important;
                    gap: 6px !important;
                }
                .driver-popover-progress-text {
                    color: #94a3b8 !important;
                    font-size: 0.75rem !important;
                    font-weight: 800 !important;
                }
                .driver-popover-navigation-btns {
                    display: flex !important;
                    gap: 6px !important;
                    flex: 1 !important;
                    justify-content: flex-end !important;
                }
                .driver-popover-footer button {
                    background-color: rgba(255, 255, 255, 0.1) !important;
                    backdrop-filter: none !important;
                    color: white !important;
                    border: 1px solid rgba(255, 255, 255, 0.1) !important;
                    text-shadow: none !important;
                    border-radius: 12px !important;
                    padding: 10px 16px !important;
                    font-weight: 800 !important;
                    font-size: 0.75rem !important;
                    cursor: pointer !important;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
                }
                .driver-popover-footer button.driver-popover-next-btn {
                    background-color: ${theme.primary} !important;
                    color: #000 !important;
                    border-color: ${theme.primary} !important;
                    box-shadow: 0 4px 14px ${theme.primary}40 !important;
                }
                .driver-popover-footer button:hover {
                    background-color: rgba(255,255,255,0.1) !important;
                    transform: translateY(-2px) !important;
                }
                .driver-popover-footer button.driver-popover-next-btn:hover {
                    background-color: ${theme.primary}ed !important;
                }
            `;
            document.head.appendChild(style);
        }

        const hasSeen = localStorage.getItem(`has_seen_tour_${userId}`) === '1';
        if (!hasSeen) {
            setTimeout(() => {
                if (driverObjRef.current) driverObjRef.current.drive();
            }, 1000);
        }

        const handleRestart = () => {
            localStorage.removeItem(`has_seen_tour_${userId}`);
            if (driverObjRef.current) driverObjRef.current.drive();
        };
        window.addEventListener('nt-start-tour', handleRestart);

        return () => {
            window.removeEventListener('nt-start-tour', handleRestart);

            if (driverObjRef.current) {
                driverObjRef.current.destroy();
                driverObjRef.current = null;
            }
        };
    }, [isLoaded, theme]);

    return null;
};

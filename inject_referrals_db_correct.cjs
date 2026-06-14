const fs = require('fs');
let content = fs.readFileSync('src/services/db.ts', 'utf8');

const gamificationLogic = `
    getReferralLevelDetails: (totalReferrals: number) => {
        if (totalReferrals >= 250) return { name: 'أسطورة الإحالات', badge: '🔥', nextLimit: null, min: 250 };
        if (totalReferrals >= 180) return { name: 'سفير المنصة', badge: '👑', nextLimit: 250, min: 180 };
        if (totalReferrals >= 130) return { name: 'خبير', badge: '🚀', nextLimit: 180, min: 130 };
        if (totalReferrals >= 80) return { name: 'محترف', badge: '💎', nextLimit: 130, min: 80 };
        if (totalReferrals >= 40) return { name: 'متميز', badge: '🥇', nextLimit: 80, min: 40 };
        if (totalReferrals >= 15) return { name: 'نشط', badge: '🥈', nextLimit: 40, min: 15 };
        if (totalReferrals >= 5) return { name: 'مبتدئ', badge: '🥉', nextLimit: 15, min: 5 };
        return { name: 'عضو جديد', badge: '🌱', nextLimit: 5, min: 0 };
    },
    getReferralAchievements: (totalReferrals: number, userAchievements: any[]) => {
        const milestones = [1, 5, 10, 25, 50, 100, 150, 250];
        const all = milestones.map(m => ({
            required: m,
            isUnlocked: totalReferrals >= m,
            achievedAt: userAchievements?.find((a: any) => a.required === m)?.achievedAt || (totalReferrals >= m ? new Date().toISOString() : null)
        }));
        return { all, unlocked: all.filter(a => a.isUnlocked) };
    },
    resetMonthlyReferralsIfNeeded: () => {
        const lastReset = StorageLayer.getItem('nt_last_monthly_reset');
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
        if (lastReset !== currentMonth) {
            const students = DB.getStudents();
            let changed = false;
            students.forEach(s => {
                if (s.monthly_referrals && s.monthly_referrals > 0) {
                    s.monthly_referrals = 0;
                    changed = true;
                }
            });
            if (changed) {
                StorageLayer.setItem(KEYS.STUDENTS, JSON.stringify(students));
                DB._syncToServer(KEYS.STUDENTS, students);
            }
            StorageLayer.setItem('nt_last_monthly_reset', currentMonth);
        }
    },
    checkAndTriggerReferralReward: (newUserId: string) => {
        // Find user
        const students = DB.getStudents();
        const user = students.find(s => s.id === newUserId);
        if (!user || !user.isEmailVerified || !user.referred_by || user.referral_reward_claimed) return;
        
        // Find referrer
        const referrer = students.find(s => s.referral_code === user.referred_by);
        if (referrer) {
            referrer.points = (referrer.points || 0) + 300;
            referrer.referral_count = (referrer.referral_count || 0) + 1;
            referrer.monthly_referrals = (referrer.monthly_referrals || 0) + 1;
            referrer.referral_earnings = (referrer.referral_earnings || 0) + 300;
            referrer.last_referral_date = new Date().toISOString();
            DB.updateLeaderboardRanks(students);
            
            user.points = (user.points || 0) + 500;
            user.referral_reward_claimed = true;
            
            StorageLayer.setItem(KEYS.STUDENTS, JSON.stringify(students));
            DB._syncToServer(KEYS.STUDENTS, students);
            notify('nt-students-change');
        }
    },
    updateLeaderboardRanks: (studentsList: any[] = null) => {
        const students = studentsList || DB.getStudents();
        // Update level/badge
        students.forEach(s => {
            const lvl = DB.getReferralLevelDetails(s.referral_count || 0);
            s.referral_level = lvl.name;
            s.referral_badge = lvl.badge;
        });
        
        // Update all-time ranking
        students.sort((a, b) => (b.referral_count || 0) - (a.referral_count || 0));
        students.forEach((s, idx) => {
            s.leaderboard_rank = idx + 1;
        });
        
        // Note: we don't save here if studentsList was passed (caller will save)
        if (!studentsList) {
            StorageLayer.setItem(KEYS.STUDENTS, JSON.stringify(students));
            DB._syncToServer(KEYS.STUDENTS, students);
        }
    }
};

// 🚀 Database Initialization`;

if (!content.includes('getReferralLevelDetails')) {
    content = content.replace('};\n\n// 🚀 Database Initialization', gamificationLogic);
    fs.writeFileSync('src/services/db.ts', content);
    console.log('db.ts updated with gamification logic correctly');
} else {
    console.log('Gamification logic already in db.ts');
}

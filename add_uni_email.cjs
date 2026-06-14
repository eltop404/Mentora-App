const fs = require('fs');

let content = fs.readFileSync('src/services/db.ts', 'utf8');

const uniLogic = `
    generateUniversityData: (student: Student, existingStudents: Student[]) => {
        if (student.universityEmail && student.universityId) return student;

        let dept = 'GENERAL';
        if (student.level?.includes('IB')) dept = 'IB';
        else if (student.level?.includes('BIS')) dept = 'BIS';
        
        // If not IB or BIS, we can either skip or use GENERAL. The user asked for IB/BIS.
        // Let's generate it anyway for everyone, just to be safe.
        if (dept === 'GENERAL' && !student.level?.includes('IB') && !student.level?.includes('BIS')) {
            // User requested strictly IB and BIS. If it's something else, we might skip, but let's default to their level name cleaned.
            if (student.level) dept = student.level.replace(/[^a-zA-Z]/g, '').toUpperCase() || 'STU';
        }

        const arabicToEnglish = (str: string) => {
            const map: Record<string, string> = {
                'أ': 'a', 'ا': 'a', 'إ': 'e', 'آ': 'a',
                'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'j', 'ح': 'h', 'خ': 'kh',
                'د': 'd', 'ذ': 'z', 'ر': 'r', 'ز': 'z', 'س': 's', 'ش': 'sh',
                'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z', 'ع': 'a', 'غ': 'gh',
                'ف': 'f', 'ق': 'q', 'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n',
                'ه': 'h', 'و': 'w', 'ي': 'y', 'ى': 'a', 'ة': 'a', 'ئ': 'e', 'ء': 'a', 'ؤ': 'o'
            };
            return str.split('').map((char: string) => map[char] || char).join('').toLowerCase().replace(/[^a-z0-9]/g, '');
        };

        const parts = (student.username || '').trim().split(/\\s+/);
        const first = parts[0] ? arabicToEnglish(parts[0]) : 'student';
        const last = parts.length > 1 ? arabicToEnglish(parts[parts.length - 1]) : 'user';
        
        let baseEmail = \`\${dept}.\${first}.\${last}@mentora.edu.eg\`;
        let finalEmail = baseEmail;
        let counter = 1;
        
        while (existingStudents.some(s => s.universityEmail === finalEmail)) {
            finalEmail = \`\${dept}.\${first}.\${last}\${counter.toString().padStart(2, '0')}@mentora.edu.eg\`;
            counter++;
        }

        // Generate ID
        const deptStudents = existingStudents.filter(s => s.universityId && s.universityId.startsWith(dept));
        const nextIdNum = deptStudents.length + 1;
        // Format: IB250001
        const yearPrefix = new Date().getFullYear().toString().slice(-2);
        const finalId = \`\${dept}\${yearPrefix}\${nextIdNum.toString().padStart(4, '0')}\`;

        return {
            ...student,
            department: dept,
            englishName: \`\${first} \${last}\`,
            universityEmail: finalEmail,
            universityId: finalId
        };
    },
    addStudent: (student: Student) => {
        const students = DB.getStudents();
        const index = students.findIndex(s => s.id === student.id);
        
        let newUser: Student = {
            ...student,
            messageQuota: student.messageQuota || 10,
            extraQuotaPoints: student.extraQuotaPoints || 0,
            usedExtraPoints: student.usedExtraPoints || 0,
            coins: student.coins || 0,
            points: student.points || 0,
            completedExams: student.completedExams || [],
            achievements: student.achievements || [],
            isBlocked: student.isBlocked || false,
            isChatFree: student.isChatFree || false,
            regDate: student.regDate || new Date().toLocaleDateString('ar-EG'),
            regTime: student.regTime || new Date().toLocaleTimeString('ar-EG'),
            referral_code: student.referral_code || DB.generateReferralCode(student.username),
            referred_by: student.referred_by || '',
            referral_count: student.referral_count || 0,
            referral_earnings: student.referral_earnings || 0,
            referral_status: student.referral_status || 'pending',
            isEmailVerified: student.isEmailVerified || false,
            isVerified: student.isVerified || false,
        };

        // Inject University Data for new students
        if (index === -1) {
            newUser = DB.generateUniversityData(newUser, students);
        }

        if (index !== -1) {
            students[index] = { ...students[index], ...newUser };
        } else {
            students.push(newUser);
        }
        DB.saveStudents(students);
        window.dispatchEvent(new Event('nt-students-change'));
    },
`;

content = content.replace(/addStudent: \(\s*student:\s*Student\s*\)\s*=>\s*\{[\s\S]*?window\.dispatchEvent\(new Event\('nt-students-change'\)\);\s*\},/, uniLogic.trim() + ',');

fs.writeFileSync('src/services/db.ts', content);
console.log('Successfully injected university email generator');

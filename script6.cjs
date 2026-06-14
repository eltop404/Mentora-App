const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Replace standard filter checks for all item types (c, b, l, e)
// Previously they looked like: (user!.level === 'إعدادية' ? b.stage === 'إعدادي' : b.stage === 'ثانوي') && b.year === user!.year && b.semester === user!.semester
// Or similar for c, l, e

const replaceFilters = () => {
    // 1. Replace the stage checks
    code = code.replace(/\(user!?\.level === 'إعدادية' \? [a-z]\.stage === 'إعدادي' : [a-z]\.stage === 'ثانوي'\)/g, match => {
        const itemVar = match.match(/([a-z])\.stage/)[1];
        return `${itemVar}.stage === user.level`;
    });
    
    code = code.replace(/\(userStage === 'إعدادي' \? [a-z]\.stage === 'إعدادي' : [a-z]\.stage === 'ثانوي'\)/g, match => {
        const itemVar = match.match(/([a-z])\.stage/)[1];
        return `${itemVar}.stage === userStage`;
    });

    // 2. Fix the semester checks
    const itemVars = ['c', 'b', 'l', 'e', 'item', 'course', 'lesson', 'booklet', 'exam'];
    itemVars.forEach(v => {
        const regex1 = new RegExp(`${v}\\.semester === user!?\\.semester`, 'g');
        code = code.replace(regex1, `(${v}.term === user.semester || !${v}.term || ${v}.term === 'الفصل الدراسي الأول') && (${v}.semester === user.specialization || ${v}.semester === '-' || !${v}.semester)`);
    });
};

replaceFilters();

// Fix `userStage` mapping. If `currentUser.level` is IB/BIS, `userStage` should just be `currentUser.level`.
// Currently in App.tsx there might be `const userStage = currentUser?.level === 'إعدادية' ? 'إعدادي' : 'ثانوي';`
code = code.replace(/const userStage = currentUser\?\.level === 'إعدادية' \? 'إعدادي' : 'ثانوي';/g, "const userStage = currentUser?.level;");

// Fix `e.stage === (user.level === 'إعدادية' ? 'إعدادي' : 'ثانوي')` in getExams
code = code.replace(/e\.stage === \(user\.level === 'إعدادية' \? 'إعدادي' : 'ثانوي'\)/g, "e.stage === user.level");

fs.writeFileSync('src/App.tsx', code);
console.log('App.tsx filtered correctly');

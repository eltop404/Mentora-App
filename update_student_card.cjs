const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/components/AdminDashboard.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Add isSubAdmin to StudentCard
content = content.replace(
    /const isOnline = DB.getOnlineStatus\(student\.id\);/,
    "const isOnline = DB.getOnlineStatus(student.id);\n  const isSubAdmin = DB.getAdminSession()?.role === 'SUB_ADMIN';"
);

// 2. Wrap تغيير كلمة المرور with {!isSubAdmin && (...)}
content = content.replace(
    /<button onClick=\{\(\) => setIsEditingPassword\(true\)\} className="flex items-center gap-1\.5 text-\[10px\] font-black text-emerald-400 hover:opacity-80 transition-opacity">[\s\S]*?<\/button>/,
    `{!isSubAdmin && (
                  <button onClick={() => setIsEditingPassword(true)} className="flex items-center gap-1.5 text-[10px] font-black text-emerald-400 hover:opacity-80 transition-opacity">
                    <span>تغيير كلمة المرور</span>
                    <Edit size={12} />
                  </button>
                )}`
);

// 3. Update all right-panel buttons to check for isSubAdmin
// Button: حذف
content = content.replace(
    /<button onClick=\{\(\) => handleDeleteStudent\(student\.id, student\.username\)\} className="text-\[11px\] font-black text-red-500\/60 hover:text-red-500 transition-colors text-center w-full mb-1">حذف<\/button>/,
    `<button disabled={isSubAdmin} onClick={() => handleDeleteStudent(student.id, student.username)} className={cn("text-[11px] font-black text-red-500/60 hover:text-red-500 transition-colors text-center w-full mb-1 flex items-center justify-center gap-2", isSubAdmin && "opacity-50 cursor-not-allowed pointer-events-none")}>حذف {isSubAdmin && <Lock size={10} />}</button>`
);

// Button: حظر طالب
content = content.replace(
    /<button onClick=\{\(\) => handleBlockStudent\(student\)\} className=\{cn\([\s\S]*?"w-full py-3\.5 rounded-2xl flex items-center justify-center gap-3 font-black text-xs transition-all shadow-xl",[\s\S]*?student\.isBlocked \? "bg-yellow-500 text-black translate-y-\[-2px\] shadow-yellow-500\/20" : "bg-yellow-500\/10 text-yellow-500 hover:bg-yellow-500\/20"[\s\S]*?\)\}>[\s\S]*?<span>\{student\.isBlocked \? 'إلغاء حظر' : 'حظر طالب'\}<\/span>[\s\S]*?<\/button>/,
    `<button disabled={isSubAdmin} onClick={() => handleBlockStudent(student)} className={cn(
          "w-full py-3.5 rounded-2xl flex items-center justify-center gap-3 font-black text-xs transition-all shadow-xl",
          student.isBlocked ? "bg-yellow-500 text-black translate-y-[-2px] shadow-yellow-500/20" : "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20",
          isSubAdmin && "opacity-50 cursor-not-allowed pointer-events-none"
        )}>
          <span>{student.isBlocked ? 'إلغاء حظر' : 'حظر طالب'}</span>
          {isSubAdmin && <Lock size={14} />}
        </button>`
);

// Button: إعادة الامتحانات
content = content.replace(
    /<button onClick=\{handleResetExams\} className="w-full py-3\.5 rounded-2xl bg-cyan-500\/10 text-cyan-400 border border-cyan-500\/20 flex items-center justify-center gap-3 font-black text-xs transition-all hover:bg-cyan-500\/20">[\s\S]*?<span>إعادة الامتحانات<\/span>[\s\S]*?<RotateCcw size=\{16\} \/>[\s\S]*?<\/button>/,
    `<button disabled={isSubAdmin} onClick={handleResetExams} className={cn("w-full py-3.5 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center gap-3 font-black text-xs transition-all hover:bg-cyan-500/20", isSubAdmin && "opacity-50 cursor-not-allowed pointer-events-none")}>
          <span>إعادة الامتحانات</span>
          {isSubAdmin ? <Lock size={16} /> : <RotateCcw size={16} />}
        </button>`
);

// Button: إعادة الشيت
content = content.replace(
    /<button onClick=\{handleResetSheets\} className="w-full py-3\.5 rounded-2xl bg-emerald-500\/10 text-emerald-400 border border-emerald-500\/20 flex items-center justify-center gap-3 font-black text-xs transition-all hover:bg-emerald-500\/20">[\s\S]*?<span>إعادة الشيت<\/span>[\s\S]*?<RotateCcw size=\{16\} \/>[\s\S]*?<\/button>/,
    `<button disabled={isSubAdmin} onClick={handleResetSheets} className={cn("w-full py-3.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center gap-3 font-black text-xs transition-all hover:bg-emerald-500/20", isSubAdmin && "opacity-50 cursor-not-allowed pointer-events-none")}>
          <span>إعادة الشيت</span>
          {isSubAdmin ? <Lock size={16} /> : <RotateCcw size={16} />}
        </button>`
);

// Button: حظر IP
content = content.replace(
    /<button onClick=\{\(\) => handleBlockIP\(student\.ip \|\| '127\.0\.0\.1', student\.username\)\} className="w-full py-3\.5 rounded-2xl bg-purple-500\/10 text-purple-400 border border-purple-500\/20 flex items-center justify-center gap-3 font-black text-xs transition-all hover:bg-purple-500\/20">[\s\S]*?<span>حظر IP<\/span>[\s\S]*?<Globe size=\{16\} \/>[\s\S]*?<\/button>/,
    `<button disabled={isSubAdmin} onClick={() => handleBlockIP(student.ip || '127.0.0.1', student.username)} className={cn("w-full py-3.5 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center gap-3 font-black text-xs transition-all hover:bg-purple-500/20", isSubAdmin && "opacity-50 cursor-not-allowed pointer-events-none")}>
          <span>حظر IP</span>
          {isSubAdmin ? <Lock size={16} /> : <Globe size={16} />}
        </button>`
);

// Button: المحتوى المفتوح بالنقاط
content = content.replace(
    /<button onClick=\{\(\) => handleManagePointsAccess\(student\)\} className="w-full py-3\.5 rounded-2xl bg-yellow-900\/20 text-yellow-600 border border-yellow-600\/20 flex items-center justify-center gap-3 font-black text-xs transition-all hover:bg-yellow-900\/30 text-center">[\s\S]*?<span>المحتوى المفتوح بالنقاط<\/span>[\s\S]*?<\/button>/,
    `<button disabled={isSubAdmin} onClick={() => handleManagePointsAccess(student)} className={cn("w-full py-3.5 rounded-2xl bg-yellow-900/20 text-yellow-600 border border-yellow-600/20 flex items-center justify-center gap-3 font-black text-xs transition-all hover:bg-yellow-900/30 text-center", isSubAdmin && "opacity-50 cursor-not-allowed pointer-events-none")}>
          <span>المحتوى المفتوح بالنقاط</span>
          {isSubAdmin && <Lock size={16} />}
        </button>`
);

// 4. Remove polls_manage from subAdminAllowedIds
content = content.replace(
    /const subAdminAllowedIds = \['dashboard', 'students', 'student_reports', 'content', 'sections_manage', 'exams_manage', 'booklets', 'courses', 'lessons', 'results', 'polls_manage', 'ratings'\];/,
    "const subAdminAllowedIds = ['dashboard', 'students', 'student_reports', 'content', 'sections_manage', 'exams_manage', 'booklets', 'courses', 'lessons', 'results', 'ratings'];"
);

fs.writeFileSync(file, content, 'utf8');

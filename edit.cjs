const fs = require('fs');
const file = 'src/components/AdminDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

// remove lock
content = content.replace(
  /\{\/\*\s*Sub-admin lock overlay\s*\*\/\}[\s\S]*?<\/div>\s*\)\}/,
  `{showSubAdminAlert && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] z-20 flex items-center justify-center pointer-events-none">
            <div className="bg-red-500/95 text-white text-[11px] leading-relaxed font-black px-4 py-3 rounded-2xl text-center shadow-[0_0_20px_rgba(239,68,68,0.4)] backdrop-blur-md animate-in fade-in zoom-in slide-in-from-bottom-2 duration-300 border border-red-400/30">
              غير مصرح لك!
              <br />
              <span className="text-[9px] opacity-90 mt-1 block">هذه الأزرار تحت استخدام الأدمن الأساسي فقط.</span>
            </div>
          </div>
        )}`
);

// replace all buttons one by one using a smart regex
content = content.replace(
  /<button\s*onClick={\(\) => handleDeleteStudent\(student\.id, student\.username\)}[\s\S]*?>حذف<\/button>/,
  `<button
          onClick={() => handleRestrictedAction(() => handleDeleteStudent(student.id, student.username))}
          className="text-[11px] font-black transition-colors text-center w-full mb-1 text-red-500/60 hover:text-red-500"
        >حذف</button>`
);

content = content.replace(
  /<button\s*onClick={\(\) => handleBlockStudent\(student\)}[\s\S]*?<\/button>/,
  `<button
          onClick={() => handleRestrictedAction(() => handleBlockStudent(student))}
          className={cn(
            "w-full py-3.5 rounded-2xl flex items-center justify-center gap-3 font-black text-xs transition-all shadow-xl",
            student.isBlocked ? "bg-yellow-500 text-black translate-y-[-2px] shadow-yellow-500/20" : "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20"
          )}
        >
          <span>{student.isBlocked ? 'إلغاء حظر' : 'حظر طالب'}</span>
        </button>`
);

content = content.replace(
  /<button\s*onClick={handleResetExams}[\s\S]*?RotateCcw size={16} \/>\s*<\/button>/,
  `<button
          onClick={() => handleRestrictedAction(handleResetExams)}
          className="w-full py-3.5 rounded-2xl border flex items-center justify-center gap-3 font-black text-xs transition-all bg-cyan-500/10 text-cyan-400 border-cyan-500/20 hover:bg-cyan-500/20"
        >
          <span>إعادة الامتحانات </span>
          <RotateCcw size={16} />
        </button>`
);

content = content.replace(
  /<button\s*onClick={handleResetSheets}[\s\S]*?RotateCcw size={16} \/>\s*<\/button>/,
  `<button
          onClick={() => handleRestrictedAction(handleResetSheets)}
          className="w-full py-3.5 rounded-2xl border flex items-center justify-center gap-3 font-black text-xs transition-all bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
        >
          <span>إعادة الشيتات </span>
          <RotateCcw size={16} />
        </button>`
);

content = content.replace(
  /<button\s*onClick={\(\) => handleBlockIP\(student\.ip \|\| '127\.0\.0\.1', student\.username\)}[\s\S]*?Globe size={16} \/>\s*<\/button>/,
  `<button
          onClick={() => handleRestrictedAction(() => handleBlockIP(student.ip || '127.0.0.1', student.username))}
          className="w-full py-3.5 rounded-2xl border flex items-center justify-center gap-3 font-black text-xs transition-all bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/20"
        >
          <span>حظر IP</span>
          <Globe size={16} />
        </button>`
);

content = content.replace(
  /<button\s*onClick={\(\) => handleManagePointsAccess\(student\)}[\s\S]*?المحتوى المفتوح بالنقاط<\/span>\s*<\/button>/,
  `<button
          onClick={() => handleRestrictedAction(() => handleManagePointsAccess(student))}
          className="w-full py-3.5 rounded-2xl border flex items-center justify-center gap-3 font-black text-xs transition-all text-center bg-yellow-900/20 text-yellow-600 border-yellow-600/20 hover:bg-yellow-900/30"
        >
          <span>المحتوى المفتوح بالنقاط</span>
        </button>`
);

fs.writeFileSync(file, content);
console.log('done');

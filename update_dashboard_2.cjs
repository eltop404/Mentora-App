const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/components/AdminDashboard.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Blur IP
content = content.replace(
    /<span className="text-\[11px\] text-gray-400 font-mono bg-white\/\[0\.02\] px-3 py-0\.5 rounded-lg">\{student\.ip \|\| '156\.221\.32\.0'\}<\/span>/,
    `<span className={cn("text-[11px] text-gray-400 font-mono bg-white/[0.02] px-3 py-0.5 rounded-lg", isSubAdmin && "blur-md select-none")}>{student.ip || '156.221.32.0'}</span>`
);

// 2. Hide all password buttons for SubAdmin
content = content.replace(
    /<>([\s\S]*?)<button onClick=\{\(\) => setShowPassword\(!showPassword\)\}[\s\S]*?<\/button>([\s\S]*?)\{\!isSubAdmin && \([\s\S]*?<\/button>\s*\)\}([\s\S]*?)<button[\s\S]*?onClick=\{\(\) => \{[\s\S]*?navigator\.clipboard\.writeText\(student\.password\);[\s\S]*?\}\}[\s\S]*?<\/button>([\s\S]*?)<\/>/,
    `{!isSubAdmin && (
              <>
                <button onClick={() => setShowPassword(!showPassword)} className="flex items-center gap-1.5 text-[10px] font-black text-primary hover:opacity-80 transition-opacity" style={{ color: theme.primary }}>
                  <span>عرض</span>
                  <Eye size={12} />
                </button>
                <button onClick={() => setIsEditingPassword(true)} className="flex items-center gap-1.5 text-[10px] font-black text-emerald-400 hover:opacity-80 transition-opacity">
                  <span>تغيير كلمة المرور</span>
                  <Edit size={12} />
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(student.password);
                    setIsCopied(true);
                    setTimeout(() => setIsCopied(false), 2000);
                  }}
                  className="flex items-center gap-1.5 text-[10px] font-black text-amber-500 hover:opacity-80 transition-opacity"
                >
                  <span>{isCopied ? 'تم النسخ' : 'نسخ'}</span>
                  {isCopied ? <CheckCircle size={12} className="animate-bounce" /> : <Copy size={12} />}
                </button>
              </>
            )}`
);

fs.writeFileSync(file, content, 'utf8');

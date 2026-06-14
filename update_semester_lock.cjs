const fs = require('fs');
const path = require('path');

const filesToUpdate = ['ContentManagement.tsx', 'SectionsManagement.tsx'];

filesToUpdate.forEach(fileName => {
    const file = path.join(__dirname, 'src/components/admin', fileName);
    let content = fs.readFileSync(file, 'utf8');

    content = content.replace(
        /\{\/\* Semester Lock Switcher \*\/\}\s*<div className="flex items-center gap-2 bg-white\/5 p-2 rounded-3xl border border-white\/5 self-end">[\s\S]*?<\/div>/,
        `{/* Semester Lock Switcher */}
                {DB.getAdminSession()?.role !== 'SUB_ADMIN' && (
                <div className="flex items-center gap-2 bg-white/5 p-2 rounded-3xl border border-white/5 self-end">
                    <button
                        onClick={() => handleLockToggle(false)}
                        className={cn(
                            "px-6 py-2.5 rounded-2xl font-black text-xs transition-all flex items-center gap-2",
                            !currentLockStatus ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-gray-500 hover:bg-white/5"
                        )}
                    >
                        <Unlock size={14} />
                        فتح الفصل
                    </button>
                    <button
                        onClick={() => handleLockToggle(true)}
                        className={cn(
                            "px-6 py-2.5 rounded-2xl font-black text-xs transition-all flex items-center gap-2",
                            currentLockStatus ? "bg-red-500 text-white shadow-lg shadow-red-500/20" : "text-gray-500 hover:bg-white/5"
                        )}
                    >
                        <Lock size={14} />
                        قفل الفصل
                    </button>
                </div>
                )}`
    );

    fs.writeFileSync(file, content, 'utf8');
});

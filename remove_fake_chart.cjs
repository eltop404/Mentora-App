const fs = require('fs');
const file = 'src/components/AdminDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

// Fix 1: Sub-admin stats should use isolatedStudents and not ALL students
const statTarget = `                    <div className="text-2xl font-black text-emerald-400 flex items-center justify-center gap-2">
                      {(students || []).length}
                      <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                    </div>`;

const statReplace = `                    <div className="text-2xl font-black text-emerald-400 flex items-center justify-center gap-2">
                      {subAdminConfig ? (isolatedStudents || []).filter(s => !s.isDeleted).length : (students || []).length}
                      <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                    </div>`;

content = content.replace(statTarget, statReplace);

// Fix 2: Remove the fake chart completely
const fakeChartStart = '{/* Sub-admin: Frameless Curved Area Chart */}';
const fakeChartEnd = '                  })()}';

const startIdx = content.indexOf(fakeChartStart);
const endIdx = content.indexOf(fakeChartEnd, startIdx) + fakeChartEnd.length;

if (startIdx !== -1 && endIdx !== -1) {
  content = content.substring(0, startIdx) + content.substring(endIdx);
}

fs.writeFileSync(file, content);
console.log('done');

const fs = require('fs');
const path = require('path');

const filePath = path.join('d:\\نبض-التاريخ', 'src', 'components', 'admin', 'CourseManagement.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// The old URL input block (lines 477-491 in the file)
const oldBlock = `                                                 <div className="space-y-2">
                                                     <div className="relative">
                                                         <input
                                                             type="text"
                                                             value={vid.url}
                                                             onChange={e => {
                                                                 const next = [...form.videos];
                                                                 next[idx].url = e.target.value;
                                                                 setForm(prev => ({ ...prev, videos: next }));
                                                             }}
                                                             placeholder="ضع رابط الفيديو هنا (YouTube / Drive...)"
                                                             className="w-full bg-black/60 border border-white/5 rounded-xl py-2.5 pr-4 pl-10 text-right outline-none focus:border-cyan-500/30 text-xs font-bold transition-all"
                                                         />
                                                         <Link size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400/50" />
                                                     </div>`;

const newBlock = `                                                 <div className="space-y-2">
                                                     <div className="flex items-center gap-2">
                                                         <div className="relative flex-1">
                                                             <input
                                                                 type="text"
                                                                 value={vid.url}
                                                                 onChange={e => {
                                                                     const next = [...form.videos];
                                                                     next[idx].url = e.target.value;
                                                                     setForm(prev => ({ ...prev, videos: next }));
                                                                 }}
                                                                 placeholder="ضع رابط الفيديو هنا (YouTube / Drive...)"
                                                                 className="w-full bg-black/60 border border-white/5 rounded-xl py-2.5 pr-4 pl-10 text-right outline-none focus:border-cyan-500/30 text-xs font-bold transition-all"
                                                             />
                                                             <Link size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400/50 pointer-events-none" />
                                                         </div>
                                                         {vid.url.trim() && (
                                                             <button
                                                                 type="button"
                                                                 onClick={() => {
                                                                     setTrimStart(0);
                                                                     setTrimEnd(0);
                                                                     setVideoDuration(0);
                                                                     setPreviewVideo({ url: vid.url.trim(), idx });
                                                                 }}
                                                                 className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 rounded-xl font-black text-[11px] transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
                                                                 title="معاينة الفيديو"
                                                             >
                                                                 <Play size={12} />
                                                                 تشغيل
                                                             </button>
                                                         )}
                                                     </div>`;

// Normalize line endings for comparison
const normalizeLE = s => s.replace(/\r\n/g, '\n');
const contentNorm = normalizeLE(content);
const oldBlockNorm = normalizeLE(oldBlock);

if (!contentNorm.includes(oldBlockNorm)) {
  console.error('OLD BLOCK NOT FOUND!');
  // Print a snippet from the file around where it should be
  const idx = contentNorm.indexOf('space-y-2');
  console.log('Found space-y-2 at index:', idx);
  console.log('Context:\n', contentNorm.substring(idx - 100, idx + 400));
  process.exit(1);
}

// Do the replacement on normalized content
const updatedNorm = contentNorm.replace(oldBlockNorm, normalizeLE(newBlock));

// Convert back to CRLF to match original file
const updated = updatedNorm.replace(/\n/g, '\r\n');

fs.writeFileSync(filePath, updated, 'utf8');
console.log('SUCCESS: File updated with Play button!');

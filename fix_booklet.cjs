const fs = require('fs');
const file = 'src/components/admin/BookletManagement.tsx';
const content = fs.readFileSync(file, 'utf8');
const lines = content.split('\\n');

let restored = '';
// Keep everything up to line 415
for (let i = 0; i < 415; i++) {
    restored += lines[i] + '\\n';
}

// Restore the end of requiredPoints block
restored += `                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={form.requiredPoints}
                                        onChange={e => setForm({ ...form, requiredPoints: Number(e.target.value) })}
                                        min="0"
                                        className="w-full bg-cyan-500/10 border border-cyan-500/20 rounded-2xl py-3 px-10 text-right outline-none focus:border-cyan-500/50 font-black text-cyan-400"
                                    />
                                    <Brain size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400" />
                                </div>
                                <span className="text-[9px] text-gray-500 font-bold mt-1 block">اتركه 0 إذا لم تكن تريد قفله بالنقاط</span>
                            </div>
                        </div>\\n`;

// Append everything from line 580 (the blank line before the next grid) onwards
for (let i = 580; i < lines.length; i++) {
    restored += lines[i];
    if (i !== lines.length - 1) {
        restored += '\\n';
    }
}

fs.writeFileSync(file, restored);
console.log('BookletManagement restored and thumbnail removed!');

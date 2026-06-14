const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf8');

// Remove the stale "رجوع" rows that are leftover labels (not actual buttons)
// These appear as: <div className="flex items-center justify-end gap-2 text-white/cyan-400"><span ...>رجوع</span><CreditCard/Lock/> </div>
// They are NOT the real back button (which is now in the sticky header)

// Pattern 1: the one with text-white + CreditCard
const old1 = `                           <div className="space-y-3">
                             <div className="flex items-center justify-end gap-2 text-white">
                               <span className="font-bold text-[10px]">رجوع</span>
                               <CreditCard size={12} className="text-gray-500" />
                             </div>

                             `;
const new1 = `                          <div className="space-y-3">
                             `;

const result1 = content.replace(old1, new1);
if (result1 === content) {
  console.log('Pattern 1 not found - trying trimmed search...');
  // Try finding by parts
  const idx = content.indexOf('<CreditCard size={12} className="text-gray-500" />');
  if (idx !== -1) {
    console.log('Found CreditCard at char:', idx, ', near line:', content.substring(0, idx).split('\n').length);
  }
} else {
  console.log('Pattern 1 replaced successfully');
  fs.writeFileSync('src/App.tsx', result1, 'utf8');
}

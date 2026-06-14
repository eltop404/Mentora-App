const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf8');
const lines = content.split('\n');

// Count divs opened from line 9411 (the modal container) to 9707 to find the right number
// The modal structure should close with exactly 3 </div>s:
// 1. </div> closes the scrollable content div
// 2. </div> closes the outer modal card div
// 3. </div> closes the overlay div

// Currently we have 5 </div>s - need to remove 2 of them
// The extra ones are at indices 9703 and 9704 (the two extra)

// Actually let me check: the structure should be:
//   overlay div (9406)
//     modal card div (9412) 
//       sticky header div (9420) -> closed at 9462
//       scrollable content div (9465) -> should close somewhere
//   </div> closing scrollable = 9703
//   </div> closing modal card = 9704
//   </div> closing overlay = 9705
// So 9705 should be the last one that closes ) on 9706

// We have 5 closes: 9701, 9702, 9703, 9704, 9705
// Let's trace from 9534:
// L9534: <div space-y-3> (payment details outer)
// L9535: <div space-y-3> (buttons wrapper) -> closes L9580
// L9583: <div pt-4 space-y-4> (phone section)
//   L9584: <div space-y-2> -> closes L9598?
// Let me just print lines 9578-9710 to trace

for (let i = 9578; i <= 9710; i++) {
  const line = lines[i].trimStart();
  if (line.startsWith('<div') || line.startsWith('</div') || line.startsWith('{/*') || line === ')' || line === '}') {
    console.log(`${i+1}: ${lines[i]}`);
  }
}

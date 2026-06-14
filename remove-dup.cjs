const fs = require('fs');
const lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

// Remove lines 9467-9471 (0-indexed: 9466-9470) which are the stale back button row
// Line 9466 = "                          <div className="space-y-3">" (KEEP)
// Lines 9467-9471 = the old back-button div (REMOVE)
// Line 9472 = blank line (REMOVE)

// Print current content around lines
for (let i = 9463; i <= 9475; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}

console.log('\n--- Removing lines 9467-9471 (0-indexed 9466-9470 + blank 9471) ---\n');

// Remove the 5 lines: the <div flex items-center>, <span>رجوع</span>, <Lock />, </div>, and the blank line after
lines.splice(9466, 6); // Remove 6 lines starting at index 9466

// Print after
for (let i = 9462; i <= 9470; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}

fs.writeFileSync('src/App.tsx', lines.join('\n'), 'utf8');
console.log('\nDone! Lines removed.');

const fs = require('fs');
const lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

// Remove lines 9534-9539 (0-indexed) which are the stale back button rows in payment details section
// Lines 9534 = <div flex items...> 
// 9535 = <span>رجوع</span>
// 9536 = <CreditCard />
// 9537 = </div>
// 9538 = blank

lines.splice(9534, 5); // Remove 5 lines starting at index 9534

// Also fix indentation of the now-orphaned <div space-y-3> at the previous line 9534 (now the inner payment buttons wrapper)
// Check the div before buttons
console.log('After removal, lines 9530-9540:');
for (let i = 9529; i <= 9540; i++) {
  console.log(`${i+1}: |${lines[i]}|`);
}

fs.writeFileSync('src/App.tsx', lines.join('\n'), 'utf8');
console.log('\nDone!');

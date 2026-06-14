const fs = require('fs');
const lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

// Print lines 9530-9545 to see exact content
for (let i = 9530; i <= 9545; i++) {
  console.log(`${i+1}: |${lines[i]}|`);
}

// Remove lines 9534-9539 (0-indexed: 9533-9538) which are the stale section header
// That's: {/* Payment Details */} <div space-y-3> <div flex...> <span>رجوع</span> <CreditCard> </div>
// We want to keep:  {/* Payment Details */} and then the inner <div space-y-3> BUT without the rogue first child

// The stale rows are at lines 9534, 9535, 9536, 9537, 9538 (the back-button row: flex+span+icon+close div)
// Lines 9534 = comment (KEEP)
// Line 9535 = <div className="space-y-3"> (KEEP but fix indentation)
// Lines 9536-9539 = stale back button row (REMOVE)

// First just print more context
console.log('\n--- Context around line 9533-9542 ---');
for (let i = 9532; i <= 9542; i++) {
  console.log(`${i+1}: |${lines[i]}|`);
}

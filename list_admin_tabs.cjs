const fs = require('fs');
const ad = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

// Find nav tabs in AdminDashboard
const navStart = ad.indexOf("activeTab ===");
// Look for the admin tabs array definition
const tabsMatch = ad.match(/\bid:\s*'([^']+)',\s*label:\s*'([^']+)'/g);
if (tabsMatch) {
  console.log('Admin tabs found:');
  tabsMatch.forEach((t,i) => console.log(`  [${i}] ${t}`));
} else {
  // Try another approach - find all unique tab IDs
  const idRegex = /activeTab === '([^']+)'/g;
  let m; const ids = new Set();
  while((m = idRegex.exec(ad)) !== null) ids.add(m[1]);
  console.log('Admin tab IDs (from activeTab ===):', [...ids].join(', '));
}

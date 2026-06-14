const fs = require('fs');

// The core insight: the encoding corruption is systematic.
// Each broken Arabic char comes from misreading Windows-1256 as UTF-8.
// We can build a character-level mapping by analyzing patterns.

// The broken chars we see are from UTF-8 misread of CP1256 Arabic:
// Arabic letter in CP1256 => when read as UTF-8 => appears as \ufffd or control chars
// 
// Strategy: fix the most impactful visible UI strings using a comprehensive dictionary
// built by reading the broken patterns from the file and knowing what they should be.

const filePath = 'src/App.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// ============================================================
// Build replacements by searching for known broken patterns
// that appear in UI strings (label, title, alert, text nodes)
// ============================================================

// We'll do line-by-line processing for lines with mojibake
const sep = content.includes('\r\n') ? '\r\n' : '\n';
const lines = content.split(sep);

// Count lines with issues
let brokenLines = 0;
for (const line of lines) {
  if (line.includes('\u001e') || line.includes('\ufffd')) brokenLines++;
}
console.log(`Lines with encoding issues: ${brokenLines}`);

// The systematic fix: 
// \u001e = ASCII control char (Record Separator) - appears in place of Arabic letters 
// \ufffd = Unicode replacement char - appears in place of Arabic letters
// 
// These are caused by the original file being saved in one encoding and reopened in another.
// The ONLY safe fix is a manual dictionary or using the .fixed backup.

// Check the .fixed backup
const fixedPath = 'src/App.tsx.fixed';
if (fs.existsSync(fixedPath)) {
  const fixed = fs.readFileSync(fixedPath, 'utf8');
  const fixedBroken = (fixed.match(/\u001e|\ufffd/g) || []).length;
  const fixedLines = fixed.split('\n').length;
  console.log(`\n.fixed backup stats:`);
  console.log(`  Broken chars: ${fixedBroken}`);
  console.log(`  Lines: ${fixedLines}`);
  console.log(`  Size: ${fixed.length}`);
  
  // Check key features
  const checks = ['SectionsSection', 'GoldenMembership', 'golden_membership', 'referrals', 'leaderboard', 'handleRegister', 'tanta_portal', 'AdminDashboard'];
  checks.forEach(fn => {
    console.log(`  ${fn}: ${fixed.includes(fn)}`);
  });
}

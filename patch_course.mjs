import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const filePath = join('d:\\نبض-التاريخ', 'src', 'components', 'admin', 'CourseManagement.tsx');
let content = readFileSync(filePath, 'utf8');
let norm = content.replace(/\r\n/g, '\n');

// The issue: the modal was added AFTER the closing </div> of the main container.
// We need to:
// 1. Remove the stray "        </div>\n" at line 780 (before the modal comment)
// 2. The modal block already has "        </div>\n" at the correct end (line 972)

// Find the pattern: "        </div>\n\n            {/* ══" 
// and replace with "\n            {/* ══" (remove the extra closing div before the modal)

const badPattern = `        </div>\n\n            {/* \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\n                VIDEO PREVIEW MODAL`;

const goodPattern = `\n            {/* \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\n                VIDEO PREVIEW MODAL`;

if (!norm.includes(badPattern)) {
  console.error('Bad pattern not found, checking actual content around modal...');
  const pos = norm.indexOf('VIDEO PREVIEW MODAL');
  console.log(norm.substring(pos - 150, pos + 50));
  process.exit(1);
}

const fixed = norm.replace(badPattern, goodPattern).replace(/\n/g, '\r\n');
writeFileSync(filePath, fixed, 'utf8');
console.log('SUCCESS: Fixed extra closing div!');

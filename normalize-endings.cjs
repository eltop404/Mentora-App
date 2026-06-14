const fs = require('fs');

// Read the file as binary to check current state
const buf = fs.readFileSync('src/App.tsx');
const content = buf.toString('utf8');

// Count \r\n vs \n
const crlf = (content.match(/\r\n/g) || []).length;
const lf = (content.match(/(?<!\r)\n/g) || []).length;
console.log(`CRLF: ${crlf}, LF-only: ${lf}`);

// Normalize to CRLF
const normalized = content.replace(/\r\n/g, '\n').replace(/\n/g, '\r\n');
fs.writeFileSync('src/App.tsx', normalized, 'utf8');
console.log('Normalized to CRLF');

// Verify
const buf2 = fs.readFileSync('src/App.tsx');
const content2 = buf2.toString('utf8');
const crlf2 = (content2.match(/\r\n/g) || []).length;
const lf2 = (content2.match(/(?<!\r)\n/g) || []).length;
console.log(`After: CRLF: ${crlf2}, LF-only: ${lf2}`);

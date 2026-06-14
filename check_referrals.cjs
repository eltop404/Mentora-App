const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf8');

const matches = content.match(/referrals/ig);
console.log('Matches:', matches ? matches.length : 0);

// Search for where the user object is updated or referrals modal is rendered
const refModalMatch = content.match(/activeModal === 'referrals'/g);
console.log('Referrals Modal:', refModalMatch ? refModalMatch.length : 0);

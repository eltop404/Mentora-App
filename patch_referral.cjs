const fs = require('fs');
let code = fs.readFileSync('src/services/db.ts', 'utf8');

// Fix generateReferralCode to use _mentora
code = code.replace(
    "return `${baseName}_${randomChars}_napd_altareekh`;",
    "return `${baseName}_${randomChars}_mentora`;"
);

// Fix isReferralCodeClean to accept _mentora and any existing code
const oldClean = `    isReferralCodeClean: (code: string | undefined): boolean => {\r\n        if (!code) return false;\r\n        const parts = code.split('_');\r\n        if (parts.length < 3) return false;\r\n        const randomPart = parts[parts.length - 3];\r\n        const isNapdAltareekh = parts[parts.length - 2] === 'napd' && parts[parts.length - 1] === 'altareekh';\r\n        return isNapdAltareekh && /^[A-Z0-9]{12}$/.test(randomPart);\r\n    },`;

const newClean = `    isReferralCodeClean: (code: string | undefined): boolean => {
        if (!code) return false;
        // Accept any non-empty existing code - never replace a code that already exists
        const parts = code.split('_');
        if (parts.length < 2) return false;
        const lastPart = parts[parts.length - 1];
        const secondLastPart = parts[parts.length - 2];
        // Accept _mentora suffix
        if (lastPart === 'mentora') return true;
        // Accept legacy _napd_altareekh suffix
        if (secondLastPart === 'napd' && lastPart === 'altareekh') return true;
        // Accept any code with reasonable length (already assigned)
        return code.length >= 5;
    },`;

code = code.replace(oldClean, newClean);

// Verify
if (code.includes('_mentora') && code.includes('Accept _mentora suffix')) {
    fs.writeFileSync('src/services/db.ts', code, 'utf8');
    console.log('db.ts fixed successfully');
} else {
    console.log('Pattern not found, trying alternate approach...');
    // Direct replacement of the isReferralCodeClean function
    code = code.replace(
        /isReferralCodeClean: \(code: string \| undefined\): boolean => \{[\s\S]*?return isNapdAltareekh[\s\S]*?\},/,
        newClean
    );
    fs.writeFileSync('src/services/db.ts', code, 'utf8');
    console.log('db.ts fixed with regex');
}

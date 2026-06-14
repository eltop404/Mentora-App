const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/components/AdminDashboard.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Update incomeDetails memo
content = content.replace(
    /const incomeDetails = React\.useMemo\(\(\) => \{\s*const approved = \(paymentList \|\| \[\]\)\.filter\(p => p\.status === 'approved'\);\s*return \{\s*courses:.*?\s*lessons:.*?\s*booklets:.*?\s*coins:.*?\s*recharge:.*?\s*\};\s*\}, \[paymentList\]\);/,
    `const incomeDetails = React.useMemo(() => {
    const approved = (paymentList || []).filter(p => p.status === 'approved');
    return {
      courses: approved.filter(p => p.itemType === 'course').reduce((acc, p) => acc + (p.discountedPrice || p.price || 0), 0),
      ads: approved.filter(p => p.itemType === 'ads_package' || p.itemType === 'ads' || p.itemType === 'ad').reduce((acc, p) => acc + (p.discountedPrice || p.price || 0), 0),
      recharge: approved.filter(p => p.itemType === 'recharge').reduce((acc, p) => acc + (p.discountedPrice || p.price || 0), 0)
    };
  }, [paymentList]);`
);

// 2. Update UI array
content = content.replace(
    /\{\s*l:\s*'دخل الكورسات'[\s\S]*?\{\s*l:\s*'دخل الشحن'.*?\}\s*\]\.map/,
    `[
                    { l: 'دخل الكورسات', v: incomeDetails.courses, c: '#3b82f6', i: <Video size={20} /> },
                    { l: 'دخل الاعلانات', v: incomeDetails.ads, c: '#f59e0b', i: <Star size={20} /> },
                    { l: 'دخل الشحن', v: incomeDetails.recharge, c: '#14b8a6', i: <Coins size={20} /> }
                  ].map`
);

fs.writeFileSync(file, content, 'utf8');

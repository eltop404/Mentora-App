const fs = require('fs');
const path = 'e:/نبض-التاريخ/src/App.tsx';
let c = fs.readFileSync(path, 'utf8');

// Global regex corruption fixes
c = c.replace(/<\/\[a-z-\]\/g([a-zA-Z0-9_]+)>/g, '</$1>');
c = c.replace(/\/\[a-z-\]\/g([a-zA-Z0-9_]+)>/g, '10"></$1>');
c = c.replace(/\/\[a-z-\]\/g>}/g, '10">}');
c = c.replace(/<([a-zA-Z0-9_]+)([^>]*?)\/\[a-z-\]\/g>/g, '<$1$2/>');
c = c.replace(/\/\[a-z-\]\/g\/>/g, '10" />');
c = c.replace(/\/\[a-z-\]\/g>/g, '10">');
c = c.replace(/\/\/\[a-z-\]\/g\//g, '// ');
c = c.replace(/\[a-z-\]\/g/g, '10');
c = c.replace(/\/ \[a-z -\] \/ g \/ \[a-z -\] \/ g \/ \[a-z -\] \/ g\\s \+ \/10/g, '/ (1000 * 60)');
c = c.replace(/\/ \[a-z -\] \/ g \/ First Exam Warning/g, '/ 60);\n  const s = seconds % 60;\n  return `${h}:${String(m).padStart(2, \'0\')}:${String(s).padStart(2, \'0\')}`;\n};\n\n  // First Exam Warning');
c = c.replace(/\/ \[a-z -\] \/ g \/ Visits - Once per session/g, '1000);\n          setSurveyTimerStr(`${hours}س و ${minutes}د و ${seconds}ث`);\n          setSurveyQuotaStr(\'0\');\n        } else {\n          setSurveyQuotaStr(String(parsed.remaining || 3));\n          setSurveyTimerStr(\'\');\n        }\n      } else {\n        setSurveyQuotaStr(\'3\');\n        setSurveyTimerStr(\'\');\n      }\n    };\n    update();\n    const interval = setInterval(update, 1000);\n    return () => clearInterval(interval);\n  }, [user?.id]);\n\n  useEffect(() => {\n    // Visits - Once per session');

// Fix premium deduction block + misplaced useStates
const premiumBroken = `// Premium Coin Deduction Logic
useEffect(() => {
  if (user && user.role !== 'admin' && user.isPremiumUnlocked) {
    const settings = DB.getSettings();
    if (!settings.isPremiumSystemEnabled) return;

    const today = new Date().toISOString().split('T')[0];
    const lastDeduction = user.lastPremiumDeduction;

    if (lastDeduction !== today) {
      const rate = settings.premiumConsumptionRate || 10;
      const currentCoins = user.coins || 0;

      // Deduct coins if balance is positive
      if (currentCoins > 0) {
        const newCoins = Math.max(0, currentCoins - rate);
        const updatedUser = {
          ...user,
          coins: newCoins,
          lastPremiumDeduction: today
        };

        setUser(updatedUser);
        DB.updateStudent(user.id, {
          coins: newCoins,
          lastPremiumDeduction: today
        });
        StorageLayer.setItem('nt_current_user', JSON.stringify(updatedUser));

        //  Also check when opening control modal

        const [payingBooklet, setPayingBooklet]`;

const premiumFixed = `// Premium Coin Deduction Logic
useEffect(() => {
  if (user && user.role !== 'admin' && user.isPremiumUnlocked) {
    const settings = DB.getSettings();
    if (!settings.isPremiumSystemEnabled) return;

    const today = new Date().toISOString().split('T')[0];
    const lastDeduction = user.lastPremiumDeduction;

    if (lastDeduction !== today) {
      const rate = settings.premiumConsumptionRate || 10;
      const currentCoins = user.coins || 0;

      if (currentCoins > 0) {
        const newCoins = Math.max(0, currentCoins - rate);
        const updatedUser = {
          ...user,
          coins: newCoins,
          lastPremiumDeduction: today
        };

        setUser(updatedUser);
        DB.updateStudent(user.id, {
          coins: newCoins,
          lastPremiumDeduction: today
        });
        StorageLayer.setItem('nt_current_user', JSON.stringify(updatedUser));
      }
    }
  }
}, [user?.id, user?.isPremiumUnlocked, user?.coins, user?.lastPremiumDeduction]);

const [payingBooklet, setPayingBooklet]`;

if (c.includes(premiumBroken)) {
  c = c.replace(premiumBroken, premiumFixed);
  console.log('Fixed premium block');
}

// Fix ipify fetch block
c = c.replace(
  /\/\/ api\.ipify\.org\?format=json'\)\s*\n\s*\.then\(res => res\.json\(\)\)[\s\S]*?return \(\) => window\.removeEventListener\('nt-settings-change', handleSettingsChange\);\s*\}, \[\]\);/,
  `useEffect(() => {
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => {
        setUserIP(data.ip);
        const settings = DB.getSettings();
        if (settings.blockedIPs?.includes(data.ip)) {
          setUser(null);
          StorageLayer.removeItem('nt_current_user');
          setScreen('welcome');
          alert('🚫 تم حظر دخولك للمنصة نهائياً.');
        }
      })
      .catch(() => setUserIP('192.168.1.1'));
  }, []);`
);

// Fix broken formatRetakeTime if still broken
c = c.replace(
  /const formatRetakeTime = \(seconds: number\) => \{\s*const h = Math\.floor\(seconds \/ 3600\);\s*const m = Math\.floor\(\(seconds % 3600\) \/ 10[\s\S]*?const \[showFirstExamWarning/,
  `const formatRetakeTime = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return \`\${h}:\${String(m).padStart(2, '0')}:\${String(s).padStart(2, '0')}\`;
};

  // First Exam Warning
  const [showFirstExamWarning`
);

fs.writeFileSync(path, c, 'utf8');
console.log('repair_all.cjs done');

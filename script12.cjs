const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add portalCountdown state
if(!code.includes('portalCountdown')) {
    const appSettingsLine = 'const [appSettings, setAppSettings] = useState(() => DB.getSettings());';
    const stateToAdd = `const [appSettings, setAppSettings] = useState(() => DB.getSettings());
  const [portalCountdown, setPortalCountdown] = useState<number>(3);

  useEffect(() => {
    if (activeModal === 'tanta_portal' && portalCountdown > 0) {
        const timer = setInterval(() => {
            setPortalCountdown(prev => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    } else if (activeModal !== 'tanta_portal') {
        setPortalCountdown(3);
    }
  }, [activeModal, portalCountdown]);`;
    code = code.replace(appSettingsLine, stateToAdd);
}

// 2. Change 'منصة المنصة' to 'منصة المعهد'
code = code.replace(/منصة المنصة/g, 'منصة المعهد');

fs.writeFileSync('src/App.tsx', code);
console.log('App.tsx updated with portalCountdown and correct label');

const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

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

if(!code.includes('setPortalCountdown')) {
    code = code.replace(appSettingsLine, stateToAdd);
    fs.writeFileSync('src/App.tsx', code);
    console.log('portalCountdown state added');
} else {
    console.log('portalCountdown already exists');
}

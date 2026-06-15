const fs = require('fs');
const file = 'src/components/AdminDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `  const [isCopied, setIsCopied] = useState(false);
  const isOnline = DB.getOnlineStatus(student.id);`;

const replacement = `  const [isCopied, setIsCopied] = useState(false);
  const [showSubAdminAlert, setShowSubAdminAlert] = useState(false);
  const isOnline = DB.getOnlineStatus(student.id);

  const handleRestrictedAction = (action: () => void) => {
    if (isSubAdmin) {
      setShowSubAdminAlert(true);
      setTimeout(() => setShowSubAdminAlert(false), 3000);
    } else {
      action();
    }
  };`;

content = content.replace(target, replacement);

fs.writeFileSync(file, content);
console.log('done');

const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

const logoUrl = 'https://i.postimg.cc/4NP62dYC/IMG-20260420-WA0023-2.jpg';

// Instead of complex regex, let's replace them carefully.
// We want to wrap ANY <img ... src="...logoUrl..."> with a div container.
// Or even easier: use a custom component? No, App.tsx doesn't have a custom logo component imported everywhere.

// Let's find all <img> tags that have the logo.
const imgRegex = /<img[^>]+4NP62dYC[^>]*>/g;

content = content.replace(imgRegex, (match) => {
    // Extract className
    let classMatch = match.match(/className=["']([^"']+)["']/);
    let classes = classMatch ? classMatch[1] : '';
    
    // Clean up classes for the wrapper
    classes = classes.replace(/object-cover/g, '').trim();
    if (!classes.includes('shrink-0')) classes += ' shrink-0';
    if (!classes.includes('overflow-hidden')) classes += ' overflow-hidden';
    if (!classes.includes('flex items-center justify-center')) classes += ' flex items-center justify-center';
    
    // Extract style
    let styleMatch = match.match(/style=\{([^}]+)\}/);
    let styleAttr = styleMatch ? `style={${styleMatch[1]}}` : '';

    // If it's the Vodafone cash one, maybe don't make it rounded-full?
    // User said: "في كل الاماكن اللي فيها اللوجو يبقي دائري" -> "In all places where the logo is, make it circular"
    if (!classes.includes('rounded-full')) classes += ' rounded-full';

    // Build the new structure
    return `<div className="${classes}" ${styleAttr} title="Mentora">
        <img src="${logoUrl}" className="w-[145%] h-[145%] max-w-none object-cover" alt="Mentora Logo" />
    </div>`;
});

// Write it back
fs.writeFileSync('src/App.tsx', content);

// Also apply to AdminDashboard and db.ts just in case
const adminPath = 'src/components/AdminDashboard.tsx';
if (fs.existsSync(adminPath)) {
    let adminContent = fs.readFileSync(adminPath, 'utf8');
    adminContent = adminContent.replace(imgRegex, (match) => {
        let classMatch = match.match(/className=["']([^"']+)["']/);
        let classes = classMatch ? classMatch[1] : '';
        classes = classes.replace(/object-cover/g, '').trim();
        if (!classes.includes('shrink-0')) classes += ' shrink-0';
        if (!classes.includes('overflow-hidden')) classes += ' overflow-hidden';
        if (!classes.includes('flex items-center justify-center')) classes += ' flex items-center justify-center';
        if (!classes.includes('rounded-full')) classes += ' rounded-full';
        let styleMatch = match.match(/style=\{([^}]+)\}/);
        let styleAttr = styleMatch ? `style={${styleMatch[1]}}` : '';
        return `<div className="${classes}" ${styleAttr} title="Mentora">
            <img src="${logoUrl}" className="w-[145%] h-[145%] max-w-none object-cover" alt="Mentora Logo" />
        </div>`;
    });
    fs.writeFileSync(adminPath, adminContent);
}

console.log('Successfully wrapped logos in zoomed circular containers.');

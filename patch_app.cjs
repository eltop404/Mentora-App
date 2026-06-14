const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

if (!code.includes('const [sectionList, setSectionList] = useState<Content[]>(() => DB.getSections());')) {
    code = code.replace(
        "const [contentList, setContentList] = useState<Content[]>(() => DB.getContent());",
        "const [contentList, setContentList] = useState<Content[]>(() => DB.getContent());\n  const [sectionList, setSectionList] = useState<Content[]>(() => DB.getSections());"
    );
}

if (!code.includes('const onSectionChange = () => setSectionList(DB.getSections());')) {
    code = code.replace(
        "const onContentChange = () => setContentList(DB.getContent());",
        "const onContentChange = () => setContentList(DB.getContent());\n    const onSectionChange = () => setSectionList(DB.getSections());"
    );
}

if (!code.includes("'nt-sections-change', onSectionChange")) {
    code = code.replace(
        "window.addEventListener('nt-content-change', onContentChange);",
        "window.addEventListener('nt-content-change', onContentChange);\n    window.addEventListener('nt-sections-change', onSectionChange);"
    );
    code = code.replace(
        "window.removeEventListener('nt-content-change', onContentChange);",
        "window.removeEventListener('nt-content-change', onContentChange);\n      window.removeEventListener('nt-sections-change', onSectionChange);"
    );
}

if (!code.includes('sectionList={sectionList}')) {
    code = code.replace(
        "contentList={contentList}\n            setContentList={setContentList}",
        "contentList={contentList}\n            setContentList={setContentList}\n            sectionList={sectionList}\n            setSectionList={setSectionList}"
    );
    
    // Also for the other render of AdminDashboard if there's any
    code = code.replace(
        "contentList={contentList} setContentList={setContentList}",
        "contentList={contentList} setContentList={setContentList} sectionList={sectionList} setSectionList={setSectionList}"
    );
}

fs.writeFileSync('src/App.tsx', code, 'utf8');
console.log('App.tsx patched.');

const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

if (!code.includes('SectionsManagement')) {
    code = code.replace(
        "import { ContentManagement } from './admin/ContentManagement';",
        "import { ContentManagement } from './admin/ContentManagement';\nimport { SectionsManagement } from './admin/SectionsManagement';"
    );
}

if (!code.includes('sectionList: Content[]')) {
    code = code.replace(
        "contentList: Content[];",
        "contentList: Content[];\n  sectionList: Content[];\n  setSectionList: React.Dispatch<React.SetStateAction<Content[]>>;"
    );
}

if (!code.includes('setSectionList,')) {
    code = code.replace(
        "setContentList,",
        "setContentList,\n  sectionList,\n  setSectionList,"
    );
}

if (!code.includes('deleteSection')) {
    code = code.replace(
        "if (type === 'content') DB.deleteContent(id);",
        "if (type === 'content') DB.deleteContent(id);\n    else if (type === 'section') DB.deleteSection(id);"
    );
    
    code = code.replace(
        "setContentList(DB.getContent());",
        "setContentList(DB.getContent());\n    setSectionList(DB.getSections());"
    );
}

if (!code.includes("setActiveTab('sections');")) {
    code = code.replace(
        "if (type === 'content') setActiveTab('content');",
        "if (type === 'content') setActiveTab('content');\n    else if (type === 'section') setActiveTab('sections');"
    );
}

if (!code.includes("id: 'sections'")) {
    code = code.replace(
        "{ id: 'content', icon: <FileText size={20} />, label: 'إدارة المحتوى' },",
        "{ id: 'content', icon: <FileText size={20} />, label: 'إدارة المحتوى' },\n      { id: 'sections', icon: <Layers size={20} />, label: 'إدارة السكاشن' },"
    );
    
    if (!code.includes('Layers,')) {
        code = code.replace("import {", "import { Layers,");
    }
}

if (!code.includes('<SectionsManagement')) {
    code = code.replace(
        "{activeTab === 'content' && <ContentManagement isDarkMode={true} theme={theme} contentList={contentList} setContentList={setContentList} />}",
        "{activeTab === 'content' && <ContentManagement isDarkMode={true} theme={theme} contentList={contentList} setContentList={setContentList} />}\n          {activeTab === 'sections' && <SectionsManagement isDarkMode={true} theme={theme} sectionList={sectionList} setSectionList={setSectionList} />}"
    );
}

fs.writeFileSync('src/components/AdminDashboard.tsx', code, 'utf8');
console.log('AdminDashboard patched.');

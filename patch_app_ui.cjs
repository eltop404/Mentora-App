const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

if (!code.includes('SectionsSection')) {
    code = code.replace(
        "import { UnitsSection } from './components/UnitsSection';",
        "import { UnitsSection } from './components/UnitsSection';\nimport { SectionsSection } from './components/SectionsSection';"
    );
}

if (!code.includes('isSectionsOpen')) {
    code = code.replace(
        "const [isUnitOpen, setIsUnitOpen] = useState(false);",
        "const [isUnitOpen, setIsUnitOpen] = useState(false);\n  const [isSectionsOpen, setIsSectionsOpen] = useState(false);"
    );
}

if (!code.includes("setIsSectionsOpen(false)")) {
    code = code.replace(
        /setIsUnitOpen\(false\);/g,
        "setIsUnitOpen(false); setIsSectionsOpen(false);"
    );
}

if (!code.includes("activeModal === 'sections'")) {
    const unitsSectionStr = "{activeModal === 'units' && (";
    const newSectionStr = `{activeModal === 'sections' && (
                          <div className="h-full relative overflow-y-auto no-scrollbar pb-32 animate-fade-in">
                              <SectionsSection
                                  user={user!}
                                  theme={theme}
                                  onClose={() => setActiveModal(null)}
                                  onViewLesson={handleViewLesson}
                                  onViewFile={handleViewFile}
                              />
                          </div>
                      )}
                      `;
    code = code.replace(unitsSectionStr, newSectionStr + unitsSectionStr);
}

if (!code.includes("id: 'sections'")) {
    const bookletsDef = "id: 'booklets',";
    const sectionsDef = `id: 'sections',
                      icon: <Layers size={36} className="drop-shadow-lg" />,
                      title: 'السكاشن',
                      description: 'سكاشن المادة',
                      onClick: () => setActiveModal('sections'),
                      notify: false
                    },
                    {
                      `;
    code = code.replace(bookletsDef, sectionsDef + bookletsDef);
    
    if (!code.includes('Layers,')) {
        code = code.replace("import {", "import { Layers,");
    }
}

// Add the breadcrumb condition
if (!code.includes("activeModal === 'sections' ? 'السكاشن' :")) {
    code = code.replace(
        "activeModal === 'booklets' ? 'المذكرات التعليمية' :",
        "activeModal === 'sections' ? 'السكاشن' :\n                                                activeModal === 'booklets' ? 'المذكرات التعليمية' :"
    );
}


fs.writeFileSync('src/App.tsx', code, 'utf8');
console.log('App.tsx UI patched.');

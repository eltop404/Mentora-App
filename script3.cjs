const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/components/admin/ContentManagement.tsx');

let code = fs.readFileSync(file, 'utf8');

code = code.replace(/إدارة الوحدات التعليمية/g, "إدارة المواد");
code = code.replace(/اسم الوحدة\.\.\./g, "اسم المادة...");
code = code.replace(/إضافة وحدة/g, "إضافة مادة");

// Replace handleAddUnit
const addUnitRegex = /const handleAddUnit = \(\) => \{[\s\S]*?setShowAddUnitInput\(false\);\s*\};/;
const newAddUnit = `const handleAddUnit = () => {
        if (!newUnitName.trim()) return;
        const newSub = {
            id: 'sub_' + Date.now().toString(),
            name: newUnitName.trim(),
            year: filter.year,
            division: filter.stage,
            specialization: filter.semester === '-' ? undefined : filter.semester
        };
        const updatedSubs = [...DB.getSubjects(), newSub];
        DB.saveSubjects(updatedSubs);
        setUnits([...units, newSub.name]);
        setNewUnitName('');
        setShowAddUnitInput(false);
    };`;
code = code.replace(addUnitRegex, newAddUnit);

// Replace handleDeleteUnit
const deleteUnitRegex = /const handleDeleteUnit = \(u: string\) => \{[\s\S]*?if \(form\.unit === u\) setForm\(\{ \.\.\.form, unit: updatedUnits\[0\] \}\);\s*\};/;
const newDeleteUnit = `const handleDeleteUnit = (u: string) => {
        if (!window.confirm('هل أنت متأكد من حذف هذه المادة نهائيا؟')) return;
        const allSubs = DB.getSubjects().filter(s => !(s.name === u && s.division === filter.stage && s.year === filter.year && (s.specialization === filter.semester || filter.semester === '-' || !s.specialization)));
        DB.saveSubjects(allSubs);
        const updatedUnits = units.filter(item => item !== u);
        setUnits(updatedUnits);

        if (filter.unit === u) setFilter({ ...filter, unit: updatedUnits[0] || 'المادة الأولى' });
        if (form.unit === u) setForm({ ...form, unit: updatedUnits[0] || 'المادة الأولى' });
    };`;
code = code.replace(deleteUnitRegex, newDeleteUnit);

// Replace handleRenameUnit
const renameUnitRegex = /const handleRenameUnit = \(oldName: string, newName: string\) => \{[\s\S]*?setEditingUnitName\(\{ oldName: '', newName: '' \}\);\s*\};/;
const newRenameUnit = `const handleRenameUnit = (oldName: string, newName: string) => {
        if (!newName.trim() || newName === oldName) {
            setEditingUnitName({ oldName: '', newName: '' });
            return;
        }
        const allSubs = DB.getSubjects().map(s => {
            if (s.name === oldName && s.division === filter.stage && s.year === filter.year && (s.specialization === filter.semester || filter.semester === '-' || !s.specialization)) {
                return { ...s, name: newName.trim() };
            }
            return s;
        });
        DB.saveSubjects(allSubs);
        const updatedUnits = units.map(u => u === oldName ? newName.trim() : u);
        setUnits(updatedUnits);

        const allContent = DB.getContent();
        let changed = false;
        const updatedContent = allContent.map(c => {
            if ((c.unit || '').trim() === oldName.trim() && c.stage === filter.stage && c.year === filter.year && c.semester === filter.semester) {
                changed = true;
                return { ...c, unit: newName.trim() };
            }
            return c;
        });
        if (changed) {
            DB.saveContent(updatedContent);
            setContentList(updatedContent);
        }

        if (filter.unit === oldName) setFilter({ ...filter, unit: newName.trim() });
        if (form.unit === oldName) setForm({ ...form, unit: newName.trim() });
        setEditingUnitName({ oldName: '', newName: '' });
    };`;
code = code.replace(renameUnitRegex, newRenameUnit);

fs.writeFileSync(file, code);
console.log('Fixed ContentManagement subjects logic');

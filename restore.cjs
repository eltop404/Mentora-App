const fs = require('fs');
let text = fs.readFileSync('e:\\نبض-التاريخ\\src\\components\\admin\\ContentManagement.tsx', 'utf8');

// Component specific replacements
text = text.replace(/ContentManagement/g, 'SectionsManagement');
text = text.replace(/contentList/g, 'sectionList');
text = text.replace(/setContentList/g, 'setSectionList');
text = text.replace(/DB\.getContent/g, 'DB.getSections');
text = text.replace(/DB\.saveContent/g, 'DB.saveSections');
text = text.replace(/DB\.addContent/g, 'DB.addSection');
text = text.replace(/DB\.updateContent/g, 'DB.updateSection');
text = text.replace(/DB\.deleteContent/g, 'DB.deleteSection');
text = text.replace(/contentData/g, 'sectionData');
text = text.replace(/content-thumbnail-upload/g, 'section-thumbnail-upload');

// Arabic text replacements
text = text.replace(/إدارة المحتوى التعليمي/g, 'إدارة السكاشن');
text = text.replace(/محتوى جديد متاح/g, 'سكشن جديد متاح');
text = text.replace(/إضافة محتوى جديد/g, 'إضافة سكشن جديد');
text = text.replace(/تعديل المحتوى/g, 'تعديل السكشن');
text = text.replace(/عنوان المحتوى/g, 'عنوان السكشن');
text = text.replace(/نص المحتوى \(اختياري\)/g, 'نص السكشن (اختياري)');
text = text.replace(/رابط محتوى خارجي/g, 'رابط سكشن خارجي');
text = text.replace(/محتوى مجاني؟/g, 'سكشن مجاني؟');
text = text.replace(/تمت إضافة محتوى جديد:/g, 'تمت إضافة سكشن جديد:');

// Insert props for appSettings
text = text.replace('setSectionList: (list: Content[]) => void;', 'setSectionList: (list: Content[]) => void;\n    appSettings?: any;\n    setAppSettings?: (val: any) => void;');
text = text.replace('({ isDarkMode, theme, sectionList, setSectionList }) => {', '({ isDarkMode, theme, sectionList, setSectionList, appSettings, setAppSettings }) => {');

// Insert the toggle switch before 'Semester Lock Switcher'
const toggleUI = `                <div className="flex flex-col gap-2">
                    <div className="text-right flex items-center justify-end gap-2 text-sm text-gray-400 font-bold mb-1">
                        ظهور قسم السكاشن في صفحة الطالب
                    </div>
                    {appSettings && setAppSettings && (
                        <div className="flex items-center gap-2 bg-white/5 p-2 rounded-3xl border border-white/5 self-end">
                            <button
                                onClick={() => {
                                    const val = false;
                                    setAppSettings({ ...appSettings, isSectionsEnabled: val });
                                    DB.updateSettings({ ...appSettings, isSectionsEnabled: val });
                                }}
                                className={cn(
                                    "px-6 py-2.5 rounded-2xl font-black text-xs transition-all flex items-center gap-2",
                                    appSettings.isSectionsEnabled === false ? "bg-red-500 text-white shadow-lg shadow-red-500/20" : "text-gray-500 hover:bg-white/5"
                                )}
                            >
                                <Lock size={14} />
                                إغلاق القسم
                            </button>
                            <button
                                onClick={() => {
                                    const val = true;
                                    setAppSettings({ ...appSettings, isSectionsEnabled: val });
                                    DB.updateSettings({ ...appSettings, isSectionsEnabled: val });
                                }}
                                className={cn(
                                    "px-6 py-2.5 rounded-2xl font-black text-xs transition-all flex items-center gap-2",
                                    appSettings.isSectionsEnabled !== false ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-gray-500 hover:bg-white/5"
                                )}
                            >
                                <Unlock size={14} />
                                فتح القسم
                            </button>
                        </div>
                    )}
                </div>

                {/* Semester Lock Switcher */}`;
text = text.replace('{/* Semester Lock Switcher */}', toggleUI);

fs.writeFileSync('e:\\نبض-التاريخ\\src\\components\\admin\\SectionsManagement.tsx', text, 'utf8');
console.log('Restored successfully');

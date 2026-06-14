const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Fix icon size
code = code.replace(
    /icon: <Layers size=\{36\} className="drop-shadow-lg" \/>,/,
    'icon: <Layers size={20} />,'
);

// Add modal logic
const insertStr = `{activeModal === 'sections' && (
                          <div className="space-y-6">
                              <SectionsSection
                                  user={{
                                      stage: user.level,
                                      year: user.year,
                                      semester: user.semester,
                                      specialization: user.specialization
                                  }}
                                  theme={theme}
                                  isBgAnimated={isBgAnimated}
                                  toggleBgAnimation={() => {}}
                                  onVideoClick={(vid) => setPlayingVideo(vid)}
                                  onOpenFile={(file) => triggerFileAction(file, 'open')}
                                  onDownloadFile={(name, b64) => triggerFileAction(\`\${name}|||\${b64}\`, 'download')}
                                  onUnitOpen={(name) => { updateActivity(\`يراجع سكاشن: \${name} 📖\`); setIsUnitOpen(true); }}
                                  onUnitClose={() => setIsUnitOpen(false)}
                                  completedExams={user.completedExams || []}
                                  currentTime={currentTime}
                                  onOpenRetakeModal={(exam) => {
                                      setBookingRetakeExam(exam);
                                      setShowRetakeModal(true);
                                  }}
                                  achievements={user.achievements || []}
                                  purchasedLessons={user.purchasedLessons || []}
                                  onLockClick={(type, item) => {
                                      if (item.requiredPoints > 0 && (!user.plan || user.plan === 'مجانية')) {
                                          setActiveModal('recharge');
                                          return;
                                      }
                                      setPremiumLockModal({ isOpen: true, type, item });
                                  }}
                              />
                          </div>
                        )}
                        `;

if (!code.includes("activeModal === 'sections' && (")) {
    code = code.replace(
        "{activeModal === 'booklets' && (",
        insertStr + "{activeModal === 'booklets' && ("
    );
}

fs.writeFileSync('src/App.tsx', code, 'utf8');
console.log('Fixed Sections UI.');

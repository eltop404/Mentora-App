const fs = require('fs');
const file = 'src/components/admin/ContentManagement.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetToRemove = `                            <div className="space-y-1 text-right">
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>`;

content = content.replace(targetToRemove, '');

const pdfUrlInput = `<input
                                type="text"
                                value={form.pdfUrl}`;

const replacementPdfUrl = `{form.pdfUrl && (
                                    <button
                                        type="button"
                                        onClick={() => window.open(form.pdfUrl, '_blank')}
                                        className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-4 rounded-2xl text-[10px] font-bold hover:bg-cyan-500/20 transition-all flex items-center justify-center gap-1 whitespace-nowrap"
                                    >
                                        <Eye size={14} /> معاينة
                                    </button>
                                )}
                                <input
                                type="text"
                                value={form.pdfUrl}`;

if (!content.includes('{form.pdfUrl && (')) {
    content = content.replace(pdfUrlInput, replacementPdfUrl);
}

fs.writeFileSync(file, content);
console.log('Fixed ContentManagement.tsx!');

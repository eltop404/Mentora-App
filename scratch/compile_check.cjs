const ts = require('typescript');
const fs = require('fs');

const file = 'd:\\نبض-التاريخ\\src\\App.tsx';
const program = ts.createProgram([file], {
    noEmit: true,
    jsx: ts.JsxEmit.ReactJSX,
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.CommonJS
});

const diagnostics = ts.getPreEmitDiagnostics(program);

for (const diag of diagnostics) {
    if (diag.file && diag.file.fileName.includes('App.tsx')) {
        const { line, character } = diag.file.getLineAndCharacterOfPosition(diag.start);
        console.log(`Error in App.tsx at line ${line + 1}, col ${character + 1}: ${ts.flattenDiagnosticMessageText(diag.messageText, '\n')}`);
    }
}

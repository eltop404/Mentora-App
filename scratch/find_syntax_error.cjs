const fs = require('fs');

const code = fs.readFileSync('d:\\نبض-التاريخ\\src\\App.tsx', 'utf8');

function checkBrackets(str) {
    let count = 0;
    let lines = str.split('\n');
    let brackets = [];
    
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        for (let j = 0; j < line.length; j++) {
            let char = line[j];
            if (char === '{') {
                brackets.push({ type: 'brace', line: i + 1, col: j + 1 });
            } else if (char === '}') {
                if (brackets.length === 0) {
                    console.log(`Unmatched } at line ${i + 1}, column ${j + 1}`);
                } else {
                    brackets.pop();
                }
            } else if (char === '(') {
                brackets.push({ type: 'paren', line: i + 1, col: j + 1 });
            } else if (char === ')') {
                let last = brackets[brackets.length - 1];
                if (last && last.type === 'paren') {
                    brackets.pop();
                }
            }
        }
    }
    
    if (brackets.length > 0) {
        console.log(`Unclosed brackets count: ${brackets.length}`);
        console.log("Top 10 unclosed brackets:");
        console.log(brackets.slice(-10));
    } else {
        console.log("All brackets matched!");
    }
}

checkBrackets(code);

const fs = require('fs');
const filePath = process.argv[2] || 'src/components/CellBreakGameFixed.tsx';
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

let parenDepth = 0;
let braceDepth = 0;
let bracketDepth = 0;
let inString = false;
let stringChar = null;
let inComment = false;
let inMultiComment = false;

console.log(`Checking syntax of ${filePath}...`);
console.log(`Total lines: ${lines.length}`);

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    for (let j = 0; j < line.length; j++) {
        const ch = line[j];
        const nextCh = line[j + 1] || '';
        const prevCh = j > 0 ? line[j - 1] : '';

        // Check for multi-line comments
        if (!inString && ch === '/' && nextCh === '*') {
            inMultiComment = true;
            j++; // Skip next char
            continue;
        }
        if (inMultiComment && ch === '*' && nextCh === '/') {
            inMultiComment = false;
            j++; // Skip next char
            continue;
        }

        if (inMultiComment) continue;

        // Check for single-line comments
        if (!inString && ch === '/' && nextCh === '/') {
            break; // Rest of line is comment
        }

        // Check for strings
        if ((ch === '"' || ch === "'" || ch === '`') && prevCh !== '\\') {
            if (!inString) {
                inString = true;
                stringChar = ch;
            } else if (ch === stringChar) {
                inString = false;
                stringChar = null;
            }
        }

        if (!inString && !inComment) {
            if (ch === '(') parenDepth++;
            if (ch === ')') {
                parenDepth--;
                if (parenDepth < 0) {
                    console.log(`ERROR: Extra closing ) at line ${i + 1}, column ${j + 1}`);
                    console.log(`Line: ${line}`);
                }
            }
            if (ch === '{') braceDepth++;
            if (ch === '}') {
                braceDepth--;
                if (braceDepth < 0) {
                    console.log(`ERROR: Extra closing } at line ${i + 1}, column ${j + 1}`);
                    console.log(`Line: ${line}`);
                }
            }
            if (ch === '[') bracketDepth++;
            if (ch === ']') {
                bracketDepth--;
                if (bracketDepth < 0) {
                    console.log(`ERROR: Extra closing ] at line ${i + 1}, column ${j + 1}`);
                    console.log(`Line: ${line}`);
                }
            }
        }
    }

    // Log progress every 500 lines
    if (i % 500 === 0 && i > 0) {
        console.log(`Line ${i}: parens=${parenDepth}, braces=${braceDepth}, brackets=${bracketDepth}`);
    }
}

console.log(`\nFinal counts:`);
console.log(`Parentheses: ${parenDepth} (${parenDepth === 0 ? 'balanced' : parenDepth > 0 ? 'missing closing' : 'extra closing'})`);
console.log(`Braces: ${braceDepth} (${braceDepth === 0 ? 'balanced' : braceDepth > 0 ? 'missing closing' : 'extra closing'})`);
console.log(`Brackets: ${bracketDepth} (${bracketDepth === 0 ? 'balanced' : bracketDepth > 0 ? 'missing closing' : 'extra closing'})`);